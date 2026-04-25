# 🧠 Oh My Engine: 让你的 AI 编程助手学会"记忆"和"进化"

## TL;DR

我开发了一个自我进化的工作流引擎 **Oh My Engine**，它能让 Claude Code 和 Codex 拥有记忆和学习能力。它会记住你的操作历史、学习你的编码模式，并自动生成新的技能。

**一行命令安装：**
```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

GitHub: https://github.com/oh-my-engine/oh-my-engine

---

## 为什么要做这个项目？

在使用 Claude Code 和 Codex 这类 AI 编程助手时，我发现了几个痛点：

### 痛点 1：每次都要重复相同的指令
当你第三次告诉 AI "用 Tailwind CSS 写样式，不要用内联样式" 时，你会想：**为什么它不能记住我的偏好？**

### 痛点 2：成功的解决方案无法复用
上周 AI 帮你完美解决了一个 API 集成问题，这周遇到类似问题时，它又从零开始。**为什么不能把成功的经验保存下来？**

### 痛点 3：重复的工作流无法自动化
你发现自己总是在做：读设计稿 → 生成组件 → 调整样式 → 测试。**为什么不能把这个流程固化成一个命令？**

### 痛点 4：项目特定的规则需要反复说明
每个项目都有自己的代码规范、技术栈、目录结构。**为什么每次都要重新解释？**

于是，我做了 **Oh My Engine**。

---

## Oh My Engine 是什么？

**Oh My Engine** 是一个为 Claude Code 和 Codex 设计的自我进化工作流引擎。它的核心能力是：

### 🧠 记忆系统
- 记录每次执行的历史
- 保存用户偏好和项目规则
- 追踪成功和失败的案例

### 🔄 自我进化
自动识别模式并生成新技能：
- **重复错误修复**（≥3次）→ 自动修复规则
- **代码复用**（≥3处）→ 工具函数
- **成功模式**（≥95%成功率）→ 最佳实践
- **操作序列**（≥5次）→ 快捷命令

### ⚙️ 项目配置
每个项目都有独立的 `.oh-my-engine/` 目录：
```
.oh-my-engine/
├── config.json          # 项目配置
├── workflows/           # 自定义工作流
├── rules/              # 项目规则
└── memory/             # 执行记忆
```

### 📋 预置工作流
开箱即用的工作流：
- **UI 还原**：从设计稿生成代码
- **Bug 分析**：智能分析和修复
- **组件生成**：快速创建组件
- **API 集成**：自动对接 API

---

## 实际使用场景

### 场景 1：UI 还原工作流

**传统方式：**
```
你: "帮我根据这个 Figma 设计实现登录页面"
AI: "好的，我来实现..."
[30分钟后]
你: "样式不对，我们用 Tailwind，不要内联样式"
AI: "好的，我来修改..."
你: "响应式也要做"
AI: "好的..."
```

**使用 Oh My Engine：**
```
你: /oh-my-engine-ui
AI: "检测到 Figma 链接，开始还原..."
    ✓ 分析设计稿结构
    ✓ 生成组件代码（使用 Tailwind）
    ✓ 实现响应式布局
    ✓ 添加交互逻辑
    完成！已生成 LoginPage.tsx
```

**为什么更好？**
- 一个命令完成所有步骤
- 自动应用项目规则（Tailwind、响应式）
- 记住你的偏好（组件结构、命名规范）

### 场景 2：Bug 修复工作流

**传统方式：**
```
你: "这个 API 调用报错了"
AI: "让我看看代码..."
你: "还要检查网络请求"
AI: "好的..."
你: "看看日志"
AI: "好的..."
```

**使用 Oh My Engine：**
```
你: /oh-my-engine-bug
AI: "开始分析 Bug..."
    ✓ 读取错误日志
    ✓ 检查相关代码
    ✓ 分析网络请求
    ✓ 查找类似历史问题
    ✓ 应用已知解决方案
    
    发现问题：API 端点缺少认证 header
    已修复并测试通过！
```

**为什么更好？**
- 自动执行完整的诊断流程
- 从历史记忆中查找类似问题
- 应用已验证的解决方案

### 场景 3：自动进化

**第一次：手动解决问题**
```
你: "这个 API 调用总是超时"
AI: "让我添加重试逻辑..."
[成功解决]
```

**第二次：类似问题**
```
你: "另一个 API 也超时了"
AI: "让我添加重试逻辑..."
[成功解决]
```

**第三次：自动进化**
```
[Oh My Engine 检测到模式]
✓ 识别：API 超时问题出现 3 次
✓ 分析：重试逻辑成功率 100%
✓ 进化：生成新技能 "api-retry-handler"

新技能已生成！
使用: /oh-my-engine-api-retry
```

**第四次：一键解决**
```
你: "又一个 API 超时"
AI: "检测到 API 超时，应用 api-retry-handler..."
    ✓ 自动添加重试逻辑
    ✓ 配置指数退避
    ✓ 添加错误处理
    完成！
```

---

## 核心特性详解

### 1. 记忆系统

**执行历史：**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "workflow": "ui-restoration",
  "input": "Figma: https://...",
  "output": "LoginPage.tsx",
  "success": true,
  "duration": 45,
  "learnings": [
    "用户偏好 Tailwind CSS",
    "需要响应式布局",
    "组件使用 TypeScript"
  ]
}
```

**用户偏好：**
```json
{
  "styling": "tailwind",
  "typescript": true,
  "responsive": true,
  "componentStructure": "functional",
  "namingConvention": "PascalCase"
}
```

### 2. 自我进化机制

**模式识别算法：**
```
IF 相同操作序列出现 ≥ 5 次
AND 成功率 ≥ 95%
THEN 生成新技能
```

**进化示例：**

| 检测到的模式 | 出现次数 | 成功率 | 生成的技能 |
|------------|---------|--------|-----------|
| API 超时重试 | 5 | 100% | `/api-retry` |
| 表单验证 | 8 | 97% | `/form-validator` |
| 图片优化 | 6 | 100% | `/image-optimizer` |
| 错误边界 | 4 | 100% | `/error-boundary` |

### 3. 项目配置

**`.oh-my-engine/config.json`：**
```json
{
  "project": {
    "name": "my-app",
    "type": "react",
    "framework": "next.js"
  },
  "preferences": {
    "styling": "tailwind",
    "typescript": true,
    "testFramework": "jest"
  },
  "rules": [
    "使用函数式组件",
    "所有 API 调用需要错误处理",
    "组件必须有 PropTypes 或 TypeScript 类型"
  ],
  "workflows": {
    "ui": {
      "designTool": "figma",
      "responsive": true,
      "accessibility": true
    }
  }
}
```

### 4. 工作流系统

**工作流定义：**
```yaml
name: ui-restoration
description: 从设计稿还原 UI
version: 1.0.0

steps:
  - name: analyze-design
    action: parse-figma-url
    
  - name: generate-structure
    action: create-component-tree
    
  - name: apply-styles
    action: generate-tailwind-classes
    context: project.preferences.styling
    
  - name: add-interactions
    action: implement-event-handlers
    
  - name: test
    action: run-component-tests

memory:
  - save: execution-history
  - learn: user-preferences
  - evolve: if-pattern-detected
```

---

## 技术实现

### 架构设计

```
┌─────────────────────────────────────────┐
│           Claude Code / Codex           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Oh My Engine Core            │ │
│  │                                   │ │
│  │  ┌─────────────┐  ┌────────────┐ │ │
│  │  │   Memory    │  │  Evolution │ │ │
│  │  │   System    │  │   Engine   │ │ │
│  │  └─────────────┘  └────────────┘ │ │
│  │                                   │ │
│  │  ┌─────────────┐  ┌────────────┐ │ │
│  │  │  Workflow   │  │   Config   │ │ │
│  │  │   Engine    │  │   Manager  │ │ │
│  │  └─────────────┘  └────────────┘ │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
           │                    │
           ▼                    ▼
    ┌─────────────┐      ┌──────────────┐
    │  ~/.claude/ │      │ .oh-my-engine/│
    │  ~/.codex/  │      │  (project)    │
    └─────────────┘      └──────────────┘
```

### 核心模块

**1. Memory System（记忆系统）**
- 执行历史追踪
- 用户偏好学习
- 成功案例存储
- 失败案例分析

**2. Evolution Engine（进化引擎）**
- 模式识别算法
- 技能生成器
- 工作流优化器
- 规则提取器

**3. Workflow Engine（工作流引擎）**
- 工作流解析器
- 步骤执行器
- 上下文管理器
- 错误处理器

**4. Config Manager（配置管理器）**
- 项目配置加载
- 规则验证器
- 偏好合并器
- 环境检测器

---

## 安装和使用

### 快速安装

**方式 1：一键安装（推荐）**
```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**方式 2：指定 AI 代理**
```bash
# 安装到 Claude Code
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# 安装到 Codex
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# 同时安装到两者
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

**方式 3：手动安装**
```bash
git clone https://github.com/oh-my-engine/oh-my-engine.git
cd oh-my-engine
./install.sh
```

### 初始化项目

```bash
# 在你的项目目录中
cd your-project

# 在 Claude Code 或 Codex 中运行
/oh-my-engine-init
```

这会创建 `.oh-my-engine/` 目录并生成配置文件。

### 使用工作流

**UI 还原：**
```
/oh-my-engine-ui
```

**Bug 分析：**
```
/oh-my-engine-bug
```

**组件生成：**
```
/oh-my-engine-comp
```

**API 集成：**
```
/oh-my-engine-api
```

**查看记忆：**
```
/oh-my-engine-memory
```

**手动进化：**
```
/oh-my-engine-evolve
```

---

## 实际效果对比

### 开发效率提升

| 任务 | 传统方式 | 使用 Oh My Engine | 提升 |
|-----|---------|------------------|-----|
| UI 还原 | 2-3 小时 | 15-30 分钟 | **6x** |
| Bug 修复 | 30-60 分钟 | 5-10 分钟 | **6x** |
| 组件生成 | 20-40 分钟 | 3-5 分钟 | **8x** |
| API 集成 | 1-2 小时 | 10-20 分钟 | **6x** |

### 代码质量提升

- ✅ **一致性**：自动应用项目规则，代码风格统一
- ✅ **可维护性**：记住最佳实践，避免重复错误
- ✅ **可复用性**：自动提取通用模式，生成工具函数
- ✅ **可测试性**：工作流包含测试步骤，确保质量

### 学习曲线

```
传统 AI 助手：
  效率 ▲
      │     ╱────────  (平稳，但有上限)
      │   ╱
      │ ╱
      └──────────────► 时间

Oh My Engine：
  效率 ▲
      │           ╱
      │         ╱
      │       ╱  (持续进化)
      │     ╱
      │   ╱
      │ ╱
      └──────────────► 时间
```

---

## 进阶使用

### 自定义工作流

创建 `.oh-my-engine/workflows/my-workflow.yaml`：

```yaml
name: my-custom-workflow
description: 我的自定义工作流
version: 1.0.0

trigger:
  command: /my-workflow
  pattern: "当用户说.*自定义任务.*"

steps:
  - name: step-1
    description: 第一步
    action: |
      # 你的逻辑
      echo "执行第一步"
    
  - name: step-2
    description: 第二步
    action: |
      # 你的逻辑
      echo "执行第二步"
    depends_on: [step-1]

memory:
  save: true
  learn: true
  evolve: true
```

### 自定义规则

编辑 `.oh-my-engine/rules/coding-standards.md`：

```markdown
# 编码规范

## 组件规范
- 使用函数式组件
- 使用 TypeScript
- 组件名使用 PascalCase

## 样式规范
- 使用 Tailwind CSS
- 不使用内联样式
- 响应式优先

## API 规范
- 所有 API 调用必须有错误处理
- 使用 axios 而不是 fetch
- 超时时间设置为 10 秒
```

### 查看和管理记忆

```bash
# 查看执行历史
/oh-my-engine-memory --type history

# 查看学习内容
/oh-my-engine-memory --type learnings

# 查看用户偏好
/oh-my-engine-memory --type preferences

# 清除记忆
/oh-my-engine-memory --clear
```

### 手动触发进化

```bash
# 分析当前模式
/oh-my-engine-evolve --analyze

# 生成新技能
/oh-my-engine-evolve --generate

# 查看进化历史
/oh-my-engine-evolve --history
```

---

## 路线图

### v1.0（当前版本）
- ✅ 基础记忆系统
- ✅ 自我进化机制
- ✅ 项目配置
- ✅ 预置工作流
- ✅ Claude Code 和 Codex 支持

### v1.1（计划中）
- 🔄 云端记忆同步
- 🔄 团队协作功能
- 🔄 工作流市场
- 🔄 可视化配置界面

### v1.2（未来）
- 📋 更多预置工作流
- 📋 AI 驱动的工作流优化
- 📋 跨项目学习
- 📋 性能分析和优化建议

### v2.0（愿景）
- 💡 多 AI 代理协作
- 💡 自然语言工作流定义
- 💡 智能代码审查
- 💡 自动化测试生成

---

## 常见问题

### Q: Oh My Engine 会收集我的代码吗？
**A:** 不会。所有数据都存储在本地（`~/.claude/` 或 `~/.codex/` 和 `.oh-my-engine/`），不会上传到任何服务器。

### Q: 支持哪些编程语言？
**A:** 理论上支持所有语言，但预置工作流主要针对 Web 开发（React、Vue、Next.js 等）。你可以自定义工作流来支持其他语言。

### Q: 可以在团队中使用吗？
**A:** 可以。`.oh-my-engine/` 目录可以提交到 Git，团队成员共享配置和规则。但记忆系统是个人的（存储在 `~/.claude/` 或 `~/.codex/`）。

### Q: 如何卸载？
**A:** 删除 `~/.claude/skills/oh-my-engine/` 或 `~/.codex/skills/oh-my-engine/` 目录即可。

### Q: 进化生成的技能质量如何保证？
**A:** 进化引擎只在模式出现多次（≥5次）且成功率高（≥95%）时才生成技能。生成后你可以审查和修改。

### Q: 可以禁用自动进化吗？
**A:** 可以。在 `.oh-my-engine/config.json` 中设置 `"autoEvolve": false`。

### Q: 支持其他 AI 代理吗？
**A:** 目前支持 Claude Code 和 Codex。未来计划支持更多 AI 代理。

---

## 贡献指南

欢迎贡献！以下是一些贡献方向：

### 🎯 高优先级
- 新的预置工作流
- Bug 修复
- 文档改进
- 性能优化

### 💡 功能建议
- 更智能的模式识别算法
- 更多的进化策略
- 可视化配置界面
- 工作流调试工具

### 📝 如何贡献

1. Fork 仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 社区和支持

### 📢 讨论和反馈
- GitHub Discussions: https://github.com/oh-my-engine/oh-my-engine/discussions
- GitHub Issues: https://github.com/oh-my-engine/oh-my-engine/issues

### 📚 文档
- 完整文档: https://github.com/oh-my-engine/oh-my-engine
- 多语言支持: 英语、简体中文、日语、韩语、西班牙语、法语

### 🌟 关注项目
如果你觉得这个项目有用，请给个 Star ⭐️

---

## 结语

**Oh My Engine** 的目标是让 AI 编程助手不仅仅是一个工具，而是一个会学习、会记忆、会进化的智能伙伴。

它不会取代你的思考，但会记住你的偏好。
它不会替你做决策，但会学习你的模式。
它不会自动完成所有工作，但会让重复的工作自动化。

**让 AI 助手变得更智能，从 Oh My Engine 开始。**

---

## 快速开始

```bash
# 1. 安装
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash

# 2. 初始化项目
cd your-project
# 在 Claude Code 或 Codex 中运行
/oh-my-engine-init

# 3. 开始使用
/oh-my-engine-ui    # UI 还原
/oh-my-engine-bug   # Bug 分析
/oh-my-engine-comp  # 组件生成
/oh-my-engine-api   # API 集成
```

**GitHub:** https://github.com/oh-my-engine/oh-my-engine

**License:** MIT

---

*如果你喜欢这个项目，请给个 Star ⭐️ 并分享给更多开发者！*
