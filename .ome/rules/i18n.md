---
rule: i18n
version: 1.0.0
description: 国际化规则模板
category: localization
---

# 国际化规则模板

确保所有用户可见文本都支持国际化。

## 规则说明

### 1. 文本硬编码检测
```
❌ 错误：
<Text>登录</Text>
<Button title="提交" />

✅ 正确：
<Text>{t('login')}</Text>
<Button title={t('submit')} />
```

### 2. 翻译键命名规范
```
格式：<模块>.<功能>.<描述>
示例：
- auth.login.title
- auth.login.button
- profile.settings.save
```

### 3. 必须翻译的内容
- 按钮文本
- 标题和标签
- 提示信息
- 错误消息
- 占位符文本

### 4. 无需翻译的内容
- 日志信息
- 开发调试文本
- API 端点
- 技术标识符

## 验证规则

### 检查项
1. 所有 JSX 文本节点是否使用 `t()` 函数
2. 所有字符串属性（title, placeholder, label）是否使用 `t()`
3. 翻译键是否遵循命名规范
4. 翻译文件是否包含所有语言

### 自动修复
```javascript
// 检测硬编码文本
const hardcodedText = /<Text>[\u4e00-\u9fa5]+<\/Text>/g;

// 自动生成翻译键
function generateI18nKey(text, context) {
  const module = context.module;
  const feature = context.feature;
  const key = toPinyin(text).toLowerCase();
  return `${module}.${feature}.${key}`;
}

// 自动替换
function autoFix(code, text) {
  const key = generateI18nKey(text, context);
  return code.replace(text, `{t('${key}')}`);
}
```

## 项目配置示例

```json
{
  "i18n": {
    "enabled": true,
    "languages": ["en", "zh-CN", "zh-TW", "th"],
    "default_language": "en",
    "translation_function": "t",
    "key_format": "<module>.<feature>.<key>",
    "auto_generate_keys": true,
    "check_missing_translations": true
  }
}
```

## 学习和进化

### 模式识别
- 某个模块的翻译键总是缺失 → 生成自动补全规则
- 某类文本总是被误判 → 添加到白名单
- 某个命名模式复用率高 → 固化为标准

### Skill 生成触发
- 翻译键缺失 ≥ 5 次 → 生成 auto-generate-i18n-keys skill
- 命名不规范 ≥ 3 次 → 生成 i18n-key-formatter skill

---

**提示**：这个规则会随着项目使用而自动优化！
