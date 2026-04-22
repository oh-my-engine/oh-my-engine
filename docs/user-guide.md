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
./install.sh
```

This creates symbolic links from `~/.claude/skills/` to the repository, so updates are automatic.

### Manual Install

```bash
# Clone the repository
git clone https://github.com/yourusername/oh-my-engine.git

# Create skills directory if it doesn't exist
mkdir -p ~/.claude/skills

# Link each skill
cd oh-my-engine/skills
for skill in oh-my-engine*; do
  ln -sf "$(pwd)/$skill" ~/.claude/skills/
done
```

### Verify Installation

```bash
# Check if skills are installed
ls -la ~/.claude/skills/ | grep oh-my-engine
```

You should see 8 skills listed.

## Quick Start

### 1. Initialize a Project

Navigate to your project directory and run:

```bash
/oh-my-engine-init
```

This creates the `.oh-my-engine/` directory with default configuration.

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
    "component-generation": {
      "enabled": true,
      "rules": ["code-style", "theme"]
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

# Generate a component
/oh-my-engine-comp

# Integrate an API
/oh-my-engine-api

# Analyze a bug
/oh-my-engine-bug
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
2. Workflow-specific settings
3. All specified rules
4. Recent memory and learnings
5. Your input parameters

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
        "componentStyle": "functional",
        "stateManagement": "hooks"
      }
    }
  }
}
```

**Usage**:
```bash
/oh-my-engine-ui
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
    "component-generation": {
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
# Provide API endpoint details
```

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
      "rules": ["debugging-guidelines"],
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
# Describe the bug or provide error logs
```

### `/oh-my-engine-memory`

View execution history and learnings.

**What it does**:
- Shows recent executions
- Displays learnings
- Shows user preferences
- Analyzes patterns

**Usage**:
```bash
/oh-my-engine-memory
# Optional: filter by workflow or date
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
    "retentionDays": 90,
    "autoArchive": true
  },
  "evolution": {
    "enabled": true,
    "patternThreshold": 3,
    "autoGenerate": false
  }
}
```

### Workflow Options

Each workflow can have custom options:

**UI Restore**:
```json
{
  "componentStyle": "functional | class",
  "stateManagement": "hooks | redux | mobx",
  "styling": "styled-components | emotion | stylesheet"
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
├── executions/           # Execution logs
│   └── YYYY-MM-DD/
│       └── HH-MM-SS-workflow-name.json
├── learnings/            # Learned patterns
│   ├── successful-patterns.json
│   ├── failed-cases.json
│   └── best-practices.json
└── preferences/          # User preferences
    └── user-feedback.json
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

The system learns from executions:

**Successful Patterns**:
```json
{
  "pattern": "form-validation",
  "occurrences": 5,
  "successRate": 1.0,
  "bestPractice": "Use Yup schema validation"
}
```

**Failed Cases**:
```json
{
  "error": "Missing translation key",
  "occurrences": 3,
  "solution": "Always check i18n keys exist before using"
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
3. **Skill Generation**: Creates new skill based on pattern
4. **User Approval**: Proposes skill to user
5. **Installation**: Installs approved skill to `generated-skills/`

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

Example generated skill:

```markdown
---
name: fix-missing-i18n-key
description: Auto-fix missing translation keys
generated: true
confidence: 0.95
---

# Fix Missing i18n Key

This skill was auto-generated after detecting 5 occurrences of missing translation keys.

## Detection
Looks for: `i18n.t('key')` where key doesn't exist

## Fix
1. Check if key exists in all language files
2. If missing, add placeholder
3. Log warning for manual translation
```

### Configuration

```json
{
  "evolution": {
    "enabled": true,
    "patternThreshold": 3,
    "autoGenerate": false,
    "requireApproval": true
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

**Problem**: `/oh-my-engine-ui` command not recognized

**Solution**:
```bash
# Check if skills are installed
ls ~/.claude/skills/ | grep oh-my-engine

# Reinstall if needed
cd /path/to/oh-my-engine
./install.sh
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
3. Lower `patternThreshold` if needed

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
