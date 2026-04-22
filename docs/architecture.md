# Oh My Engine Architecture

## Overview

Oh My Engine is a two-layer architecture that combines global skills with project-specific configurations to create intelligent, context-aware workflows.

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
│   └── preferences/
└── generated-skills/      # Auto-generated skills (future)
```

## Core Components

### 1. Configuration System

**config.json** defines:
- Project metadata (name, type, framework)
- Enabled workflows and their settings
- Skills to load for each workflow
- Rules to apply
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

The memory system records and learns from every workflow execution:

**Executions** (`memory/executions/`)
- Timestamped execution logs
- Input parameters and outputs
- Success/failure status
- Performance metrics

**Learnings** (`memory/learnings/`)
- Successful patterns
- Failed cases and their causes
- Best practices discovered
- Anti-patterns to avoid

**Preferences** (`memory/preferences/`)
- User feedback on generated code
- Preferred approaches
- Custom conventions

### 3. Evolution Mechanism

The evolution system analyzes memory data to identify opportunities for improvement:

**Pattern Detection**
- Errors repeated ≥3 times → Generate fix skill
- Code reused ≥3 times → Extract utility skill
- Success rate ≥95% → Solidify as best practice

**Skill Generation**
- Automatically creates new skills based on patterns
- Proposes them to the user for approval
- Installs approved skills to `generated-skills/`

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
3. Check if workflow is enabled
   ↓
4. Load configured skills
   ↓
5. Load configured rules
   ↓
6. Execute workflow logic
   ↓
7. Generate code/output
   ↓
8. Save execution to memory
   ↓
9. Update learnings
```

## Context Loading Strategy

When a workflow starts, it loads context in this order:

1. **Project Config**: `.oh-my-engine/config.json`
2. **Workflow Config**: Specific workflow settings
3. **Rules**: All rules specified in workflow config
4. **Skills**: Additional skills specified in workflow config
5. **Memory**: Recent executions and learnings
6. **User Input**: Command parameters

This ensures the workflow has complete context before generating any code.

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
