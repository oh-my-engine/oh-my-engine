---
version: 1.0.0
project:
  name: Oh My Engine
  type: workflow-engine
  framework: node
workflows:
  ui-restore:
    enabled: true
    description: 从设计稿还原 UI 组件
    skills:
      - ome-ui
    rules:
      - domain-ui-theme
      - domain-i18n
      - domain-ui-design-tokens
    options: {}
  bug-analysis:
    enabled: true
    description: 分析和修复 Bug
    skills:
      - ome-bug
    rules:
      - universal-code-style
    options: {}
  component-gen:
    enabled: true
    description: 生成可复用组件
    skills:
      - ome-comp
    rules:
      - domain-ui-theme
      - domain-i18n
      - domain-ui-design-tokens
    options: {}
  api-integration:
    enabled: true
    description: 集成 API 接口
    skills:
      - ome-api
    rules:
      - universal-code-style
    options: {}
rules:
  theme:
    description: 主题系统规则
    required: true
  i18n:
    description: 多语言规则
    required: true
  design_tokens:
    description: 设计令牌规则
    required: true
  code_style:
    description: 代码风格规则
    required: true
memory:
  enabled: true
  captureMode: selective
  allowSources:
    workflow_command: true
    explicit_remember: true
    post_run_promotion: true
  thresholds:
    preferencePromotion: 0.8
    knowledgePromotion: 0.85
    skillCandidatePromotion: 0.9
  retention_days: 90
evolution:
  enabled: true
  autoApply: false
  requireVerification: true
  candidateOnly: true
  thresholds:
    learningCandidateMinEvidence: 3
    skillCandidateMinEvidence: 3
    adoptedPreferenceMinEvidence: 2
platforms:
  enabled:
    - claude-code
    - cursor
    - trae
    - antigravity
    - codex
    - opencode
    - windsurf
    - qoder
  platforms:
    claude-code:
      name: Claude Code
      description: Anthropic 官方 CLI/Desktop/Web
      type: single-file
      file: CLAUDE.md
      format: markdown-index
      autoSync: true
    cursor:
      name: Cursor IDE
      description: AI-first IDE
      type: multi-file
      directory: .cursor/rules
      format: mdc
      extension: .mdc
      frontmatter:
        glob: '**/*'
        alwaysApply: true
      autoSync: true
    trae:
      name: Trae
      description: Trae AI Agent
      type: multi-file
      directory: .trae/rules
      format: markdown
      extension: .md
      autoSync: true
    antigravity:
      name: Antigravity
      description: Antigravity AI Agent
      type: multi-file
      directory: .agents/rules
      format: markdown
      extension: .md
      numberedPrefix: true
      autoSync: true
    codex:
      name: Codex
      description: Codex AI Agent
      type: single-file
      file: AGENTS.md
      format: markdown-index
      autoSync: true
    opencode:
      name: OpenCode
      description: OpenCode AI Agent
      type: single-file
      file: AGENTS.md
      format: markdown-index
      autoSync: true
    windsurf:
      name: Windsurf
      description: Windsurf IDE by Codeium
      type: single-file
      file: .windsurfrules
      format: markdown-index
      autoSync: true
    qoder:
      name: Qoder
      description: Qoder AI Agent
      type: multi-file
      directory: .qoder/rules
      format: markdown
      extension: .md
      autoSync: true
  ruleMapping:
    _comment: 规则文件名映射：源文件名 -> 各平台的文件名
    i18n:
      cursor: i18n-localization
      trae: i18n-localization
      agents: i18n
      default: i18n
    theme:
      cursor: theme-system-enforcement
      trae: theme-system-enforcement
      agents: theme-and-styling
      default: theme
    design-tokens:
      cursor: design-tokens
      trae: design-tokens
      agents: design-tokens
      default: design-tokens
    code-style:
      cursor: typescript-react-native
      trae: typescript-react-native
      agents: typescript-react-native
      default: code-style
  customPlatforms:
    _comment: 在这里添加自定义平台
    _example:
      name: My Custom Agent
      type: single-file
      file: .myagent/rules.md
      format: markdown-index
      autoSync: true
---

# Oh My Engine 配置文档

## 项目信息

- **项目名称**: Oh My Engine
- **项目类型**: workflow-engine
- **框架**: node


## Workflows 说明

### ui-restore

从设计稿还原 UI 组件

**Skills**: ome-ui

**应用规则**:
- theme
- i18n
- design-tokens

### bug-analysis

分析和修复 Bug

**Skills**: ome-bug

**应用规则**:
- code-style

### component-gen

生成可复用组件

**Skills**: ome-comp

**应用规则**:
- theme
- i18n
- design-tokens

### api-integration

集成 API 接口

**Skills**: ome-api

**应用规则**:
- code-style

## 记忆系统

记忆系统采用 **selective** 捕获模式，保留 **90** 天。

**阈值配置**:
- 偏好提升: 0.8
- 知识提升: 0.85
- Skill 候选提升: 0.9

## 进化系统

进化系统**已启用**。

- **自动应用**: 否
- **需要验证**: 是

**阈值配置**:
- 学习候选最小证据: 3
- Skill 候选最小证据: 3

## 平台集成

当前启用了 **8** 个 AI 平台的集成，规则会自动同步到各平台。

**启用的平台**: claude-code, cursor, trae, antigravity, codex, opencode, windsurf, qoder

### Claude Code

- **类型**: single-file
- **文件**: CLAUDE.md
- **格式**: markdown-index
- **自动同步**: 是

### Cursor IDE

- **类型**: multi-file
- **目录**: .cursor/rules
- **格式**: mdc
- **自动同步**: 是

### Windsurf

- **类型**: single-file
- **文件**: .windsurfrules
- **格式**: markdown-index
- **自动同步**: 是

## 自定义配置

你可以在此添加自定义配置说明和项目特定的文档。

### 如何修改配置

1. 直接编辑 OME.md 文件的 YAML frontmatter 部分
2. 运行 `ome config validate` 验证配置格式
3. 运行 `ome rules sync` 同步规则到各平台

### 如何添加新规则

1. 在 `.ome/rules/` 目录下创建新的 `.md` 文件
2. 使用命名前缀分类（universal-*, framework-*, domain-*, toolchain-*）
3. 添加 YAML frontmatter 元数据
4. 运行 `ome rules sync` 同步到各平台

### 相关命令

```bash
ome rules list              # 列出所有规则
ome rules sync              # 同步规则到各平台
ome config validate         # 验证配置文件
ome doctor                  # 检查项目健康状态
```
