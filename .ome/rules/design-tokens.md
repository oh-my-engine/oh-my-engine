# 设计令牌规则

## 强制要求

### 1. 必须使用设计令牌

所有样式值必须来自设计令牌系统，禁止硬编码。

```typescript
// ❌ 禁止
const $container: ThemedStyle<ViewStyle> = () => ({
  padding: 16,
  borderRadius: 8,
  backgroundColor: "#FF432C",
})

// ✅ 必须
const $container: ThemedStyle<ViewStyle> = ({ spacing, borderRadius, colors }) => ({
  padding: spacing.md,
  borderRadius: borderRadius.sm,
  backgroundColor: colors.tint,
})
```

## 可用的设计令牌

### colors（颜色）

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

### spacing（间距）

```typescript
spacing.xs   // 8
spacing.sm   // 12
spacing.md   // 16
spacing.lg   // 24
spacing.xl   // 32
spacing.xxl  // 48
```

### typography（字体）

```typescript
typography.sizes.xs   // 12
typography.sizes.sm   // 14
typography.sizes.md   // 16
typography.sizes.lg   // 24
typography.sizes.xl   // 32
```

### borderRadius（圆角）

```typescript
borderRadius.xs   // 4
borderRadius.sm   // 8
borderRadius.md   // 12
borderRadius.lg   // 16
borderRadius.xl   // 24
```

## 验证清单

- [ ] 所有数值都使用设计令牌
- [ ] 没有硬编码的颜色值
- [ ] 没有硬编码的间距值
- [ ] 没有硬编码的字体大小
