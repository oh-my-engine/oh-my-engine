---
name: oh-my-engine-ui
version: 1.0.0
description: 从设计稿还原 UI 组件
author: yunxi
tags: [ui, design, mastergo, figma, code-generation]
---

# oh-my-engine-ui

从 MasterGo/Figma 设计稿自动生成 UI 组件代码。

## 使用方法

```bash
/oh-my-engine-ui <design-url>
```

Claude Code 可直接使用上面的 slash command。
Codex 请按技能名 `oh-my-engine-ui` 触发，并沿用相同参数。

## 参数

- `design-url`: MasterGo 或 Figma 设计稿链接

## 示例

```bash
# MasterGo 设计稿
/oh-my-engine-ui https://mastergo.com/goto/xxxxx

# Figma 设计稿
/oh-my-engine-ui https://www.figma.com/file/xxxxx
```

## 执行流程

1. **解析设计稿 URL**
   - 验证 URL 格式
   - 提取 fileId 和 layerId
   - 检测设计工具类型

2. **获取设计数据**
   - 调用 MCP 获取 DSL 数据
   - 获取组件元数据
   - 下载设计资源

3. **分析设计结构**
   - 识别组件类型
   - 提取设计 tokens
   - 分析布局结构

4. **应用规则验证**
   - 加载项目规则（.oh-my-engine/rules/）
   - 验证 i18n、theme、design-tokens 规则
   - 记录验证结果

5. **生成代码**
   - 生成组件文件
   - 生成样式文件
   - 生成类型定义
   - 生成测试文件

6. **写入文件**
   - 检查输出目录
   - 写入生成的文件
   - 更新 index 文件

7. **验证生成结果**
   - 检查语法错误
   - 检查样式错误
   - 运行测试

8. **保存记忆**
   - 记录执行时间
   - 记录成功/失败状态
   - 记录应用的规则
   - 触发进化分析（后台）

## 配置

### 项目配置（.oh-my-engine/config.json）

```json
{
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "rules": ["i18n", "theme", "design-tokens"],
      "options": {
        "languages": ["en", "zh-CN", "zh-TW", "th"],
        "themeSystem": "ThemedStyle",
        "designTokens": true,
        "outputDir": "src/components"
      }
    }
  }
}
```

### 全局默认配置

如果项目没有 `.oh-my-engine/` 配置，将使用全局默认模板：
- 位置：`~/.claude/skills/oh-my-engine/templates/ui-restore.md`
- 规则：`~/.claude/skills/oh-my-engine/rules/`

## 输出示例

```
✅ UI 还原完成

生成的文件：
  - src/components/LoginButton/index.tsx
  - src/components/LoginButton/styles.module.css
  - src/components/LoginButton/types.d.ts
  - src/components/LoginButton/LoginButton.test.tsx

应用的规则：
  ✅ i18n: 所有文本已国际化
  ✅ theme: 使用主题变量
  ✅ design-tokens: 使用设计令牌

执行时间: 8.5s
```

## 自动学习

系统会自动记录执行历史，当检测到可优化模式时：

- **错误重复 ≥3 次** → 自动生成修复 Skill
- **代码复用 ≥3 处** → 自动提取工具 Skill
- **成功率 ≥95%** → 固化为最佳实践

## 相关命令

- `/oh-my-engine-init` - 初始化项目配置
- `/oh-my-engine-memory` - 查看执行历史
- `/oh-my-engine-evolve` - 触发进化分析

---

**提示**：这个命令会随着使用次数增加而变得越来越智能！
