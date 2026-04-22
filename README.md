# Oh My Engine

> A self-evolving workflow engine with memory and learning capabilities for Claude Code

Oh My Engine is a powerful framework that transforms Claude Code into an intelligent workflow system. It learns from your patterns, remembers your preferences, and evolves to create custom workflows automatically.

## ✨ Features

- **🧠 Memory System**: Remembers execution history, learnings, and user preferences
- **🔄 Self-Evolution**: Automatically identifies patterns and generates new skills
- **⚙️ Project Configuration**: Per-project workflow customization with `.oh-my-engine/`
- **📋 Rich Workflows**: Pre-built workflows for UI restoration, bug analysis, component generation, and API integration
- **🎯 Smart Context**: Loads project-specific rules and configurations automatically
- **🔧 Extensible**: Easy to create custom workflows for your specific needs

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/oh-my-engine.git

# Run the installation script
cd oh-my-engine
chmod +x install.sh
./install.sh
```

The installer will copy all skills to `~/.claude/skills/` and make them available globally in Claude Code.

### Initialize a Project

In your project directory:

```bash
/oh-my-engine-init
```

This creates a `.oh-my-engine/` directory with:
- `config.json` - Workflow configurations
- `rules/` - Project-specific rules
- `memory/` - Execution history and learnings (git-ignored)

### Available Commands

- `/oh-my-engine-init` - Initialize Oh My Engine in current project
- `/oh-my-engine-ui` - Restore UI from design files or screenshots
- `/oh-my-engine-bug` - Analyze and fix bugs with context
- `/oh-my-engine-comp` - Generate components from specifications
- `/oh-my-engine-api` - Integrate APIs with proper error handling
- `/oh-my-engine-memory` - View execution history and learnings
- `/oh-my-engine-evolve` - Analyze patterns and suggest new workflows

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
~/.claude/skills/           # Global skills (installed by install.sh)
├── oh-my-engine/          # Core framework
├── oh-my-engine-init/     # Project initialization
├── oh-my-engine-ui/       # UI restoration workflow
├── oh-my-engine-bug/      # Bug analysis workflow
├── oh-my-engine-comp/     # Component generation workflow
├── oh-my-engine-api/      # API integration workflow
├── oh-my-engine-memory/   # Memory viewer
└── oh-my-engine-evolve/   # Evolution analyzer

project/
└── .oh-my-engine/         # Project-specific configuration
    ├── config.json        # Workflow settings
    ├── rules/             # Project rules (committed to git)
    └── memory/            # Execution history (git-ignored)
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

Built for [Claude Code](https://claude.ai/code) by Anthropic.

---

**Note**: Oh My Engine requires Claude Code to function. Make sure you have Claude Code installed and configured before using this framework.
