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

# 创建变更提案
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
- `propose`：生成 change scaffold
- `plan`：标记计划阶段并补 Planning Notes
- `apply`：输出实现上下文，支持勾选任务/验收项并回写进度
- `status`：汇总当前 phase、任务计数和待处理项
- `verify`：基于 `tasks.md`、`proposal.md` 的勾选项和 `config.json` 里的 `verifyCommands` 做通过/失败判断
- `archive`：在 verify 通过后归档 change，并同步长期 capability spec 的当前快照与历史

`apply` 不会自动改业务代码；它只负责切换状态和输出应加载的上下文。

## 目录约定

### Spec 工作区

```text
openspec/
├── project.md
├── changes/
│   └── <change-id>/
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

### 3. plan

根据 proposal 细化：
- 设计边界
- 接口和数据模型
- 任务拆分
- 验证策略

### 4. apply

执行实现时应加载：
1. `.oh-my-engine/config.json`
2. `openspec/project.md`
3. 当前 change 的 `proposal.md`、`design.md`、`tasks.md`
4. 相关 capability 的长期 `openspec/specs/<capability>/spec.md`
5. `.oh-my-engine/rules/`
6. `.oh-my-engine/memory/`

### 5. verify

验证必须覆盖：
- 任务完成情况
- 验收标准
- 相关测试和手工检查
- 规范变更是否落到 spec delta

### 6. archive

完成后：
1. 将 change 下的 spec delta 合并到 `openspec/specs/`
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
        "defaultFlow": "propose-plan-apply-verify-archive",
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
  - openspec/changes/user-authentication/proposal.md
  - openspec/changes/user-authentication/design.md
  - openspec/changes/user-authentication/tasks.md
  - openspec/changes/user-authentication/specs/auth/spec.md

Next:
  1. Review proposal.md
  2. Refine design.md
  3. Execute /oh-my-engine-spec apply user-authentication
```

## 相关命令

- `/oh-my-engine spec <change-id>` - 通过主 skill 委托 spec 工作流
- `/oh-my-engine-memory` - 查看 spec 执行记忆
- `/oh-my-engine-evolve` - 触发学习和进化分析

---

**提示**：优先把 `openspec/specs/` 视为长期事实来源，把 `openspec/changes/` 视为当前变更上下文。
