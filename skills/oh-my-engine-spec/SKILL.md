---
name: oh-my-engine-spec
version: 1.0.0
description: OpenSpec-compatible spec-driven workflow for Oh My Engine
author: yunxi
tags: [spec, openspec, workflow, planning, verification]
---

# oh-my-engine-spec

基于规范驱动的开发工作流，兼容 OpenSpec 的目录和生命周期，同时保持 Oh My Engine 的 skill 分发和记忆系统。

## 使用方法

```bash
# 初始化 spec 工作区
/oh-my-engine-spec init

# 导入 PRD / 提示词 / 附件
/oh-my-engine-spec import <change-id>

# 基于导入上下文拆解 spec 草案
/oh-my-engine-spec decompose <change-id>

# 手工创建变更提案（保留）
/oh-my-engine-spec propose <change-id>

# 约束较强的变更
/oh-my-engine-spec propose <change-id> --design-first

# Bug 修复
/oh-my-engine-spec propose <change-id> --bugfix

# 细化设计与任务
/oh-my-engine-spec plan <change-id>

# 执行开发
/oh-my-engine-spec apply <change-id>

# 验证完成度
/oh-my-engine-spec verify <change-id>

# 归档并更新长期规范
/oh-my-engine-spec archive <change-id>
```

Claude Code 可直接使用上面的 slash command。
Codex 请按技能名 `oh-my-engine-spec` 触发，并沿用相同子命令和参数。

## 可执行脚本

这版 MVP 已提供可直接运行的 helper scripts：

```bash
./scripts/init-workspace.sh
./scripts/import-change.sh <change-id> --source-file docs/prd.md --prompt-file docs/prompt.md
./scripts/import-change.sh <change-id> --source-text "Copied PRD text" --asset mockup.png
./scripts/decompose-change.sh <change-id>
./scripts/propose-change.sh <change-id>
./scripts/plan-change.sh <change-id>
./scripts/apply-change.sh <change-id>
./scripts/apply-change.sh <change-id> --task "Implement the change"
./scripts/status-change.sh <change-id>
./scripts/verify-change.sh <change-id>
./scripts/archive-change.sh <change-id>
./scripts/propose-change.sh <change-id> --design-first
./scripts/propose-change.sh <change-id> --bugfix
```

脚本能力边界：
- `init`：创建工作区和默认配置
- `import`：将 PRD、提示词、附件归档到 `context/`
- `decompose`：基于 `context/` 准备 `analysis.md` 和标准 OpenSpec scaffold
- `propose`：生成 change scaffold
- `plan`：标记计划阶段并补 Planning Notes
- `apply`：输出实现上下文，支持勾选任务/验收项并回写进度
- `status`：汇总当前 phase、任务计数和待处理项
- `verify`：基于 `tasks.md`、`proposal.md` 的勾选项、`TBD:` 模板标记检查、spec delta 完整性，以及 `config.json` 里的 `verifyCommands` 做通过/失败判断
- `archive`：在 verify 通过后归档 change，并在首次接受时创建长期 capability spec，之后基于已接受 delta 重建 canonical summary/requirements/compatibility，同时持续同步当前快照与历史

`apply` 不会自动改业务代码；它只负责切换状态和输出应加载的上下文。

## 目录约定

### Spec 工作区

```text
openspec/
├── project.md
├── changes/
│   └── <change-id>/
│       ├── context/
│       │   ├── source.md
│       │   ├── prompt.md
│       │   ├── analysis.md
│       │   ├── references.json
│       │   └── assets/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/
│           └── <capability>/
│               └── spec.md
├── specs/
│   └── <capability>/
│       └── spec.md
└── archive/
```

### Oh My Engine 记忆

```text
.oh-my-engine/
├── config.json
└── memory/
    └── specs/
        └── <change-id>.json
```

`openspec/` 保存长期规范和当前变更，`.oh-my-engine/` 保存执行记忆和学习结果。两者职责分离，不混存。

## 生命周期

### 1. init

创建 OpenSpec-compatible 工作区：
- `openspec/project.md`
- `openspec/changes/`
- `openspec/specs/`
- `openspec/archive/`
- `.oh-my-engine/memory/specs/`

### 2. propose

创建一次变更的入口文档：
- `proposal.md`
- `design.md`
- `tasks.md`
- `changes/<change-id>/specs/<capability>/spec.md`

默认使用 feature proposal 模板。`--design-first` 会先强调技术约束和架构边界，`--bugfix` 会切换到 bugfix proposal 模板。

### 2a. import

为 prompt-driven 入口准备输入上下文：
- `context/source.md`
- `context/prompt.md`
- `context/references.json`
- `context/assets/`

适合 PRD 来源是文档、复制文本、MCP 结果或图片附件的情况。

### 2b. decompose

基于导入上下文准备 spec 草案：
- `context/analysis.md`
- `proposal.md`
- `design.md`
- `tasks.md`
- `changes/<change-id>/specs/<capability>/spec.md`

`decompose` 会保留输入追踪信息，把多模态信息先转成文本分析，再继续后续生命周期。

### 3. plan

根据 proposal 细化：
- 设计边界
- 接口和数据模型
- 任务拆分
- 验证策略
- 输入分析里的未决问题

### 4. apply

执行实现时应加载：
1. `.oh-my-engine/config.json`
2. `openspec/project.md`
3. 当前 change 的 `context/source.md`、`context/prompt.md`、`context/analysis.md`（如果存在）
4. 当前 change 的 `proposal.md`、`design.md`、`tasks.md`
5. 相关 capability 的长期 `openspec/specs/<capability>/spec.md`（如果该 capability 已经被接受过）
6. `.oh-my-engine/rules/`
7. `.oh-my-engine/memory/`

### 5. verify

验证必须覆盖：
- 任务完成情况
- 验收标准
- 模板里的 `TBD:` 标记是否已替换
- 每个 spec delta 是否且只能声明一种 change type，并提供具体 requirement 和 WHEN/THEN 场景
- 相关测试和手工检查
- 规范变更是否落到 spec delta

### 6. archive

完成后：
1. 将 change 下的 spec delta 提升到 `openspec/specs/`（必要时创建 capability spec，并重建 canonical sections）
2. 将 change 移入 `openspec/archive/`
3. 将执行摘要写入 `.oh-my-engine/memory/specs/<change-id>.json`

## 配置

### 项目配置（.oh-my-engine/config.json）

```json
{
  "workflows": {
    "spec": {
      "enabled": true,
      "format": "openspec-compatible",
      "options": {
        "specRoot": "openspec",
        "changesDir": "openspec/changes",
        "specsDir": "openspec/specs",
        "archiveDir": "openspec/archive",
        "memoryDir": ".oh-my-engine/memory/specs",
        "defaultFlow": "import-decompose-plan-apply-verify-archive",
        "manualFlow": "propose-plan-apply-verify-archive",
        "contextDirName": "context",
        "assetsDirName": "assets",
        "verifyCommands": [
          "npm test"
        ],
        "externalOpenSpecCli": "optional"
      }
    }
  }
}
```

## 模板策略

模板内容参考 Kiro 的 requirements/design/tasks 思路，但目录和生命周期按 OpenSpec-compatible 方式组织：
- `project.md`：项目背景、约束、验证基线
- `source.md`：归一化后的 PRD / 来源文档
- `prompt.md`：驱动拆解的操作提示词
- `analysis.md`：来源分析、图片观察、歧义和问题清单
- `proposal.md`：问题、目标、验收标准
- `bugfix-proposal.md`：面向问题定位和回滚的提案模板
- `design.md`：架构、接口、数据、风险
- `tasks.md`：可执行任务和验证项
- `spec-delta.md`：change 目录下 `spec.md` 的变更模板
- `capability-spec.md`：`openspec/specs/<capability>/spec.md` 的长期规范模板

## 输出示例

```text
✅ Spec workspace updated

Created:
  - openspec/changes/user-authentication/context/source.md
  - openspec/changes/user-authentication/context/prompt.md
  - openspec/changes/user-authentication/context/analysis.md
  - openspec/changes/user-authentication/proposal.md
  - openspec/changes/user-authentication/design.md
  - openspec/changes/user-authentication/tasks.md
  - openspec/changes/user-authentication/specs/auth/spec.md

Next:
  1. Replace TBD markers using context/source.md and context/prompt.md
  2. Refine design.md and tasks.md
  3. Execute /oh-my-engine-spec plan user-authentication
```

## 相关命令

- `/oh-my-engine spec <change-id>` - 通过主 skill 委托 spec 工作流
- `/oh-my-engine-memory` - 查看 spec 执行记忆
- `/oh-my-engine-evolve` - 触发学习和进化分析

---

**提示**：优先把 `openspec/specs/` 视为长期事实来源，把 `openspec/changes/` 视为当前变更上下文。
