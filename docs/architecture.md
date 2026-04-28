# Oh My Engine Architecture

## Overview

Oh My Engine is a two-layer architecture that combines a TypeScript-driven `ome` CLI with optional agent skills and project-specific configurations. Spec-driven work uses an OpenSpec-compatible workspace so long-lived specs and active changes stay separate from project memory.

## Architecture Layers

### Layer 1: CLI Runtime (`ome`)

The `ome` CLI is the source of truth for engine operations:

- `ome init`
- `ome rules sync`
- `ome spec ...`
- `ome guidance ...`
- `ome memory view`
- `ome evolve ...`

### Layer 2: Optional Agent Skills (`~/.claude/skills/`, `~/.codex/skills/`)

Agent skills are optional native entry points for Claude Code and Codex. They should delegate engine operations to `ome` rather than reintroducing shell or JavaScript compatibility wrappers.

```
~/.claude/skills/
├── oh-my-engine/          # Core framework and utilities
├── ome-init/              # Project initialization
├── ome-ui/                # UI restoration workflow
├── ome-bug/               # Bug analysis workflow
├── ome-comp/              # Component generation workflow
├── ome-api/               # API integration workflow
├── ome-spec/              # OpenSpec-compatible spec workflow
├── ome-memory/            # Memory system viewer
└── ome-evolve/            # Evolution analyzer
```

### Layer 3: Project Configuration (`.ome/`)

Each project has its own configuration that customizes how workflows behave.

```
project/.ome/
├── config.json            # Workflow configurations
├── rules/                 # Project-specific rules
│   ├── i18n.md
│   ├── theme.md
│   └── ...
├── workflows/             # Custom workflows (optional)
├── memory/                # Execution history (git-ignored)
│   ├── executions/
│   ├── learnings/
│   │   ├── candidates/
│   │   └── adopted/
│   ├── preferences/
│   ├── skill-candidates/
│   └── specs/
└── generated-skills/      # Adopted skill artifacts

project/openspec/
├── project.md             # Stable project context
├── changes/               # In-progress changes
├── specs/                 # Long-lived capability specs
└── archive/               # Completed changes
```

## Core Components

### 1. Configuration System

**config.json** defines:
- Project metadata (name, type, framework)
- Enabled workflows and their settings
- Skills to load for each workflow
- Rules to apply
- OpenSpec-compatible spec workflow settings
- Memory and evolution settings

Example:
```json
{
  "project": {
    "name": "MyApp",
    "type": "react-native"
  },
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system", "i18n-helper"],
      "rules": ["i18n", "theme"]
    }
  }
}
```

### 2. Memory System

The v1 memory system is selective and uses **Markdown format** for all storage. It records only events that pass the memory policy gate:

- explicit engine workflow execution
- explicit user remember requests
- post-run promotions that meet reusable-value thresholds

All memory records are stored as Markdown files with YAML frontmatter, providing human-readable, Agent-friendly, and Git-friendly storage.

**Executions** (`memory/executions/{workflow}/{date}-{slug}.md`)
- One Markdown file per execution
- YAML frontmatter with metadata (workflow, phase, timestamp, status, duration)
- Human-readable content with execution details, errors, files touched
- `captureLevel` and `whyStored` explanation
- Success/failure status
- File/test/error evidence when available

**Learnings** (`memory/learnings/`)
- Candidate best practices promoted from repeated successful patterns
- Candidates are stored under `memory/learnings/candidates/{slug}.md`
- Adopted learning artifacts are stored under `memory/learnings/adopted/{slug}.md`
- Each stored as Markdown with frontmatter (category, evidence, reusability)
- Verified before broader adoption

**Preferences** (`memory/preferences/{scope}-{slug}.md`)
- User feedback on generated code
- Preferred approaches
- Custom conventions
- Each preference as a separate Markdown file with evidence tracking

**Skill Candidates** (`memory/skill-candidates/{slug}.md`)
- Candidate automation distilled from repeated bug-fix patterns
- Stored as Markdown with pattern metadata and evidence
- Stored as candidates first, not auto-installed
- Verified before adoption

**Generated Skills** (`generated-skills/{slug}.md`)
- Adopted candidate artifacts promoted after verification
- Markdown format with execution directives
- Can contribute execution directives that are surfaced during downstream `spec apply`
- Are visible through the memory viewer and change status surfaces
- Remain project-local in v1

### 3. Evolution Mechanism

The evolution system analyzes selected memory data to identify opportunities for improvement:

**Pattern Detection**
- Errors repeated ≥3 times → Generate fix skill
- Code reused ≥3 times → Extract utility skill
- Success rate ≥95% → Solidify as best practice

**Skill Generation**
- Creates skill candidates based on verified patterns
- Proposes them to the user for approval
- Adopts approved candidates into `generated-skills/` and exposes their execution directives to downstream workflows

### 4. Rule System

Rules are markdown files that define constraints and guidelines:

```markdown
---
name: i18n
description: Multi-language support rules
priority: high
---

# Translation Requirements

1. All user-facing text must be translatable
2. Use i18n keys, never hardcode strings
3. Support languages: en, zh-CN, zh-TW, th
...
```

Rules are loaded automatically based on workflow configuration and applied during code generation.

## Workflow Execution Flow

```
1. User invokes workflow command
   ↓
2. Load project config.json
   ↓
3. If using spec mode, load openspec/project.md and active change docs
   ↓
4. Check if workflow is enabled
   ↓
5. Load configured skills
   ↓
6. Load configured rules
   ↓
7. Execute workflow logic
   ↓
8. Generate code/output
   ↓
9. Run the selective memory gate
   ↓
10. Persist only approved execution or promotion records
```

Non-spec workflow helpers can now consume adopted engine knowledge directly through:
- `ome guidance bug-analysis --input "<issue>"`
- `ome guidance ui-restore --input "<design-url>"`
- `ome guidance component-gen --input "<component-name>"`
- `ome guidance api-integration --input "<api-spec>"`

## Context Loading Strategy

When a workflow starts, it loads context in this order:

1. **Project Config**: `.ome/config.json`
2. **Project Spec Context**: `openspec/project.md`
3. **Workflow Config**: Specific workflow settings
4. **Active Change Docs**: `openspec/changes/<change-id>/`
5. **Capability Specs**: `openspec/specs/<capability>/spec.md` when the capability has already been accepted
6. **Rules**: All rules specified in workflow config
7. **Engine Memory Context**: `openspec/changes/<change-id>/context/engine-memory.md` refreshed from adopted learnings and generated skills during `plan/apply`, including execution directives derived from adopted skills
8. **Skills**: Additional skills specified in workflow config
9. **Memory**: Recent executions and learnings
10. **User Input**: Command parameters

This ensures the workflow has complete context before generating any code.

## Spec-Driven Lifecycle

Spec mode follows an OpenSpec-compatible lifecycle:

1. `init` - create `openspec/` and memory directories
2. `propose` - scaffold a change under `openspec/changes/`
3. `plan` - refine design and tasks
4. `apply` - implement against the active change and long-lived specs
5. `verify` - prove acceptance criteria, reject placeholder content, and require concrete spec deltas
6. `archive` - create or update `openspec/specs/` from accepted change deltas and persist memory

## Prompt-Driven Spec Intake

The current OpenSpec-compatible workflow is the durable lifecycle core. For real-world PRD-driven work, the recommended extension is a thin intake layer in front of it:

1. `import` - ingest PRD content from MCP, local docs, URLs, inline text, and image attachments
2. `decompose` - convert normalized input plus operator prompt into `proposal.md`, `design.md`, `tasks.md`, and spec deltas
3. `plan/apply/verify/archive` - continue using the existing lifecycle and long-lived specs as the source of truth

This keeps multimodal retrieval and source-specific logic outside the spec core while preserving traceability and repeatability through persisted context artifacts.

See [Prompt-Driven Spec Intake Architecture](spec-intake-architecture.md) for the detailed design.

## Extensibility

### Custom Workflows

Create custom workflows in `.ome/workflows/`:

```markdown
---
name: my-custom-workflow
description: Custom workflow for specific task
---

# Workflow Steps
1. Load context
2. Execute custom logic
3. Save to memory
```

### Custom Rules

Add project-specific rules in `.ome/rules/`:

```markdown
---
name: api-conventions
description: API integration conventions
---

# API Rules
- Use axios for HTTP requests
- Implement retry logic
- Handle errors consistently
```

### Generated Skills

The evolution system can generate new skills automatically:

```
.ome/generated-skills/
├── fix-common-error-123/
├── extract-date-formatter/
└── optimize-image-loading/
```

These skills are project-specific and can be promoted to global skills if useful across projects.

## Design Principles

1. **Convention over Configuration**: Sensible defaults, minimal setup
2. **Progressive Enhancement**: Start simple, add complexity as needed
3. **Learning by Doing**: System improves with usage
4. **Context Awareness**: Always load relevant project context
5. **Non-Invasive**: Works alongside existing tools and workflows
6. **Transparent**: All decisions and learnings are visible

## Performance Considerations

- **Lazy Loading**: Only load rules and skills when needed
- **Caching**: Cache parsed configurations and rules
- **Incremental Learning**: Update learnings incrementally, not in batch
- **Memory Limits**: Auto-archive old executions (default: 90 days)

## Security

- **No Secrets in Config**: Never store API keys or credentials in config files
- **Git Ignore Memory**: Memory directory is always git-ignored
- **Sandboxed Execution**: Generated skills run in isolated context
- **User Approval**: Evolution changes require explicit user approval
