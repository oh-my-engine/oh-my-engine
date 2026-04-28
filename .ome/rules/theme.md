---
rule: theme
version: 1.0.0
description: 主题规则模板
category: styling
---

# 主题规则模板

确保所有样式使用主题变量，支持主题切换。

## 规则说明

### 1. 颜色硬编码检测
```
❌ 错误：
backgroundColor: '#FF0000'
color: 'blue'

✅ 正确：
backgroundColor: theme.colors.primary
color: theme.colors.text
```

### 2. 主题变量命名规范
```
colors:
  - primary, secondary, accent
  - background, surface, card
  - text, textSecondary, textDisabled
  - error, warning, success, info
  - border, divider

spacing:
  - xs, sm, md, lg, xl, xxl

typography:
  - h1, h2, h3, h4, h5, h6
  - body, bodySmall, caption
  - button, label
```

### 3. 必须使用主题的场景
- 所有颜色值
- 所有间距值
- 所有字体样式
- 所有圆角值
- 所有阴影值

### 4. 可以硬编码的场景
- 透明度值（opacity）
- 百分比值（width: '100%'）
- 固定尺寸（borderWidth: 1）

## 验证规则

### 检查项
1. 样式对象中是否有硬编码颜色（#xxx, rgb(), rgba()）
2. 是否使用主题变量（theme.colors.xxx）
3. 间距是否使用主题值（theme.spacing.xxx）
4. 字体是否使用主题定义（theme.typography.xxx）

### 自动修复
```javascript
// 检测硬编码颜色
const hardcodedColor = /#[0-9A-Fa-f]{6}|rgb\(|rgba\(/g;

// 自动映射到主题变量
function mapToThemeColor(color) {
  const colorMap = {
    '#FF0000': 'theme.colors.error',
    '#00FF00': 'theme.colors.success',
    '#0000FF': 'theme.colors.primary',
    // ... 更多映射
  };
  return colorMap[color] || 'theme.colors.primary';
}

// 自动替换
function autoFix(code, color) {
  const themeVar = mapToThemeColor(color);
  return code.replace(color, themeVar);
}
```

## 项目配置示例

```json
{
  "theme": {
    "enabled": true,
    "theme_variable": "theme",
    "check_hardcoded_colors": true,
    "check_hardcoded_spacing": true,
    "check_hardcoded_typography": true,
    "auto_convert": true,
    "allowed_hardcoded": ["transparent", "inherit"]
  }
}
```

## 学习和进化

### 模式识别
- 某个颜色值总是被使用 → 添加到主题定义
- 某个间距值复用率高 → 提取为主题变量
- 某个样式组合常见 → 生成快捷方式

### Skill 生成触发
- 硬编码颜色 ≥ 5 次 → 生成 auto-convert-to-theme skill
- 缺失主题变量 ≥ 3 次 → 生成 theme-variable-generator skill

---

**提示**：这个规则会帮助你构建一致的视觉体验！
