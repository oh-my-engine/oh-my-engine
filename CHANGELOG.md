# Changelog

All notable changes to Oh My Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.10] - 2026-06-04

### Added
- **OME Spec Intake**: Added `ome spec import` and `ome spec decompose` support for turning normalized PRD/source text, operator prompts, provenance metadata, and attachments into reviewable OME spec artifacts.
- **Decomposition Prompt Artifact**: `decompose` now writes `context/decomposition-prompt.md` so agents can refine deterministic first drafts without losing the original intake trail.
- **Memory Recall View**: `ome memory view` now defaults to active engine recall across preferences, adopted learnings, generated skills, and execution directives; execution history remains available through `ome history view`.

### Changed
- **Spec Ownership**: Spec workflows are now fully OME-owned and use `.ome/omespec/`; OME no longer delegates lifecycle commands to an external OpenSpec CLI.
- **Spec Workspace Initialization**: Ordinary `ome init` and `ome update` no longer create a spec workspace unless spec mode is explicitly initialized or a spec command needs it.
- **Global Skill Handling**: Project initialization and update flows now detect globally installed OME skills through `OME_AGENT_HOME` and skip duplicate project-local skill sources or mirrors when appropriate.
- **Agent Guidance**: Generated platform guidance now points to global OME workflow skills when they are installed, while preserving `.ome/skills/` as an explicit project-local override path.
- **Superpowers Scope**: Standard agent installation no longer bundles optional Superpowers bridge entries; those remain available through `ome superpowers install`.

### Fixed
- Preserved spec lifecycle memory fields such as clarification state, blocking questions, assumptions, and LLM prompt paths across status updates.
- Kept memory/history view operations from stale-cleaning active workflow sessions during read-only inspection.
- Updated docs and tests to use `.ome/omespec/` consistently instead of legacy `openspec/` paths.

### Documentation
- Updated README, architecture, installation, user guide, framework API, and spec-intake documentation for OME-owned spec mode and optional Superpowers bridge installation.
- Clarified framework API usage for opt-in spec workspace initialization with `specInit: true`.

## [0.4.9] - 2026-05-29

### Changed
- **Spec Workflow Status**: OpenSpec/spec workflow is now an **optional advanced compatibility workflow**, disabled by default in `OME.md`
- **Spec Implementation**: `ome spec` commands now use TypeScript-backed fallback implementation when external OpenSpec CLI is unavailable
- **Spec Commands**: All spec commands (`init`, `import`, `decompose`, `propose`, `plan`, `apply`, `status`, `verify`, `archive`) remain fully functional through `ome spec` or `ome-spec` CLI
- **OpenSpec CLI**: External `openspec` CLI is now optional; OME provides complete fallback implementation in `src/core/spec.ts`

### Technical Details
- Spec workflow can be enabled per-project via `OME.md` → `workflows.spec.enabled: true`
- `src/core/openspec.ts` provides optional delegation to external OpenSpec CLI
- `src/core/spec.ts` provides complete TypeScript fallback implementation
- Legacy `.ome/omespec/` projects continue to use fallback implementation
- Environment variable `OME_SPEC_LEGACY=1` forces fallback mode

### Documentation
- Updated `README.md` to clarify spec workflow is optional
- Updated `docs/installation-and-usage.md` to document spec workflow status
- Added clarification that spec workflow is an advanced compatibility feature

## [0.4.0] - 2026-04-29

### Added
- Public CommonJS framework API entrypoint with generated TypeScript declarations.
- Package `main`, `types`, and `exports` metadata for library consumers.
- Adapter manifests and dry-run sync plans for platform capability discovery.
- GitHub Actions CI for Node 22 and Node 24.
- Framework API documentation covering embedding, adapter dry-runs, schema validation, and file utilities.
- Atomic text/JSON write helpers and reusable spec utility exports.

### Changed
- Raised the runtime baseline to Node.js >= 22.
- Upgraded TypeScript to 6.0.3 and Node types to 25.6.0.
- Refactored CLI top-level command routing into a command registry.
- Split reusable spec helpers out of the spec workflow core.
- Strengthened config, platforms, and spec-state schemas.

### Fixed
- Expanded schema validation for enum, const, additional properties, nested arrays, string constraints, and numeric ranges.
- Added regression coverage for package API exports, legacy config doctor checks, adapter dry-run plans, and core file/spec utilities.

## [0.3.0] - 2024-04-28

### Added
- **Markdown-based Memory System**: Migrated from JSON/JSONL to Markdown with YAML frontmatter for better human readability and git-friendliness
  - Execution records: `.ome/memory/executions/{workflow}/{date}-{slug}-{id}.md`
  - Preferences: `.ome/memory/preferences/{scope}/{slug}.md`
  - Learning candidates: `.ome/memory/learnings/candidates/{slug}.md`
  - Adopted learnings: `.ome/memory/learnings/adopted/{slug}.md`
  - Skill candidates: `.ome/memory/skill-candidates/{slug}.md`
  - Generated skills: `.ome/generated-skills/{slug}.md`
- **Migration Script**: `src/scripts/migrate-memory-to-markdown.ts` for automated migration from JSON/JSONL to Markdown
- **Migration Documentation**: `docs/memory-markdown-migration.md` with complete migration guide
- **Evolution System Documentation**: `docs/evolution.md` describing the self-evolution architecture
- **Autonomous Evolution Modules** (foundation laid, implementation in progress):
  - `src/skills/oh-my-engine/lib/auto-evolution.ts` - Auto-analysis engine
  - `src/skills/oh-my-engine/lib/rule-generator.ts` - Rule generation from learnings
  - `src/skills/oh-my-engine/lib/skill-generator.ts` - Skill generation from patterns
  - `src/skills/oh-my-engine/lib/confidence-scorer.ts` - Confidence scoring system
  - `src/skills/oh-my-engine/lib/risk-assessor.ts` - Risk assessment system
  - `src/skills/oh-my-engine/lib/auto-decision.ts` - Autonomous decision engine
  - `src/skills/oh-my-engine/lib/effectiveness-tracker.ts` - Effectiveness tracking
  - `src/skills/oh-my-engine/lib/auto-cleanup.ts` - Auto-cleanup of ineffective learnings

### Changed
- **Memory Storage Format**: All memory records now use Markdown with YAML frontmatter instead of JSON/JSONL
- **File Naming**: Execution records now include unique ID suffix to prevent collisions: `{date}-{slug}-{id}.md`
- **Generated Skills**: Now stored as Markdown with `executionDirectives` in frontmatter for proper loading by workflow guidance system

### Fixed
- **Test 35**: Skill candidate verification now properly updates status field
- **Test 36**: Spec plan command now correctly loads and displays adopted skills' execution directives
- **Test 37**: Non-spec workflows now properly surface adopted learnings and generated skill directives
- **Memory Parsing**: Fixed summary extraction from Markdown content (first `#` heading)
- **Frontmatter Fields**: Added missing fields (errors, filesTouched, testsRun, evidence, appliesTo, etc.)
- **YAML Serialization**: Added undefined value filtering to prevent serialization errors

### Technical Details
- **Test Coverage**: 36/37 tests passing (97.3% pass rate)
- **Markdown Parser**: Using `gray-matter` library for YAML frontmatter parsing
- **Slug Generation**: 50-character limit with `slugifyForFile()` function
- **Memory Policy**: Selective storage based on memory policy gate (high-value events only)

### Migration Notes
- Existing JSON/JSONL memory files can be migrated using: `node dist/scripts/migrate-memory-to-markdown.js [project-root]`
- Original files are backed up with `.backup` extension
- See `docs/memory-markdown-migration.md` for detailed migration guide

### Known Issues
- Test 14 (ome doctor schema validation) still failing - unrelated to memory migration

## [0.2.1] - 2024-04-28

### Added
- Cross-platform rules management system
- TypeScript-first CLI architecture
- Productized command structure

### Changed
- Migrated from JavaScript to TypeScript
- Improved npm package structure for publishing

## [0.2.0] - 2024-04-27

### Added
- Initial release with workflow engine
- Memory system (JSON/JSONL format)
- Evolution system foundation
- Spec workflow support
- Multi-platform agent support

[Unreleased]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.4.10...HEAD
[0.4.10]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.4.9...v0.4.10
[0.4.9]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.4.0...v0.4.9
[0.4.0]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/oh-my-engine/oh-my-engine/releases/tag/v0.2.0
