---
project:
  name: oh-my-engine
  template: default
  type: cli
  framework: Node.js
  frameworks:
    - Node.js
  language: TypeScript
  packageManager: npm
  tooling:
    - build-script
    - check-script
    - test-script
    - typescript
  sourceDirectories:
    - src
    - docs
    - schemas
    - skills
    - examples
    - bin
  testFramework: node:test
  testFrameworks:
    - node:test
  buildTools:
    - typescript
  filesScanned: 186
  detectedPatterns:
    - automated-tests
    - build-script
    - build-tooling
    - commonjs-exports
    - commonjs-require
    - console-logging
    - data-access
    - deployment-config
    - environment-variables
    - esm-exports
    - esm-imports
    - http-routing
    - koa-context
    - npm-package-manager
    - src-directory
    - structured-content-parsing
    - try-catch-error-handling
    - typecheck-script
    - typed-source
version: 1.0.0
workflows:
  ui-restore:
    enabled: false
    rules: []
  bug-analysis:
    enabled: true
    rules:
      - project-overview
      - code-style
      - architecture
      - testing
      - tooling
      - security
      - logging-error-handling
  component-gen:
    enabled: true
    rules:
      - code-style
      - architecture
      - tooling
  api-integration:
    enabled: true
    rules:
      - routing-middleware
      - data-access
      - configuration-env
      - security
      - logging-error-handling
  rules-personalization:
    enabled: true
    rules:
      - architecture
      - code-style
      - configuration-env
      - data-access
      - deployment
      - logging-error-handling
      - project-overview
      - routing-middleware
      - security
      - testing
      - tooling
  spec:
    enabled: true
    format: openspec-compatible
    options:
      specRoot: .ome/omespec
      changesDir: .ome/omespec/changes
      specsDir: .ome/omespec/specs
      archiveDir: .ome/omespec/archive
      memoryDir: .ome/memory/specs
      defaultFlow: import-decompose-plan-apply-verify-archive
      manualFlow: propose-plan-apply-verify-archive
      contextDirName: context
      assetsDirName: assets
      verifyCommands: []
memory:
  enabled: true
  captureMode: selective
  allowSources:
    workflow_command: true
    explicit_remember: true
    post_run_promotion: true
  thresholds:
    preferencePromotion: 0.8
    knowledgePromotion: 0.85
    skillCandidatePromotion: 0.9
  retention: 90d
  maxExecutions: 1000
evolution:
  enabled: true
  autoApply: false
  requireVerification: true
  candidateOnly: true
  thresholds:
    learningCandidateMinEvidence: 3
    skillCandidateMinEvidence: 3
    adoptedPreferenceMinEvidence: 2
  evaluationInterval: daily
  optimizationThreshold: 85
directories:
  plans: .ome/plans
  rules: .ome/rules
  memory: .ome/memory
  spec: .ome/spec
  context: .ome/context
  docs: .ome/docs
  generatedSkills: .ome/generated-skills
  workflows: .ome/workflows
---

# Oh My Engine Configuration

## Project Information

- **Project Name**: oh-my-engine
- **Template**: default
- **Project Type**: cli
- **Frameworks**: Node.js
- **Language**: TypeScript
- **Package Manager**: npm
- **Version**: 1.0.0

## Project Scan

- **Files Scanned**: 186
- **Source Directories**: src, docs, schemas, skills, examples, bin
- **Entrypoints**: dist/index.d.ts, dist/index.js, src/index.ts
- **Test Frameworks**: node:test
- **Tooling**: build-script, check-script, test-script, typescript
- **Build Tools**: typescript
- **Detected Patterns**: automated-tests, build-script, build-tooling, commonjs-exports, commonjs-require, console-logging, data-access, deployment-config, environment-variables, esm-exports, esm-imports, http-routing, koa-context, npm-package-manager, src-directory, structured-content-parsing, try-catch-error-handling, typecheck-script, typed-source

## Workflows

This project has the following workflows enabled:

- **ui-restore**: disabled because no UI framework was detected
- **bug-analysis**: Bug analysis workflow with project-specific code, architecture, and tooling rules
- **component-gen**: Component generation workflow
- **api-integration**: API integration workflow
- **spec**: OpenSpec workflow for structured change management

## Memory System

The memory system is enabled with selective capture mode. It records:
- Workflow command executions
- Explicit remember requests
- Post-run promotions

## Evolution System

The evolution system analyzes patterns and suggests improvements. It requires verification before adopting changes.

## Agent Personalization

For deeper AI-assisted personalization, ask your agent editor to follow `.ome/context/rules-generation-prompt.md`.

## Getting Started

Run `ome help` to see available commands.
