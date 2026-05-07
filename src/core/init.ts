const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const { ENGINE_DIR, currentEnginePath, migrateLegacyEngineDirectory, repoEnginePath } = require('./paths');
const { syncRules } = require('./rules');
const { renderScanSummary, scanProject } = require('./project-scanner');
import type { ProjectScanSummary } from './project-scanner';

export interface InitOptions {
  force: boolean;
  template: string;
  projectRoot: string;
  repoRoot: string;
  sync?: boolean;
  migrate?: boolean;
  installAgents?: boolean;
  home?: string;
}

export interface InitResult {
  projectRoot: string;
  template: string;
  configCreated: boolean;
  projectCreated: boolean;
  rulesUpdated: number;
  directories: string[];
  migratedLegacy: boolean;
  syncedTargets: string[];
  installedAgentTargets: string[];
  scanSummary: string;
  contextFilesUpdated: number;
}

export interface InitRulesResult {
  projectRoot: string;
  scanSummary: string;
  contextFilesUpdated: number;
  rulesUpdated: number;
  promptPath: string;
  ruleNames: string[];
}

const ENGINE_DIRECTORIES = [
  `${ENGINE_DIR}/workflows`,
  `${ENGINE_DIR}/rules`,
  `${ENGINE_DIR}/context`,
  `${ENGINE_DIR}/generated-skills`,
  `${ENGINE_DIR}/memory/executions`,
  `${ENGINE_DIR}/memory/learnings/candidates`,
  `${ENGINE_DIR}/memory/learnings/adopted`,
  `${ENGINE_DIR}/memory/preferences`,
  `${ENGINE_DIR}/memory/skill-candidates`,
  `${ENGINE_DIR}/memory/specs`,
  'openspec/changes',
  'openspec/specs',
  'openspec/archive'
];

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFileIfNeeded(filePath: string, content: string, force: boolean): boolean {
  if (force || !fs.existsSync(filePath)) {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    return true;
  }

  return false;
}

function copyFileIfNeeded(sourcePath: string, targetPath: string, force: boolean): boolean {
  if (!fs.existsSync(sourcePath) || path.resolve(sourcePath) === path.resolve(targetPath)) {
    return false;
  }

  if (force || !fs.existsSync(targetPath)) {
    ensureDirectory(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
    return true;
  }

  return false;
}

function appendGitignoreOnce(projectRoot: string, pattern: string): void {
  const gitignorePath = path.join(projectRoot, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `${pattern}\n`, 'utf8');
    return;
  }

  const lines = fs.readFileSync(gitignorePath, 'utf8').split('\n');
  if (!lines.includes(pattern)) {
    const prefix = lines.length > 0 && lines[lines.length - 1] !== '' ? '\n' : '';
    fs.appendFileSync(gitignorePath, `${prefix}${pattern}\n`, 'utf8');
  }
}

function formatList(values: string[], fallback: string = 'none detected'): string {
  return values.length > 0 ? values.join(', ') : fallback;
}

function buildDefaultConfig(scan: ProjectScanSummary, template: string): any {
  const uiRules = scan.hasUi ? ['i18n', 'theme', 'design-tokens'] : [];
  const componentRules = scan.hasUi
    ? ['code-style', 'architecture', 'tooling', 'design-tokens', 'theme']
    : ['code-style', 'architecture', 'tooling'];

  return {
    project: {
      name: scan.projectName,
      template,
      type: scan.projectType,
      framework: scan.framework,
      language: scan.language,
      packageManager: scan.packageManager,
      tooling: scan.tooling,
      sourceDirectories: scan.sourceDirectories,
      testFrameworks: scan.testFrameworks,
      detectedPatterns: scan.detectedPatterns
    },
    version: '1.0.0',
    workflows: {
      'ui-restore': {
        enabled: scan.hasUi,
        rules: uiRules
      },
      'bug-analysis': {
        enabled: true,
        rules: ['code-style', 'architecture', 'tooling']
      },
      'component-gen': {
        enabled: true,
        rules: componentRules
      },
      'api-integration': {
        enabled: true,
        rules: ['code-style', 'architecture', 'tooling']
      },
      spec: {
        enabled: true,
        format: 'openspec-compatible',
        options: {
          specRoot: 'openspec',
          changesDir: 'openspec/changes',
          specsDir: 'openspec/specs',
          archiveDir: 'openspec/archive',
          memoryDir: `${ENGINE_DIR}/memory/specs`,
          defaultFlow: 'import-decompose-plan-apply-verify-archive',
          manualFlow: 'propose-plan-apply-verify-archive',
          contextDirName: 'context',
          assetsDirName: 'assets',
          verifyCommands: []
        }
      }
    },
    memory: {
      enabled: true,
      captureMode: 'selective',
      allowSources: {
        workflow_command: true,
        explicit_remember: true,
        post_run_promotion: true
      },
      thresholds: {
        preferencePromotion: 0.8,
        knowledgePromotion: 0.85,
        skillCandidatePromotion: 0.9
      },
      retention: '90d',
      maxExecutions: 1000
    },
    evolution: {
      enabled: true,
      autoApply: false,
      requireVerification: true,
      candidateOnly: true,
      thresholds: {
        learningCandidateMinEvidence: 3,
        skillCandidateMinEvidence: 3,
        adoptedPreferenceMinEvidence: 2
      },
      evaluationInterval: 'daily',
      optimizationThreshold: 85
    }
  };
}

function buildOMEMarkdown(scan: ProjectScanSummary, template: string): string {
  const config = buildDefaultConfig(scan, template);
  const frontmatter = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  const docs = `# Oh My Engine Configuration

## Project Information

- **Project Name**: ${scan.projectName}
- **Template**: ${template}
- **Project Type**: ${scan.projectType}
- **Framework**: ${scan.framework}
- **Language**: ${scan.language}
- **Package Manager**: ${scan.packageManager}
- **Version**: 1.0.0

## Project Scan

- **Source Directories**: ${formatList(scan.sourceDirectories)}
- **Test Frameworks**: ${formatList(scan.testFrameworks)}
- **Tooling**: ${formatList(scan.tooling)}
- **Detected Patterns**: ${formatList(scan.detectedPatterns)}

## Workflows

This project has the following workflows enabled:

- **ui-restore**: ${scan.hasUi ? 'UI restoration workflow with UI rules' : 'disabled because no UI framework was detected'}
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

For deeper AI-assisted personalization, ask your agent editor to follow \`${ENGINE_DIR}/context/rules-generation-prompt.md\`.

## Getting Started

Run \`ome help\` to see available commands.
`;

  return `---
${frontmatter}---

${docs}`;
}

function renderProjectProfile(scan: ProjectScanSummary): string {
  const extensions = Object.entries(scan.sourceExtensions)
    .map(([extension, count]) => `${extension}: ${count}`)
    .join(', ') || 'none detected';

  return [
    '## Project Profile',
    '',
    `- Project type: ${scan.projectType}`,
    `- Framework: ${scan.framework}`,
    `- Language: ${scan.language}`,
    `- Package manager: ${scan.packageManager}`,
    `- Source directories: ${formatList(scan.sourceDirectories)}`,
    `- Test frameworks: ${formatList(scan.testFrameworks)}`,
    `- Tooling: ${formatList(scan.tooling)}`,
    `- Source extensions: ${extensions}`,
    `- Existing rule files: ${formatList(scan.existingRuleFiles)}`,
    `- Detected patterns: ${formatList(scan.detectedPatterns)}`,
    ''
  ].join('\n');
}

function buildRule(ruleName: string, description: string, category: string, body: string): string {
  return `---
rule: ${ruleName}
version: 1.0.0
description: ${description}
category: ${category}
---

${body.trimEnd()}
`;
}

function buildCodeStyleRule(scan: ProjectScanSummary): string {
  return buildRule('code-style', `Code style rules for ${scan.language} ${scan.framework} projects`, 'code-quality', `
# Code Style

${renderProjectProfile(scan)}
## Rules

- Match the existing ${scan.language} style in ${formatList(scan.sourceDirectories, 'the repository source directories')}.
- Prefer typed interfaces and explicit return shapes when changing shared code.
- Keep module boundaries consistent with the current directory structure.
- Use the existing package manager (${scan.packageManager}) and scripts instead of adding parallel tooling.
- Preserve existing CommonJS/ESM conventions found in the project.

## Verification

- Run the configured check script when available: ${scan.scripts.check ? `\`${scan.packageManager} run check\`` : 'no check script detected'}.
- Run the configured build script when available: ${scan.scripts.build ? `\`${scan.packageManager} run build\`` : 'no build script detected'}.
`);
}

function buildTestingRule(scan: ProjectScanSummary): string {
  return buildRule('testing', `Testing rules for ${formatList(scan.testFrameworks, scan.language)}`, 'testing', `
# Testing

${renderProjectProfile(scan)}
## Rules

- Add or update tests near the behavior being changed.
- Prefer the detected test framework(s): ${formatList(scan.testFrameworks)}.
- Keep test fixtures small and deterministic.
- Cover initialization, rule generation, config parsing, and sync behavior when changing Oh My Engine workflows.

## Verification

- Primary test command: ${scan.scripts.test ? `\`${scan.packageManager} test\`` : 'no test script detected'}.
- Full verification command: ${scan.scripts.verify ? `\`${scan.packageManager} run verify\`` : 'no verify script detected'}.
`);
}

function buildArchitectureRule(scan: ProjectScanSummary): string {
  return buildRule('architecture', `Architecture rules for ${scan.projectType} projects`, 'architecture', `
# Architecture

${renderProjectProfile(scan)}
## Rules

- Keep workflow orchestration, filesystem helpers, and platform adapters separated by responsibility.
- Prefer small core modules with explicit inputs and deterministic outputs.
- Do not introduce network or model-provider dependencies into initialization unless explicitly configured.
- Store generated project context under \`${ENGINE_DIR}/context/\` and source rules under \`${ENGINE_DIR}/rules/\`.
- Keep platform-specific generated files derived from \`${ENGINE_DIR}/rules/\` through \`ome rules sync\`.
`);
}

function buildToolingRule(scan: ProjectScanSummary): string {
  const scriptLines = Object.entries(scan.scripts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, command]) => `- \`${name}\`: \`${command}\``)
    .join('\n') || '- No package scripts detected.';

  return buildRule('tooling', `Tooling rules for ${scan.packageManager}`, 'toolchain', `
# Tooling

${renderProjectProfile(scan)}
## Package Scripts

${scriptLines}

## Rules

- Use ${scan.packageManager} for dependency and script commands.
- Keep generated files deterministic so tests can assert exact behavior.
- Avoid adding new runtime dependencies for local project scanning.
`);
}

function buildUiRule(ruleName: string, title: string, scan: ProjectScanSummary): string {
  return buildRule(ruleName, `${title} rules for ${scan.framework}`, 'ui', `
# ${title}

${renderProjectProfile(scan)}
## Rules

- Follow the detected UI stack: ${scan.framework}.
- Reuse existing component, styling, and localization patterns from the source directories.
- Do not assume React Native conventions unless the scan detects React Native or Expo.
- Keep UI-facing rules grounded in actual repository files and dependencies.
`);
}

function buildGeneratedRules(scan: ProjectScanSummary): Record<string, string> {
  const rules: Record<string, string> = {
    'code-style': buildCodeStyleRule(scan),
    testing: buildTestingRule(scan),
    architecture: buildArchitectureRule(scan),
    tooling: buildToolingRule(scan)
  };

  if (scan.hasUi) {
    rules.theme = buildUiRule('theme', 'Theme', scan);
    rules['design-tokens'] = buildUiRule('design-tokens', 'Design Tokens', scan);
    rules.i18n = buildUiRule('i18n', 'Internationalization', scan);
  }

  return rules;
}

function buildRulesGenerationPrompt(scan: ProjectScanSummary): string {
  return `# Generate Personalized Oh My Engine Rules

You are running inside an AI agent editor such as Codex, Claude Code, or Antigravity.

## Goal

Rewrite the Markdown files under \`${ENGINE_DIR}/rules/\` so they reflect this repository's latest code, architecture, tooling, and team conventions.

## Required Context

- Read \`${ENGINE_DIR}/context/project-scan.json\` first.
- Inspect representative source files from: ${formatList(scan.sourceDirectories, 'repository source directories')}.
- Inspect package scripts and existing tests before changing testing or tooling rules.
- Preserve \`${ENGINE_DIR}/rules/\` as the only source of truth for project rules.
- After editing rules, run \`ome rules sync\` so platform files are regenerated.

## Current Scan Summary

${renderProjectProfile(scan)}
## Output Expectations

- Keep rules specific to this repository, not generic framework advice.
- Include concrete verification commands when the repository defines them.
- Do not add API keys, model calls, or external network dependencies to the CLI.
`;
}

function writeProjectContext(projectRoot: string, scan: ProjectScanSummary, force: boolean): number {
  let updated = 0;
  if (writeFileIfNeeded(currentEnginePath(projectRoot, 'context', 'project-scan.json'), JSON.stringify(scan, null, 2), force)) updated += 1;
  if (writeFileIfNeeded(currentEnginePath(projectRoot, 'context', 'rules-generation-prompt.md'), buildRulesGenerationPrompt(scan), force)) updated += 1;
  return updated;
}

function writeGeneratedRules(projectRoot: string, scan: ProjectScanSummary, force: boolean): { updated: number; ruleNames: string[] } {
  const generatedRules = buildGeneratedRules(scan);
  let updated = 0;

  for (const [rule, content] of Object.entries(generatedRules)) {
    if (writeFileIfNeeded(currentEnginePath(projectRoot, 'rules', `${rule}.md`), content, force)) {
      updated += 1;
    }
  }

  return { updated, ruleNames: Object.keys(generatedRules).sort() };
}

export function parseInitArgs(args: string[], defaults: Partial<InitOptions> = {}): InitOptions {
  const options: InitOptions = {
    force: false,
    template: 'default',
    projectRoot: defaults.projectRoot || process.cwd(),
    repoRoot: defaults.repoRoot || process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..'),
    sync: defaults.sync ?? true,
    migrate: defaults.migrate ?? true,
    installAgents: defaults.installAgents ?? false,
    home: defaults.home
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    if (argument === '--no-sync') {
      options.sync = false;
      continue;
    }

    if (argument === '--no-migrate') {
      options.migrate = false;
      continue;
    }

    if (argument === '--install-agents') {
      options.installAgents = true;
      continue;
    }

    if (argument === '--template') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --template');
      }
      options.template = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--project-root') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --project-root');
      }
      options.projectRoot = path.resolve(args[index + 1]);
      index += 1;
      continue;
    }

    if (argument === '--home') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --home');
      }
      options.home = path.resolve(args[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

export function initializeProject(options: InitOptions): InitResult {
  const migration = options.migrate !== false ? migrateLegacyEngineDirectory(options.projectRoot) : { migrated: false };
  const scan = scanProject(options.projectRoot) as ProjectScanSummary;
  const createdDirectories: string[] = [];

  for (const directory of ENGINE_DIRECTORIES) {
    const target = path.join(options.projectRoot, directory);
    ensureDirectory(target);
    createdDirectories.push(directory);
  }

  const configCreated = writeFileIfNeeded(
    path.join(options.projectRoot, 'OME.md'),
    buildOMEMarkdown(scan, options.template),
    options.force
  );

  const projectCreated = copyFileIfNeeded(
    path.join(options.repoRoot, 'skills', 'oh-my-engine-spec', 'templates', 'project.md'),
    path.join(options.projectRoot, 'openspec', 'project.md'),
    options.force
  );

  copyFileIfNeeded(
    repoEnginePath(options.repoRoot, 'platforms.json'),
    currentEnginePath(options.projectRoot, 'platforms.json'),
    options.force
  );

  const generatedRules = writeGeneratedRules(options.projectRoot, scan, options.force);
  const rulesUpdated = generatedRules.updated;

  const contextFilesUpdated = writeProjectContext(options.projectRoot, scan, options.force);

  appendGitignoreOnce(options.projectRoot, `${ENGINE_DIR}/memory/`);

  const syncedTargets = options.sync !== false
    ? syncRules([], options.projectRoot).map((result: Record<string, any>) => `${result.platform}: ${result.target}`)
    : [];

  let installedAgentTargets: string[] = [];
  if (options.installAgents === true) {
    const { installAgents } = require('./agents');
    installedAgentTargets = installAgents({ platforms: [], all: true, home: options.home }).map((result: Record<string, any>) => `${result.platform}: ${result.target}`);
  }

  return {
    projectRoot: options.projectRoot,
    template: options.template,
    configCreated,
    projectCreated,
    rulesUpdated,
    directories: createdDirectories,
    migratedLegacy: Boolean(migration.migrated),
    syncedTargets,
    installedAgentTargets,
    scanSummary: renderScanSummary(scan),
    contextFilesUpdated
  };
}

export function initializeProjectRules(projectRoot: string = process.cwd(), force: boolean = true): InitRulesResult {
  ensureDirectory(currentEnginePath(projectRoot, 'rules'));
  ensureDirectory(currentEnginePath(projectRoot, 'context'));

  const scan = scanProject(projectRoot) as ProjectScanSummary;
  const generatedRules = writeGeneratedRules(projectRoot, scan, force);
  const contextFilesUpdated = writeProjectContext(projectRoot, scan, force);

  return {
    projectRoot,
    scanSummary: renderScanSummary(scan),
    contextFilesUpdated,
    rulesUpdated: generatedRules.updated,
    promptPath: currentEnginePath(projectRoot, 'context', 'rules-generation-prompt.md'),
    ruleNames: generatedRules.ruleNames
  };
}

export function renderInitRulesResult(result: InitRulesResult): string {
  return [
    `Initialized personalized rule context in ${result.projectRoot}`,
    `Project scan: ${result.scanSummary}`,
    `Rule drafts updated: ${result.rulesUpdated}`,
    `Agent context files updated: ${result.contextFilesUpdated}`,
    `Rules: ${result.ruleNames.join(', ')}`,
    '',
    'Agent next steps:',
    `  - Read ${ENGINE_DIR}/context/project-scan.json`,
    `  - Read ${ENGINE_DIR}/context/rules-generation-prompt.md`,
    `  - Inspect representative source files before editing ${ENGINE_DIR}/rules/*.md`,
    `  - Rewrite ${ENGINE_DIR}/rules/*.md so they match this repository`,
    '  - Run `ome rules sync` after editing rules'
  ].join('\n') + '\n';
}

export function renderInitResult(result: InitResult): string {
  return [
    `Initialized Oh My Engine project in ${result.projectRoot}`,
    `Template: ${result.template}`,
    `Legacy .oh-my-engine migration: ${result.migratedLegacy ? 'migrated to .ome' : 'not needed'}`,
    `Project scan: ${result.scanSummary}`,
    `Config: ${result.configCreated ? 'created' : 'preserved'}`,
    `openspec/project.md: ${result.projectCreated ? 'created' : 'preserved'}`,
    `Rule files updated: ${result.rulesUpdated}`,
    `Agent context files updated: ${result.contextFilesUpdated}`,
    `Integration targets synced: ${result.syncedTargets.length}`,
    ...result.syncedTargets.map(target => `  - ${target}`),
    `Agent commands installed: ${result.installedAgentTargets.length}`,
    ...result.installedAgentTargets.map(target => `  - ${target}`),
    'Created directories:',
    `  - ${ENGINE_DIR}/`,
    '  - openspec/',
    'Next steps:',
    `  - Review ${ENGINE_DIR}/rules/ for the local scan-based rule drafts`,
    `  - In Codex, Claude Code, or Antigravity, load ${ENGINE_DIR}/context/rules-generation-prompt.md to personalize rules from the latest source code`
  ].join('\n') + '\n';
}
