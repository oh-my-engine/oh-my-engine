# Oh My Engine User Guide

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Available Workflows](#available-workflows)
5. [Configuration](#configuration)
6. [Rules System](#rules-system)
7. [Memory System](#memory-system)
8. [Evolution System](#evolution-system)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Installation

### One-Line Install

```bash
git clone https://github.com/yourusername/oh-my-engine.git
cd oh-my-engine
./install.sh --agent both
```

This copies the skills into `~/.claude/skills/` and/or `~/.codex/skills/`, depending on the selected agent target.

### Manual Install

```bash
# Clone the repository
git clone https://github.com/yourusername/oh-my-engine.git

# Create skills directories if they don't exist
mkdir -p ~/.claude/skills
mkdir -p ~/.codex/skills

# Copy each skill
cd oh-my-engine/skills
for skill in oh-my-engine*; do
  cp -R "$skill" ~/.claude/skills/
  cp -R "$skill" ~/.codex/skills/
done
```

### Verify Installation

```bash
# Check if skills are installed for Claude Code
ls -la ~/.claude/skills/ | grep oh-my-engine

# Check if skills are installed for Codex
ls -la ~/.codex/skills/ | grep oh-my-engine
```

You should see 9 skills listed.

## Quick Start

### 1. Initialize a Project

Navigate to your project directory and invoke the installed init workflow:

```bash
# Claude Code
/oh-my-engine-init

# Codex
oh-my-engine-init
```

This creates the `.oh-my-engine/` directory with default configuration.

It also creates an `openspec/` workspace for long-lived capability specs and in-progress changes.

### 2. Configure Your Project

Edit `.oh-my-engine/config.json`:

```json
{
  "project": {
    "name": "MyApp",
    "type": "react-native",
    "framework": "expo"
  },
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system", "i18n-helper"],
      "rules": ["i18n", "theme", "design-tokens"]
    },
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "theme"]
    },
    "spec": {
      "enabled": true,
      "format": "openspec-compatible"
    }
  }
}
```

### 3. Add Project Rules

Create rules in `.oh-my-engine/rules/`:

**i18n.md**:
```markdown
---
name: i18n
description: Multi-language support
priority: high
---

# Supported Languages
- English (en)
- Simplified Chinese (zh-CN)
- Traditional Chinese (zh-TW)
- Thai (th)

# Translation Keys
Use descriptive keys: `screen.home.welcome` not `text1`
```

### 4. Use Workflows

```bash
# Restore UI from Figma
/oh-my-engine-ui
./skills/oh-my-engine-ui/scripts/prepare-context.sh https://mastergo.com/goto/demo

# Generate a component
/oh-my-engine-comp
./skills/oh-my-engine-comp/scripts/prepare-context.sh UserCard

# Integrate an API
/oh-my-engine-api
./skills/oh-my-engine-api/scripts/prepare-context.sh ./specs/user-api.yaml

# Analyze a bug
/oh-my-engine-bug
./skills/oh-my-engine-bug/scripts/prepare-context.sh "Login button click does nothing"

# Start a prompt-driven spec change
/oh-my-engine-spec import user-authentication
/oh-my-engine-spec decompose user-authentication
/oh-my-engine-spec plan user-authentication
```

## Core Concepts

### Two-Layer Architecture

**Global Layer** (`~/.claude/skills/`)
- Installed once, available everywhere
- Contains workflow logic
- Shared across all projects

**Project Layer** (`.oh-my-engine/`)
- Project-specific configuration
- Custom rules and preferences
- Execution history and learnings

**Spec Workspace** (`openspec/`)
- Stable project context
- In-progress changes
- Long-lived capability specs
- Archived changes

### Configuration Inheritance

Projects inherit from global defaults but can override:

```json
{
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system"],  // Override default skills
      "rules": ["custom-theme"]     // Use custom rules
    }
  }
}
```

### Context Loading

When you run a workflow, Oh My Engine loads:
1. Project configuration
2. Project spec context (`openspec/project.md`) when spec mode is enabled
3. Workflow-specific settings
4. Active change docs and long-lived capability specs when relevant
5. Workflow guidance derived from adopted learnings and generated skills
6. All specified rules
7. Recent memory and learnings
8. Your input parameters

This ensures every workflow has complete context.

## Available Workflows

### `/oh-my-engine-init`

Initialize Oh My Engine in a project.

**What it does**:
- Creates `.oh-my-engine/` directory structure
- Generates default `config.json`
- Creates example rules
- Initializes memory system
- Updates `.gitignore`

**Usage**:
```bash
cd /path/to/project
/oh-my-engine-init
```

### `/oh-my-engine-ui`

Restore UI from design files (Figma, Sketch, etc.).

**What it does**:
- Analyzes design file
- Generates component code
- Applies theme and styling rules
- Handles i18n if configured
- Saves execution to memory

**Configuration**:
```json
{
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "skills": ["theme-system", "i18n-helper"],
      "rules": ["i18n", "theme", "design-tokens"],
      "options": {
        "languages": ["en", "zh-CN", "zh-TW", "th"],
        "themeSystem": "ThemedStyle",
        "designTokens": true
      }
    }
  }
}
```

**Usage**:
```bash
/oh-my-engine-ui
./skills/oh-my-engine-ui/scripts/prepare-context.sh <design-url>
# Follow prompts to provide design file URL
```

### `/oh-my-engine-comp`

Generate a new component with best practices.

**What it does**:
- Creates component file
- Generates styles
- Adds i18n support
- Includes TypeScript types
- Follows project conventions

**Configuration**:
```json
{
  "workflows": {
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "theme"],
      "options": {
        "template": "functional",
        "includeTests": true
      }
    }
  }
}
```

**Usage**:
```bash
/oh-my-engine-comp
./skills/oh-my-engine-comp/scripts/prepare-context.sh <component-name>
# Specify component name and type
```

### `/oh-my-engine-api`

Integrate an API endpoint.

**What it does**:
- Generates API client code
- Adds error handling
- Implements retry logic
- Creates TypeScript types
- Adds tests

**Configuration**:
```json
{
  "workflows": {
    "api-integration": {
      "enabled": true,
      "rules": ["api-conventions", "error-handling"],
      "options": {
        "client": "axios",
        "retryAttempts": 3
      }
    }
  }
}
```

**Usage**:
```bash
/oh-my-engine-api
./skills/oh-my-engine-api/scripts/prepare-context.sh <api-spec>
# Provide API endpoint details
```

### `/oh-my-engine-spec`

Manage an OpenSpec-compatible change lifecycle inside Oh My Engine.

**What it does**:
- Creates `openspec/` scaffolding
- Imports PRD, prompt, and attachment context under `openspec/changes/<change-id>/context/`
- Prepares `analysis.md` plus standard spec artifacts from imported context
- Proposes changes under `openspec/changes/`
- Refines design and tasks
- Loads implementation context for the active change
- Lets you mark task and acceptance progress from the CLI helper
- Shows current change status and pending items
- Verifies checklist completion, blocks template placeholders, and enforces concrete spec deltas
- Archives completed changes into long-lived specs, creating the capability spec on first acceptance

**Usage**:
```bash
/oh-my-engine-spec init
/oh-my-engine-spec import user-authentication
/oh-my-engine-spec decompose user-authentication
/oh-my-engine-spec propose user-authentication
/oh-my-engine-spec plan user-authentication
/oh-my-engine-spec apply user-authentication
/oh-my-engine-spec apply user-authentication --task "Implement the change"
/oh-my-engine-spec status user-authentication
/oh-my-engine-spec verify user-authentication
/oh-my-engine-spec archive user-authentication
```

**Current limits**:
- `import` and `decompose` persist normalized context and scaffolding, but the agent still needs to replace `TBD:` markers with concrete decisions.
- `apply` updates lifecycle state and prints the expected context files, but does not edit app code automatically.
- `verify` checks the documented checklist, blocks unresolved `TBD:` template markers, enforces exactly one change type plus concrete requirement/scenario content in each spec delta, and runs `workflows.spec.options.verifyCommands` from `.oh-my-engine/config.json`.
- `archive` now rebuilds capability summary/requirements/compatibility from accepted deltas, but `Invariants`、`Interfaces`、`Observability` 这些长期说明仍需人工维护。

### `/oh-my-engine-bug`

Analyze and fix bugs.

**What it does**:
- Analyzes error logs
- Identifies root cause
- Suggests fixes
- Applies fix if approved
- Records solution to memory

**Configuration**:
```json
{
  "workflows": {
    "bug-analysis": {
      "enabled": true,
      "rules": ["code-style"],
      "options": {
        "autoFix": false,
        "createTest": true
      }
    }
  }
}
```

**Usage**:
```bash
/oh-my-engine-bug
./skills/oh-my-engine-bug/scripts/prepare-context.sh "Describe the bug or provide error logs"
# Describe the bug or provide error logs
```

### `/oh-my-engine-memory`

View execution history and learnings.

**What it does**:
- Shows recent executions
- Displays learning candidates and adopted learnings
- Shows user preferences
- Shows skill candidates and generated skills, including execution directives

**Usage**:
```bash
/oh-my-engine-memory
/oh-my-engine-memory --type adopted-learnings
/oh-my-engine-memory --type generated-skills
# Optional: filter by workflow, scope, or output format
```

### `/oh-my-engine-evolve`

Analyze patterns and suggest improvements.

**What it does**:
- Analyzes execution history
- Detects repeated patterns
- Suggests new skills
- Proposes optimizations

**Usage**:
```bash
/oh-my-engine-evolve
# Review suggestions and approve/reject
```

## Configuration

### Project Configuration

**config.json** structure:

```json
{
  "project": {
    "name": "string",
    "type": "react-native | nextjs | express | ...",
    "framework": "expo | vite | ...",
    "version": "1.0.0"
  },
  "workflows": {
    "workflow-name": {
      "enabled": boolean,
      "skills": ["skill1", "skill2"],
      "rules": ["rule1", "rule2"],
      "options": {
        // Workflow-specific options
      }
    }
  },
  "memory": {
    "enabled": true,
    "captureMode": "selective",
    "allowSources": {
      "workflow_command": true,
      "explicit_remember": true,
      "post_run_promotion": true
    },
    "retention": "90d"
  },
  "evolution": {
    "enabled": true,
    "autoApply": false,
    "requireVerification": true,
    "candidateOnly": true,
    "thresholds": {
      "learningCandidateMinEvidence": 3,
      "skillCandidateMinEvidence": 3,
      "adoptedPreferenceMinEvidence": 2
    }
  }
}
```

### Workflow Options

Each workflow can have custom options:

**UI Restore**:
```json
{
  "languages": ["en", "zh-CN", "zh-TW", "th"],
  "themeSystem": "ThemedStyle",
  "designTokens": true,
  "outputDir": "src/components"
}
```

**Component Generation**:
```json
{
  "template": "functional | class",
  "includeTests": boolean,
  "includeStorybook": boolean
}
```

**API Integration**:
```json
{
  "client": "axios | fetch",
  "retryAttempts": number,
  "timeout": number,
  "includeCache": boolean
}
```

## Rules System

### Creating Rules

Rules are markdown files in `.oh-my-engine/rules/`:

```markdown
---
name: rule-name
description: Brief description
priority: high | medium | low
applies_to: ["workflow1", "workflow2"]
---

# Rule Title

## Context
Why this rule exists

## Guidelines
1. Specific guideline
2. Another guideline

## Examples

### Good
\`\`\`typescript
// Good example
\`\`\`

### Bad
\`\`\`typescript
// Bad example
\`\`\`

## Exceptions
When this rule doesn't apply
```

### Rule Priority

- **High**: Must be followed, violations are errors
- **Medium**: Should be followed, violations are warnings
- **Low**: Nice to have, violations are suggestions

### Loading Rules

Rules are loaded based on workflow configuration:

```json
{
  "workflows": {
    "ui-restore": {
      "rules": ["i18n", "theme", "design-tokens"]
    }
  }
}
```

Or load all rules:

```json
{
  "workflows": {
    "ui-restore": {
      "rules": ["*"]
    }
  }
}
```

## Memory System

### Structure

```
.oh-my-engine/memory/
├── executions/           # Execution logs grouped by workflow/day
├── learnings/
│   ├── candidates/       # Learning candidates
│   └── adopted/          # Adopted learning artifacts
├── preferences/          # Explicit remembered preferences
├── skill-candidates/     # Candidate automation patterns
└── generated-skills/     # Adopted generated skill artifacts
```

### Execution Logs

Each execution creates a log:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "workflow": "ui-restore",
  "input": {
    "designFile": "https://figma.com/...",
    "component": "LoginScreen"
  },
  "output": {
    "files": ["src/screens/LoginScreen.tsx"],
    "linesOfCode": 150
  },
  "status": "success",
  "duration": 45000,
  "rulesApplied": ["i18n", "theme"],
  "errors": []
}
```

### Learnings

The system promotes repeated successful behavior into learning candidates, then requires verification before adoption.

**Learning Candidate**:
```json
{
  "slug": "ui-restore-apply-reuse-themedstyle-and-design-tokens-for-generated-ui",
  "workflow": "ui-restore",
  "phase": "apply",
  "status": "candidate",
  "verification": {
    "state": "pending"
  },
  "evidenceCount": 3
}
```

**Adopted Learning**:
```json
{
  "slug": "ui-restore-apply-reuse-themedstyle-and-design-tokens-for-generated-ui",
  "status": "adopted",
  "appliesTo": ["ui-restore"],
  "summary": "Reuse ThemedStyle and design tokens for generated UI."
}
```

### User Preferences

Records your feedback:

```json
{
  "preference": "component-structure",
  "value": "prefer-hooks-over-class",
  "confidence": 0.9,
  "examples": [...]
}
```

## Evolution System

### How It Works

1. **Pattern Detection**: Analyzes memory for repeated patterns
2. **Threshold Check**: Patterns must occur ≥3 times (configurable)
3. **Candidate Generation**: Creates learning and skill candidates from repeated patterns
4. **Verification**: Candidates must be verified before adoption
5. **Adoption**: Promotes approved skill artifacts to `generated-skills/`, stores adopted learnings under `memory/learnings/adopted/`, and surfaces their execution directives in downstream workflows

### Pattern Types

**Error Patterns**:
- Same error occurs multiple times
- Generates a fix skill

**Code Patterns**:
- Same code structure repeated
- Generates a utility skill

**Success Patterns**:
- High success rate approach
- Solidifies as best practice

### Generated Skills

Example generated skill artifact:

```json
{
  "slug": "react-event-handler-invocation",
  "status": "adopted",
  "patternId": "react-event-handler-invocation",
  "executionDirectives": [
    "Avoid immediate invocation in React JSX event handlers; pass function references instead of calling handlers during render.",
    "If a handler needs arguments, wrap it in an explicit closure at the event boundary rather than invoking it while rendering."
  ]
}
```

These directives are consumed directly by:
- `spec` via `plan/apply` and `context/engine-memory.md`
- `bug/ui/comp/api` via each workflow's `./scripts/prepare-context.sh`

### Configuration

```json
{
  "memory": {
    "captureMode": "selective"
  },
  "evolution": {
    "enabled": true,
    "requireVerification": true,
    "thresholds": {
      "learningCandidateMinEvidence": 3,
      "skillCandidateMinEvidence": 3
    }
  }
}
```

## Best Practices

### 1. Start Simple

Begin with basic configuration:
```json
{
  "project": {
    "name": "MyApp",
    "type": "react-native"
  }
}
```

Add complexity as needed.

### 2. Use Descriptive Rules

Bad:
```markdown
# Rule 1
Don't do X
```

Good:
```markdown
# Error Handling
Always wrap network requests in try-catch blocks because network failures are common and should be handled gracefully.
```

### 3. Review Memory Regularly

```bash
/oh-my-engine-memory
```

Check what the system is learning and adjust if needed.

### 4. Leverage Evolution

```bash
/oh-my-engine-evolve
```

Let the system suggest improvements based on your patterns.

### 5. Keep Rules Updated

As your project evolves, update rules to reflect current practices.

### 6. Commit Configuration, Not Memory

```bash
# .gitignore
.oh-my-engine/memory/
```

Configuration should be shared, memory should not.

## Troubleshooting

### Workflow Not Found

**Problem**: `oh-my-engine-ui` workflow not recognized

**Solution**:
```bash
# Claude Code install location
ls ~/.claude/skills/ | grep oh-my-engine

# Codex install location
ls ~/.codex/skills/ | grep oh-my-engine

# Reinstall for the intended target if needed
cd /path/to/oh-my-engine
./install.sh --agent claude
./install.sh --agent codex
```

### Configuration Not Loading

**Problem**: Rules not being applied

**Solution**:
1. Check config.json syntax (must be valid JSON)
2. Verify workflow is enabled
3. Check rule files exist in `.oh-my-engine/rules/`

### Memory Not Saving

**Problem**: Executions not recorded

**Solution**:
1. Check memory is enabled in config.json
2. Verify `.oh-my-engine/memory/` directory exists
3. Check file permissions

### Evolution Not Detecting Patterns

**Problem**: No suggestions from `/oh-my-engine-evolve`

**Solution**:
1. Need at least 3 executions for pattern detection
2. Check evolution is enabled in config.json
3. Lower `learningCandidateMinEvidence` or `skillCandidateMinEvidence` if needed

### Generated Code Not Following Rules

**Problem**: Code doesn't match project conventions

**Solution**:
1. Verify rules are loaded (check execution log)
2. Make rules more specific with examples
3. Increase rule priority to "high"

## Getting Help

- **Documentation**: Check `docs/` directory
- **Examples**: See `examples/` directory
- **Issues**: Report bugs on GitHub
- **Discussions**: Ask questions in GitHub Discussions

## Next Steps

- Read [Architecture](docs/architecture.md) for deeper understanding
- Check [Examples](examples/) for real-world configurations
- Join the community and share your learnings
- Contribute improvements (see [CONTRIBUTING.md](CONTRIBUTING.md))
