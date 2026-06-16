/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertCircle, RefreshCw, Search, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEnabledModels } from '@/features/channels/api'
import { safeJsonParse } from '../utils/json-parser'
import { combineBillingExpr } from '@/features/pricing/lib/billing-expr'
import {
  ModelPricingEditorPanel,
  type ModelPricingEditorPanelHandle,
  type ModelRatioData,
} from './model-pricing-sheet'
import { useUpdateOption } from '../hooks/use-update-option'

type UnsetPricingModelsProps = {
  modelDefaults: {
    ModelPrice: string
    ModelRatio: string
    CacheRatio: string
    CreateCacheRatio: string
    CompletionRatio: string
    ImageRatio: string
    AudioRatio: string
    AudioCompletionRatio: string
    BillingMode: string
    BillingExpr: string
  }
  onRefresh?: () => void
}

const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

export function UnsetPricingModels({
  modelDefaults,
  onRefresh,
}: UnsetPricingModelsProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [enabledModels, setEnabledModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null)
  const editorPanelRef = useRef<ModelPricingEditorPanelHandle>(null)

  const modelPriceMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.ModelPrice,
      { fallback: {} }
    )
  }, [modelDefaults.ModelPrice])

  const modelRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.ModelRatio,
      { fallback: {} }
    )
  }, [modelDefaults.ModelRatio])

  const completionRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.CompletionRatio,
      { fallback: {} }
    )
  }, [modelDefaults.CompletionRatio])

  const cacheRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.CacheRatio,
      { fallback: {} }
    )
  }, [modelDefaults.CacheRatio])

  const createCacheRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.CreateCacheRatio,
      { fallback: {} }
    )
  }, [modelDefaults.CreateCacheRatio])

  const imageRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.ImageRatio,
      { fallback: {} }
    )
  }, [modelDefaults.ImageRatio])

  const audioRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.AudioRatio,
      { fallback: {} }
    )
  }, [modelDefaults.AudioRatio])

  const audioCompletionRatioMap = useMemo(() => {
    return safeJsonParse<Record<string, string | number>>(
      modelDefaults.AudioCompletionRatio,
      { fallback: {} }
    )
  }, [modelDefaults.AudioCompletionRatio])

  const billingModeMap = useMemo(() => {
    return safeJsonParse<Record<string, string>>(modelDefaults.BillingMode, {
      fallback: {},
    })
  }, [modelDefaults.BillingMode])

  const billingExprMap = useMemo(() => {
    return safeJsonParse<Record<string, string>>(modelDefaults.BillingExpr, {
      fallback: {},
    })
  }, [modelDefaults.BillingExpr])

  const unsetModels = useMemo(() => {
    return enabledModels.filter((model) => {
      const hasPrice = hasValue(modelPriceMap[model])
      const hasRatio = hasValue(modelRatioMap[model])
      const hasBillingMode = hasValue(billingModeMap[model])
      return !hasPrice && !hasRatio && !hasBillingMode
    })
  }, [
    enabledModels,
    modelPriceMap,
    modelRatioMap,
    billingModeMap,
  ])

  const filteredModels = useMemo(() => {
    if (!searchText.trim()) return unsetModels
    const lowerSearch = searchText.toLowerCase()
    return unsetModels.filter((model) =>
      model.toLowerCase().includes(lowerSearch)
    )
  }, [unsetModels, searchText])

  const fetchEnabledModels = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getEnabledModels()
      if (res.success && res.data) {
        setEnabledModels(res.data)
      } else {
        toast.error(res.message || t('Failed to fetch enabled models'))
      }
    } catch (error) {
      toast.error(t('Failed to fetch enabled models'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchEnabledModels()
  }, [fetchEnabledModels])

  const selectedModel = useMemo(() => {
    if (!selectedModelName) return null

    const billingMode = billingModeMap[selectedModelName]
    const billingExpr = billingExprMap[selectedModelName]

    return {
      name: selectedModelName,
      price: modelPriceMap[selectedModelName]?.toString() || '',
      ratio: modelRatioMap[selectedModelName]?.toString() || '',
      cacheRatio: cacheRatioMap[selectedModelName]?.toString() || '',
      createCacheRatio: createCacheRatioMap[selectedModelName]?.toString() || '',
      completionRatio: completionRatioMap[selectedModelName]?.toString() || '',
      imageRatio: imageRatioMap[selectedModelName]?.toString() || '',
      audioRatio: audioRatioMap[selectedModelName]?.toString() || '',
      audioCompletionRatio:
        audioCompletionRatioMap[selectedModelName]?.toString() || '',
      billingMode: billingMode || 'per-token',
      billingExpr: billingExpr || '',
      requestRuleExpr: '',
    } as ModelRatioData
  }, [
    selectedModelName,
    modelPriceMap,
    modelRatioMap,
    cacheRatioMap,
    createCacheRatioMap,
    completionRatioMap,
    imageRatioMap,
    audioRatioMap,
    audioCompletionRatioMap,
    billingModeMap,
    billingExprMap,
  ])

  const handleSave = useCallback(async () => {
    if (!editorPanelRef.current || !selectedModelName) return

    const draft = await editorPanelRef.current.commitDraft()
    if (!draft) return

    const apiKeyMap: Record<string, string> = {
      billingMode: 'billing_setting.billing_mode',
      billingExpr: 'billing_setting.billing_expr',
    }

    try {
      const nextModelPrice = { ...modelPriceMap }
      const nextModelRatio = { ...modelRatioMap }
      const nextCacheRatio = { ...cacheRatioMap }
      const nextCreateCacheRatio = { ...createCacheRatioMap }
      const nextCompletionRatio = { ...completionRatioMap }
      const nextImageRatio = { ...imageRatioMap }
      const nextAudioRatio = { ...audioRatioMap }
      const nextAudioCompletionRatio = { ...audioCompletionRatioMap }
      const nextBillingMode = { ...billingModeMap }
      const nextBillingExpr = { ...billingExprMap }

      if (draft.price) {
        nextModelPrice[selectedModelName] = draft.price
      } else {
        delete nextModelPrice[selectedModelName]
      }

      if (draft.ratio) {
        nextModelRatio[selectedModelName] = draft.ratio
      } else {
        delete nextModelRatio[selectedModelName]
      }

      if (draft.cacheRatio) {
        nextCacheRatio[selectedModelName] = draft.cacheRatio
      } else {
        delete nextCacheRatio[selectedModelName]
      }

      if (draft.createCacheRatio) {
        nextCreateCacheRatio[selectedModelName] = draft.createCacheRatio
      } else {
        delete nextCreateCacheRatio[selectedModelName]
      }

      if (draft.completionRatio) {
        nextCompletionRatio[selectedModelName] = draft.completionRatio
      } else {
        delete nextCompletionRatio[selectedModelName]
      }

      if (draft.imageRatio) {
        nextImageRatio[selectedModelName] = draft.imageRatio
      } else {
        delete nextImageRatio[selectedModelName]
      }

      if (draft.audioRatio) {
        nextAudioRatio[selectedModelName] = draft.audioRatio
      } else {
        delete nextAudioRatio[selectedModelName]
      }

      if (draft.audioCompletionRatio) {
        nextAudioCompletionRatio[selectedModelName] = draft.audioCompletionRatio
      } else {
        delete nextAudioCompletionRatio[selectedModelName]
      }

      if (draft.billingMode === 'tiered_expr') {
        nextBillingMode[selectedModelName] = 'tiered_expr'
        nextBillingExpr[selectedModelName] = combineBillingExpr(
          draft.billingExpr || '',
          draft.requestRuleExpr || ''
        )
      } else {
        delete nextBillingMode[selectedModelName]
        delete nextBillingExpr[selectedModelName]
      }

      const updates = [
        { key: 'ModelPrice', value: JSON.stringify(nextModelPrice) },
        { key: 'ModelRatio', value: JSON.stringify(nextModelRatio) },
        { key: 'CacheRatio', value: JSON.stringify(nextCacheRatio) },
        { key: 'CreateCacheRatio', value: JSON.stringify(nextCreateCacheRatio) },
        { key: 'CompletionRatio', value: JSON.stringify(nextCompletionRatio) },
        { key: 'ImageRatio', value: JSON.stringify(nextImageRatio) },
        { key: 'AudioRatio', value: JSON.stringify(nextAudioRatio) },
        {
          key: 'AudioCompletionRatio',
          value: JSON.stringify(nextAudioCompletionRatio),
        },
        {
          key: apiKeyMap.billingMode || 'billing_setting.billing_mode',
          value: JSON.stringify(nextBillingMode),
        },
        {
          key: apiKeyMap.billingExpr || 'billing_setting.billing_expr',
          value: JSON.stringify(nextBillingExpr),
        },
      ]

      for (const update of updates) {
        await updateOption.mutateAsync(update)
      }

      toast.success(t('Model pricing saved successfully'))
      setSelectedModelName(null)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      toast.error(t('Failed to save model pricing'))
    }
  }, [
    selectedModelName,
    modelPriceMap,
    modelRatioMap,
    cacheRatioMap,
    createCacheRatioMap,
    completionRatioMap,
    imageRatioMap,
    audioRatioMap,
    audioCompletionRatioMap,
    billingModeMap,
    billingExprMap,
    updateOption,
    t,
    onRefresh,
  ])

  return (
    <div className='space-y-4'>
      <Alert>
        <AlertCircle data-icon='inline-start' />
        <AlertDescription>
          {t(
            'This page only shows models that have not been assigned any pricing. Once you set a price, the model will automatically be removed from this list.'
          )}
        </AlertDescription>
      </Alert>

      <div className='flex flex-wrap items-center gap-3'>
        <Button
          variant='outline'
          size='sm'
          onClick={fetchEnabledModels}
          disabled={loading}
        >
          <RefreshCw
            className={loading ? 'animate-spin' : ''}
            data-icon='inline-start'
          />
          {t('Refresh')}
        </Button>
        <div className='relative flex-1 min-w-[200px]'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t('Search model name')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className='pl-9 pr-9'
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
        <Badge variant='secondary' className='text-sm'>
          {t('{{count}} unset models', { count: filteredModels.length })}
        </Badge>
      </div>

      <div className='grid gap-4 md:grid-cols-[300px_1fr]'>
        <Card className='p-4'>
          <div className='space-y-2'>
            <h3 className='font-medium text-sm'>{t('Unset models')}</h3>
            {loading ? (
              <div className='text-sm text-muted-foreground py-8 text-center'>
                {t('Loading...')}
              </div>
            ) : filteredModels.length === 0 ? (
              <div className='text-sm text-muted-foreground py-8 text-center'>
                {searchText
                  ? t('No matching models')
                  : t('No unset pricing models')}
              </div>
            ) : (
              <div className='space-y-1 max-h-[600px] overflow-y-auto'>
                {filteredModels.map((model) => (
                  <button
                    key={model}
                    onClick={() => setSelectedModelName(model)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedModelName === model
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className='p-0 overflow-hidden'>
          {selectedModel ? (
            <ModelPricingEditorPanel
              ref={editorPanelRef}
              editData={selectedModel}
              onSave={handleSave}
              isSaving={updateOption.isPending}
            />
          ) : (
            <div className='flex flex-col items-center justify-center py-20 text-center px-4'>
              <div className='text-muted-foreground mb-2'>
                {filteredModels.length === 0
                  ? t('No unset pricing models')
                  : t('Select a model from the list to set its pricing')}
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('Models with pricing configured will not appear in this list')}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
