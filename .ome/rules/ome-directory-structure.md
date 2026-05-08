---
rule: ome-directory-structure
version: 1.0.0
description: Oh My Engine 目录结构规范
category: ome/structure
priority: critical
severity: error
tags: [ome, structure, organization]
autoApply: true
---

# Oh My Engine 目录结构规范

## .ome 目录结构

`.ome/` 是 Oh My Engine 的项目配置和数据根目录，所有 OME 相关的文件都应该存放在此目录下。

```
.ome/
├── config.json              # 项目配置文件
├── bug-patterns.json        # Bug 模式记录
├── platforms.json           # 平台配置
├── context/                 # 📊 上下文数据
│   └── project-scan.json    # 项目扫描结果
├── docs/                    # 📚 文档
│   └── *.md                 # 各类说明文档
├── generated-skills/        # 🤖 自动生成的技能
│   └── *.md                 # 生成的技能定义
├── memory/                  # 🧠 记忆系统
│   ├── executions/          # 执行历史
│   ├── learnings/           # 学习记录
│   ├── preferences/         # 用户偏好
│   ├── skill-candidates/    # 技能候选
│   └── specs/               # 规范记忆
├── plans/                   # 📋 方案文件（重要）
│   └── *.md                 # 实现方案文档
├── rules/                   # 📏 规则文件
│   └── *.md                 # 各类规则定义
├── spec/                    # 📝 规范驱动开发
│   ├── archive/             # 已归档的规范
│   ├── changes/             # 变更记录
│   └── specs/               # 活跃的规范
└── workflows/               # 🔄 工作流定义
    └── *.md                 # 工作流配置
```

## 📋 Plans 目录规范

### 用途

`plans/` 目录用于存放 **所有通过 ome-plan 生成的实现方案文档**。

### 命名规范

方案文件应使用清晰、描述性的名称：

```
✅ 推荐命名：
- feature-user-authentication.md
- refactor-api-layer.md
- bugfix-login-validation.md
- spec-workspace-migration.md

❌ 避免命名：
- plan.md                    # 太泛化
- temp.md                    # 临时文件
- 20260508.md                # 只有日期
```

### 文件结构

每个方案文件应包含：

```markdown
# 方案标题

## 目标
明确的目标描述

## 范围
- 包含的功能
- 不包含的功能

## 实现步骤
1. 步骤一
2. 步骤二
...

## 技术决策
关键的技术选择和理由

## 测试策略
如何验证实现

## 风险和注意事项
潜在的问题和应对方案
```

### 生命周期

1. **创建**：通过 `/ome-plan` 或 `ome plan` 命令创建
2. **使用**：在实现过程中作为指导文档
3. **归档**：完成后可以移动到 `.ome/spec/archive/` 或删除

### 强制规则

**❌ 禁止**：
- 在项目根目录或其他位置创建方案文件（如 `prompts/`, `docs/plans/` 等）
- 使用临时目录存放方案文件
- 将方案文件与其他类型的文档混合存放

**✅ 必须**：
- 所有 ome-plan 生成的方案文件必须存放在 `.ome/plans/`
- 使用描述性的文件名
- 保持方案文件的结构完整性

## 其他目录说明

### context/
存放项目扫描和上下文分析结果，由 `ome init-rules` 自动生成。

### docs/
存放 OME 相关的说明文档和迁移指南。

### generated-skills/
存放通过 `ome evolve` 自动生成的技能定义。

### memory/
记忆系统的数据存储，包含执行历史、学习记录、用户偏好等。

### rules/
存放项目规则定义，是 CLAUDE.md 等平台文件的源文件。

### spec/
规范驱动开发的工作目录，包含活跃规范、变更记录和归档。

### workflows/
存放自定义工作流定义（如果需要）。

## 配置文件

### config.json

项目配置文件应包含各个目录的路径配置：

```json
{
  "directories": {
    "plans": ".ome/plans",
    "rules": ".ome/rules",
    "memory": ".ome/memory",
    "spec": ".ome/spec",
    "context": ".ome/context"
  }
}
```

## 验证清单

- [ ] 所有方案文件都在 `.ome/plans/` 目录下
- [ ] 方案文件使用了描述性的命名
- [ ] 没有在其他位置创建方案文件
- [ ] `.ome/` 目录结构符合规范
- [ ] 配置文件中包含了目录路径配置

## 迁移指南

如果发现方案文件在错误的位置：

```bash
# 1. 移动到标准位置
mv prompts/*.md .ome/plans/ 2>/dev/null || true
mv docs/plans/*.md .ome/plans/ 2>/dev/null || true

# 2. 删除旧目录
rm -rf prompts/
rm -rf docs/plans/

# 3. 验证
ls -la .ome/plans/
```

## 相关命令

- `/ome-plan` - 创建实现方案（自动保存到 .ome/plans/）
- `/ome-init` - 初始化 .ome 目录结构
- `/ome-init-rules` - 刷新项目扫描和规则
