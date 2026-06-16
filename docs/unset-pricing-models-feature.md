# 未设置价格模型功能 - 更新说明

## 功能概述

在新主题的"模型定价"页面中添加了"未设置价格模型"Tab，用于快速查找并配置尚未设置价格的模型。

## ✅ 最终实现位置

**正确位置**：系统设置 → 计费设置 → **模型定价 (Model Pricing)** → **未设置价格模型** Tab

与旧主题保持一致的访问路径和用户体验。

## 功能特点

1. **自动筛选**: 自动显示所有已启用但未设置任何价格的模型
2. **实时搜索**: 支持按模型名称搜索过滤
3. **可视化编辑**: 使用与主模型定价页面相同的编辑器
4. **自动移除**: 设置价格后，模型会自动从列表中消失
5. **计数显示**: 实时显示未设置价格的模型数量
6. **响应式设计**: 支持桌面和移动端

## 使用方法

### 访问路径
1. 登录管理后台
2. 导航至 **系统设置 (System Settings)** → **计费设置 (Billing)**
3. 点击 **模型定价 (Model Pricing)**
4. 切换到 **未设置价格模型 (Unset pricing models)** Tab

### 界面布局

```
模型定价
┌─────────────────────────────────────────────────────────────┐
│  [模型价格] [工具价格] [未设置价格模型] [上游价格同步]        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────────────────────┐     │
│  │ 未设置模型列表  │  │    价格编辑器                   │     │
│  │                │  │                                │     │
│  │ • gpt-4        │  │  [模型名称]                     │     │
│  │ • claude-3     │  │  [计费方式]                     │     │
│  │ • gemini-pro   │  │  [价格设置]                     │     │
│  │                │  │                                │     │
│  │ [搜索框]       │  │  [保存]                        │     │
│  └────────────────┘  └────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 操作步骤
1. 切换到"未设置价格模型"Tab
2. 页面自动加载所有未设置价格的模型
3. 使用搜索框快速定位特定模型
4. 点击左侧列表中的模型名称
5. 在右侧编辑器中设置价格（三种模式）：
   - **按量计费**: 按token数量计费
   - **按次计费**: 固定价格
   - **表达式计费**: 动态表达式
6. 点击"保存模型价格"按钮
7. 模型自动从未设置列表中移除

## 技术实现

### 核心文件

1. **新增组件**
   - `web/default/src/features/system-settings/models/unset-pricing-models.tsx`
     - 主组件：模型列表 + 搜索 + 编辑器集成

2. **修改文件**
   - `web/default/src/features/system-settings/models/ratio-settings-card.tsx`
     - 添加 'unset-models' 到 RatioTabId 类型
     - 添加 UnsetPricingModels 组件的渲染逻辑
     - 更新 tabLabels 和 grid 布局
   
   - `web/default/src/features/system-settings/billing/section-registry.tsx`
     - 在 model-pricing section 的 visibleTabs 中添加 'unset-models'

### 翻译更新

**英文 (en.json)**:
- `Unset pricing models`: "Unset pricing models"
- `{{count}} unset models`: "{{count}} unset models"
- `No unset pricing models`: "No unset pricing models"
- 等...

**中文 (zh.json)**:
- `Unset pricing models`: "未设置价格模型"
- `{{count}} unset models`: "{{count}} 个未设置模型"
- `No unset pricing models`: "没有未设置定价的模型"
- 等...

## 判断逻辑

模型被认为"未设置价格"的条件：
```typescript
const unsetModels = enabledModels.filter((model) => {
  const hasPrice = hasValue(modelPriceMap[model])
  const hasRatio = hasValue(modelRatioMap[model])
  const hasBillingMode = hasValue(billingModeMap[model])
  return !hasPrice && !hasRatio && !hasBillingMode
})
```

即：模型在启用列表中，但同时没有设置 `ModelPrice`、`ModelRatio` 和 `billing_mode`。

## API依赖

- `GET /api/channel/models_enabled`: 获取所有启用的模型
- `PUT /api/option`: 更新模型定价配置

## 与旧主题的对比

| 特性 | 旧主题 (Classic) | 新主题 (Default) |
|------|-----------------|------------------|
| 位置 | 分组与模型定价 → 未设置价格模型 | 模型定价 → 未设置价格模型 |
| 布局 | 表格 + 侧边栏 | 卡片列表 + 编辑器 |
| 搜索 | ✅ | ✅ |
| 统计 | ✅ | ✅ (徽章显示) |
| 响应式 | ✅ | ✅ (更优) |
| 编辑器 | Semi Design | Base UI (更现代) |

## 构建验证

```bash
cd web/default
bun run build
# ✅ Built in 3.00s
# ✅ No errors or warnings
```

## 测试建议

1. 访问"模型定价"页面，确认显示4个Tab
2. 切换到"未设置价格模型"Tab
3. 验证未设置价格的模型列表正确显示
4. 测试搜索功能
5. 选择一个模型，设置价格后保存
6. 确认模型从未设置列表中移除
7. 刷新页面，确认更改持久化

## 更新日期

2026-06-16
