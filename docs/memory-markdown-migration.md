# Memory System Migration: JSON → Markdown

## Overview

Oh My Engine 的记忆系统已从 JSON/JSONL 格式迁移到 Markdown 格式，以提供更好的用户体验和 Agent 友好性。

## Why Markdown?

### 优势

✅ **人类可读** - 用户可以直接打开 `.ome/memory/` 查看和编辑记忆  
✅ **Agent 友好** - AI 可以直接理解，无需解析 JSON  
✅ **格式统一** - 记忆、规则、技能都使用 Markdown  
✅ **Git 友好** - diff 清晰，易于版本控制  
✅ **易于编辑** - 用户可以手动修正或补充记忆  
✅ **与主流一致** - Claude Code、Cursor、Windsurf 都使用 Markdown

### 对比

**旧格式（JSON/JSONL）**:
```json
{"id":"exec-123","workflow":"bug","summary":"修复登录","status":"success"}
```

**新格式（Markdown）**:
```markdown
---
id: exec-123
type: execution
workflow: bug
status: success
timestamp: 2024-01-15T10:30:00Z
duration: 1200
---

# 修复登录按钮点击无响应

## Details

- **Workflow**: bug
- **Status**: success
- **Duration**: 1200ms
- **Timestamp**: 2024-01-15T10:30:00Z

## Why Stored

High-value execution with error recovery

## Files Touched

- src/components/LoginButton.tsx
- src/hooks/useAuth.ts
```

## File Structure

### 旧结构（JSON/JSONL）

```
.ome/memory/
├── executions/
│   └── bug/
│       └── 2024-01-15.jsonl          # 每天一个 JSONL 文件
├── preferences/
│   └── user.json                      # 每个 scope 一个 JSON 文件
├── learnings/
│   ├── candidates/
│   │   └── react-event-handler.json
│   └── adopted/
│       └── react-event-handler.json
└── skill-candidates/
    └── debug-react-events.json
```

### 新结构（Markdown）

```
.ome/memory/
├── executions/
│   └── bug/
│       ├── 2024-01-15-fix-login-button.md      # 每个执行一个 MD 文件
│       └── 2024-01-16-resolve-auth-error.md
├── preferences/
│   ├── user-coding-style.md                     # 每个偏好一个 MD 文件
│   └── user-testing-approach.md
├── learnings/
│   ├── candidates/
│   │   └── react-event-handler.md
│   └── adopted/
│       └── react-event-handler.md
└── skill-candidates/
    └── debug-react-events.md
```

## Migration Guide

### 自动迁移（推荐）

运行迁移脚本自动转换现有数据：

```bash
# 迁移当前项目
node dist/scripts/migrate-memory-to-markdown.js

# 迁移指定项目
node dist/scripts/migrate-memory-to-markdown.js /path/to/project
```

迁移脚本会：
1. ✅ 将所有 JSON/JSONL 文件转换为 Markdown
2. ✅ 保留所有元数据和内容
3. ✅ 备份原始文件为 `*.backup`
4. ✅ 生成人类可读的 Markdown 文件

### 手动迁移

如果需要手动迁移，可以参考以下模板：

#### 执行记录模板

```markdown
---
id: exec-1234567890-abc123
type: execution
workflow: bug
phase: apply
timestamp: 2024-01-15T10:30:00Z
status: success
duration: 1200
captureLevel: high
---

# [执行摘要]

## Details

- **Workflow**: bug
- **Phase**: apply
- **Status**: success
- **Duration**: 1200ms
- **Timestamp**: 2024-01-15T10:30:00Z

## Why Stored

[为什么存储这条记录]

## Errors

- [错误信息 1]
- [错误信息 2]

## Files Touched

- [文件路径 1]
- [文件路径 2]

## Tests Run

- [测试名称 1]
- [测试名称 2]

## Metadata

```json
{
  "key": "value"
}
```
```

#### 偏好记录模板

```markdown
---
id: pref-1234567890-abc123
type: preference
scope: user
source: explicit_remember
explicit: true
evidenceCount: 3
lastConfirmedAt: 2024-01-15T10:30:00Z
stability: 1
status: adopted
---

# [偏好声明]

## Details

- **Scope**: user
- **Source**: explicit_remember
- **Evidence Count**: 3
- **Stability**: 1
- **Status**: adopted

## Why Stored

[为什么存储这条偏好]
```

#### 学习候选模板

```markdown
---
id: learn-1234567890-abc123
type: learning
slug: react-event-handler
category: best_practice
workflow: bug
phase: apply
status: candidate
evidenceCount: 3
reusability: 0.8
verification:
  state: pending
  required: true
---

# React Event Handler Pattern

## Summary

[学习内容摘要]

## Applies To

- React components
- Event handling
- User interactions

## Evidence

### 2024-01-15T10:30:00Z

- **Change ID**: change-123
- **Workflow**: bug
- **Phase**: apply
- **Status**: success

### 2024-01-16T14:20:00Z

- **Change ID**: change-456
- **Workflow**: ui
- **Phase**: apply
- **Status**: success

## Why Stored

[为什么存储这条学习]
```

#### 技能候选模板

```markdown
---
id: skill-1234567890-abc123
type: skill
slug: debug-react-events
patternCategory: debugging
patternId: react-event-debugging
status: candidate
evidenceCount: 2
verification:
  state: pending
  required: true
---

# Debug React Event Issues

## Summary

[技能内容摘要]

## Evidence

### 2024-01-15T10:30:00Z

- **Change ID**: change-123
- **Workflow**: bug
- **Status**: success

### 2024-01-16T14:20:00Z

- **Change ID**: change-456
- **Workflow**: bug
- **Status**: success

## Why Stored

[为什么存储这个技能]
```

## Backward Compatibility

新的记忆系统**仅支持 Markdown 格式**。如果你有旧的 JSON/JSONL 文件：

1. **运行迁移脚本**（推荐）
2. 或者手动转换为 Markdown 格式
3. 备份文件会保留为 `*.backup`，验证后可以删除

## Benefits for Users

### 1. 直接查看记忆

```bash
# 查看最近的执行记录
ls -lt .ome/memory/executions/bug/*.md | head -5

# 查看特定记忆
cat .ome/memory/executions/bug/2024-01-15-fix-login-button.md
```

### 2. 手动编辑记忆

用任何文本编辑器打开 Markdown 文件，直接编辑：

```bash
# 使用 VS Code 编辑
code .ome/memory/executions/bug/2024-01-15-fix-login-button.md

# 使用 vim 编辑
vim .ome/memory/executions/bug/2024-01-15-fix-login-button.md
```

### 3. Git 版本控制

```bash
# 查看记忆变化
git diff .ome/memory/

# 提交记忆更新
git add .ome/memory/
git commit -m "Update memory: add debugging insights"
```

### 4. 搜索记忆

```bash
# 搜索包含特定关键词的记忆
grep -r "login" .ome/memory/executions/

# 使用 ripgrep 搜索
rg "authentication" .ome/memory/
```

## Benefits for Agents

### 1. 直接理解

Agent 可以直接读取 Markdown 内容，无需解析 JSON：

```markdown
The execution record shows:
- Fixed login button click issue
- Changed onClick={handleLogin()} to onClick={handleLogin}
- Duration: 1200ms
- Status: success
```

### 2. 上下文加载

Agent 可以轻松加载相关记忆作为上下文：

```bash
# 加载最近的 bug 修复记忆
cat .ome/memory/executions/bug/*.md | tail -n 100
```

### 3. 模式识别

Markdown 格式让 Agent 更容易识别模式和趋势：

```markdown
Pattern detected:
- 3 executions with "event handler" errors
- All resolved by removing () from onClick
- Suggests a learning candidate
```

## API Changes

### 记忆存储 API（保持不变）

```typescript
// API 接口保持不变，只是内部格式改变
recordExecutionMemory(projectRoot, {
  workflow: 'bug',
  summary: '修复登录按钮',
  status: 'success',
  // ...
});

// 读取记忆（返回的数据结构相同）
const records = listExecutionRecords(projectRoot, {
  workflow: 'bug'
});
```

### 新增字段

记忆记录现在包含额外的元数据字段：

```typescript
{
  ...record,
  _content: string,    // Markdown 正文内容
  _filePath: string    // 文件路径
}
```

## Troubleshooting

### 迁移失败

如果迁移脚本失败：

1. 检查文件权限
2. 确保 `.ome/memory/` 目录存在
3. 查看错误日志
4. 手动转换失败的文件

### 格式错误

如果 Markdown 文件格式错误：

1. 检查 frontmatter 格式（必须是有效的 YAML）
2. 确保有正确的分隔符 `---`
3. 验证所有必需字段都存在

### 性能问题

如果记忆文件过多导致性能问题：

1. 定期清理旧的执行记录
2. 归档不常用的记忆
3. 使用 `.gitignore` 排除记忆目录（如果不需要版本控制）

## FAQ

### Q: 旧的 JSON 文件会被删除吗？

A: 不会。迁移脚本会将原始文件重命名为 `*.backup`，你可以在验证迁移成功后手动删除。

### Q: 可以混用 JSON 和 Markdown 吗？

A: 不可以。新系统只支持 Markdown 格式。请运行迁移脚本转换所有旧数据。

### Q: 如何回滚到 JSON 格式？

A: 如果需要回滚：
1. 恢复备份的 `memory-store-json-backup.ts`
2. 删除 Markdown 文件
3. 恢复 `*.backup` 文件

### Q: Markdown 格式会影响性能吗？

A: 不会。Markdown 解析非常快，而且文件数量相同（执行记录从每天一个 JSONL 变为每个执行一个 MD）。

### Q: 可以手动创建记忆文件吗？

A: 可以！只需按照模板创建 Markdown 文件，确保 frontmatter 格式正确即可。

## Next Steps

1. ✅ 运行迁移脚本
2. ✅ 验证迁移结果
3. ✅ 删除备份文件（可选）
4. ✅ 享受更好的记忆体验！

## Related Documentation

- [Memory System](memory-system.md)
- [Evolution Mechanism](evolution.md)
- [User Guide](user-guide.md)
