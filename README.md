# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> A self-evolving workflow engine with memory and learning capabilities for Claude Code and Codex

Oh My Engine is a powerful framework that transforms Claude Code and Codex into intelligent workflow systems. It learns from your patterns, remembers your preferences, and evolves to create custom workflows automatically.

## ✨ Features

- **🧠 Memory System**: Remembers execution history, learnings, and user preferences
- **🔄 Self-Evolution**: Automatically identifies patterns and generates new skills
- **⚙️ Project Configuration**: Per-project workflow customization with `.oh-my-engine/`
- **📋 Rich Workflows**: Pre-built workflows for UI restoration, bug analysis, component generation, and API integration
- **📝 Spec Mode**: OpenSpec-compatible proposal, planning, apply, verify, and archive workflow
- **🎯 Smart Context**: Loads project-specific rules and configurations automatically
- **🔧 Extensible**: Easy to create custom workflows for your specific needs

## 🚀 Quick Start

### Installation

#### Method 1: Quick Install (Recommended)

One command to install everything:

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

Or with wget:

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**Install for specific agent:**

```bash
# For Claude Code only
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# For Codex only
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# For both
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

#### Method 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/oh-my-engine/oh-my-engine.git

# Run the installation script
cd oh-my-engine
chmod +x install.sh

# Auto-detect agent
./install.sh

# Or specify agent
./install.sh --agent claude   # Claude Code only
./install.sh --agent codex    # Codex only
./install.sh --agent both     # Both agents
```

#### Method 3: Install with AI

Copy the installation prompt from [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) and paste it to any AI assistant (Claude, ChatGPT, etc.), and the AI will guide you through the installation.

The installer will copy all skills to `~/.claude/skills/` and/or `~/.codex/skills/`.

Claude Code users can invoke the installed workflows as slash commands.
Codex users should invoke the installed skills by name; the exact trigger format depends on the Codex client, so do not assume `/oh-my-engine-*` slash commands are available there.

### Initialize a Project

In your project directory:

**Claude Code:**
```bash
/oh-my-engine-init
```

**Codex:**
```bash
oh-my-engine-init
```

This creates a `.oh-my-engine/` directory with:
- `config.json` - Workflow configurations
- `rules/` - Project-specific rules
- `memory/` - Execution history and learnings (git-ignored)

It also creates an `openspec/` workspace for long-lived specs and active changes:
- `project.md` - Project-level context
- `changes/` - In-progress changes
- `specs/` - Stable capability specs
- `archive/` - Completed changes

### Available Commands

- Claude Code: `/oh-my-engine-init`, `/oh-my-engine-ui`, `/oh-my-engine-bug`, `/oh-my-engine-comp`, `/oh-my-engine-api`, `/oh-my-engine-spec`, `/oh-my-engine-memory`, `/oh-my-engine-evolve`
- Codex skill names: `oh-my-engine-init`, `oh-my-engine-ui`, `oh-my-engine-bug`, `oh-my-engine-comp`, `oh-my-engine-api`, `oh-my-engine-spec`, `oh-my-engine-memory`, `oh-my-engine-evolve`

### Spec Workflow

```bash
# Initialize the spec workspace
oh-my-engine-spec init

# Create a change proposal
oh-my-engine-spec propose user-authentication

# Refine and load execution context
oh-my-engine-spec plan user-authentication
oh-my-engine-spec apply user-authentication
oh-my-engine-spec apply user-authentication --task "Implement the change"
oh-my-engine-spec status user-authentication

# Verify and archive a change
oh-my-engine-spec verify user-authentication
oh-my-engine-spec archive user-authentication
```

`apply` updates lifecycle state, can mark task and acceptance progress, and prints the files the agent should load. It does not generate production code automatically. `status` summarizes the current phase and remaining checklist items. `archive` now updates both the current accepted snapshot and archived history in the long-lived capability spec.
You can add real project checks under `workflows.spec.options.verifyCommands` in `.oh-my-engine/config.json`; `verify` runs them sequentially and fails on the first non-zero exit.

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [Creating Custom Workflows](docs/custom-workflows.md)
- [Configuration Guide](docs/configuration.md)
- [Memory System](docs/memory-system.md)
- [Evolution Mechanism](docs/evolution.md)

## 🎯 Examples

### React Native Project

See [examples/react-native](examples/react-native) for a complete configuration example including:
- i18n rules for multi-language support
- Theme system integration
- Design tokens
- Code style guidelines

### Custom Workflow

```markdown
---
name: oh-my-engine-deploy
description: Deploy application with pre-flight checks
---

# Deploy Workflow

## Context Loading
1. Load `.oh-my-engine/config.json`
2. Check deployment configuration
3. Verify environment variables

## Pre-flight Checks
- Run tests
- Check build status
- Verify dependencies

## Deployment
- Build production bundle
- Deploy to configured environment
- Update deployment logs

## Post-deployment
- Save execution to memory
- Update learnings
```

## 🏗️ Architecture

```
~/.claude/skills/           # Claude Code skills
~/.codex/skills/            # Codex skills
├── oh-my-engine/          # Core framework
├── oh-my-engine-init/     # Project initialization
├── oh-my-engine-ui/       # UI restoration workflow
├── oh-my-engine-bug/      # Bug analysis workflow
├── oh-my-engine-comp/     # Component generation workflow
├── oh-my-engine-api/      # API integration workflow
├── oh-my-engine-spec/     # OpenSpec-compatible spec workflow
├── oh-my-engine-memory/   # Memory viewer
└── oh-my-engine-evolve/   # Evolution analyzer

project/
├── .oh-my-engine/         # Project-specific configuration and memory
│   ├── config.json        # Workflow settings
│   ├── rules/             # Project rules (committed to git)
│   └── memory/            # Execution history (git-ignored)
└── openspec/              # OpenSpec-compatible workspace
    ├── project.md         # Project context
    ├── changes/           # In-progress changes
    ├── specs/             # Stable capability specs
    └── archive/           # Completed changes
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built for [Claude Code](https://claude.ai/code) by Anthropic and [Codex](https://codex.dev).

---

**Note**: Oh My Engine requires Claude Code or Codex to function. Make sure you have at least one of them installed and configured before using this framework.
