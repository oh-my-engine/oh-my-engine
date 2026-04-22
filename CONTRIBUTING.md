# Contributing to Oh My Engine

Thank you for your interest in contributing to Oh My Engine! This document provides guidelines and instructions for contributing.

## Getting Started

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/yourusername/oh-my-engine.git
cd oh-my-engine
```

2. Install in development mode:
```bash
./install.sh
```

3. Make your changes in the `skills/` directory

4. Test your changes in a sample project:
```bash
cd /path/to/test-project
/oh-my-engine-init
# Test your modified workflow
```

## Project Structure

```
oh-my-engine/
├── skills/                    # All skill implementations
│   ├── oh-my-engine/         # Core framework
│   ├── oh-my-engine-init/    # Initialization workflow
│   ├── oh-my-engine-ui/      # UI restoration workflow
│   ├── oh-my-engine-bug/     # Bug analysis workflow
│   ├── oh-my-engine-comp/    # Component generation workflow
│   ├── oh-my-engine-api/     # API integration workflow
│   ├── oh-my-engine-memory/  # Memory system viewer
│   └── oh-my-engine-evolve/  # Evolution analyzer
├── examples/                  # Example configurations
├── docs/                      # Documentation
├── templates/                 # Workflow templates
└── install.sh                # Installation script
```

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Claude Code version, project type)
- Relevant logs from `.oh-my-engine/memory/executions/`

### Suggesting Features

Feature requests are welcome! Please include:
- Use case and motivation
- Proposed solution or API
- Alternative approaches considered
- Impact on existing functionality

### Submitting Changes

1. **Create a branch** for your changes:
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following our coding standards (see below)

3. **Test thoroughly**:
   - Test in multiple project types (React Native, Next.js, etc.)
   - Verify memory system records executions correctly
   - Check that rules are loaded properly
   - Ensure no breaking changes to existing workflows

4. **Commit with clear messages**:
```bash
git commit -m "feat: add support for Vue.js projects"
```

5. **Push and create a pull request**:
```bash
git push origin feature/your-feature-name
```

## Coding Standards

### Skill Structure

Every skill should follow this structure:

```markdown
---
name: skill-name
description: Brief description
version: 1.0.0
---

# Skill Name

## Purpose
Clear explanation of what this skill does

## Usage
How to invoke and use the skill

## Configuration
Required configuration in config.json

## Rules
Rules that should be loaded

## Output
What the skill produces

## Memory
What gets saved to memory
```

### Configuration Schema

When adding new configuration options:
- Document in the skill's SKILL.md
- Provide sensible defaults
- Validate configuration on load
- Show clear error messages for invalid config

### Rule Writing

Rules should be:
- **Specific**: Clear, actionable guidelines
- **Contextual**: Include why, not just what
- **Prioritized**: Mark as high/medium/low priority
- **Examples**: Include code examples

Example:
```markdown
---
name: error-handling
priority: high
---

# Error Handling Rules

## Network Requests
Always wrap network requests in try-catch blocks.

**Why**: Network failures are common and should be handled gracefully.

**Example**:
\`\`\`typescript
try {
  const response = await api.fetchData();
  return response.data;
} catch (error) {
  logger.error('Failed to fetch data', error);
  throw new NetworkError('Data fetch failed');
}
\`\`\`
```

### Memory System

When modifying memory system:
- Maintain backward compatibility with existing memory files
- Document memory schema changes
- Provide migration scripts if needed
- Respect privacy (never log sensitive data)

### Testing

Before submitting:
- Test in at least 2 different project types
- Verify memory files are created correctly
- Check that evolution system detects patterns
- Ensure no performance regression

## Documentation

- Update README.md if adding new features
- Add examples to `examples/` directory
- Update architecture docs if changing core behavior
- Include inline comments for complex logic

## Code Review Process

All contributions go through code review:
1. Automated checks (linting, basic validation)
2. Manual review by maintainers
3. Testing in real projects
4. Approval and merge

## Community Guidelines

- Be respectful and constructive
- Help others in issues and discussions
- Share your use cases and learnings
- Contribute examples and documentation

## Questions?

- Open an issue for questions
- Join discussions in existing issues
- Check documentation in `docs/`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
