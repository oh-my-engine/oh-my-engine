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

## ThemedStyle 可用的设计令牌

### 1. colors（颜色）

```typescript
colors.text          // 主文本颜色
colors.textDim       // 次要文本颜色
colors.background    // 背景色
colors.tint          // 主题色
colors.border        // 边框色
```

### 2. spacing（间距）

```typescript
spacing.xs   // 8
spacing.sm   // 12
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32
```

### 3. typography（字体）

```typescript
typography.sizes.xs   // 12
typography.sizes.sm   // 14
typography.sizes.md   // 16
typography.sizes.lg   // 24
```

## 验证清单

生成代码后必须检查：

- [ ] 所有样式都预定义为 `ThemedStyle`
- [ ] 没有行内样式（`style={{ ... }}`）
- [ ] 使用了设计令牌（colors.*, spacing.* 等）
- [ ] 样式文件独立（`.styles.ts`）
