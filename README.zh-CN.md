# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> 一个具有记忆和学习能力的自我进化工作流引擎，专为 Claude Code 和 Codex 设计

Oh My Engine 是一个强大的框架，可以将 Claude Code 和 Codex 转变为智能工作流系统。它能从你的使用模式中学习，记住你的偏好，并自动进化创建定制化工作流。

## ✨ 特性

- **🧠 记忆系统**：记住执行历史、学习内容和用户偏好
- **🔄 自我进化**：自动识别模式并生成新的技能
- **⚙️ 项目配置**：通过 `.oh-my-engine/` 实现项目级工作流定制
- **📋 丰富的工作流**：预置 UI 还原、Bug 分析、组件生成和 API 集成等工作流
- **🎯 智能上下文**：自动加载项目特定的规则和配置
- **🔧 可扩展**：轻松创建满足特定需求的自定义工作流

## 🚀 快速开始

### 安装

#### 方式 1：快速安装（推荐）

一条命令安装所有内容：

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

或使用 wget：

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**为特定代理安装：**

```bash
# 仅为 Claude Code 安装
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# 仅为 Codex 安装
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# 为两者安装
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

#### 方式 2：克隆并安装

```bash
# 克隆仓库
git clone https://github.com/oh-my-engine/oh-my-engine.git

# 运行安装脚本
cd oh-my-engine
chmod +x install.sh

# 自动检测代理
./install.sh

# 或指定代理
./install.sh --agent claude   # 仅 Claude Code
./install.sh --agent codex    # 仅 Codex
./install.sh --agent both     # 两者
```

#### 方式 3：使用 AI 安装

复制 [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) 中的安装提示词，粘贴给任何 AI 助手（Claude、ChatGPT 等），AI 会引导你完成安装。

安装程序会将所有技能复制到 `~/.claude/skills/` 和/或 `~/.codex/skills/`。

Claude Code 可直接用 slash command 调用这些工作流。
Codex 应按技能名触发，不要默认认为 `/oh-my-engine-*` 这类 slash command 在 Codex 中可用。

### 初始化项目

在你的项目目录中：

```bash
oh-my-engine-init
```

这会创建一个 `.oh-my-engine/` 目录，包含：
- `config.json` - 工作流配置
- `rules/` - 项目特定规则
- `memory/` - 执行历史和学习内容（git 忽略）

### 可用命令

- Claude Code：`/oh-my-engine-init`、`/oh-my-engine-ui`、`/oh-my-engine-bug`、`/oh-my-engine-comp`、`/oh-my-engine-api`、`/oh-my-engine-memory`、`/oh-my-engine-evolve`
- Codex 技能名：`oh-my-engine-init`、`oh-my-engine-ui`、`oh-my-engine-bug`、`oh-my-engine-comp`、`oh-my-engine-api`、`oh-my-engine-memory`、`oh-my-engine-evolve`

## 📖 文档

- [架构概览](docs/architecture.md)
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
├── oh-my-engine-memory/   # 记忆查看器
└── oh-my-engine-evolve/   # 进化分析器

project/
└── .oh-my-engine/         # 项目特定配置
    ├── config.json        # 工作流设置
    ├── rules/             # 项目规则（提交到 git）
    └── memory/            # 执行历史（git 忽略）
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

**注意**：Oh My Engine 需要 Claude Code 或 Codex 才能运行。使用此框架前请确保已安装并配置至少其中一个。
