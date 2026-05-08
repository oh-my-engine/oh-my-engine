# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> A self-evolving workflow engine with memory and learning capabilities for Claude Code and Codex

Oh My Engine is a powerful framework that transforms Claude Code and Codex into intelligent workflow systems. It learns from your patterns, remembers your preferences, and evolves to create custom workflows automatically.

## ✨ Features

- **🧠 Memory System**: Remembers execution history, learnings, and user preferences in human-readable Markdown format
- **🔄 Self-Evolution**: Automatically learns from patterns, generates rules and skills, and intelligently decides when to apply improvements
- **🤖 Auto-Detection**: AI agents automatically recognize task types and invoke the right OME commands without manual prompting
- **⚙️ Project Configuration**: Per-project workflow customization with `.ome/`
- **📋 Rich Workflows**: Pre-built workflows for UI restoration, bug analysis, component generation, and API integration
- **📝 Spec Mode**: OpenSpec-compatible proposal, planning, apply, verify, and archive workflow
- **🎯 Smart Context**: Loads project-specific rules and configurations automatically
- **🔧 Extensible**: Easy to create custom workflows for your specific needs
- **🌐 Cross-Platform Rules**: Single source of truth for rules, auto-sync to 9+ AI platforms (Claude Code, Cursor, Trae, Agents, etc.) - [Learn more](docs/CROSS_PLATFORM_RULES.md)

## 🚀 Quick Start

### Requirements

- Node.js >= 22
- npm >= 10

### Installation

#### Method 1: npm CLI Install (Recommended)

Install the TypeScript-driven `ome` CLI:

```bash
npm install -g oh-my-engine
ome --help
ome agents list
```

Then initialize any project:

```bash
cd your-project
ome init
ome init-rules
ome doctor
```

#### Method 2: GitHub Install

```bash
git clone https://github.com/oh-my-engine/oh-my-engine.git
cd oh-my-engine
npm install
npm run build
npm link
ome --help
```

#### Method 3: Install Global Agent Commands

The CLI works everywhere. Install global Agent commands when you want native `/ome-*` or `ome-*` entries:

```bash
ome agents install          # interactive, default all supported agents
ome agents install --all    # non-interactive all
ome agents doctor
```

This installs the same workflow set into every supported Agent editor: Claude Code, Codex, Cursor, Trae, Windsurf, Qoder, OpenCode, and Antigravity. The installed set includes `ome-init-rules` and `ome-superpowers`.

Install Superpowers bridge wrappers for all supported editors:

```bash
ome superpowers install all
ome superpowers doctor all
```

Initialize and sync design-tool MCP configuration from a single project source:

```bash
ome mcp init --all
ome mcp sync
ome mcp doctor
```

`ome mcp init` creates `.ome/mcp/source.json` and `.ome/mcp/README.md`. `ome mcp sync` expands that source into editor-specific MCP config files such as `.mcp.json`, `.cursor/mcp.json`, `opencode.json`, `~/.codex/config.toml`, and Windsurf `mcp_config.json`. Tokens stay in environment variables like `FIGMA_API_KEY` and `MG_MCP_TOKEN`.

Legacy GitHub skill installers still exist for deprecated `/oh-my-engine-*` compatibility:

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

The quick installer copies skills only. Install the CLI with npm or `npm link`.

#### Method 4: Install with AI

Copy the installation prompt from [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) and paste it to any AI assistant (Claude, ChatGPT, etc.), and the AI will guide you through the installation.

Detailed install and multi-tool usage: [docs/installation-and-usage.md](docs/installation-and-usage.md).

Claude Code users can invoke installed workflows as `/ome-bug`, `/ome-spec`, etc.
Codex users can invoke installed skills by name such as `ome-bug`; clients that support `$skill` can use `$ome-bug`.

### Initialize a Project

In your project directory:

```bash
ome init
ome init-rules
```

Agent-specific legacy commands such as `/oh-my-engine-init` remain available only for compatibility. New commands use `ome-*`.

This creates a `.ome/` directory with:
- `context/project-scan.json` - A deterministic local scan of the project codebase
- `context/rules-generation-prompt.md` - Agent instructions for personalizing rules from current source code
- `rules/` - Project-specific rules (single source of truth, auto-syncs to all platforms)
- `memory/` - Execution history and learnings in Markdown format (git-ignored, human-readable)

It also generates **agent integration files** at the project root:
- **Single-file platforms**: `CLAUDE.md`, `AGENTS.md`, `.windsurfrules`, `GEMINI.md`
- **Multi-file platforms**: `.cursor/rules/00-ome-auto-detection.mdc`, `.trae/rules/00-ome-auto-detection.md`, etc.

**🎯 Auto-Detection Feature**: These files teach **all 8 supported AI agents** when to automatically use OME commands:
- User: "登录按钮点击没反应" → Agent automatically uses `/ome-bug` or `ome-bug`
- User: "还原这个设计稿 [URL]" → Agent automatically uses `/ome-ui` or `ome-ui`
- User: "集成用户登录 API" → Agent automatically uses `/ome-api` or `ome-api`

No need to manually type `/ome-bug` or `/ome-ui` — **every supported agent** (Claude Code, Codex, Cursor, Trae, Windsurf, Qoder, OpenCode, Antigravity) recognizes task types and invokes the right workflow automatically. Command syntax adapts to each platform's style.

The generated rule set is dynamic. `ome init-rules` scans the repository and creates rule files that match detected code, frameworks, build tools, routes, templates, styles, configs, tests, and deployment signals instead of forcing a fixed four-file template.

`ome init` also installs project-local Agent workflow entries such as `.claude/commands/`, `.cursor/commands/`, `.qoder/commands/`, `.opencode/command/`, `.windsurf/workflows/`, and `.agent/workflows/` so the initialized rules are reachable from each editor inside the repository.

It also creates an `openspec/` workspace for long-lived specs and active changes:
- `project.md` - Project-level context
- `changes/` - In-progress changes
- `specs/` - Stable capability specs
- `archive/` - Completed changes


### TypeScript-Driven Development

Oh My Engine is now TypeScript-driven. Edit source files under `src/`, then run:

```bash
npm run build
npm test
```

Runtime JavaScript is emitted only under ignored `dist/`. Repository scripts, tests, and engine code are authored from `src/**/*.ts`.

### Unified CLI

```bash
# Check the current project
ome doctor

# Install global Agent commands
ome agents install
ome agents doctor

# Render workflow guidance
ome bug "Login button click does nothing"
ome-bug "Login button click does nothing"

# Validate and sync rules
ome rules validate
ome rules init
ome init-rules
ome rules preview codex
ome rules sync

# Install Superpowers bridge wrappers
ome superpowers install all
ome superpowers doctor all

# Initialize and sync MCP config from .ome/mcp/source.json
ome mcp init --all
ome mcp sync
ome mcp doctor
```

Rules sync is implemented in `src/core/rules.ts`; use `ome rules sync` instead of removed compatibility entrypoints.

```bash
# Run TypeScript-backed spec workflow commands
ome spec init
ome spec propose user-authentication
ome spec plan user-authentication
ome spec apply user-authentication
ome spec status user-authentication

# Verify and archive are TypeScript-backed too
ome spec verify user-authentication
ome spec archive user-authentication

# Inspect memory and evolution system
ome memory view --format json
ome evolve analyze --format json
ome evolve review  # View candidates pending approval
ome evolve stats   # View effectiveness statistics

# Render workflow guidance with adopted learnings and generated skill directives
ome guidance bug-analysis --input "Login button click does nothing"
ome guidance ui-restore --input "https://mastergo.com/goto/demo"
ome guidance component-gen --input "UserCard"
ome guidance api-integration --input "./specs/user-api.yaml"

# List platform adapters
ome adapters list
```

Platform adapters live under `src/adapters/platforms/` and expose detection metadata plus rule/skill capabilities through the adapter registry.

Generated artifact policy is documented in `docs/generated-artifacts.md`.

Packaging is guarded by `npm run verify` and `prepack`, which run typecheck, clean build, and the full test suite before publishing. On Windows, if `npm run verify` fails on the Unix `rm -rf dist` clean step, use:

```powershell
Remove-Item -LiteralPath dist -Recurse -Force -ErrorAction SilentlyContinue
.\node_modules\.bin\tsc.cmd -p tsconfig.json
node dist\scripts\restore-shebangs.js
node --test dist\tests\*.test.js
npm publish
```

Recommended release flow:

```bash
npm run verify
npm pack --dry-run
npm version patch
npm publish
```

This publishes the `ome` CLI and all packaged command bins, including `ome-mcp`.

### Framework API

The package also exposes a typed CommonJS API for tools that embed Oh My Engine instead of shelling out to the CLI:

```js
const {
  initializeProject,
  listAdapterManifests,
  previewAdapterSync,
  renderWorkflowCommand,
  validateJsonFile
} = require('oh-my-engine');
```

See [docs/framework-api.md](docs/framework-api.md) for the public API surface, adapter dry-run behavior, and schema validation notes.

### Available Commands

#### Lifecycle Workflows

Oh My Engine now provides structured lifecycle workflows that guide you through the complete software development process:

- `ome define` - Clarify requirements, boundaries, and success criteria
- `ome plan` - Form implementation plans, interface changes, and test strategies
- `ome build` - Guide or execute implementation with incremental verification
- `ome test` - Design tests, run regression checks, and diagnose failures
- `ome review` - Code review across correctness, security, performance, and architecture
- `ome ship` - Pre-delivery checks, change summary, and commit preparation

These lifecycle commands work alongside existing workflow-specific commands and enforce structured execution discipline with verification requirements, red flags, and anti-rationalization checks.

See [docs/lifecycle-workflows.md](docs/lifecycle-workflows.md) and [docs/skill-anatomy.md](docs/skill-anatomy.md) for details.

#### All Commands

- Terminal: `ome`, `ome-init`, `ome-init-rules`, `ome-bug`, `ome-ui`, `ome-comp`, `ome-api`, `ome-spec`, `ome-memory`, `ome-evolve`, `ome-superpowers`, `ome-mcp`, `ome-define`, `ome-plan`, `ome-build`, `ome-test`, `ome-review`, `ome-ship`
- Claude Code: `/ome-init`, `/ome-init-rules`, `/ome-bug`, `/ome-ui`, `/ome-comp`, `/ome-api`, `/ome-spec`, `/ome-memory`, `/ome-evolve`, `/ome-superpowers`, `/ome-mcp`, `/ome-define`, `/ome-plan`, `/ome-build`, `/ome-test`, `/ome-review`, `/ome-ship`
- Codex skill names: `ome-init`, `ome-init-rules`, `ome-bug`, `ome-ui`, `ome-comp`, `ome-api`, `ome-spec`, `ome-memory`, `ome-evolve`, `ome-superpowers`, `ome-mcp`, `ome-define`, `ome-plan`, `ome-build`, `ome-test`, `ome-review`, `ome-ship`
- Cursor, Trae, Windsurf, Qoder, OpenCode, and Antigravity receive the same workflow set through `ome agents install --all`.
- `ome init` generates project rules for each tool, and `ome init-rules` refreshes scan context plus local rule drafts before an Agent editor rewrites `.ome/rules/*.md`.

### Spec Workflow

```bash
# Initialize the spec workspace
ome spec init

# Import PRD inputs and operator intent
ome spec import user-authentication --source-file docs/prd.md

# Prepare proposal/design/tasks/spec delta from the imported context
ome spec decompose user-authentication

# Manual scaffold path remains available
ome spec propose user-authentication

# Refine and load execution context
ome spec plan user-authentication
ome spec apply user-authentication
ome spec apply user-authentication --task "Implement the change"
ome spec status user-authentication

# Verify and archive a change
ome spec verify user-authentication
ome spec archive user-authentication
```

`import` persists normalized source text, prompt input, provenance, and copied attachments under `openspec/changes/<change-id>/context/`. `decompose` turns that intake context into `analysis.md`, `proposal.md`, `design.md`, `tasks.md`, and spec deltas while keeping source references attached to the change. `apply` updates lifecycle state, can mark task and acceptance progress, and prints the files the agent should load. It does not generate production code automatically. `status` summarizes the current phase and remaining checklist items. `archive` now creates the long-lived capability spec on first acceptance, rebuilds canonical summary/requirements/compatibility sections from accepted deltas, and keeps both the current accepted snapshot and archived history.
You can add real project checks under `workflows.spec.options.verifyCommands` in `.ome/config.json`; `verify` runs them sequentially and fails on the first non-zero exit. `verify` also blocks unresolved `TBD:` template markers and requires each spec delta to select exactly one change type plus at least one concrete requirement and WHEN/THEN scenario.

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [Installation and Multi-Tool Usage](docs/installation-and-usage.md)
- [Prompt-Driven Spec Intake Architecture](docs/spec-intake-architecture.md)
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
name: ome-deploy
description: Deploy application with pre-flight checks
---

# Deploy Workflow

## Context Loading
1. Load `.ome/config.json`
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
├── ome-init/              # Project initialization
├── ome-ui/                # UI restoration workflow
├── ome-bug/               # Bug analysis workflow
├── ome-comp/              # Component generation workflow
├── ome-api/               # API integration workflow
├── ome-spec/              # OpenSpec-compatible spec workflow
├── ome-memory/            # Memory viewer
└── ome-evolve/            # Evolution analyzer

project/
├── .ome/                  # Project-specific configuration and memory
│   ├── config.json        # Workflow settings
│   ├── rules/             # Project rules (committed to git)
│   └── memory/            # Execution history (git-ignored)
└── openspec/              # OpenSpec-compatible workspace
    ├── project.md         # Project context
    ├── changes/           # In-progress changes
    │   └── <change-id>/context/  # Imported PRD, prompt, analysis, references, assets
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

**Note**: The `ome` CLI works in any terminal. Claude Code and Codex skills are optional native entry points; other tools consume generated rule files through `ome rules sync`.
# Test auto-record
