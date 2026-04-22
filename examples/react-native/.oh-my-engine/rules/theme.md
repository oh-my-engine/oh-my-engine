# 主题系统规则（ThemedStyle）

## 强制要求

### 1. 禁止行内样式

```typescript
// ❌ 禁止
<View style={{ backgroundColor: "#FF432C", padding: 16 }} />
<View style={themed({ padding: spacing.md })} />

// ✅ 必须（预定义 ThemedStyle）
const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.tint,
  padding: spacing.md,
})
<View style={themed($container)} />
```

### 2. 所有样式必须预定义为 ThemedStyle

```typescript
// ✅ 正确的样式定义
import { ThemedStyle } from "app/theme"
import { ViewStyle, TextStyle } from "react-native"

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.background,
  padding: spacing.md,
})

const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontSize: typography.sizes.lg,
  fontWeight: "600",
})
```

### 3. 禁止在 JSX 中使用对象字面量

```typescript
// ❌ 禁止
<View style={{ flex: 1 }} />
<Text style={{ color: "red" }} />

// ✅ 必须
const $flex: ThemedStyle<ViewStyle> = () => ({ flex: 1 })
<View style={themed($flex)} />
```

### 4. 禁止在 render 内创建样式对象

```typescript
// ❌ 禁止
function MyComponent() {
  return (
    <View style={themed(({ colors }) => ({
      backgroundColor: colors.background
    }))} />
  )
}

// ✅ 必须
const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

function MyComponent() {
  return <View style={themed($container)} />
}
```

## ThemedStyle 可用的设计令牌

### 1. colors（颜色）

```typescript
colors.text          // 主文本颜色
colors.textDim       // 次要文本颜色
colors.background    // 背景色
colors.tint          // 主题色
colors.border        // 边框色
colors.error         // 错误色
colors.success       // 成功色
colors.warning       // 警告色
```

### 2. spacing（间距）

```typescript
spacing.xs   // 8
spacing.sm   // 12
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32
spacing.xxl  // 48
```

### 3. typography（字体）

```typescript
typography.sizes.xs   // 12
typography.sizes.sm   // 14
typography.sizes.md   // 16
typography.sizes.lg   // 24
typography.sizes.xl   // 32

// 注意：字体无需手动设置 fontFamily
// 系统根据语言 + fontWeight 自动应用
```

### 4. borderRadius（圆角）

```typescript
borderRadius.xs   // 4
borderRadius.sm   // 8
borderRadius.md   // 12
borderRadius.lg   // 16
borderRadius.xl   // 24
```

## 样式文件组织

### 1. 独立的样式文件

每个组件/页面应该拆分为：
- `Component.tsx` - 组件逻辑
- `Component.styles.ts` - 样式定义
- `index.ts` - 导出

```typescript
// Component.styles.ts
import { ThemedStyle } from "app/theme"
import { ViewStyle, TextStyle } from "react-native"

export const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.background,
  padding: spacing.md,
})

export const $title: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  color: colors.text,
  fontSize: typography.sizes.lg,
  fontWeight: "600",
})
```

```typescript
// Component.tsx
import { themed } from "app/theme"
import { $container, $title } from "./Component.styles"

export function Component() {
  return (
    <View style={themed($container)}>
      <Text style={themed($title)}>Title</Text>
    </View>
  )
}
```

### 2. 样式命名规范

- 使用 `$` 前缀：`$container`, `$title`, `$button`
- 使用驼峰命名：`$headerContainer`, `$submitButton`
- 语义化命名：描述用途而非样式

## 验证清单

生成代码后必须检查：

- [ ] 所有样式都预定义为 `ThemedStyle`
- [ ] 没有行内样式（`style={{ ... }}`）
- [ ] 没有在 render 内创建样式对象
- [ ] 使用了设计令牌（colors.*, spacing.* 等）
- [ ] 样式文件独立（`.styles.ts`）
- [ ] 样式命名符合规范（`$` 前缀）

## 相关文件

- 主题配置：`app/theme/`
- ThemedStyle 类型：`app/theme/themed.ts`
- 设计令牌：`app/theme/colors.ts`, `app/theme/spacing.ts` 等
