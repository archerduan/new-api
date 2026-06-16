package operation_setting

import (
	"sort"
	"strings"
	"sync/atomic"

	"github.com/QuantumNous/new-api/setting/config"
)

// ---------------------------------------------------------------------------
// Resolution-based pricing ($/call, admin-configurable)
// DB key: resolution_price_setting.prices
//
// Key format:
//   - "1K"                    → default price for 1K resolution (all models)
//   - "1024x1024"             → default price for 1024x1024 resolution
//   - "4K:dall-e-3"           → override for dall-e-3 model
//   - "1024x1024:midjourney*" → override for models matching the prefix
//   - "default"               → fallback price if resolution not found
//
// Lookup order: exact match with model → exact match → prefix match with model → prefix match → default → 0
// ---------------------------------------------------------------------------

var defaultResolutionPrices = map[string]float64{
	"1K":      0.792,
	"2K":      0.792,
	"4K":      1.418,
	"default": 0.50,
}

// ResolutionPriceSetting is managed by config.GlobalConfig.Register.
type ResolutionPriceSetting struct {
	Prices map[string]float64 `json:"prices"`
}

var resolutionPriceSetting = ResolutionPriceSetting{
	Prices: func() map[string]float64 {
		m := make(map[string]float64, len(defaultResolutionPrices))
		for k, v := range defaultResolutionPrices {
			m[k] = v
		}
		return m
	}(),
}

func init() {
	config.GlobalConfig.Register("resolution_price_setting", &resolutionPriceSetting)
	RebuildResolutionPriceIndex()
}

// ---------------------------------------------------------------------------
// Precomputed price index (atomic, lock-free on read path)
// ---------------------------------------------------------------------------

type resolutionPrefixEntry struct {
	prefix string
	price  float64
}

type resolutionPriceIndex struct {
	defaults       map[string]float64                        // resolution → price
	modelOverrides map[string]map[string]float64             // modelName → (resolution → price)
	prefixes       map[string][]resolutionPrefixEntry        // resolution → []prefixEntry
	modelPrefixes  map[string]map[string][]resolutionPrefixEntry // resolution → (modelName → []prefixEntry)
}

var currentResolutionIndex atomic.Pointer[resolutionPriceIndex]

// RebuildResolutionPriceIndex rebuilds the lookup index from the current config.
// Called on init and after config updates. Not on the billing hot path.
func RebuildResolutionPriceIndex() {
	merged := make(map[string]float64, len(defaultResolutionPrices)+len(resolutionPriceSetting.Prices))
	for k, v := range defaultResolutionPrices {
		merged[k] = v
	}
	for k, v := range resolutionPriceSetting.Prices {
		merged[k] = v
	}

	idx := &resolutionPriceIndex{
		defaults:       make(map[string]float64),
		modelOverrides: make(map[string]map[string]float64),
		prefixes:       make(map[string][]resolutionPrefixEntry),
		modelPrefixes:  make(map[string]map[string][]resolutionPrefixEntry),
	}

	for key, price := range merged {
		colonIdx := strings.IndexByte(key, ':')
		if colonIdx < 0 {
			// Simple resolution key: "1K", "4K", "default"
			idx.defaults[key] = price
			continue
		}

		// Key with model: "1K:dall-e-3" or "4K:midjourney*"
		resolution := key[:colonIdx]
		modelPart := key[colonIdx+1:]

		if strings.HasSuffix(modelPart, "*") {
			// Prefix match: "4K:midjourney*"
			prefix := strings.TrimSuffix(modelPart, "*")
			if idx.modelPrefixes[resolution] == nil {
				idx.modelPrefixes[resolution] = make(map[string][]resolutionPrefixEntry)
			}
			idx.modelPrefixes[resolution][prefix] = append(
				idx.modelPrefixes[resolution][prefix],
				resolutionPrefixEntry{prefix: prefix, price: price},
			)
		} else {
			// Exact model match: "1K:dall-e-3"
			if idx.modelOverrides[modelPart] == nil {
				idx.modelOverrides[modelPart] = make(map[string]float64)
			}
			idx.modelOverrides[modelPart][resolution] = price
		}
	}

	// Sort prefixes by length (longest first) for each resolution
	for resolution := range idx.modelPrefixes {
		for modelPrefix := range idx.modelPrefixes[resolution] {
			entries := idx.modelPrefixes[resolution][modelPrefix]
			sort.Slice(entries, func(i, j int) bool {
				return len(entries[i].prefix) > len(entries[j].prefix)
			})
			idx.modelPrefixes[resolution][modelPrefix] = entries
		}
	}

	currentResolutionIndex.Store(idx)
}

// GetResolutionPriceForModel returns the price ($/call) for a resolution given a model name.
// Lookup order:
// 1. Exact match with model: "1K:dall-e-3"
// 2. Prefix match with model: "1K:dall-e*"
// 3. Exact resolution match: "1K"
// 4. Default: "default"
// 5. Fallback: 0
func GetResolutionPriceForModel(resolution, modelName string) float64 {
	idx := currentResolutionIndex.Load()
	if idx == nil {
		if v, ok := defaultResolutionPrices[resolution]; ok {
			return v
		}
		if v, ok := defaultResolutionPrices["default"]; ok {
			return v
		}
		return 0
	}

	// Normalize resolution to lowercase for comparison
	resolution = strings.ToLower(strings.TrimSpace(resolution))
	if resolution == "" {
		resolution = "default"
	}

	// 1. Check exact model override: "1K:dall-e-3"
	if modelName != "" {
		if resMap, ok := idx.modelOverrides[modelName]; ok {
			if p, ok := resMap[resolution]; ok {
				return p
			}
		}

		// 2. Check prefix match with model: "1K:dall-e*"
		if prefixMap, ok := idx.modelPrefixes[resolution]; ok {
			for prefix, entries := range prefixMap {
				if strings.HasPrefix(modelName, prefix) {
					for _, e := range entries {
						if strings.HasPrefix(modelName, e.prefix) {
							return e.price
						}
					}
				}
			}
		}
	}

	// 3. Check exact resolution match: "1K"
	if p, ok := idx.defaults[resolution]; ok {
		return p
	}

	// 4. Check default
	if p, ok := idx.defaults["default"]; ok {
		return p
	}

	// 5. Fallback
	return 0
}

// GetResolutionPrice is a convenience wrapper when no model name is needed.
func GetResolutionPrice(resolution string) float64 {
	return GetResolutionPriceForModel(resolution, "")
}

// NormalizeResolution normalizes common resolution formats:
// - "1024x1024" → "1024x1024"
// - "1K" → "1k"
// - "4K" → "4k"
// - "high_1024x1024" → "high_1024x1024"
func NormalizeResolution(resolution string) string {
	return strings.ToLower(strings.TrimSpace(resolution))
}

// ExtractResolutionFromRequest extracts resolution from request parameters.
// Checks both "size" and "imageSize" fields.
func ExtractResolutionFromRequest(size, imageSize string) string {
	if size != "" {
		return NormalizeResolution(size)
	}
	if imageSize != "" {
		return NormalizeResolution(imageSize)
	}
	return "default"
}
