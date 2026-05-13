---
description: Run OpenSpec-compatible proposal, plan, apply, verify, and archive workflows.
---

﻿---
name: ome-spec
version: 1.0.0
description: OpenSpec-compatible spec-driven workflow for Oh My Engine
author: yunxi
tags: [spec, openspec, workflow, planning, verification]
---

# ome-spec

基于规范驱动的开发工作流，兼�?OpenSpec 的目录和生命周期，同时保�?Oh My Engine �?skill 分发和记忆系统�?

## 使用方法

```bash
# 初始�?spec 工作�?
/ome-spec init

# 导入 PRD / 提示�?/ 附件
/ome-spec import <change-id>

# 基于导入上下文拆�?spec 草案
/ome-spec decompose <change-id>

# 手工创建变更提案（保留）
/ome-spec propose <change-id>

# 约束较强的变�?
/ome-spec propose <change-id> --design-first

# Bug 修复
/ome-spec propose <change-id> --bugfix

# 细化设计与任�?
/ome-spec plan <change-id>

# 执行开�?
/ome-spec apply <change-id>

# 验证完成�?
/ome-spec verify <change-id>

# 归档并更新长期规�?
/ome-spec archive <change-id>
```

Claude Code 可直接使用上面的 slash command�?
Codex 请按技能名 `ome-spec` 触发，并沿用相同子命令和参数�?

## 可执行入�?

主入口是 TypeScript 驱动�?`ome spec`�?

```bash
ome spec init
ome spec import <change-id> --source-file docs/prd.md --prompt-file docs/prompt.md
ome spec import <change-id> --source-text "Copied PRD text" --asset mockup.png
ome spec decompose <change-id>
ome spec propose <change-id>
ome spec plan <change-id>
ome spec apply <change-id>
ome spec apply <change-id> --task "Implement the change"
ome spec status <change-id>
ome spec verify <change-id>
ome spec archive <change-id>
ome spec propose <change-id> --design-first
ome spec propose <change-id> --bugfix
```

旧的 shell 兼容转发器已移除；统一使用 `ome spec`�?

脚本能力边界�?
- `init`：创建工作区和默认配�?
- `import`：将 PRD、提示词、附件归档到 `context/`
- `decompose`：基�?`context/` 准备 `analysis.md` 和标�?OpenSpec scaffold
- `propose`：生�?change scaffold
- `plan`：标记计划阶段并�?Planning Notes
- `apply`：输出实现上下文、已采纳 skill �?execution directives，并支持勾选任�?验收项回写进�?
- `status`：汇总当�?phase、任务计数、engine-memory context �?execution directive 数量
- `verify`：基�?`tasks.md`、`proposal.md` 的勾选项、`TBD:` 模板标记检查、spec delta 完整性，以及 `config.json` 里的 `verifyCommands` 做通过/失败判断
- `archive`：在 verify 通过后归�?change，并在首次接受时创建长期 capability spec，之后基于已接受 delta 重建 canonical summary/requirements/compatibility，同时持续同步当前快照与历史

`apply` 不会自动改业务代码；它会把已采纳 skill 转成必须遵循�?execution directives，直接作用于实现提示�?

## 目录约定

### Spec 工作�?

```text
.ome/omespec/
├── project.md
├── changes/
�?  └── <change-id>/
�?      ├── context/
�?      �?  ├── source.md
�?      �?  ├── prompt.md
�?      �?  ├── analysis.md
�?      �?  ├── references.json
�?      �?  └── assets/
�?      ├── proposal.md
�?      ├── design.md
�?      ├── tasks.md
�?      └── specs/
�?          └── <capability>/
�?              └── spec.md
├── specs/
�?  └── <capability>/
�?      └── spec.md
└── archive/
```

### Oh My Engine 记忆

```text
.ome/
├── config.json
└── memory/
    └── specs/
        └── <change-id>.json
```

`.ome/omespec/` 保存长期规范和当前变更，`.ome/memory/` 保存执行记忆和学习结果。两者职责分离，不混存�?

## 生命周期

### 1. init

创建 OpenSpec-compatible 工作区：
- `.ome/omespec/project.md`
- `.ome/omespec/changes/`
- `.ome/omespec/specs/`
- `.ome/omespec/archive/`
- `.ome/memory/specs/`

### 2. propose

创建一次变更的入口文档�?
- `.ome/omespec/changes/<change-id>/proposal.md`
- `.ome/omespec/changes/<change-id>/design.md`
- `.ome/omespec/changes/<change-id>/tasks.md`
- `.ome/omespec/changes/<change-id>/specs/<capability>/spec.md`

默认使用 feature proposal 模板。`--design-first` 会先强调技术约束和架构边界，`--bugfix` 会切换到 bugfix proposal 模板�?

### 2a. import

�?prompt-driven 入口准备输入上下文：
- `context/source.md`
- `context/prompt.md`
- `context/references.json`
- `context/assets/`

适合 PRD 来源是文档、复制文本、MCP 结果或图片附件的情况�?

### 2b. decompose

基于导入上下文准�?spec 草案�?
- `context/analysis.md`
- `proposal.md`
- `design.md`
- `tasks.md`
- `changes/<change-id>/specs/<capability>/spec.md`

`decompose` 会保留输入追踪信息，把多模态信息先转成文本分析，再继续后续生命周期�?

### 3. plan

根据 proposal 细化�?
- 设计边界
- 接口和数据模�?
- 任务拆分
- 验证策略
- 输入分析里的未决问题
- 刷新 `context/engine-memory.md`，把已采纳的 learnings / generated skills 注入当前 change 上下�?
- 直接输出 adopted skill �?execution directives，约束后续实现方�?

### 4. apply

执行实现时应加载�?
1. `.ome/config.json`
2. `.ome/omespec/project.md`
3. 当前 change �?`context/source.md`、`context/prompt.md`、`context/analysis.md`、`context/engine-memory.md`（如果存在）
4. 当前 change �?`proposal.md`、`design.md`、`tasks.md`
5. 相关 capability 的长�?`.ome/omespec/specs/<capability>/spec.md`（如果该 capability 已经被接受过�?
6. `.ome/rules/`
7. `.ome/memory/`

### 5. verify

验证必须覆盖�?
- 任务完成情况
- 验收标准
- 模板里的 `TBD:` 标记是否已替�?
- 每个 spec delta 是否且只能声明一�?change type，并提供具体 requirement �?WHEN/THEN 场景
- 相关测试和手工检�?
- 规范变更是否落到 spec delta

### 6. archive

完成后：
1. �?change 下的 spec delta 提升�?`.ome/omespec/specs/`（必要时创建 capability spec，并重建 canonical sections�?
2. �?change 移入 `.ome/omespec/archive/`
3. 将执行摘要写�?`.ome/memory/specs/<change-id>.json`

## 配置

### 项目配置（OME.md �?.ome/config.json�?

**推荐使用 OME.md**（在 frontmatter 中配置）�?

```yaml
workflows:
  spec-driven:
    enabled: true
    description: 基于规范驱动的开发工作流
    skills:
      - ome-spec
    rules:
      - universal-code-style
      - universal-documentation
      - universal-testing
    options:
      specRoot: .ome/omespec
      changesDir: .ome/omespec/changes
      specsDir: .ome/omespec/specs
      archiveDir: .ome/omespec/archive
      memoryDir: .ome/memory/specs
      defaultFlow: import-decompose-plan-apply-verify-archive
      manualFlow: propose-plan-apply-verify-archive
      contextDirName: context
      assetsDirName: assets
      verifyCommands:
        - npm test
```

**或使�?.ome/config.json**（向后兼容）�?

```json
{
  "workflows": {
    "spec": {
      "enabled": true,
      "format": "openspec-compatible",
      "options": {
        "specRoot": ".ome/omespec",
        "changesDir": ".ome/omespec/changes",
        "specsDir": ".ome/omespec/specs",
        "archiveDir": ".ome/omespec/archive",
        "memoryDir": ".ome/memory/specs",
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

模板内容参�?Kiro �?requirements/design/tasks 思路，但目录和生命周期按 OpenSpec-compatible 方式组织�?
- `project.md`：项目背景、约束、验证基�?
- `source.md`：归一化后�?PRD / 来源文档
- `prompt.md`：驱动拆解的操作提示�?
- `analysis.md`：来源分析、图片观察、歧义和问题清单
- `proposal.md`：问题、目标、验收标�?
- `bugfix-proposal.md`：面向问题定位和回滚的提案模�?
- `design.md`：架构、接口、数据、风�?
- `tasks.md`：可执行任务和验证项
- `spec-delta.md`：change 目录�?`spec.md` 的变更模�?
- `capability-spec.md`：`.ome/spec/specs/<capability>/spec.md` 的长期规范模�?

## 输出示例

```text
�?Spec workspace updated

Created:
  - .ome/omespec/changes/user-authentication/context/source.md
  - .ome/omespec/changes/user-authentication/context/prompt.md
  - .ome/omespec/changes/user-authentication/context/analysis.md
  - .ome/omespec/changes/user-authentication/proposal.md
  - .ome/omespec/changes/user-authentication/design.md
  - .ome/omespec/changes/user-authentication/tasks.md
  - .ome/omespec/changes/user-authentication/specs/auth/spec.md

Next:
  1. Replace TBD markers using context/source.md and context/prompt.md
  2. Refine design.md and tasks.md
  3. Execute /ome-spec plan user-authentication
```

## 相关命令

- `ome spec <change-id>` - 通过�?skill 委托 spec 工作�?
- `/ome-memory` - 查看 spec 执行记忆
- `/ome-evolve` - 触发学习和进化分�?

---

**提示**：优先把 `.ome/omespec/specs/` 视为长期事实来源，把 `.ome/omespec/changes/` 视为当前变更上下文�?
