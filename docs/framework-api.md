# Framework API

Oh My Engine can be used as both a CLI and a CommonJS library. The package entrypoint is `dist/index.js`, with TypeScript declarations at `dist/index.d.ts`.

```js
const {
  countOpenCheckboxes,
  doctorMcp,
  initMcp,
  parseMcpArgs,
  previewMcp,
  writeTextFile,
  initializeProject,
  generateAgentGuidanceFile,
  listAdapters,
  listAdapterManifests,
  previewAdapterSync,
  renderLifecycleGuidance,
  renderWorkflowCommand,
  verifySkillCandidate,
  validateJsonFile
} = require('oh-my-engine');
```

## Runtime Contract

- Runtime format: CommonJS
- Minimum Node.js: 22
- Type declarations: generated from `src/**/*.ts`
- Public entrypoint: `require('oh-my-engine')`

Only exports from `src/index.ts` are treated as the supported framework API. Deep imports from `dist/core/*` or `dist/skills/*` are implementation details.

## Project Setup

Use `initializeProject` when embedding the engine in another tool that needs to prepare `.ome/` and `openspec/` state.

```js
initializeProject({
  force: false,
  template: 'default',
  projectRoot: process.cwd(),
  repoRoot: require('node:path').resolve(__dirname, '..')
});
```

This automatically generates:
- `OME.md` configuration file
- `.ome/` directory structure
- `CLAUDE.md` and `AGENTS.md` with auto-detection rules
- Project-specific rules in `.ome/rules/`

## MCP Configuration

Use the MCP helpers when another tool wants to manage one source config and sync it to editor-specific targets.

```js
const { initMcp, doctorMcp, previewMcp } = require('oh-my-engine');

initMcp({
  all: true,
  projectRoot: process.cwd(),
  home: process.env.HOME
});

const preview = previewMcp({
  all: true,
  projectRoot: process.cwd(),
  home: process.env.HOME
});

const doctor = doctorMcp({
  all: true,
  projectRoot: process.cwd(),
  home: process.env.HOME
});
```

`initMcp(...)` creates `.ome/mcp/source.json` and `.ome/mcp/README.md`. `previewMcp(...)` shows the editor-specific config that would be generated. `doctorMcp(...)` reports file presence and token environment status.

## Agent Guidance Generation

Use `generateAgentGuidanceFile` to create or update agent integration files (CLAUDE.md, AGENTS.md) with auto-detection rules.

```js
const { generateAgentGuidanceFile } = require('oh-my-engine');
const { scanProject } = require('oh-my-engine/dist/core/project-scanner');

const scan = scanProject(process.cwd());
const result = generateAgentGuidanceFile(
  process.cwd(),
  { id: 'claude-code', projectRules: 'CLAUDE.md', commandStyle: 'slash' },
  scan
);

console.log(result.created ? 'Created' : 'Updated', result.path);
```

The guidance file includes:
- Auto-detection rules for when to use `/ome-bug`, `/ome-ui`, `/ome-api`, etc.
- Lifecycle stage detection (define/plan/build/test/review/ship)
- Command priority guidelines
- Project context references
- Rule index (within `<!-- OME:START -->` markers)

## Platform Adapters

Use adapter manifests for capability discovery without writing files.

```js
const manifests = listAdapterManifests(process.cwd());
const codexPlan = previewAdapterSync(process.cwd(), 'codex');
```

`previewAdapterSync` is a dry-run surface. It returns whether a target would be created or updated, but it does not write project files.

Adapter manifests include:

- platform id and display name
- configured target file or directory
- detection status
- declared capabilities
- the platform config used to produce the manifest

## Workflow Guidance

Use `renderWorkflowCommand` to render the same guidance text used by CLI workflow shortcuts.

```js
const guidance = renderWorkflowCommand('bug', ['login fails'], process.cwd());
```

Rendering workflow guidance creates a workflow session in `.ome/.session`, matching CLI behavior.

Use `renderLifecycleGuidance` for the lifecycle command family:

```js
const plan = renderLifecycleGuidance({
  workflow: 'plan',
  input: 'add user login',
  cwd: process.cwd()
});
```

Supported lifecycle workflows are `define`, `plan`, `build`, `test`, `review`, and `ship`.

## Skill Candidate Quality

Use `verifySkillCandidate(projectRoot, slug)` to apply the same evolve quality gate used by `ome evolve verify-skill`. The result includes verification metadata with a six-axis score and rejection reasons when a candidate is not adoption-ready.

For direct Markdown validation, pass an object:

```js
const assessment = verifySkillCandidate({
  skillMarkdown: '# Skill\n\n## Purpose\n...'
});
```

## Schema Validation

Use `validateJsonFile` for local schema-backed project state checks.

```js
const result = validateJsonFile('.ome/config.json', 'schemas/config.schema.json');
```

The built-in validator supports the subset of JSON Schema used by this project: object and array types, required properties, additional properties, enum and const, string length and pattern checks, numeric ranges, and nested item validation.

## File and Spec Utilities

The framework exports a small set of reusable helpers:

```js
writeTextFile('state/example.md', '# Example');
const open = countOpenCheckboxes('openspec/changes/demo/tasks.md');
```

`writeTextFile` and `writeJsonFile` create parent directories and write through a temporary sibling file followed by rename. This gives callers the same state-write behavior used by the spec workflow.
