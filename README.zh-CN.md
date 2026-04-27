# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> 一个 TypeScript 驱动、可跨 Claude Code / Codex / Trae / Cursor / Windsurf 等工具使用的自我进化工作流引擎

Oh My Engine 以 `ome` CLI 为核心，提供项目初始化、规则同步、Spec 流程、记忆、进化分析和工作流指导能力。Claude Code / Codex 可以通过 skills 使用，Trae / Cursor / Windsurf / OpenCode / Qoder / Antigravity 等工具通过生成的规则文件使用。

## ✨ 特性

- **🧠 记忆系统**：记住执行历史、学习内容和用户偏好
- **🔄 自我进化**：自动识别模式并生成新的技能
- **⚙️ 项目配置**：通过 `.oh-my-engine/` 实现项目级工作流定制
- **📋 丰富的工作流**：预置 UI 还原、Bug 分析、组件生成和 API 集成等工作流
- **📝 Spec 模式**：提供兼容 OpenSpec 的提案、计划、执行、验证和归档流程
- **🎯 智能上下文**：自动加载项目特定的规则和配置
- **🔧 可扩展**：轻松创建满足特定需求的自定义工作流
- **🌐 多工具适配**：通过 `ome rules sync` 同步到 Claude Code、Codex、Trae、Cursor、Windsurf 等工具

## 🚀 快速开始

### 安装

#### 方式 1：npm 安装 CLI（推荐）

安装 TypeScript 驱动的 `ome` 命令：

```bash
npm install -g oh-my-engine
ome --help
```

然后在任意项目中初始化：

```bash
cd your-project
ome init
ome doctor
ome rules sync
```

#### 方式 2：从 GitHub 安装

```bash
git clone https://github.com/oh-my-engine/oh-my-engine.git
cd oh-my-engine
npm install
npm run build
npm link
ome --help
```

#### 方式 3：安装 Claude Code / Codex Skills

`ome` CLI 可以在任何终端使用。只有当你希望在 Claude Code 使用 slash command，或在 Codex 按 skill 名调用时，才需要安装 skills：

```bash
./install.sh
./install.sh --agent claude   # 仅 Claude Code
./install.sh --agent codex    # 仅 Codex
./install.sh --agent both     # 两者
```

GitHub 一行安装 skills：

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

注意：`quick-install.sh` 只复制 skills；CLI 请通过 npm 或 `npm link` 安装。

#### 方式 4：使用 AI 安装

复制 [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) 中的安装提示词，粘贴给任何 AI 助手（Claude、ChatGPT 等），AI 会引导你完成安装。

完整安装和多工具使用说明见：[docs/installation-and-usage.md](docs/installation-and-usage.md)。

### 初始化项目

在你的项目目录中：

```bash
ome init
ome doctor
ome rules sync
```

这会创建一个 `.oh-my-engine/` 目录，包含：
- `config.json` - 工作流配置
- `rules/` - 项目特定规则
- `memory/` - 执行历史和学习内容（git 忽略）

同时还会创建一个 `openspec/` 工作区，用于长期规范和活跃变更：
- `project.md` - 项目级上下文
- `changes/` - 进行中的变更
- `specs/` - 稳定能力规范
- `archive/` - 已完成变更

### 可用命令

- Claude Code：`/oh-my-engine-init`、`/oh-my-engine-ui`、`/oh-my-engine-bug`、`/oh-my-engine-comp`、`/oh-my-engine-api`、`/oh-my-engine-spec`、`/oh-my-engine-memory`、`/oh-my-engine-evolve`
- Codex 技能名：`oh-my-engine-init`、`oh-my-engine-ui`、`oh-my-engine-bug`、`oh-my-engine-comp`、`oh-my-engine-api`、`oh-my-engine-spec`、`oh-my-engine-memory`、`oh-my-engine-evolve`
- Trae / Cursor / Windsurf / OpenCode / Qoder / Antigravity：在项目中运行 `ome rules sync <platform>`，由工具读取生成的规则文件

### Spec 工作流

```bash
# 初始化 spec 工作区
ome spec init

# 导入 PRD、提示词和附件
ome spec import user-authentication --source-file docs/prd.md

# 基于导入上下文准备 proposal/design/tasks/spec delta
ome spec decompose user-authentication

# 仍可使用手工 scaffold 路径
ome spec propose user-authentication

# 细化和加载执行上下文
ome spec plan user-authentication
ome spec apply user-authentication
ome spec apply user-authentication --task "Implement the change"
ome spec status user-authentication

# 验证和归档变更
ome spec verify user-authentication
ome spec archive user-authentication
```

`import` 会把归一化后的来源文本、提示词、追踪信息和附件复制到 `openspec/changes/<change-id>/context/`。`decompose` 会基于这些 intake artifacts 准备 `analysis.md`、`proposal.md`、`design.md`、`tasks.md` 和 spec delta，并保留来源引用。`apply` 会更新生命周期状态，也可以回写任务和验收项进度，并输出应加载的上下文文件，但不会自动生成业务代码。`status` 用于查看当前 phase 和剩余待办。`archive` 现在会在首次接受时创建长期 capability spec，并基于已接受 delta 重建 canonical summary/requirements/compatibility，同时保留当前接受快照和归档历史。
你可以在 `.oh-my-engine/config.json` 的 `workflows.spec.options.verifyCommands` 中配置真实校验命令；`verify` 会按顺序执行，遇到首个非零退出码就失败。`verify` 还会阻止未替换的 `TBD:` 模板标记，并要求每个 spec delta 必须且只能选中一种 change type，且写出至少一条具体 requirement 和 WHEN/THEN 场景。

## 📖 文档

- [架构概览](docs/architecture.md)
- [安装和多工具使用](docs/installation-and-usage.md)
- [提示词驱动 Spec Intake 架构](docs/spec-intake-architecture.md)
- [创建自定义工作流](docs/custom-workflows.md)
- [配置指南](docs/configuration.md)
- [记忆系统](docs/memory-system.md)
- [进化机制](docs/evolution.md)

## 🎯 示例

### React Native 项目

查看 [examples/react-native](examples/react-native) 获取完整配置示例，包括：
- 多语言支持的 i18n 规则
- 主题系统集成
- 设计令牌
- 代码风格指南

### 自定义工作流

```markdown
---
name: oh-my-engine-deploy
description: 带预检查的应用部署
---

# 部署工作流

## 上下文加载
1. 加载 `.oh-my-engine/config.json`
2. 检查部署配置
3. 验证环境变量

## 预检查
- 运行测试
- 检查构建状态
- 验证依赖

## 部署
- 构建生产包
- 部署到配置的环境
- 更新部署日志

## 部署后
- 保存执行到记忆
- 更新学习内容
```

## 🏗️ 架构

```
~/.claude/skills/           # 全局技能（由 install.sh 安装）
├── oh-my-engine/          # 核心框架
├── oh-my-engine-init/     # 项目初始化
├── oh-my-engine-ui/       # UI 还原工作流
├── oh-my-engine-bug/      # Bug 分析工作流
├── oh-my-engine-comp/     # 组件生成工作流
├── oh-my-engine-api/      # API 集成工作流
├── oh-my-engine-spec/     # 兼容 OpenSpec 的规范工作流
├── oh-my-engine-memory/   # 记忆查看器
└── oh-my-engine-evolve/   # 进化分析器

project/
├── .oh-my-engine/         # 项目特定配置和记忆
│   ├── config.json        # 工作流设置
│   ├── rules/             # 项目规则（提交到 git）
│   └── memory/            # 执行历史（git 忽略）
└── openspec/              # 兼容 OpenSpec 的工作区
    ├── project.md         # 项目上下文
    ├── changes/           # 进行中的变更
    │   └── <change-id>/context/  # 导入的 PRD、提示词、分析、引用和附件
    ├── specs/             # 稳定能力规范
    └── archive/           # 已完成变更
```

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建特性分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 开启 Pull Request

## 📝 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

为 Anthropic 的 [Claude Code](https://claude.ai/code) 和 [Codex](https://codex.dev) 构建。

---

**注意**：`ome` CLI 可在任何终端运行。Claude Code 和 Codex skills 是可选的原生入口；其他工具通过 `ome rules sync` 生成的规则文件使用。
