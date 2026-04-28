---
rule: design-tokens
version: 1.0.0
description: 设计 Token 规则模板
category: design-system
---

# 设计 Token 规则模板

确保使用设计 tokens 而不是魔法数字。

## 规则说明

### 1. 魔法数字检测
```
❌ 错误：
padding: 16
margin: 24
borderRadius: 8

✅ 正确：
padding: tokens.spacing.md
margin: tokens.spacing.lg
borderRadius: tokens.radius.sm
```

### 2. Token 分类
```
spacing:
  - xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48

radius:
  - none: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999

fontSize:
  - xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24

lineHeight:
  - tight: 1.2, normal: 1.5, relaxed: 1.75

fontWeight:
  - light: 300, normal: 400, medium: 500, semibold: 600, bold: 700

shadow:
  - sm, md, lg, xl

opacity:
  - disabled: 0.5, hover: 0.8, pressed: 0.6
```

### 3. 必须使用 Token 的场景
- 所有间距值（padding, margin, gap）
- 所有圆角值（borderRadius）
- 所有字体大小（fontSize）
- 所有行高（lineHeight）
- 所有字重（fontWeight）
- 所有阴影（shadow）

### 4. 可以使用数字的场景
- 百分比（width: '50%'）
- 边框宽度（borderWidth: 1）
- 透明度（opacity: 0.5）
- z-index（zIndex: 10）

## 验证规则

### 检查项
1. 样式中是否有魔法数字（padding: 16）
2. 是否使用 token（tokens.spacing.md）
3. Token 是否存在于定义中
4. Token 命名是否规范

### 自动修复
```javascript
// 检测魔法数字
const magicNumber = /padding|margin|gap|borderRadius|fontSize/;

// 自动映射到 token
function mapToToken(property, value) {
  const tokenMap = {
    padding: {
      4: 'tokens.spacing.xs',
      8: 'tokens.spacing.sm',
      16: 'tokens.spacing.md',
      24: 'tokens.spacing.lg',
      32: 'tokens.spacing.xl',
    },
    borderRadius: {
      4: 'tokens.radius.sm',
      8: 'tokens.radius.md',
      12: 'tokens.radius.lg',
    },
    // ... 更多映射
  };
  return tokenMap[property]?.[value] || value;
}

// 自动替换
function autoFix(code, property, value) {
  const token = mapToToken(property, value);
  return code.replace(`${property}: ${value}`, `${property}: ${token}`);
}
```

## 项目配置示例

```json
{
  "design_tokens": {
    "enabled": true,
    "token_variable": "tokens",
    "check_magic_numbers": true,
    "auto_convert": true,
    "allowed_numbers": [0, 1, -1],
    "token_file": "./src/theme/tokens.ts"
  }
}
```

## 学习和进化

### 模式识别
- 某个数值总是被使用 → 添加到 token 定义
- 某个 token 从未使用 → 标记为可删除
- 某个数值范围常见 → 生成新的 token 级别

### Skill 生成触发
- 魔法数字 ≥ 5 次 → 生成 auto-convert-to-tokens skill
- 缺失 token ≥ 3 次 → 生成 token-generator skill

---

**提示**：使用 design tokens 让你的设计系统更加一致！
