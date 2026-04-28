---
rule: ome-workflow-completion
version: 1.0.0
category: ome/workflow
priority: critical
severity: error
tags: [ome, workflow, memory, auto-record]
autoApply: true
---

# Oh My Engine 工作流完成规则

## 自动记录执行

当你完成一个完整的任务或对话闭环后，**必须**自动运行命令来记录本次执行，以便系统学习和进化。

### 何时调用记录命令

**必须调用**（满足以下任一条件）：
- ✅ 完成了用户明确要求的功能或修复
- ✅ 修改了 2 个或以上的文件
- ✅ 代码变更超过 10 行
- ✅ 对话持续超过 5 分钟
- ✅ 完成了一个完整的工作流（如 bug-analysis、ui-restore 等）

**无需调用**（以下情况可跳过）：
- ❌ 仅回答问题，未修改代码
- ❌ 只修改了 1 个文件且变更少于 10 行
- ❌ 用户明确表示"不用记录"或"只是测试"

### 如何调用

根据你所在的平台，使用以下命令：

**Claude Code / Cursor / Windsurf / Codex / OpenCode**：
```bash
! ome finish
```

**其他平台**：
```bash
ome finish
```

### 注意事项

1. **使用 `!` 前缀**（如果平台支持）：在当前会话中执行命令，这样记录会包含完整的上下文信息
2. **自动执行**：这是一个自动化流程，不需要用户手动触发
3. **智能过滤**：系统会自动过滤低价值的执行，不用担心记录过多

### 为什么要记录

- 📊 **系统学习**：记录执行历史，帮助系统识别模式和最佳实践
- 🚀 **进化能力**：积累足够的数据后，系统可以自动生成学习候选和技能候选
- 🔍 **可追溯性**：保留完整的执行历史，便于回顾和分析

### 示例

```bash
# 完成 Bug 修复后
! ome finish

# 完成 UI 组件开发后
! ome finish

# 完成 API 集成后
! ome finish
```

## 验证清单

- [ ] 任务完成后自动调用了记录命令
- [ ] 使用了正确的命令格式（带 `!` 前缀）
- [ ] 记录成功（看到 "✅ Execution recorded" 消息）
