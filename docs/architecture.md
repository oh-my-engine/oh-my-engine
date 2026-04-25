# Oh My Engine Architecture

## Overview

Oh My Engine is a two-layer architecture that combines global skills with project-specific configurations to create intelligent, context-aware workflows. Spec-driven work uses an OpenSpec-compatible workspace so long-lived specs and active changes stay separate from project memory.

## Architecture Layers

### Layer 1: Global Skills (`~/.claude/skills/`)

Global skills are installed once and available across all projects. They contain the core workflow logic.

```
~/.claude/skills/
├── oh-my-engine/          # Core framework and utilities
├── oh-my-engine-init/     # Project initialization
├── oh-my-engine-ui/       # UI restoration workflow
├── oh-my-engine-bug/      # Bug analysis workflow
├── oh-my-engine-comp/     # Component generation workflow
├── oh-my-engine-api/      # API integration workflow
├── oh-my-engine-spec/     # OpenSpec-compatible spec workflow
├── oh-my-engine-memory/   # Memory system viewer
└── oh-my-engine-evolve/   # Evolution analyzer
```

### Layer 2: Project Configuration (`.oh-my-engine/`)

Each project has its own configuration that customizes how workflows behave.

```
project/.oh-my-engine/
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

The v1 memory system is selective. It records only events that pass the memory policy gate:

- explicit engine workflow execution
- explicit user remember requests
- post-run promotions that meet reusable-value thresholds

**Executions** (`memory/executions/`)
- Timestamped execution logs
- Workflow/phase/source metadata
- `captureLevel` and `whyStored`
- Success/failure status
- File/test/error evidence when available

**Learnings** (`memory/learnings/`)
- Candidate best practices promoted from repeated successful patterns
- Candidates are stored under `memory/learnings/candidates/`
- Adopted learning artifacts are stored under `memory/learnings/adopted/`
- Verified before broader adoption

**Preferences** (`memory/preferences/`)
- User feedback on generated code
- Preferred approaches
- Custom conventions

**Skill Candidates** (`memory/skill-candidates/`)
- Candidate automation distilled from repeated bug-fix patterns
- Stored as candidates first, not auto-installed
- Verified before adoption

**Generated Skills** (`generated-skills/`)
- Adopted candidate artifacts promoted after verification
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
- `skills/oh-my-engine-bug/scripts/prepare-context.sh`
- `skills/oh-my-engine-ui/scripts/prepare-context.sh`
- `skills/oh-my-engine-comp/scripts/prepare-context.sh`
- `skills/oh-my-engine-api/scripts/prepare-context.sh`

## Context Loading Strategy

When a workflow starts, it loads context in this order:

1. **Project Config**: `.oh-my-engine/config.json`
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

Create custom workflows in `.oh-my-engine/workflows/`:

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

Add project-specific rules in `.oh-my-engine/rules/`:

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
.oh-my-engine/generated-skills/
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
