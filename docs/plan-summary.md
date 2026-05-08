# Agent Auto-Detection Implementation - Plan Summary

## 📋 Overview

实现在 `ome init` 时为**所有 8 个 Agent 平台**自动生成包含自动检测规则的项目规则文件，让 AI Agent 能够自动识别任务类型并调用对应的 OME 命令。

## 🎯 目标

用户运行 `ome init` 后，所有支持的 Agent 编辑器都能：
- 自动识别 bug 描述 → 使用 `/ome-bug` 或 `ome-bug`
- 自动识别设计稿 → 使用 `/ome-ui` 或 `ome-ui`
- 自动识别 API 集成 → 使用 `/ome-api` 或 `ome-api`
- 自动识别组件生成 → 使用 `/ome-comp` 或 `ome-comp`
- 自动识别生命周期阶段 → 使用 define/plan/build/test/review/ship

**无需用户手动输入命令名称**，Agent 自动判断并调用。

## 🌐 支持的平台

### 单文件平台（4 个）

| 平台 | 文件路径 | 命令风格 | 说明 |
|------|---------|---------|------|
| Claude Code | `CLAUDE.md` | slash | `/ome-bug` |
| Codex | `AGENTS.md` | skill | `ome-bug` |
| OpenCode | `AGENTS.md` | slash | `/ome-bug` (与 Codex 共享) |
| Windsurf | `.windsurfrules` | workflow | `/ome-bug` |
| Antigravity | `GEMINI.md` | workflow | `/ome-bug` |

### 多文件平台（4 个）

| 平台 | 自动检测文件 | 规则索引文件 | 格式 |
|------|------------|------------|------|
| Cursor | `.cursor/rules/00-ome-auto-detection.mdc` | `.cursor/rules/01-ome-rules-index.mdc` | MDC (需要 frontmatter) |
| Trae | `.trae/rules/00-ome-auto-detection.md` | `.trae/rules/01-ome-rules-index.md` | Markdown |
| Qoder | `.qoder/rules/00-ome-auto-detection.md` | `.qoder/rules/01-ome-rules-index.md` | Markdown |
| Antigravity | `.agent/rules/00-ome-auto-detection.md` | `.agent/rules/01-ome-rules-index.md` | Markdown (多文件模式) |

## 📁 文件结构

### 单文件平台示例（CLAUDE.md）

```markdown
# Oh My Engine - Claude Code Integration

## 🤖 自动命令检测

### Bug 分析和修复
**触发条件**: 用户描述 bug、错误现象
**自动使用**: `/ome-bug "<issue>"`

### UI 还原
**触发条件**: 设计稿 URL、截图
**自动使用**: `/ome-ui <design>`

[... 其他触发规则 ...]

## 📋 命令使用优先级
1. 任务特定命令
2. 生命周期命令
3. 直接实现

<!-- OME:START -->
# 规则索引（由 ome rules sync 更新）
...
<!-- OME:END -->
```

### 多文件平台示例（Cursor）

**00-ome-auto-detection.mdc**:
```markdown
---
glob: "**/*"
alwaysApply: true
---

# Oh My Engine - Auto Detection

## 🤖 自动命令检测
[... 触发规则 ...]
```

**01-ome-rules-index.mdc**:
```markdown
---
glob: "**/*"
alwaysApply: true
---

# Oh My Engine - Rules Index

## 规则索引
- 📄 [project-overview.md](../../.ome/rules/project-overview.md)
...
```

## 🔧 实现方案

### 核心函数

1. **`buildAgentGuidanceContent(platform, scan)`**
   - 根据平台类型生成自动检测规则内容
   - 适配命令风格（slash/skill/workflow）
   - 适配文件格式（Markdown/MDC）
   - 根据项目扫描结果动态调整（无 UI 则跳过 ome-ui）

2. **`generateAgentGuidanceFile(projectRoot, platform, scan)`**
   - 为单个平台生成自动检测规则文件
   - 单文件平台：检查 OME 标记块，保留用户内容
   - 多文件平台：创建独立的 00-ome-auto-detection 文件
   - 返回创建状态和文件路径

3. **`generateAllAgentGuidanceFiles(projectRoot, scan)`**
   - 遍历所有 8 个平台
   - 调用 `generateAgentGuidanceFile()` 为每个平台生成文件
   - 处理共享文件（AGENTS.md）
   - 返回所有平台的生成结果

### 集成点

1. **`initializeProject()` 修改**
   ```typescript
   // 在 syncRules() 之前生成所有平台的指导文件
   const agentGuidanceResults = generateAllAgentGuidanceFiles(projectRoot, scan);
   
   // syncRules() 会追加规则索引
   const syncedTargets = syncRules([], projectRoot);
   ```

2. **`syncRules()` 修改**
   - 单文件平台：只更新 `<!-- OME:START -->` 标记块内容
   - 多文件平台：更新 `01-ome-rules-index.{ext}` 文件
   - 保留自动检测规则不变

## 🧪 测试策略

### 单元测试

- `buildAgentGuidanceContent()` 为所有 8 个平台生成正确内容
- 命令语法适配（slash vs skill）
- 文件格式适配（Markdown vs MDC）
- 项目类型过滤（无 UI 跳过 ome-ui）

### 集成测试

- `ome init` 生成所有 8 个平台的文件
- 单文件平台包含 OME 标记块
- 多文件平台创建独立文件
- `ome rules sync` 只更新规则索引部分

### 手动测试

- 在 Claude Code 中测试自动检测
- 在 Cursor 中测试自动检测
- 在 Codex 中测试自动检测
- 验证命令语法正确

## ✅ 验证清单

- [ ] 为所有 8 个平台实现 `buildAgentGuidanceContent()`
- [ ] 实现 `generateAgentGuidanceFile()` 支持单文件和多文件平台
- [ ] 实现 `generateAllAgentGuidanceFiles()` 遍历所有平台
- [ ] 修改 `initializeProject()` 调用指导文件生成
- [ ] 修改 `syncRules()` 支持标记块和多文件更新
- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] 手动测试：Claude Code 自动使用命令
- [ ] 手动测试：Cursor 自动使用命令
- [ ] 手动测试：Codex 自动使用命令
- [ ] 文档已更新

## 📚 相关文档

- **详细实现计划**: [plan-agent-guidance-generation.md](plan-agent-guidance-generation.md)
- **架构文档**: [architecture.md](architecture.md) - Layer 5: Agent Integration Files
- **Framework API**: [framework-api.md](framework-api.md) - Agent Guidance Generation
- **安装和使用**: [installation-and-usage.md](installation-and-usage.md)
- **README**: [../README.md](../README.md) - Auto-Detection Feature

## 🚀 下一步

执行 `/ome-build` 开始实现：

1. **Phase 1**: 实现核心函数（buildAgentGuidanceContent, generateAgentGuidanceFile, generateAllAgentGuidanceFiles）
2. **Phase 2**: 修改 initializeProject() 集成
3. **Phase 3**: 修改 syncRules() 支持多平台
4. **Phase 4**: 编写和运行测试
5. **Phase 5**: 验证所有平台的自动检测功能

## 🎉 预期效果

用户运行 `ome init` 后：

```bash
cd my-project
ome init

# 生成的文件：
# ✅ CLAUDE.md (Claude Code)
# ✅ AGENTS.md (Codex, OpenCode)
# ✅ .windsurfrules (Windsurf)
# ✅ GEMINI.md (Antigravity)
# ✅ .cursor/rules/00-ome-auto-detection.mdc (Cursor)
# ✅ .trae/rules/00-ome-auto-detection.md (Trae)
# ✅ .qoder/rules/00-ome-auto-detection.md (Qoder)
# ✅ .agent/rules/00-ome-auto-detection.md (Antigravity)
```

在任何支持的 Agent 编辑器中：

```
用户: "登录按钮点击没反应"
Agent: [自动识别为 bug] → 执行 /ome-bug "登录按钮点击没反应"

用户: "还原这个设计稿 https://..."
Agent: [自动识别为 UI] → 执行 /ome-ui "https://..."

用户: "集成用户登录 API"
Agent: [自动识别为 API] → 执行 /ome-api "用户登录 API"
```

**所有 8 个平台都支持自动检测，无需手动输入命令！**
