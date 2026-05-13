---
description: Initialize .ome project configuration and Agent rules.
---

---
name: ome-init
version: 2.0.0
description: 智能初始化项目配置 - 扫描代码仓库并生成定制化规则
author: yunxi
tags: [init, setup, configuration, ai, smart]
---

# ome-init

**智能初始化**：扫描代码仓库，结合用户需求，AI 生成定制化的开发规则。

## 核心理念

❌ **不使用固定模板**  
✅ **智能分析 + AI 生成**

```
扫描代码仓库 → AI 分析 → 生成定制化 rules → 其他平台引用
```

## 使用方法

推荐 CLI 入口：

```bash
ome init
ome rules sync
```

### 方式 1：交互式初始化（推荐）

```bash
/ome-init
```

AI 会：
1. 扫描你的代码仓库
2. 询问项目特点和团队规范
3. 生成定制化的 rules
4. 创建索引文件到各平台

### 方式 2：带提示词初始化

```bash
/ome-init "这是一个 React Native 项目，使用 TypeScript，团队要求所有组件必须使用函数式组件和 Hooks，禁止使用 any 类型，必须支持 4 种语言（en/zh-CN/zh-TW/th）"
```

### 方式 3：使用 CLI

```bash
ome init --template default
```

## 工作流程

### 第一步：扫描代码仓库

```
🔍 扫描代码仓库...

检测项目类型:
  ✅ package.json → 前端/Node.js 项目
  ✅ requirements.txt → Python 项目
  ✅ go.mod → Go 项目
  ✅ Cargo.toml → Rust 项目

检测技术栈:
  ✅ React / Vue / Angular
  ✅ Next.js / Express / FastAPI
  ✅ TypeScript / JavaScript / Python / Go

检测目录结构:
  ✅ src/ app/ components/ pages/
  ✅ api/ server/ client/

检测现有规则:
  ⚠️  CLAUDE.md
  ⚠️  .cursorrules
```

### 第二步：分析报告

```
📊 代码仓库分析结果：

项目类型: mobile
编程语言: TypeScript
技术栈: React Native
框架: Expo
包管理器: yarn
目录结构: app, components, screens, services

⚠️  发现现有规则文件: CLAUDE.md, .cursor/rules
```

### 第三步：AI 生成规则

根据分析结果和用户输入，AI 生成定制化的规则文件：

```
.ome/rules/          ← 唯一的规则源
├── code-style.md             ← AI 生成（针对 TypeScript + React Native）
├── architecture.md           ← AI 生成（针对移动端架构）
├── component-patterns.md     ← AI 生成（React Native 组件模式）
├── performance.md            ← AI 生成（移动端性能优化）
├── i18n.md                   ← AI 生成（多语言规范）
└── testing.md                ← AI 生成（测试规范）
```

### 第四步：生成索引文件

```
生成轻量级索引文件到各平台：

✅ CLAUDE.md                  ← 引用 .ome/rules/
✅ .cursorrules               ← 引用 .ome/rules/
✅ .cursor/rules/*.mdc        ← 引用 .ome/rules/
✅ .trae/rules/*.mdc          ← 引用 .ome/rules/
✅ .agents/rules/*.md         ← 引用 .ome/rules/
✅ 其他平台...
```

## 生成的规则示例

### 针对 React Native 项目

```markdown
# code-style.md

## TypeScript 规范

### 1. 禁止使用 any

\`\`\`typescript
// ❌ 禁止
function process(data: any) { }

// ✅ 必须
function process<T>(data: T) { }
\`\`\`

### 2. 组件必须使用函数式组件

\`\`\`typescript
// ❌ 禁止
class MyComponent extends React.Component { }

// ✅ 必须
function MyComponent() { }
\`\`\`

## React Native 规范

### 1. 使用 ThemedStyle

\`\`\`typescript
// ❌ 禁止
<View style={{ padding: 16 }} />

// ✅ 必须
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})
<View style={themed($container)} />
\`\`\`
```

### 针对 Python FastAPI 项目

```markdown
# code-style.md

## Python 规范

### 1. 使用类型注解

\`\`\`python
# ❌ 禁止
def process(data):
    return data

# ✅ 必须
def process(data: dict) -> dict:
    return data
\`\`\`

### 2. 使用 Pydantic 模型

\`\`\`python
# ✅ 必须
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str
\`\`\`

## FastAPI 规范

### 1. API 路由组织

\`\`\`python
# ✅ 推荐
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.get("/")
async def list_users():
    pass
\`\`\`
```

## AI 提示词模板

系统会自动构建以下提示词发送给 AI：

```
# 任务：为项目生成定制化的开发规则

## 项目分析结果

- 项目类型: mobile
- 编程语言: TypeScript
- 技术栈: React Native
- 框架: Expo
- 包管理器: yarn
- 目录结构: { app: true, components: true, screens: true }

## 用户需求

这是一个 React Native 项目，使用 TypeScript，
团队要求所有组件必须使用函数式组件和 Hooks，
禁止使用 any 类型，必须支持 4 种语言。

## 要求

请根据以上信息，生成适合这个项目的开发规则...
```

## 与固定模板的对比

| 特性 | 固定模板 | 智能初始化 |
|------|---------|-----------|
| 适用性 | 仅适用特定项目类型 | 适用任何项目 |
| 规则内容 | 通用规则 | 定制化规则 |
| 技术栈 | 预设技术栈 | 自动识别 |
| 团队规范 | 无法体现 | 根据输入生成 |
| 维护成本 | 需要维护多个模板 | 无需维护模板 |

## 示例场景

### 场景 1：React Native 项目

```bash
/ome-init "React Native + TypeScript + Expo，使用 ThemedStyle 主题系统，必须支持 4 种语言，禁止行内样式"
```

生成的规则：
- ✅ TypeScript 严格模式
- ✅ React Native 组件规范
- ✅ ThemedStyle 主题系统
- ✅ 多语言 i18n 规范
- ✅ 性能优化规范

### 场景 2：Python FastAPI 项目

```bash
/ome-init "Python FastAPI 后端项目，使用 Pydantic 模型，PostgreSQL 数据库，要求所有 API 必须有类型注解和文档"
```

生成的规则：
- ✅ Python 类型注解规范
- ✅ Pydantic 模型规范
- ✅ FastAPI 路由组织
- ✅ 数据库操作规范
- ✅ API 文档规范

### 场景 3：Go 微服务项目

```bash
/ome-init "Go 微服务项目，使用 gRPC，要求所有服务必须有健康检查和监控，错误处理必须统一"
```

生成的规则：
- ✅ Go 代码规范
- ✅ gRPC 服务规范
- ✅ 错误处理规范
- ✅ 监控和日志规范
- ✅ 测试规范

## 规则文件组织

### 唯一的规则源

```
.ome/rules/          ← 所有规则都在这里
├── code-style.md
├── architecture.md
├── best-practices.md
├── testing.md
└── [其他定制规则]
```

### 其他平台引用

```
CLAUDE.md                     ← 索引文件，引用 .ome/rules/
.cursorrules                  ← 索引文件，引用 .ome/rules/
.cursor/rules/*.mdc           ← 完整规则（从源生成）
.trae/rules/*.mdc             ← 完整规则（从源生成）
.agents/rules/*.md            ← 完整规则（从源生成）
```

**关键点**：
- ✅ 规则只维护一份（`.ome/rules/`）
- ✅ 其他平台的文件是引用或生成的副本
- ✅ 修改规则只需编辑源文件
- ✅ 运行 `ome rules sync` 更新所有平台

## 执行流程

```
1. 用户运行 /ome-init "项目描述"
         ↓
2. 扫描代码仓库
         ↓
3. 生成 AI 提示词
         ↓
4. AI 生成定制化规则
         ↓
5. 保存到 .ome/rules/
         ↓
6. 运行 `ome rules sync`
         ↓
7. 生成索引文件到各平台
         ↓
8. 完成！
```

## 输出示例

```
🚀 Oh My Engine - 智能初始化

项目目录: /path/to/project

🔍 扫描代码仓库...

📊 代码仓库分析结果：

项目类型: mobile
编程语言: TypeScript
技术栈: React Native
框架: Expo
包管理器: yarn
目录结构: app, components, screens

💬 用户输入: React Native + TypeScript，必须支持 4 种语言

🤖 AI 正在生成定制化规则...

✅ 生成规则文件：
   - code-style.md (TypeScript + React Native 规范)
   - component-patterns.md (组件模式)
   - i18n.md (多语言规范)
   - performance.md (性能优化)
   - testing.md (测试规范)

🔄 同步到所有平台...

✅ claude-code: CLAUDE.md
✅ cursor: .cursor/rules/ (5 个文件)
✅ trae: .trae/rules/ (5 个文件)
✅ agents: .agents/rules/ (5 个文件)

🎉 初始化完成！

下一步：
  1. 查看生成的规则：ls .ome/rules/
  2. 根据需要调整规则
  3. 开始使用：/ome-ui <design-url>
```

## 高级用法

### 1. 重新生成规则

```bash
/ome-init --regenerate "新的项目描述"
```

### 2. 只生成特定规则

```bash
/ome-init --rules "code-style,testing"
```

### 3. 合并现有规则

```bash
/ome-init --merge
```

AI 会分析现有的规则文件（CLAUDE.md, .cursorrules 等），并将其整合到新的规则中。

## 相关文件

- `src/core/init.ts` - 智能初始化实现
- `src/core/rules.ts` - 规则同步实现
- `platforms.json` - 平台配置
- `config.json` - 项目配置

## 相关命令

- `/ome-init` - 智能初始化
- `ome rules sync` - 同步规则到所有平台
- `/ome-memory` - 查看记忆统计
- `/ome-evolve` - 触发进化分析

---

**核心优势**：
- ✅ 无需固定模板，适用任何项目
- ✅ AI 生成定制化规则
- ✅ 单一规则源，其他平台引用
- ✅ 智能分析代码仓库
- ✅ 结合团队规范
