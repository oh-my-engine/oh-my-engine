# [开源] 别再让 AI 裸奔写代码了！OME 让你的 Claude Code / Cursor 自带记忆、会进化

---

兄弟们，我问你们一个问题：**你用 AI 写代码，是不是每次开新会话它都跟失忆了一样？**

上次说好的代码风格，忘了。上周定的项目规范，不记得。你反复强调"不要用 var"，下次照用不误。

**我受够了，所以我做了这个东西👇**

## Oh My Engine —— AI 编程工具的"外挂大脑"

> 一个让 Claude Code / Codex / Cursor / Trae / Windsurf 等 AI 工具**自带记忆、自我进化**的工作流引擎

一句话说白了：**它让 AI 记住你是谁、你的项目怎么搞、上次踩了什么坑，而且越用越聪明。**

`⭐ GitHub: https://github.com/oh-my-engine/oh-my-engine`

---

## 🔥 它到底能干嘛？

### 1. AI 终于有记忆了

`.ome/memory/` 里用 Markdown 记录所有执行历史和学习内容。跨会话、跨工具，你的偏好它都记得。

```
你：上次我们说了组件要用 functional components
AI：✅ 记住了，项目规范已记录到 .ome/rules/
（下次新会话）
AI：我看到项目规则要求使用 functional components，正在遵循...
```

> 📸 **[截图位置 1]**：展示 `ome memory view` 或 `.ome/memory/` 目录的截图

---

### 2. 一份规则，9+ 工具同步

你还在给 Claude Code 写 `CLAUDE.md`、给 Cursor 写 `.cursorrules`、给 Trae 写 rules……维护 N 份？

OME：**写一份，到处用。**

```bash
ome rules sync
# → 自动同步到 Claude Code、Codex、Cursor、Trae、Windsurf、Qoder、OpenCode、Antigravity
```

> 📸 **[截图位置 2]**：`ome rules sync` 执行过程截图，展示多个平台配置文件同时生成

---

### 3. 说人话就能触发专业工作流

不用记命令。直接跟 AI 说：

- 💬 "登录按钮点击没反应" → 自动走 `ome-bug` 分析流程
- 💬 "还原这个设计稿 [URL]" → 自动走 `ome-ui` 还原流程
- 💬 "生成一个 UserCard 组件" → 自动走 `ome-comp` 组件生成流程
- 💬 "集成用户登录 API" → 自动走 `ome-api` 集成流程

**AI 自动识别你的意图，调用对应的工作流。你甚至不知道它在用 OME。**

> 📸 **[截图位置 3]**：在 Claude Code / Cursor 里说一句话自动触发 ome-bug 的效果截图

---

### 4. Spec 模式：从需求到交付的完整闭环

```bash
ome spec propose user-auth    # 提案
ome spec plan user-auth       # 计划
ome spec apply user-auth      # 执行
ome spec verify user-auth     # 验证
ome spec archive user-auth    # 归档
```

需求文档、设计方案、任务拆解、验收标准、变更历史——**全在一个地方，AI 随时可读。**

> 📸 **[截图位置 4]**：`ome spec status` 或 openspec 目录结构截图

---

### 5. 自我进化：越用越懂你

OME 会分析你的历史执行模式，自动学习：

- 哪些规则被反复触发 → 固化为永久规则
- 哪些工作流效果好 → 提升优先级
- 你的代码风格偏好 → 生成个性化技能

```bash
ome evolve analyze    # 分析进化候选
ome evolve review     # 审查待批准的改进
ome evolve stats      # 查看效果统计
```

> 📸 **[截图位置 5]**：`ome evolve stats` 或进化分析结果截图

---

## 🚀 30 秒上手

```bash
npm install -g oh-my-engine
cd your-project
ome init
ome init-rules
ome doctor
```

完事。AI 已经有记忆了。

---

## 🏗️ 架构长这样

```
project/
├── .ome/
│   ├── config.json        # 项目配置
│   ├── rules/             # 规则（git 提交，多工具共享）
│   └── memory/            # 记忆（git 忽略，你的私有数据）
├── openspec/
│   ├── changes/           # 进行中的变更
│   ├── specs/             # 稳定能力规范
│   └── archive/           # 已完成变更
├── CLAUDE.md              # 自动生成
├── AGENTS.md              # 自动生成
└── .cursor/rules/         # 自动生成
```

> 📸 **[截图位置 6]**：项目目录结构 + .ome 内部结构截图

---

## 🛠️ 支持的工具

| 工具 | 支持方式 |
|------|---------|
| Claude Code | Skills + `/ome-*` 命令 |
| Codex | Skills + `ome-*` 命令 |
| Cursor | 生成 `.cursor/rules/` |
| Trae | 生成 `.trae/rules/` |
| Windsurf | 生成 `.windsurfrules` |
| Qoder | 生成 rules |
| OpenCode | 生成 rules |
| Antigravity | 生成 rules |

---

## 📦 技术栈

- **TypeScript** 驱动，Node.js >= 22
- **MIT 协议**，随便用
- npm 全局安装或源码构建都行

---

## 🔗 链接

- **GitHub:** https://github.com/oh-my-engine/oh-my-engine
- **npm:** `npm install -g oh-my-engine`
- **文档:** 仓库 `docs/` 目录
- **安装指南:** [INSTALL_WITH_AI.md](https://github.com/oh-my-engine/oh-my-engine/blob/main/INSTALL_WITH_AI.md)（复制提示词给 AI，它帮你装）

---

**如果这个项目对你有帮助，点个 star ⭐ 就是最大的支持。**

有问题、建议、想贡献，直接帖子里聊，我一直在 👋
