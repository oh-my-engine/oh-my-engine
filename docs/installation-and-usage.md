# Installation and Multi-Tool Usage

Oh My Engine has two layers:

1. **CLI runtime**: the `ome` command. This is the source of truth for project initialization, rules sync, spec workflow, memory, evolution, and guidance.
2. **Agent skills and rule files**: optional entry points for Claude Code/Codex, plus generated rule files for tools such as Trae, Cursor, Windsurf, OpenCode, Qoder, and Antigravity.

Do not run removed compatibility scripts directly. Use `ome ...` for engine operations.

## Recommended Install

### From npm

```bash
npm install -g oh-my-engine
ome --help
```

Then initialize any project:

```bash
cd your-project
ome init
ome doctor
ome rules sync
```

### From GitHub

```bash
git clone https://github.com/<your-org>/oh-my-engine.git
cd oh-my-engine
npm install
npm run build
npm link
ome --help
```

Install Claude Code/Codex skills from the cloned repo when you want native agent commands:

```bash
./install.sh --agent claude
./install.sh --agent codex
./install.sh --agent both
```

For one-line skill installation from GitHub:

```bash
curl -fsSL https://raw.githubusercontent.com/<your-org>/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

The quick installer copies skills only. Install the CLI with npm or `npm link` as shown above.

## Tool-Specific Usage

### Plain CLI

Works in any terminal and any project:

```bash
ome init
ome doctor
ome rules validate
ome rules sync
```

Spec workflow:

```bash
ome spec propose add-auth --capability auth
ome spec plan add-auth
ome spec apply add-auth
ome spec verify add-auth
ome spec archive add-auth
```

Memory and evolution:

```bash
ome memory view --format json
ome evolve analyze --format json
ome evolve verify-learning --slug <learning-slug>
ome evolve adopt-learning --slug <learning-slug>
ome evolve verify-skill --slug <skill-slug>
ome evolve adopt-skill --slug <skill-slug>
```

Workflow guidance:

```bash
ome guidance bug-analysis --input "Login button click does nothing"
ome guidance ui-restore --input "https://mastergo.com/goto/demo"
ome guidance component-gen --input "UserCard"
ome guidance api-integration --input "./specs/user-api.yaml"
```

### Claude Code

Install skills:

```bash
./install.sh --agent claude
```

Use slash commands:

```bash
/oh-my-engine-init
/oh-my-engine-spec propose add-auth
/oh-my-engine-bug "Login button click does nothing"
```

Run this in the project to generate/update `CLAUDE.md`:

```bash
ome rules sync claude-code
```

### Codex

Install skills:

```bash
./install.sh --agent codex
```

Invoke installed skills by name:

```text
oh-my-engine-init
oh-my-engine-spec propose add-auth
oh-my-engine-bug Login button click does nothing
```

Run this in the project to generate/update `AGENTS.md`:

```bash
ome rules sync codex
```

### Trae

Trae primarily consumes project rule files. Run:

```bash
ome init
ome rules sync trae
```

Generated target:

```text
.trae/rules/*.md
```

### Cursor

```bash
ome init
ome rules sync cursor
```

Generated target:

```text
.cursor/rules/*.mdc
```

### OpenCode

```bash
ome init
ome rules sync opencode
```

Generated target:

```text
AGENTS.md
```

### Windsurf

```bash
ome init
ome rules sync windsurf
```

Generated target:

```text
.windsurfrules
```

### Qoder

```bash
ome init
ome rules sync qoder
```

Generated target:

```text
.qoder/rules/*.md
```

### Antigravity

```bash
ome init
ome rules sync antigravity
```

Generated target:

```text
.agents/rules/*.md
```

## What to Commit

Commit project configuration and rules:

```text
.oh-my-engine/config.json
.oh-my-engine/rules/
openspec/project.md
openspec/specs/
```

Usually commit generated rule files if your team wants consistent AI behavior across tools:

```text
CLAUDE.md
AGENTS.md
.cursor/rules/
.trae/rules/
.windsurfrules
.qoder/rules/
.agents/rules/
```

Do not commit local memory by default:

```text
.oh-my-engine/memory/
```

## Publisher Checklist

Before publishing:

```bash
npm run verify
npm pack --dry-run
```

For npm:

```bash
npm publish
```

For GitHub:

```bash
git tag v0.1.0
git push origin main --tags
```

Update installer URLs from `<your-org>` to the actual GitHub organization or username before announcing the project.
