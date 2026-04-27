# 设计令牌规则（Design Tokens）

## 强制要求

### 1. 禁止硬编码样式值

```typescript
// ❌ 禁止
color: "#222222"
fontSize: 16
padding: 24
borderRadius: 8

// ✅ 必须
color: colors.text
fontSize: typography.sizes.md
padding: spacing.lg
borderRadius: borderRadius.sm
```

### 2. 所有样式值必须使用设计令牌

设计令牌是预定义的设计系统变量，确保整个应用的视觉一致性。

## 可用的设计令牌

### 1. 颜色（colors）

#### 主要颜色
```typescript
colors.tint          // #FF432C - 主题色（红色）
colors.background    // #FFFFFF - 背景色
colors.text          // #222222 - 主文本色
colors.textDim       // #666666 - 次要文本色
```

#### 功能颜色
```typescript
colors.error         // 错误色
colors.success       // 成功色
colors.warning       // 警告色
colors.info          // 信息色
```

#### 边框和分隔
```typescript
colors.border        // 边框色
colors.separator     // 分隔线色
```

#### 透明度变体
```typescript
colors.palette.neutral100  // 完全不透明
colors.palette.neutral200  // 轻微透明
// ... 更多透明度级别
```

### 2. 间距（spacing）

```typescript
spacing.xs   // 8px  - 最小间距
spacing.sm   // 12px - 小间距
spacing.md   // 16px - 中等间距（默认）
spacing.lg   // 24px - 大间距
spacing.xl   // 32px - 超大间距
spacing.xxl  // 48px - 最大间距
```

**使用场景**：
- `xs`: 图标与文本间距、小元素内边距
- `sm`: 列表项内边距、小卡片间距
- `md`: 标准内边距、按钮内边距
- `lg`: 卡片内边距、屏幕边距
- `xl`: 大卡片内边距、区块间距
- `xxl`: 屏幕顶部间距、大区块间距

### 3. 字体（typography）

#### 字体大小
```typescript
typography.sizes.xs   // 12px - 辅助文本
typography.sizes.sm   // 14px - 次要文本
typography.sizes.md   // 16px - 正文（默认）
typography.sizes.lg   // 24px - 标题
typography.sizes.xl   // 32px - 大标题
typography.sizes.xxl  // 48px - 超大标题
```

#### 字体粗细
```typescript
fontWeight: "400"  // Regular
fontWeight: "500"  // Medium
fontWeight: "600"  // Semibold
fontWeight: "700"  // Bold
```

**注意**：
- 字体无需手动设置 `fontFamily`
- 系统根据语言 + fontWeight 自动应用正确的字体
- 中文使用 Noto Sans SC，英文使用 Inter，泰文使用 Noto Sans Thai

### 4. 圆角（borderRadius）

```typescript
borderRadius.xs   // 4px  - 小圆角
borderRadius.sm   // 8px  - 标准圆角
borderRadius.md   // 12px - 中等圆角
borderRadius.lg   // 16px - 大圆角
borderRadius.xl   // 24px - 超大圆角
```

**使用场景**：
- `xs`: 小按钮、标签
- `sm`: 标准按钮、输入框
- `md`: 卡片、弹窗
- `lg`: 大卡片、图片
- `xl`: 特殊形状、圆形头像

### 5. 阴影（shadows）

```typescript
// 使用预定义的阴影样式
...shadows.sm   // 小阴影
...shadows.md   // 中等阴影
...shadows.lg   // 大阴影
```

## 使用示例

### 完整的样式定义

```typescript
import { ThemedStyle } from "app/theme"
import { ViewStyle, TextStyle } from "react-native"

const $card: ThemedStyle<ViewStyle> = ({ colors, spacing, borderRadius }) => ({
  backgroundColor: colors.background,
  padding: spacing.lg,
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderColor: colors.border,
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontSize: typography.sizes.lg,
  fontWeight: "600",
  marginBottom: spacing.sm,
})

const $description: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  color: colors.textDim,
  fontSize: typography.sizes.sm,
  lineHeight: typography.sizes.sm * 1.5,
  marginBottom: spacing.md,
})
```

## 特殊情况处理

### 1. 需要计算的值

```typescript
// ✅ 可以基于设计令牌进行计算
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  marginTop: spacing.lg * 2,  // 48px
  height: spacing.xl + spacing.md,  // 48px
})
```

### 2. 百分比和 flex

```typescript
// ✅ 布局相关的值可以直接使用
const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  width: "100%",
  height: "50%",
})
```

### 3. 固定尺寸（需要充分理由）

```typescript
// ⚠️ 仅在必要时使用固定值（如图标尺寸）
const $icon: ThemedStyle<ViewStyle> = () => ({
  width: 24,   // 图标固定尺寸
  height: 24,
})
```

## 验证清单

生成代码后必须检查：

- [ ] 颜色使用 `colors.*`（无硬编码颜色值）
- [ ] 间距使用 `spacing.*`（无硬编码数字）
- [ ] 字体大小使用 `typography.sizes.*`
- [ ] 圆角使用 `borderRadius.*`
- [ ] 没有手动设置 `fontFamily`
- [ ] 特殊情况有充分理由

## 相关文件

- 颜色定义：`app/theme/colors.ts`
- 间距定义：`app/theme/spacing.ts`
- 字体定义：`app/theme/typography.ts`
- 圆角定义：`app/theme/borderRadius.ts`
- 主题配置：`app/theme/index.ts`
