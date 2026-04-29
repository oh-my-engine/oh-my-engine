# Changelog

All notable changes to Oh My Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/oh-my-engine/oh-my-engine/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/oh-my-engine/oh-my-engine/releases/tag/v0.2.0
