# Oh My Engine User Guide

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Available Workflows](#available-workflows)
5. [Configuration](#configuration)
6. [Rules System](#rules-system)
7. [Memory System](#memory-system)
8. [Evolution System](#evolution-system)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Installation

### Install the CLI

```bash
npm install -g oh-my-engine
ome --help
```

The `ome` CLI is the primary runtime for project initialization, rules sync, spec workflow, memory, evolution, and guidance.

### Install from GitHub

```bash
git clone https://github.com/<your-org>/oh-my-engine.git
cd oh-my-engine
npm install
npm run build
npm link
ome --help
```

### Install Agent Editor Workflows

The `ome` CLI is the source of truth. Install native workflow entries for every supported Agent editor:

```bash
ome agents install --all
ome agents doctor --all
ome superpowers install all
ome superpowers doctor all
```

Legacy skills remain available for older Claude Code / Codex setups:

```bash
./install.sh --agent claude
./install.sh --agent codex
./install.sh --agent both
```

The one-line GitHub installer copies skills only:

```bash
curl -fsSL https://raw.githubusercontent.com/<your-org>/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

Install the CLI separately with npm or `npm link`.

### Verify Installation

```bash
ome doctor
ome rules validate
ome adapters list
```

Optional skill checks:

```bash
ls -la ~/.claude/skills/ | grep oh-my-engine
ls -la ~/.codex/skills/ | grep oh-my-engine
```

## Quick Start

### 1. Initialize a Project

Navigate to your project directory and use the unified CLI:

```bash
ome init
ome init-rules
ome doctor
ome rules sync
```

This creates the `.ome/` directory with project scan context, local rule drafts, and memory/spec scaffolding.

It also creates an `openspec/` workspace for long-lived capability specs and in-progress changes.

`ome rules sync` generates the rule files consumed by Claude Code, Codex, Trae, Cursor, Windsurf, OpenCode, Qoder, and Antigravity.
`ome init-rules` refreshes `.ome/context/project-scan.json`, `.ome/context/rules-generation-prompt.md`, and local `.ome/rules/*.md` drafts before an Agent editor personalizes them from current source code.

### 2. Configure Your Project

Edit `.ome/config.json`:

```json
{
  "project": {
    "name": "MyApp",
    "type": "react-native",
    "framework": "expo"
  },
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system", "i18n-helper"],
      "rules": ["i18n", "theme", "design-tokens"]
    },
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "theme"]
    },
    "spec": {
      "enabled": true,
      "format": "openspec-compatible"
    }
  }
}
```

### 3. Add Project Rules

Create rules in `.ome/rules/`:

**i18n.md**:
```markdown
---
name: i18n
description: Multi-language support
priority: high
---

# Supported Languages
- English (en)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Thai (th)

# Translation Keys
Use descriptive keys: `screen.home.welcome` not `text1`
```

### 4. Use Workflows

```bash
# Restore UI from Figma
/ome-ui
ome guidance ui-restore --input "https://mastergo.com/goto/demo"

# Generate a component
/ome-comp
ome guidance component-gen --input "UserCard"

# Integrate an API
/ome-api
ome guidance api-integration --input "./specs/user-api.yaml"

# Analyze a bug
/ome-bug
ome guidance bug-analysis --input "Login button click does nothing"

# Start a prompt-driven spec change
ome spec import user-authentication --source-file docs/prd.md
ome spec decompose user-authentication
ome spec plan user-authentication
```

### 5. Use with Different AI Tools

Claude Code:

```bash
ome rules sync claude-code
/ome-init
/ome-init-rules
/ome-superpowers
/ome-bug "Login button click does nothing"
```

Codex:

```bash
ome rules sync codex
```

Then invoke installed skills by name:

```text
ome-init
ome-init-rules
ome-superpowers
ome-spec propose add-auth
```

Trae / Cursor / Windsurf / OpenCode / Qoder / Antigravity:

```bash
ome rules sync trae
ome rules sync cursor
ome rules sync windsurf
ome rules sync opencode
ome rules sync qoder
ome rules sync antigravity
```

Install the matching command/workflow wrappers for all of those editors with:

```bash
ome agents install --all
```

Detailed install and platform usage is documented in `docs/installation-and-usage.md`.

## Core Concepts

### Two-Layer Architecture

**Global Layer** (`~/.claude/skills/`)
- Installed once, available everywhere
- Contains workflow logic
- Shared across all projects

**Project Layer** (`.ome/`)
- Project-specific configuration
- Custom rules and preferences
- Execution history and learnings

**Spec Workspace** (`openspec/`)
- Stable project context
- In-progress changes
- Long-lived capability specs
- Archived changes

### Configuration Inheritance

Projects inherit from global defaults but can override:

```json
{
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system"],  // Override default skills
      "rules": ["custom-theme"]     // Use custom rules
    }
  }
}
```

### Context Loading

When you run a workflow, Oh My Engine loads:
1. Project configuration
2. Project spec context (`openspec/project.md`) when spec mode is enabled
3. Workflow-specific settings
4. Active change docs and long-lived capability specs when relevant
5. Workflow guidance derived from adopted learnings and generated skills
6. All specified rules
7. Recent memory and learnings
8. Your input parameters

This ensures every workflow has complete context.

## Available Workflows

### Lifecycle Workflows

Oh My Engine provides structured lifecycle workflows that guide you through the complete software development process:

#### `/ome-define`

Clarify requirements, boundaries, and success criteria before implementation.

**What it does**:
- Extracts user goals and success criteria
- Distinguishes must-do, optional, and out-of-scope items
- Identifies missing information and assumptions
- Generates executable requirement summary

**Usage**:
```bash
ome define "add user login feature"
/ome-define "add user login feature"
```

#### `/ome-plan`

Form implementation plans with interface changes and test strategies.

**What it does**:
- Reads relevant code and rules
- Identifies dependencies, risks, and boundaries
- Designs minimal implementation path
- Defines test and acceptance criteria

**Usage**:
```bash
ome plan "implement login API"
/ome-plan "implement login API"
```

#### `/ome-build`

Guide or execute incremental implementation with verification.

**What it does**:
- Loads project rules and source code
- Implements changes in small verified slices
- Prioritizes reusing existing patterns
- Runs appropriate verification after each slice

**Usage**:
```bash
ome build "create login form"
/ome-build "create login form"
```

#### `/ome-test`

Design behavior-focused tests and run regression checks.

**What it does**:
- Writes failing reproduction tests for bugs
- Tests behavior and results, not implementation details
- Selects appropriate test level (unit/integration/e2e)
- Diagnoses test failures

**Usage**:
```bash
ome test "verify login flow"
/ome-test "verify login flow"
```

#### `/ome-review`

Code review across correctness, security, performance, and architecture.

**What it does**:
- Reviews correctness and readability
- Checks security and performance
- Evaluates architecture and test coverage
- Reports findings with severity and file references

**Usage**:
```bash
ome review "review current changes"
/ome-review "review current changes"
```

#### `/ome-ship`

Pre-delivery checks and handoff preparation.

**What it does**:
- Confirms tests, build, and lint status
- Summarizes user-readable changes
- Checks for incomplete items
- Generates commit message draft

**Usage**:
```bash
ome ship "prepare login feature for commit"
/ome-ship "prepare login feature for commit"
```

### Task-Specific Workflows

#### `/ome-init`

Initialize Oh My Engine in a project.

**What it does**:
- Creates `.ome/` directory structure
- Generates `OME.md`, project scan context, and local rule drafts
- Initializes memory system
- Updates `.gitignore`
- Continues into `ome-init-rules` so rules are personalized from current source code

**Usage**:
```bash
cd /path/to/project
ome init
ome init-rules
```

### `/ome-init-rules`

Refresh and personalize project rules.

**What it does**:
- Refreshes `.ome/context/project-scan.json`
- Refreshes `.ome/context/rules-generation-prompt.md`
- Updates deterministic local rule drafts
- Instructs the Agent to inspect current source code and rewrite `.ome/rules/*.md`
- Runs `ome rules sync` after rule edits

**Usage**:
```bash
ome init-rules
ome rules init
```

### `/ome-superpowers`

Install, inspect, or use Superpowers bridge entries across supported Agent editors.

**Usage**:
```bash
ome superpowers install all
ome superpowers doctor all
```

### `/ome-ui`

Restore UI from design files (Figma, Sketch, etc.).

**What it does**:
- Analyzes design file
- Generates component code
- Applies theme and styling rules
- Handles i18n if configured
- Saves execution to memory

**Configuration**:
```json
{
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system", "i18n-helper"],
      "rules": ["i18n", "theme", "design-tokens"],
      "options": {
        "languages": ["en", "zh-CN", "zh-TW", "th"],
        "themeSystem": "ThemedStyle",
        "designTokens": true
      }
    }
  }
}
```

**Usage**:
```bash
/ome-ui
ome guidance ui-restore --input "<design-url>"
# Follow prompts to provide design file URL
```

### `/ome-comp`

Generate a new component with best practices.

**What it does**:
- Creates component file
- Generates styles
- Adds i18n support
- Includes TypeScript types
- Follows project conventions

**Configuration**:
```json
{
  "workflows": {
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "theme"],
      "options": {
        "template": "functional",
        "includeTests": true
      }
    }
  }
}
```

**Usage**:
```bash
/ome-comp
ome guidance component-gen --input "<component-name>"
# Specify component name and type
```

### `/ome-api`

Integrate an API endpoint.

**What it does**:
- Generates API client code
- Adds error handling
- Implements retry logic
- Creates TypeScript types
- Adds tests

**Configuration**:
```json
{
  "workflows": {
    "api-integration": {
      "enabled": true,
      "rules": ["api-conventions", "error-handling"],
      "options": {
        "client": "axios",
        "retryAttempts": 3
      }
    }
  }
}
```

**Usage**:
```bash
/ome-api
ome guidance api-integration --input "<api-spec>"
# Provide API endpoint details
```

### `/ome-spec`

Manage an OpenSpec-compatible change lifecycle inside Oh My Engine.

**What it does**:
- Creates `openspec/` scaffolding
- Imports PRD, prompt, and attachment context under `openspec/changes/<change-id>/context/`
- Prepares `analysis.md` plus standard spec artifacts from imported context
- Proposes changes under `openspec/changes/`
- Refines design and tasks
- Loads implementation context for the active change
- Lets you mark task and acceptance progress from the CLI helper
- Shows current change status and pending items
- Verifies checklist completion, blocks template placeholders, and enforces concrete spec deltas
- Archives completed changes into long-lived specs, creating the capability spec on first acceptance

**Usage**:
```bash
ome spec init
ome spec import user-authentication --source-file docs/prd.md
ome spec decompose user-authentication
ome spec propose user-authentication
ome spec plan user-authentication
ome spec apply user-authentication
ome spec apply user-authentication --task "Implement the change"
ome spec status user-authentication
ome spec verify user-authentication
ome spec archive user-authentication
```

**Current limits**:
- `import` and `decompose` persist normalized context and scaffolding, but the agent still needs to replace `TBD:` markers with concrete decisions.
- `apply` updates lifecycle state and prints the expected context files, but does not edit app code automatically.
- `verify` checks the documented checklist, blocks unresolved `TBD:` template markers, enforces exactly one change type plus concrete requirement/scenario content in each spec delta, and runs `workflows.spec.options.verifyCommands` from `.ome/config.json`.
- `archive` now rebuilds capability summary/requirements/compatibility from accepted deltas, but `Invariants`、`Interfaces`、`Observability` 这些长期说明仍需人工维护。

### `/ome-bug`

Analyze and fix bugs.

**What it does**:
- Analyzes error logs
- Identifies root cause
- Suggests fixes
- Applies fix if approved
- Records solution to memory

**Configuration**:
```json
{
  "workflows": {
    "bug-analysis": {
      "enabled": true,
      "rules": ["code-style"],
      "options": {
        "autoFix": false,
        "createTest": true
      }
    }
  }
}
```

**Usage**:
```bash
/ome-bug
ome guidance bug-analysis --input "Describe the bug or provide error logs"
# Describe the bug or provide error logs
```

### `/ome-memory`

View execution history and learnings.

**What it does**:
- Shows recent executions
- Displays learning candidates and adopted learnings
- Shows user preferences
- Shows skill candidates and generated skills, including execution directives

**Usage**:
```bash
/ome-memory
/ome-memory --type adopted-learnings
/ome-memory --type generated-skills
# Optional: filter by workflow, scope, or output format
```

### `/ome-evolve`

Analyze patterns and suggest improvements.

**What it does**:
- Analyzes execution history
- Detects repeated patterns
- Suggests new skills
- Proposes optimizations

**Usage**:
```bash
/ome-evolve
# Review suggestions and approve/reject
```

## Configuration

### Project Configuration

**config.json** structure:

```json
{
  "project": {
    "name": "string",
    "type": "react-native | nextjs | express | ...",
    "framework": "expo | vite | ...",
    "version": "1.0.0"
  },
  "workflows": {
    "workflow-name": {
      "enabled": boolean,
      "skills": ["skill1", "skill2"],
      "rules": ["rule1", "rule2"],
      "options": {
        // Workflow-specific options
      }
    }
  },
  "memory": {
    "enabled": true,
    "captureMode": "selective",
    "allowSources": {
      "workflow_command": true,
      "explicit_remember": true,
      "post_run_promotion": true
    },
    "retention": "90d"
  },
  "evolution": {
    "enabled": true,
    "autoApply": false,
    "requireVerification": true,
    "candidateOnly": true,
    "thresholds": {
      "learningCandidateMinEvidence": 3,
      "skillCandidateMinEvidence": 3,
      "adoptedPreferenceMinEvidence": 2
    }
  }
}
```

### Workflow Options

Each workflow can have custom options:

**UI Restore**:
```json
{
  "languages": ["en", "zh-CN", "zh-TW", "th"],
  "themeSystem": "ThemedStyle",
  "designTokens": true,
  "outputDir": "src/components"
}
```

**Component Generation**:
```json
{
  "template": "functional | class",
  "includeTests": boolean,
  "includeStorybook": boolean
}
```

**API Integration**:
```json
{
  "client": "axios | fetch",
  "retryAttempts": number,
  "timeout": number,
  "includeCache": boolean
}
```

## Rules System

### Creating Rules

Rules are markdown files in `.ome/rules/`:

```markdown
---
name: rule-name
description: Brief description
priority: high | medium | low
applies_to: ["workflow1", "workflow2"]
---

# Rule Title

## Context
Why this rule exists

## Guidelines
1. Specific guideline
2. Another guideline

## Examples

### Good
\`\`\`typescript
// Good example
\`\`\`

### Bad
\`\`\`typescript
// Bad example
\`\`\`

## Exceptions
When this rule doesn't apply
```

### Rule Priority

- **High**: Must be followed, violations are errors
- **Medium**: Should be followed, violations are warnings
- **Low**: Nice to have, violations are suggestions

### Loading Rules

Rules are loaded based on workflow configuration:

```json
{
  "workflows": {
    "ui-restore": {
      "rules": ["i18n", "theme", "design-tokens"]
    }
  }
}
```

Or load all rules:

```json
{
  "workflows": {
    "ui-restore": {
      "rules": ["*"]
    }
  }
}
```

## Memory System

### Overview

Oh My Engine 使用 **Markdown 格式**存储所有记忆数据，提供人类可读、Agent 友好的记忆体验。

**为什么使用 Markdown？**
- ✅ **人类可读** - 直接查看和编辑记忆文件
- ✅ **Agent 友好** - AI 可以直接理解，无需解析 JSON
- ✅ **格式统一** - 记忆、规则、技能都使用 Markdown
- ✅ **Git 友好** - diff 清晰，易于版本控制
- ✅ **与主流一致** - Claude Code、Cursor、Windsurf 都使用 Markdown

### Structure

```
.ome/memory/
├── executions/           # Execution logs (one file per execution)
│   └── {workflow}/
│       └── {date}-{slug}.md
├── learnings/
│   ├── candidates/       # Learning candidates
│   │   └── {slug}.md
│   └── adopted/          # Adopted learning artifacts
│       └── {slug}.md
├── preferences/          # Explicit remembered preferences
│   └── {scope}-{slug}.md
├── skill-candidates/     # Candidate automation patterns
│   └── {slug}.md
└── generated-skills/     # Adopted generated skill artifacts
    └── {slug}.md
```

### Execution Logs

每次执行创建一个 Markdown 文件：

```markdown
---
id: exec-1234567890-abc123
type: execution
workflow: ui-restore
phase: apply
timestamp: 2025-01-15T10:30:00Z
status: success
duration: 45000
captureLevel: high
---

# Restore LoginScreen from Figma

## Details

- **Workflow**: ui-restore
- **Phase**: apply
- **Status**: success
- **Duration**: 45000ms
- **Timestamp**: 2025-01-15T10:30:00Z

## Why Stored

High-value execution with complete UI restoration workflow

## Files Touched

- src/screens/LoginScreen.tsx
- src/styles/LoginScreen.styles.ts
- src/i18n/en.json

## Rules Applied

- i18n
- theme
- design-tokens

## Input

- Design File: https://figma.com/...
- Component: LoginScreen

## Output

- Files Created: 3
- Lines of Code: 150
```

### Learnings

系统将重复的成功行为提升为学习候选，经过验证后采纳。

**Learning Candidate**:
```markdown
---
id: learn-1234567890-abc123
type: learning
slug: ui-restore-apply-reuse-themedstyle-and-design-tokens
category: best_practice
workflow: ui-restore
phase: apply
status: candidate
evidenceCount: 3
reusability: 0.8
verification:
  state: pending
  required: true
---

# Reuse ThemedStyle and Design Tokens for Generated UI

## Summary

When generating UI components, always reuse existing ThemedStyle system and design tokens instead of hardcoding colors and spacing.

## Applies To

- ui-restore workflow
- component-gen workflow

## Evidence

### 2025-01-15T10:30:00Z
- **Change ID**: change-123
- **Workflow**: ui-restore
- **Status**: success

### 2025-01-16T14:20:00Z
- **Change ID**: change-456
- **Workflow**: ui-restore
- **Status**: success

### 2025-01-17T09:15:00Z
- **Change ID**: change-789
- **Workflow**: component-gen
- **Status**: success
```

**Adopted Learning**:
```markdown
---
id: learn-1234567890-abc123
type: learning
slug: ui-restore-apply-reuse-themedstyle-and-design-tokens
status: adopted
appliesTo: ["ui-restore", "component-gen"]
adoptedAt: 2025-01-18T10:00:00Z
---

# Reuse ThemedStyle and Design Tokens

## Summary

Always reuse existing ThemedStyle system and design tokens for UI generation.

## Guidelines

1. Import ThemedStyle from `src/styles/ThemedStyle`
2. Use design tokens for colors, spacing, typography
3. Never hardcode style values
```

### User Preferences

记录用户反馈和偏好：

```markdown
---
id: pref-1234567890-abc123
type: preference
scope: user
source: explicit_remember
explicit: true
evidenceCount: 3
lastConfirmedAt: 2025-01-15T10:30:00Z
stability: 1
status: adopted
---

# Prefer Functional Components with Hooks

## Details

- **Scope**: user
- **Source**: explicit_remember
- **Evidence Count**: 3
- **Stability**: 1

## Preference

User prefers functional components with hooks over class components.

## Why Stored

Explicitly stated preference during component generation workflow.
```

### 查看和编辑记忆

**直接查看**:
```bash
# 查看最近的执行记录
ls -lt .ome/memory/executions/ui-restore/*.md | head -5

# 查看特定记忆
cat .ome/memory/executions/ui-restore/2025-01-15-restore-loginscreen.md
```

**手动编辑**:
```bash
# 使用任何文本编辑器
code .ome/memory/executions/ui-restore/2025-01-15-restore-loginscreen.md
vim .ome/memory/learnings/candidates/react-event-handler.md
```

**搜索记忆**:
```bash
# 搜索包含特定关键词的记忆
grep -r "login" .ome/memory/executions/

# 使用 ripgrep
rg "authentication" .ome/memory/
```

### 迁移指南

如果你有旧的 JSON/JSONL 格式记忆数据，请参考 [Memory Markdown Migration Guide](memory-markdown-migration.md) 进行迁移。

## Evolution System

Oh My Engine 的自主进化系统能够自动学习项目模式、生成规则和技能，并智能决策是否应用这些改进。详细文档请参考 [Evolution System](evolution.md)。

### 自动工作流程

系统完全自动化运行：

1. **自动记忆记录**：每次完成工作流任务后，Agent 自动执行 `ome finish` 记录执行信息
2. **自动后台分析**：系统自动识别重复模式和错误模式
3. **自动生成规则**：从错误记录生成预防性规则到 `.ome/rules/learned/`
4. **自动生成技能**：从成功模式生成可复用技能到 `.agent/workflows/learned/`
5. **智能自主决策**：基于信心评分和风险评估自动应用或请求审核
6. **效果跟踪**：持续监控已应用规则和技能的效果
7. **自动清理**：定期清理无效或过时的内容

### 决策矩阵

| 信心分数 | 风险等级 | 决策 |
|---------|---------|------|
| ≥80% | 低 (<30%) | 🟢 自动应用 |
| ≥80% | 中 (30-60%) | 🟡 请求审核 |
| 60-80% | 低 | 🟡 请求审核 |
| <60% | 任何 | 🔴 自动拒绝 |

### 命令

```bash
# 查看所有需要人工审核的候选
ome evolve review

# 手动触发分析
ome evolve analyze

# 查看效果统计
ome evolve stats
```

### 生成的内容

**规则文件** (`.ome/rules/learned/*.md`)：
- 从错误模式自动生成
- 包含问题描述、解决方案、示例
- 自动应用到未来的工作流

**技能文件** (`.agent/workflows/learned/*.md`)：
- 从成功模式自动生成
- 包含执行指令、最佳实践
- 可在未来工作流中复用

### 配置

```json
{
  "evolution": {
    "enabled": true,
    "autoAnalyze": true,
    "autoApply": {
      "enabled": true,
      "minConfidence": 80,
      "maxRisk": 30
    },
    "thresholds": {
      "learningCandidateMinEvidence": 3,
      "skillCandidateMinEvidence": 3
    },
    "cleanup": {
      "enabled": true,
      "minApplications": 10,
      "minSuccessRate": 40,
      "unusedDays": 90
    }
  }
}
```

更多详细信息，请参考 [Evolution System 文档](evolution.md)。

## Best Practices

### 1. Start Simple

Begin with basic configuration:
```json
{
  "project": {
    "name": "MyApp",
    "type": "react-native"
  }
}
```

Add complexity as needed.

### 2. Use Descriptive Rules

Bad:
```markdown
# Rule 1
Don't do X
```

Good:
```markdown
# Error Handling
Always wrap network requests in try-catch blocks because network failures are common and should be handled gracefully.
```

### 3. Review Memory Regularly

```bash
/ome-memory
```

Check what the system is learning and adjust if needed.

### 4. Leverage Evolution

```bash
/ome-evolve
```

Let the system suggest improvements based on your patterns.

### 5. Keep Rules Updated

As your project evolves, update rules to reflect current practices.

### 6. Commit Configuration, Not Memory

```bash
# .gitignore
.ome/memory/
```

Configuration should be shared, memory should not.

## Troubleshooting

### Workflow Not Found

**Problem**: `ome-ui` workflow not recognized

**Solution**:
```bash
# First verify the CLI
ome --help
ome doctor

# Reinstall for every supported Agent editor
ome agents install --all
ome agents doctor --all

# Superpowers wrappers
ome superpowers install all
ome superpowers doctor all
```

If you do not need native Claude Code/Codex skill entry points, use the CLI directly:

```bash
ome guidance ui-restore --input "<design-url>"
ome spec propose <change-id>
```

### Configuration Not Loading

**Problem**: Rules not being applied

**Solution**:
1. Check config.json syntax (must be valid JSON)
2. Verify workflow is enabled
3. Check rule files exist in `.ome/rules/`
4. Run `ome rules sync` for the target tool

### Memory Not Saving

**Problem**: Executions not recorded

**Solution**:
1. Check memory is enabled in config.json
2. Verify `.ome/memory/` directory exists
3. Check file permissions

### Evolution Not Detecting Patterns

**Problem**: No suggestions from `/ome-evolve`

**Solution**:
1. Need at least 3 executions for pattern detection
2. Check evolution is enabled in config.json
3. Lower `learningCandidateMinEvidence` or `skillCandidateMinEvidence` if needed

### Generated Code Not Following Rules

**Problem**: Code doesn't match project conventions

**Solution**:
1. Verify rules are loaded (check execution log)
2. Make rules more specific with examples
3. Increase rule priority to "high"

## Getting Help

- **Documentation**: Check `docs/` directory
- **Examples**: See `examples/` directory
- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions

## Next Steps

- Read [Architecture](docs/architecture.md) for deeper understanding
- Check [Examples](examples/) for real-world configurations
- Join the community and share your learnings
- Contribute improvements (see [CONTRIBUTING.md](CONTRIBUTING.md))
