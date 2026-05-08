---
rule: architecture
version: 1.0.0
description: Architecture rules for cli projects
category: architecture
---


# Architecture

## Project Profile

- Project type: cli
- Primary framework: Node.js
- Frameworks: Node.js
- Language: TypeScript
- Package manager: npm
- Files scanned: 186
- Source directories: src, docs, schemas, skills, examples, bin
- Entrypoints: dist/index.d.ts, dist/index.js, src/index.ts
- Route files: none detected
- Middleware files: none detected
- Test frameworks: node:test
- Test files: src/tests/core-utils.test.ts, src/tests/helpers.ts, src/tests/npm-package.test.ts, src/tests/ome-adapters.test.ts, src/tests/ome-agents.test.ts, src/tests/ome-cli.test.ts, src/tests/ome-doctor-schema.test.ts, src/tests/ome-init.test.ts, src/tests/ome-rules-sync.test.ts, src/tests/ome-spec-ts.test.ts, src/tests/schema-validator.test.ts, src/tests/selective-memory.test.ts
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
- Source extensions: .json: 8, .md: 79, .ts: 92, .yml: 1
- Existing rule files: none detected
- Detected patterns: automated-tests, build-script, build-tooling, commonjs-exports, commonjs-require, console-logging, data-access, deployment-config, environment-variables, esm-exports, esm-imports, http-routing, koa-context, npm-package-manager, src-directory, structured-content-parsing, try-catch-error-handling, typecheck-script, typed-source

## Representative Files

  - .claude/settings.local.json
  - .github/workflows/ci.yml
  - CHANGELOG.md
  - CONTRIBUTING.md
  - docs/architecture.md
  - docs/CROSS_PLATFORM_RULES.md
  - docs/evolution.md
  - docs/framework-api.md
  - docs/generated-artifacts.md
  - docs/installation-and-usage.md
  - docs/lifecycle-workflows.md
  - docs/marketing/BLOG_IMAGES.md
  - docs/marketing/BLOG_POST.md
  - docs/marketing/GITHUB_DESCRIPTION.md
  - docs/marketing/LINUXDO_POST_WITH_SCREENSHOT_NOTES.md
  - docs/marketing/LINUXDO_POST.md
  - docs/memory-markdown-migration.md
  - docs/skill-anatomy.md
  - docs/skill-quality-gate.md
  - docs/spec-intake-architecture.md
  - docs/user-guide.md
  - examples/react-native/README.md
  - INSTALL_WITH_AI.md
  - OME.md

## Config Files

  - package.json
  - tsconfig.json

## Rules

- Keep changes inside the existing top-level responsibilities: src, docs, schemas, skills, examples, bin.
- Use detected entrypoints as orientation before changing cross-cutting behavior: dist/index.d.ts, dist/index.js, src/index.ts.
- Keep framework-specific behavior in files that already own that framework or route/middleware concern.
- Store generated project context under `.ome/context/` and source rules under `.ome/rules/`.
- Keep platform-specific generated files derived from `.ome/rules/` through `ome rules sync`.
