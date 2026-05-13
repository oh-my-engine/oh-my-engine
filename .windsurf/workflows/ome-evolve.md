---
description: Analyze local memory for learning and skill candidates.
---

---
name: ome-evolve
version: 1.0.0
description: 触发系统进化分析
author: yunxi
tags: [evolution, optimization, learning]
---

# ome-evolve

分析已存储的 execution / preference memory，产出 candidate 级别的学习结果。

当前 v1 已实现：
- 从 repeated successful execution patterns 生成 `learning candidates`
- 从 repeated bug-fix patterns 生成 `skill candidates`
- 汇总已重复确认的显式 `preferences`
- learning candidate 可单独走 `verify -> adopt`
- skill candidate 可单独走 `verify -> adopt`
- 不自动 adopt skill

## 使用方法

```bash
/ome-evolve [options]
```

Claude Code 可直接使用上面的 slash command。
Codex 请按技能名 `ome-evolve` 触发，并沿用相同参数。

## 参数

- `--project-root`: 指定项目根目录（可选，默认当前目录）
- `--format`: 输出格式（可选：`text`/`json`）

## 示例

```bash
# 分析当前项目记忆
/ome-evolve

# 输出 JSON 报告
/ome-evolve --format json
```

## 执行流程

1. **加载执行历史**
   - 读取 memory/executions/
   - 读取 memory/preferences/
   - 统计 execution / preference 数据

2. **评估执行效果**
   - 识别 repeated successful patterns
   - 识别 repeated bug-fix patterns
   - 识别已重复确认的显式偏好

3. **识别可优化模式**
   - learning candidate（默认阈值 ≥3）
   - skill candidate（默认阈值 ≥3）
   - adopted preference summary（默认阈值 ≥2）

4. **生成优化建议**
   - 写入 `.ome/memory/learnings/candidates/`
   - 写入 `.ome/memory/skill-candidates/`
   - 输出报告，不直接安装 skill

5. **独立验证与采用**
   - `ome evolve verify-learning --slug <slug>` 校验 learning candidate schema 和状态
   - learning candidate adopt 结果写入 `.ome/memory/learnings/adopted/`
   - `ome evolve verify-skill --slug <slug>` 校验 candidate schema 和状态
   - 只有 `verified` candidate 才能 adopt
   - adopt 结果写入 `.ome/generated-skills/`

## 输出示例

```
Evolution analysis
Execution records: 8
Preference records: 1
Learning candidates: 1
Skill candidates: 1
Adopted preferences: 1

Learning candidates:
- spec verify: Verified the spec change and acceptance state. [evidence=3]

Skill candidates:
- react-event-handler-invocation [evidence=3]

Adopted preferences:
- Prefer concise reports [evidence=2]
```

## 配置

### 项目配置（.ome/config.json）

```json
{
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

## 当前 CLI

```bash
ome evolve analyze --format json
ome evolve verify-learning --slug spec-verify-verified-the-spec-change-and-acceptance-state
ome evolve adopt-learning --slug spec-verify-verified-the-spec-change-and-acceptance-state
ome evolve verify-skill --slug react-event-handler-invocation
ome evolve adopt-skill --slug react-event-handler-invocation
```

## 相关命令

- `/ome-memory` - 查看执行 / preference / candidate 记忆
- `ome init` - 初始化 selective memory 默认配置

---

**提示**：v1 的 evolve 只负责“发现并提名”，不负责“自动替你升级”。
