# Installation and Multi-Tool Usage

Oh My Engine has two layers:

1. **CLI runtime**: the `ome` command. This is the source of truth for project initialization, rules sync, spec workflow, memory, evolution, and guidance.
2. **Agent commands and rule files**: optional global `ome-*` entries for supported agents, plus project rule files for Trae, Cursor, Windsurf, OpenCode, Qoder, and Antigravity.

Do not run removed compatibility scripts directly. Use `ome ...` for engine operations.

## Requirements

- Node.js >= 22
- npm >= 10

The package is built with TypeScript 6 and publishes CommonJS runtime files plus `.d.ts` declarations under `dist/`.

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
ome init-rules
ome doctor
ome agents install
```

`ome init` and `ome init-rules` scan the current repository before writing rules. The generated `.ome/rules/*.md` set is intentionally dynamic: a Koa/Gulp app can get server, routing, build, static asset, and configuration rules, while a React app can get UI/theme rules, and a backend without UI signals will not receive React Native or design-token rules.

`ome init` also writes project-local Agent workflow entry files so the rules are reachable from the repository itself, not only from global installs. That includes paths such as `.claude/commands/`, `.cursor/commands/`, `.qoder/commands/`, `.opencode/command/`, `.windsurf/workflows/`, and `.agent/workflows/`.

### From GitHub

```bash
git clone https://github.com/<your-org>/oh-my-engine.git
cd oh-my-engine
npm install
npm run build
npm link
ome --help
```

Install global Agent commands when you want native `/ome-*` or skill-name entries:

```bash
ome agents install
ome agents install --all
ome agents doctor
```

`ome agents install --all` installs the same workflow set into Claude Code, Codex, Cursor, Trae, Windsurf, Qoder, OpenCode, and Antigravity. The set includes `ome-init-rules` for codebase-specific rule generation and `ome-superpowers` for the Superpowers bridge.

Install Superpowers wrappers:

```bash
ome superpowers install all
ome superpowers doctor all
```

Legacy one-line skill installation from GitHub remains available only for deprecated `/oh-my-engine-*` compatibility:

```bash
curl -fsSL https://raw.githubusercontent.com/<your-org>/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

The quick installer copies skills only. Install the CLI with npm or `npm link` as shown above.

## Tool-Specific Usage

### Plain CLI

Works in any terminal and any project:

```bash
ome init
ome init-rules
ome doctor
ome rules init
ome rules validate
ome rules sync
ome agents list
```

`ome init-rules` refreshes `.ome/context/project-scan.json`, rewrites local deterministic rule drafts, and tells the active Agent editor to inspect the latest source before final personalization. It does not call an AI API or require network access.

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
ome bug "Login button click does nothing"
ome-bug "Login button click does nothing"
ome define "add user login"
ome plan "add user login"
ome build "add user login"
ome test "login rejects invalid password"
ome review "current diff"
ome ship "login change"
ome-spec propose add-auth
ome guidance bug-analysis --input "Login button click does nothing"
ome guidance ui-restore --input "https://mastergo.com/goto/demo"
ome guidance component-gen --input "UserCard"
ome guidance api-integration --input "./specs/user-api.yaml"
```

### Framework API

Tools can embed Oh My Engine directly through the package entrypoint:

```js
const {
  initializeProject,
  listAdapters,
  listAdapterManifests,
  previewAdapterSync,
  renderWorkflowCommand,
  validateJsonFile
} = require('oh-my-engine');
```

Useful integration surfaces:

- `initializeProject(...)` prepares `.ome/` and `openspec/` state.
- `listAdapterManifests(...)` reports adapter capabilities and target config without writing files.
- `previewAdapterSync(...)` returns a create/update dry-run plan for one platform.
- `renderWorkflowCommand(...)` renders the same workflow guidance used by CLI shortcuts.
- `validateJsonFile(...)` validates project state against the bundled schemas.

See [Framework API](framework-api.md) for details.

### Claude Code

Install global commands:

```bash
ome agents install claude-code
```

Use slash commands:

```bash
/ome-init
/ome-init-rules
/ome-superpowers
/ome-spec propose add-auth
/ome-bug "Login button click does nothing"
```

Run this in the project to generate/update `CLAUDE.md`:

```bash
ome rules sync claude-code
```

### Codex

Install global skills:

```bash
ome agents install codex
```

Invoke installed skills by name:

```text
ome-init
ome-init-rules
ome-superpowers
ome-spec propose add-auth
ome-bug Login button click does nothing
```

Run this in the project to generate/update `AGENTS.md`:

```bash
ome rules sync codex
```

### Trae

Install global command wrappers:

```bash
ome agents install trae
```

Trae primarily consumes project rule files. Run:

```bash
ome init
ome init-rules
ome rules sync trae
```

Generated rules target:

```text
.trae/rules/*.md
```

### Cursor

```bash
ome agents install cursor
ome init
ome init-rules
ome rules sync cursor
```

Generated rules target:

```text
.cursor/rules/*.mdc
```

### OpenCode

```bash
ome agents install opencode
ome init
ome init-rules
ome rules sync opencode
```

Generated rules target:

```text
AGENTS.md
```

### Windsurf

```bash
ome agents install windsurf
ome init
ome init-rules
ome rules sync windsurf
```

Generated rules target:

```text
.windsurfrules
```

### Qoder

```bash
ome agents install qoder
ome init
ome init-rules
ome rules sync qoder
```

Generated rules target:

```text
.qoder/rules/*.md
```

### Antigravity

Install global workflows:

```bash
ome agents install antigravity
```

Generated global workflow target:

```text
~/.gemini/antigravity/global_workflows/*.md
```

Install project workflows:

```bash
ome agents install antigravity --project
```

Generated project workflow target:

```text
.agent/workflows/*.md
```

```bash
ome init
ome init-rules
ome rules sync antigravity
```

Generated rules target:

```text
.agent/rules/*.md
```

Project command/workflow files such as `.cursor/commands/*.md`, `.windsurf/workflows/*.md`, `.qoder/commands/*.md`, `.opencode/command/*.md`, and `.agent/workflows/*.md` are generated only when you run:

```bash
ome agents install --project
```

## What to Commit

Commit project configuration and rules:

```text
.ome/context/project-scan.json
.ome/context/rules-generation-prompt.md
.ome/rules/
OME.md
openspec/project.md
openspec/specs/
```

Do not assume `.ome/rules/` contains a fixed template set. Commit whatever project-specific files `ome init-rules` generated and your Agent editor refined.

Usually commit generated rule files if your team wants consistent AI behavior across tools:

```text
CLAUDE.md
AGENTS.md
.cursor/rules/
.trae/rules/
.windsurfrules
.qoder/rules/
.agent/rules/
```

Do not commit local memory by default:

```text
.ome/memory/
```

## Publisher Checklist

Before publishing:

```bash
npm run verify
npm pack --dry-run
```

On Windows, if `npm run verify` fails at the Unix `rm -rf dist` clean step, run the equivalent verification sequence:

```powershell
Remove-Item -LiteralPath dist -Recurse -Force -ErrorAction SilentlyContinue
.\node_modules\.bin\tsc.cmd -p tsconfig.json
node dist\scripts\restore-shebangs.js
node --test dist\tests\*.test.js
npm pack --dry-run
```

If the local npm cache has permission problems, use an isolated cache without changing the user's home directory:

```bash
npm --cache /tmp/oh-my-engine-npm-cache pack --dry-run
```

The dry-run package should include `dist/index.js`, `dist/index.d.ts`, CLI bins under `dist/bin/`, schemas, skills, and the public docs.

For npm:

```bash
npm version patch
npm publish
```

For GitHub:

```bash
git tag v0.2.0
git push origin main --tags
```

Update installer URLs from `<your-org>` to the actual GitHub organization or username before announcing the project.
