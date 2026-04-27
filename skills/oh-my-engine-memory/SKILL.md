---
name: oh-my-engine-memory
version: 1.0.0
description: 查看系统记忆和学习数据
author: yunxi
tags: [memory, statistics, learning]
---

# oh-my-engine-memory

查看系统记忆统计。

当前 v1 已落地的是选择性执行记忆：
- 只有命中策略门控的事件才会落盘
- 当前 viewer 已支持 `executions`、显式 `preferences`、`learnings`、`adopted-learnings`、`skill-candidates`、`generated-skills`

## 使用方法

```bash
/oh-my-engine-memory [options]
```

Claude Code 可直接使用上面的 slash command。
Codex 请按技能名 `oh-my-engine-memory` 触发，并沿用相同参数。

## 参数

- `--workflow`: 指定工作流（可选）
- `--type`: 记忆类型（当前 v1 支持 `executions` / `preferences` / `learnings` / `adopted-learnings` / `skill-candidates` / `generated-skills`）
- `--project-root`: 指定项目根目录（可选，默认当前目录）
- `--scope`: 偏好作用域（可选，当前用于 `preferences`）
- `--format`: 输出格式（可选：`text`/`json`）

## 示例

```bash
# 查看执行记忆
/oh-my-engine-memory

# 查看 spec 工作流执行记忆
/oh-my-engine-memory --type executions --workflow spec

# 查看显式记住的偏好
/oh-my-engine-memory --type preferences --scope user

# 查看 learning candidates
/oh-my-engine-memory --type learnings

# 查看 adopted learnings
/oh-my-engine-memory --type adopted-learnings

# 查看 skill candidates
/oh-my-engine-memory --type skill-candidates

# 查看 adopted generated skills
/oh-my-engine-memory --type generated-skills

# 以 JSON 输出
/oh-my-engine-memory --type executions --format json
```

## 输出示例

```
Execution memory
Total records: 2
Workflow spec: 2

- 2026-04-24T14:28:48Z spec/propose demo-memory [rich] workflow_command_high_complexity
- 2026-04-24T14:30:12Z spec/plan demo-memory [summary] workflow_command_medium_complexity
```

## 当前实现

v1 viewer 命令：

```bash
ome memory view --type executions
ome memory view --type preferences --scope user
ome memory view --type learnings
ome memory view --type adopted-learnings
ome memory view --type skill-candidates
ome memory view --type generated-skills
```

当前返回：
- 执行记录总数
- 按 workflow 聚合的数量
- 每条记录的 `captureLevel`
- 每条记录的 `whyStored`
- 偏好记录总数
- 按 scope 聚合的偏好数量
- 偏好的 `evidenceCount`
- learning candidate 总数
- learning candidate 的 `status`
- learning candidate 的 `verification.state`
- adopted learning 总数
- skill candidate 总数
- skill candidate 的 `status`
- skill candidate 的 `verification.state`
- generated skill 总数
- generated skill 的 `executionDirectives`

## 相关命令

- `/oh-my-engine-evolve` - 触发进化分析
- `ome init` - 初始化项目配置

---

**提示**：v1 的重点不是“全部记住”，而是“只记值得记的东西”。
