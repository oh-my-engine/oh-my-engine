---
rule: logging-error-handling
version: 1.0.0
description: Logging and error handling rules
category: observability
---


# Logging And Error Handling

## Project Profile

- Project type: cli
- Primary framework: Node.js
- Frameworks: Node.js
- Language: TypeScript
- Package manager: npm
- Files scanned: 474
- Source directories: src, docs, schemas, skills, examples, bin
- Entrypoints: dist/index.d.ts, dist/index.js, src/index.ts
- Route files: none detected
- Middleware files: none detected
- Test frameworks: node:test
- Test files: src/tests/core-utils.test.ts, src/tests/helpers.ts, src/tests/npm-package.test.ts, src/tests/ome-adapters.test.ts, src/tests/ome-agents.test.ts, src/tests/ome-cli.test.ts, src/tests/ome-doctor-schema.test.ts, src/tests/ome-init.test.ts, src/tests/ome-mcp.test.ts, src/tests/ome-rules-sync.test.ts, src/tests/ome-spec-ts.test.ts, src/tests/schema-validator.test.ts
- Tooling: build-script, check-script, test-script, typescript
- Build tools: typescript
- Server frameworks: none detected
- UI frameworks: none detected
- Mobile frameworks: none detected
- Template engines: none detected
- Style systems: none detected
- i18n signals: none detected
- Database signals: migrations-or-sql
- Deployment signals: github-actions
- Source signals: commonjs-exports, commonjs-require, console-logging, environment-variables, esm-exports, esm-imports, http-routing, koa-context, try-catch-error-handling
- Source extensions: .json: 8, .md: 321, .ts: 99, .yml: 1
- Existing rule files: .agents/rules, .cursor/rules, .qoder/rules, .trae/rules, .windsurfrules, AGENTS.md, CLAUDE.md
- Detected patterns: automated-tests, build-script, build-tooling, commonjs-exports, commonjs-require, console-logging, data-access, deployment-config, environment-variables, esm-exports, esm-imports, http-routing, koa-context, npm-package-manager, src-directory, structured-content-parsing, try-catch-error-handling, typecheck-script, typed-source

## Representative Files

  - .agent/rules/00-ome-auto-detection.md
  - .agent/workflows/ome-api.md
  - .agent/workflows/ome-bug.md
  - .agent/workflows/ome-build.md
  - .agent/workflows/ome-comp.md
  - .agent/workflows/ome-define.md
  - .agent/workflows/ome-evolve.md
  - .agent/workflows/ome-init-rules.md
  - .agent/workflows/ome-init.md
  - .agent/workflows/ome-mcp.md
  - .agent/workflows/ome-memory.md
  - .agent/workflows/ome-plan.md
  - .agent/workflows/ome-review.md
  - .agent/workflows/ome-ship.md
  - .agent/workflows/ome-spec.md
  - .agent/workflows/ome-superpowers.md
  - .agent/workflows/ome-test.md
  - .agent/workflows/ome-ui.md
  - .agents/rules/00-ome-rules.md
  - .agents/rules/01-api-rest-design.md
  - .agents/rules/02-arch-clean-architecture.md
  - .agents/rules/03-arch-database-design.md
  - .agents/rules/04-arch-microservices.md
  - .agents/rules/05-architecture.md

## Config Files

  - package.json
  - tsconfig.json

## Rules

- Preserve existing error propagation conventions in route, middleware, CLI, and service code.
- Keep logs actionable and avoid noisy console output in library or test code.
- Use the repository's current logger or console convention before adding a new logging dependency.
- Convert expected validation or user errors into framework-appropriate responses; reserve thrown errors for exceptional paths.
