---
name: oh-my-engine-init
version: 1.0.0
description: 初始化项目配置
author: yunxi
tags: [init, setup, configuration]
---

# oh-my-engine-init

在当前项目中初始化 Oh My Engine 配置。

## 使用方法

```bash
/oh-my-engine-init [options]
```

Claude Code 可直接使用上面的 slash command。
Codex 请按技能名 `oh-my-engine-init` 触发，并沿用相同参数。

## 可执行脚本

这版 MVP 已提供实际初始化脚本：

```bash
./scripts/init-project.sh
./scripts/init-project.sh --template react-native
./scripts/init-project.sh --force
```

脚本会创建 `.oh-my-engine/`、`openspec/`、基础 `config.json`、规则模板，以及 `.gitignore` 中的记忆目录忽略项。

## 参数

- `--template`: 使用模板（可选：react-native/react/vue）
- `--force`: 强制覆盖已有配置

## 示例

```bash
# 基础初始化
/oh-my-engine-init

# 使用 React Native 模板
/oh-my-engine-init --template react-native

# 强制覆盖
/oh-my-engine-init --force
```

## 执行流程

1. **检查当前目录**
   - 检查是否已有 .oh-my-engine/ 目录
   - 检查是否是 Git 仓库
   - 识别项目类型

2. **创建目录结构**
   ```
   .oh-my-engine/
   ├── config.json          # 项目配置
   ├── workflows/           # 自定义工作流
   ├── rules/               # 项目规则
   └── memory/              # 项目记忆
       ├── executions/      # 执行历史
       ├── learnings/       # 学习数据
       ├── preferences/     # 用户偏好
       └── specs/           # Spec 执行记忆

   openspec/
   ├── project.md          # 项目级长期上下文
   ├── changes/            # 当前变更
   ├── specs/              # 长期能力规范
   └── archive/            # 已归档变更
   ```

3. **生成配置文件**
   - 复制默认模板
   - 根据项目类型调整
   - 生成 config.json

4. **复制规则模板**
   - i18n 规则
   - theme 规则
   - design-tokens 规则
   - code-style 规则

5. **初始化记忆系统**
   - 创建记忆目录
   - 初始化统计数据
   - 设置用户偏好

6. **添加到 .gitignore**
   - 添加 .oh-my-engine/memory/ 到 .gitignore
   - 保留配置文件在版本控制中

## 生成的配置示例

### config.json

```json
{
  "project": "MyProject",
  "version": "1.0.0",
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "rules": ["i18n", "theme", "design-tokens"],
      "options": {
        "languages": ["en", "zh-CN"],
        "themeSystem": "styled-components",
        "designTokens": true,
        "outputDir": "src/components"
      }
    },
    "bug-analysis": {
      "enabled": true,
      "rules": ["code-style"],
      "options": {
        "searchScope": ["src/", "app/"],
        "logPaths": ["logs/"],
        "autoFix": false
      }
    },
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "design-tokens", "theme"],
      "options": {
        "outputDir": "src/components",
        "componentLibrary": "react",
        "styleType": "css-modules",
        "generateTests": true
      }
    },
    "api-integration": {
      "enabled": true,
      "rules": ["code-style", "error-handling"],
      "options": {
        "outputDir": "src/services",
        "baseURL": "https://api.example.com",
        "generateMocks": true,
        "generateTests": true
      }
    },
    "spec": {
      "enabled": true,
      "format": "openspec-compatible",
      "options": {
        "specRoot": "openspec",
        "changesDir": "openspec/changes",
        "specsDir": "openspec/specs",
        "archiveDir": "openspec/archive",
        "memoryDir": ".oh-my-engine/memory/specs",
        "defaultFlow": "propose-plan-apply-verify-archive",
        "verifyCommands": [
          "npm test"
        ]
      }
    }
  },
  "memory": {
    "enabled": true,
    "retention": "90d",
    "maxExecutions": 1000
  },
  "evolution": {
    "enabled": true,
    "autoApply": false,
    "evaluationInterval": "daily",
    "optimizationThreshold": 85
  }
}
```

## 模板

### React Native 模板

```bash
/oh-my-engine-init --template react-native
```

特点：
- 4 种语言支持（en/zh-CN/zh-TW/th）
- ThemedStyle 主题系统
- React Native 组件库
- Expo 支持

### React 模板

```bash
/oh-my-engine-init --template react
```

特点：
- 2 种语言支持（en/zh-CN）
- CSS Modules 样式系统
- React 组件库
- Vite/CRA 支持

### Vue 模板

```bash
/oh-my-engine-init --template vue
```

特点：
- 2 种语言支持（en/zh-CN）
- Scoped CSS 样式系统
- Vue 组件库
- Vite 支持

## 输出示例

```
✅ Oh My Engine 初始化完成

创建的目录：
  ✅ .oh-my-engine/
  ✅ .oh-my-engine/workflows/
  ✅ .oh-my-engine/rules/
  ✅ .oh-my-engine/memory/
  ✅ openspec/

生成的文件：
  ✅ .oh-my-engine/config.json
  ✅ .oh-my-engine/rules/i18n.md
  ✅ .oh-my-engine/rules/theme.md
  ✅ .oh-my-engine/rules/design-tokens.md
  ✅ .oh-my-engine/rules/code-style.md
  ✅ openspec/project.md

更新的文件：
  ✅ .gitignore (添加 .oh-my-engine/memory/)

下一步：
  1. 编辑 .oh-my-engine/config.json 调整配置
  2. 完善 openspec/project.md 的项目上下文
  3. 运行 /oh-my-engine-spec propose <change-id>

执行时间: 1.2s
```

## 自定义配置

初始化后，你可以：

1. **编辑配置文件**
   ```bash
   vim .oh-my-engine/config.json
   ```

2. **自定义规则**
   ```bash
   vim .oh-my-engine/rules/i18n.md
   ```

3. **添加自定义工作流**
   ```bash
   vim .oh-my-engine/workflows/my-workflow.md
   ```

## 团队协作

配置文件可以提交到 Git：
```bash
git add .oh-my-engine/config.json
git add .oh-my-engine/rules/
git add .oh-my-engine/workflows/
git commit -m "Add Oh My Engine configuration"
```

记忆数据不会提交（已在 .gitignore 中）。

## 相关命令

- `/oh-my-engine-ui` - 开始使用 UI 还原
- `/oh-my-engine-memory` - 查看记忆统计
- `/oh-my-engine-evolve` - 触发进化分析

---

**提示**：初始化后，系统会根据你的使用习惯自动学习和优化！
