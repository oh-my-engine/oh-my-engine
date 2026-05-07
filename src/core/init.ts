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
  projectAgentTargets: string[];
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

function planRuleNames(scan: ProjectScanSummary): string[] {
  const rules = new Set([
    'project-overview',
    'code-style',
    'testing',
    'architecture',
    'tooling',
    'security',
    'logging-error-handling'
  ]);

  if (scan.serverFrameworks.includes('Koa')) rules.add('server-koa');
  if (scan.serverFrameworks.includes('Express')) rules.add('server-express');
  if (scan.serverFrameworks.includes('Fastify')) rules.add('server-fastify');
  if (scan.routeFiles.length > 0 || scan.middlewareFiles.length > 0 || scan.sourceSignals.includes('http-routing')) rules.add('routing-middleware');
  if (scan.templateEngines.length > 0 || scan.sourceSignals.includes('static-file-serving')) rules.add('views-static-assets');
  if (scan.buildTools.includes('gulp')) rules.add('build-gulp');
  if (scan.styleSystems.length > 0) rules.add('styling-assets');
  if (scan.i18nSignals.length > 0) rules.add('i18n');
  if (scan.uiFrameworks.length > 0 || scan.mobileFrameworks.length > 0) rules.add('theme');
  if (scan.uiFrameworks.length > 0 || scan.mobileFrameworks.length > 0 || scan.styleSystems.includes('tailwind')) rules.add('design-tokens');
  if (scan.sourceSignals.includes('environment-variables') || scan.deploymentSignals.includes('env-template') || scan.configFiles.length > 0) rules.add('configuration-env');
  if (scan.databaseSignals.length > 0) rules.add('data-access');
  if (scan.deploymentSignals.length > 0) rules.add('deployment');

  return Array.from(rules).sort();
}

function buildDefaultConfig(scan: ProjectScanSummary, template: string): any {
  const ruleSet = new Set(planRuleNames(scan));
  const allRules = Array.from(ruleSet);
  const uiRules = ['theme', 'design-tokens', 'i18n', 'views-static-assets', 'styling-assets'].filter(rule => ruleSet.has(rule));
  const apiRules = ['server-koa', 'server-express', 'server-fastify', 'routing-middleware', 'data-access', 'configuration-env', 'security', 'logging-error-handling'].filter(rule => ruleSet.has(rule));
  const componentRules = ['code-style', 'architecture', 'tooling', 'views-static-assets', 'styling-assets', 'theme', 'design-tokens'].filter(rule => ruleSet.has(rule));

  return {
    project: {
      name: scan.projectName,
      template,
      type: scan.projectType,
      framework: scan.framework,
      frameworks: scan.frameworks,
      language: scan.language,
      packageManager: scan.packageManager,
      tooling: scan.tooling,
      sourceDirectories: scan.sourceDirectories,
      testFramework: scan.testFrameworks[0] || 'unknown',
      testFrameworks: scan.testFrameworks,
      buildTools: scan.buildTools,
      filesScanned: scan.filesScanned,
      detectedPatterns: scan.detectedPatterns
    },
    version: '1.0.0',
    workflows: {
      'ui-restore': {
        enabled: uiRules.length > 0,
        rules: uiRules
      },
      'bug-analysis': {
        enabled: true,
        rules: ['project-overview', 'code-style', 'architecture', 'testing', 'tooling', 'security', 'logging-error-handling'].filter(rule => ruleSet.has(rule))
      },
      'component-gen': {
        enabled: true,
        rules: componentRules
      },
      'api-integration': {
        enabled: true,
        rules: apiRules.length > 0 ? apiRules : ['project-overview', 'code-style', 'architecture', 'tooling'].filter(rule => ruleSet.has(rule))
      },
      'rules-personalization': {
        enabled: true,
        rules: allRules
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
- **Frameworks**: ${formatList(scan.frameworks)}
- **Language**: ${scan.language}
- **Package Manager**: ${scan.packageManager}
- **Version**: 1.0.0

## Project Scan

- **Files Scanned**: ${scan.filesScanned}
- **Source Directories**: ${formatList(scan.sourceDirectories)}
- **Entrypoints**: ${formatList(scan.entrypoints)}
- **Test Frameworks**: ${formatList(scan.testFrameworks)}
- **Tooling**: ${formatList(scan.tooling)}
- **Build Tools**: ${formatList(scan.buildTools)}
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

  const sampleFiles = scan.sampleFiles.slice(0, 24).map(file => `  - ${file}`).join('\n') || '  - none detected';
  const configFiles = scan.configFiles.slice(0, 24).map(file => `  - ${file}`).join('\n') || '  - none detected';

  return [
    '## Project Profile',
    '',
    `- Project type: ${scan.projectType}`,
    `- Primary framework: ${scan.framework}`,
    `- Frameworks: ${formatList(scan.frameworks)}`,
    `- Language: ${scan.language}`,
    `- Package manager: ${scan.packageManager}`,
    `- Files scanned: ${scan.filesScanned}`,
    `- Source directories: ${formatList(scan.sourceDirectories)}`,
    `- Entrypoints: ${formatList(scan.entrypoints)}`,
    `- Route files: ${formatList(scan.routeFiles.slice(0, 12))}`,
    `- Middleware files: ${formatList(scan.middlewareFiles.slice(0, 12))}`,
    `- Test frameworks: ${formatList(scan.testFrameworks)}`,
    `- Test files: ${formatList(scan.testFiles.slice(0, 12))}`,
    `- Tooling: ${formatList(scan.tooling)}`,
    `- Build tools: ${formatList(scan.buildTools)}`,
    `- Server frameworks: ${formatList(scan.serverFrameworks)}`,
    `- UI frameworks: ${formatList(scan.uiFrameworks)}`,
    `- Mobile frameworks: ${formatList(scan.mobileFrameworks)}`,
    `- Template engines: ${formatList(scan.templateEngines)}`,
    `- Style systems: ${formatList(scan.styleSystems)}`,
    `- i18n signals: ${formatList(scan.i18nSignals)}`,
    `- Database signals: ${formatList(scan.databaseSignals)}`,
    `- Deployment signals: ${formatList(scan.deploymentSignals)}`,
    `- Source signals: ${formatList(scan.sourceSignals)}`,
    `- Source extensions: ${extensions}`,
    `- Existing rule files: ${formatList(scan.existingRuleFiles)}`,
    `- Detected patterns: ${formatList(scan.detectedPatterns)}`,
    '',
    '## Representative Files',
    '',
    sampleFiles,
    '',
    '## Config Files',
    '',
    configFiles,
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

function ruleList(values: string[], fallback: string = '- None detected.'): string {
  return values.length > 0 ? values.map(value => `- \`${value}\``).join('\n') : fallback;
}

function commandFor(scan: ProjectScanSummary, scriptName: string): string {
  if (!scan.scripts[scriptName]) return 'not configured';
  if (scriptName === 'test' && scan.packageManager === 'npm') return '`npm test`';
  return `\`${scan.packageManager} run ${scriptName}\``;
}

function buildProjectOverviewRule(scan: ProjectScanSummary): string {
  return buildRule('project-overview', `Repository profile for ${scan.projectName}`, 'project-profile', `
# Project Overview

${renderProjectProfile(scan)}
## Rules

- Treat \`${ENGINE_DIR}/context/project-scan.json\` as the machine-readable baseline, then inspect the current source before making architecture claims.
- Prefer rules that name actual directories, entrypoints, scripts, dependencies, and framework signals from this repository.
- Keep generated platform files derived from \`${ENGINE_DIR}/rules/\` through \`ome rules sync\`.
- Do not assume React, React Native, mobile, or UI conventions unless the scan lists those frameworks or signals.

## Update Checklist

- Refresh this rule with \`ome init-rules\` after major directory, framework, or build-system changes.
- Regenerate agent platform files with \`ome rules sync\` after editing any rule file.
`);
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
- Preserve existing module conventions detected in source: ${formatList(scan.sourceSignals.filter(signal => signal.includes('commonjs') || signal.includes('esm')), 'inspect imports/exports before editing')}.
- Keep changes close to representative source files and naming patterns from the scan instead of introducing generic templates.

## Verification

- Check script: ${commandFor(scan, 'check')}.
- Lint script: ${commandFor(scan, 'lint')}.
- Build script: ${commandFor(scan, 'build')}.
`);
}

function buildTestingRule(scan: ProjectScanSummary): string {
  return buildRule('testing', `Testing rules for ${formatList(scan.testFrameworks, scan.language)}`, 'testing', `
# Testing

${renderProjectProfile(scan)}
## Rules

- Add or update tests near the behavior being changed.
- Prefer the detected test framework(s): ${formatList(scan.testFrameworks)}.
- Existing test files found by scan:
${ruleList(scan.testFiles.slice(0, 20))}
- Keep test fixtures small and deterministic.
- When changing code without a detected framework, add the smallest local test that follows the closest existing file naming convention.

## Verification

- Primary test command: ${commandFor(scan, 'test')}.
- Full verification command: ${commandFor(scan, 'verify')}.
`);
}

function buildArchitectureRule(scan: ProjectScanSummary): string {
  return buildRule('architecture', `Architecture rules for ${scan.projectType} projects`, 'architecture', `
# Architecture

${renderProjectProfile(scan)}
## Rules

- Keep changes inside the existing top-level responsibilities: ${formatList(scan.sourceDirectories)}.
- Use detected entrypoints as orientation before changing cross-cutting behavior: ${formatList(scan.entrypoints)}.
- Keep framework-specific behavior in files that already own that framework or route/middleware concern.
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
- Prefer existing build tools: ${formatList(scan.buildTools)}.
- Config files discovered by the scan:
${ruleList(scan.configFiles.slice(0, 24))}
- Keep generated files deterministic so tests can assert exact behavior.
- Avoid adding new runtime dependencies for local project scanning.
`);
}

function buildServerRule(ruleName: string, framework: string, scan: ProjectScanSummary): string {
  const title = `${framework} Server`;
  return buildRule(ruleName, `${framework} server rules`, 'server', `
# ${title}

${renderProjectProfile(scan)}
## Rules

- Follow the detected ${framework} application shape instead of replacing it with a different server framework.
- Inspect entrypoints and route registration before adding middleware: ${formatList(scan.entrypoints)}.
- Keep request lifecycle behavior consistent with detected source signals: ${formatList(scan.sourceSignals.filter(signal => signal.includes('routing') || signal.includes('context') || signal.includes('handlers') || signal.includes('body')), 'inspect server files first')}.
- Put new handlers, services, and middleware in the existing directories when they are present.

## Server Files

${ruleList([...scan.entrypoints, ...scan.routeFiles.slice(0, 16), ...scan.middlewareFiles.slice(0, 16)])}
`);
}

function buildRoutingMiddlewareRule(scan: ProjectScanSummary): string {
  return buildRule('routing-middleware', 'Routing and middleware rules', 'server', `
# Routing And Middleware

${renderProjectProfile(scan)}
## Rules

- Read existing route and middleware files before adding endpoints.
- Keep route registration order explicit; add global middleware only when it belongs in the existing server bootstrap path.
- Preserve framework conventions for request context, params, query, body parsing, status codes, and error propagation.
- Avoid hiding business behavior in anonymous middleware when a named handler or service better matches the project structure.

## Route Files

${ruleList(scan.routeFiles.slice(0, 30))}

## Middleware Files

${ruleList(scan.middlewareFiles.slice(0, 30))}
`);
}

function buildViewsStaticAssetsRule(scan: ProjectScanSummary): string {
  return buildRule('views-static-assets', 'Server-rendered views and static asset rules', 'ui', `
# Views And Static Assets

${renderProjectProfile(scan)}
## Rules

- Treat this as a server-rendered or asset-served project when template engines or static asset folders are present.
- Reuse detected template engines: ${formatList(scan.templateEngines)}.
- Keep public/static/assets paths compatible with existing middleware and build scripts.
- Do not generate React Native, mobile, or app-router assumptions unless those frameworks are detected.

## Relevant Signals

- Template engines: ${formatList(scan.templateEngines)}
- Style systems: ${formatList(scan.styleSystems)}
- Static serving signals: ${formatList(scan.sourceSignals.filter(signal => signal.includes('static')))}
`);
}

function buildGulpRule(scan: ProjectScanSummary): string {
  return buildRule('build-gulp', 'Gulp build pipeline rules', 'toolchain', `
# Gulp Build Pipeline

${renderProjectProfile(scan)}
## Rules

- Preserve the existing Gulp pipeline and task names when editing build behavior.
- Inspect \`gulpfile.*\` and scripts that invoke \`gulp\` before changing asset processing.
- Keep generated assets, watch tasks, and production build tasks deterministic.
- Do not add a parallel Vite/Webpack pipeline unless the repository already uses it or the change explicitly calls for a migration.

## Verification

- Build command: ${commandFor(scan, 'build')}.
- Test command: ${commandFor(scan, 'test')}.
`);
}

function buildStylingAssetsRule(scan: ProjectScanSummary): string {
  return buildRule('styling-assets', 'Styling and frontend asset rules', 'ui', `
# Styling And Assets

${renderProjectProfile(scan)}
## Rules

- Reuse detected styling systems: ${formatList(scan.styleSystems)}.
- Keep styles in the existing asset directories and extension conventions.
- Preserve server-rendered template compatibility when templates and public/static folders are present.
- Avoid introducing a design token layer unless this repository already has tokens, UI framework conventions, or the task asks for one.
`);
}

function buildI18nRule(scan: ProjectScanSummary): string {
  return buildRule('i18n', 'Internationalization rules', 'localization', `
# Internationalization

${renderProjectProfile(scan)}
## Rules

- Follow existing localization signals: ${formatList(scan.i18nSignals)}.
- Reuse current locale directories, message formats, and translation helper names.
- Do not add i18n scaffolding to unrelated UI or backend files unless the project already contains localization usage.
- Keep user-facing strings consistent with the detected template, component, or server-rendered layer.
`);
}

function buildThemeRule(scan: ProjectScanSummary): string {
  return buildRule('theme', `Theme rules for ${formatList(scan.uiFrameworks.concat(scan.templateEngines), scan.framework)}`, 'ui', `
# Theme

${renderProjectProfile(scan)}
## Rules

- Base theme changes on actual UI/template/style files in this repository.
- Preserve existing CSS, Sass, Less, Tailwind, or component styling conventions.
- Do not assume React Native theme APIs unless React Native or Expo is detected.
`);
}

function buildDesignTokensRule(scan: ProjectScanSummary): string {
  return buildRule('design-tokens', 'Design token rules', 'ui', `
# Design Tokens

${renderProjectProfile(scan)}
## Rules

- Only add or modify tokens where the repository already has a token-like source, theme config, Tailwind config, CSS variables, or a task explicitly requires it.
- Keep token naming compatible with existing style systems: ${formatList(scan.styleSystems)}.
- Avoid creating mobile-specific token rules unless the scan detects React Native or Expo.
`);
}

function buildConfigurationEnvRule(scan: ProjectScanSummary): string {
  return buildRule('configuration-env', 'Configuration and environment rules', 'configuration', `
# Configuration And Environment

${renderProjectProfile(scan)}
## Rules

- Inspect config files before adding new settings.
- Keep environment variable names consistent with existing \`process.env\` usage and env template files.
- Do not commit secrets or generate API keys into rules, configs, examples, or prompts.
- Prefer documented defaults and explicit validation when adding required configuration.

## Config Files

${ruleList(scan.configFiles.slice(0, 40))}
`);
}

function buildDataAccessRule(scan: ProjectScanSummary): string {
  return buildRule('data-access', 'Data access rules', 'data', `
# Data Access

${renderProjectProfile(scan)}
## Rules

- Follow the detected data access layer and dependency signals: ${formatList(scan.databaseSignals)}.
- Keep query, migration, model, and repository changes close to existing directories.
- Avoid mixing ORM and raw-driver patterns unless the repository already does so.
- Add tests or fixtures around persistence behavior when changing schema, queries, or repository boundaries.
`);
}

function buildDeploymentRule(scan: ProjectScanSummary): string {
  return buildRule('deployment', 'Deployment and runtime rules', 'deployment', `
# Deployment And Runtime

${renderProjectProfile(scan)}
## Rules

- Preserve existing deployment targets and runtime assumptions: ${formatList(scan.deploymentSignals)}.
- Check Docker, Nginx, PM2, and CI files before changing ports, build outputs, public paths, or process commands.
- Keep local scripts and production commands aligned.
`);
}

function buildSecurityRule(scan: ProjectScanSummary): string {
  return buildRule('security', 'Security rules', 'security', `
# Security

${renderProjectProfile(scan)}
## Rules

- Validate request input at route or service boundaries when adding server behavior.
- Do not log secrets, tokens, passwords, raw authorization headers, or full request bodies.
- Keep authentication, authorization, CORS, body parsing, static serving, and file upload behavior consistent with existing middleware.
- Treat environment variables and deployment configs as sensitive unless they are explicit examples.
`);
}

function buildLoggingErrorHandlingRule(scan: ProjectScanSummary): string {
  return buildRule('logging-error-handling', 'Logging and error handling rules', 'observability', `
# Logging And Error Handling

${renderProjectProfile(scan)}
## Rules

- Preserve existing error propagation conventions in route, middleware, CLI, and service code.
- Keep logs actionable and avoid noisy console output in library or test code.
- Use the repository's current logger or console convention before adding a new logging dependency.
- Convert expected validation or user errors into framework-appropriate responses; reserve thrown errors for exceptional paths.
`);
}

function buildGeneratedRules(scan: ProjectScanSummary): Record<string, string> {
  const rules: Record<string, string> = {
    'project-overview': buildProjectOverviewRule(scan),
    'code-style': buildCodeStyleRule(scan),
    testing: buildTestingRule(scan),
    architecture: buildArchitectureRule(scan),
    tooling: buildToolingRule(scan),
    security: buildSecurityRule(scan),
    'logging-error-handling': buildLoggingErrorHandlingRule(scan)
  };

  if (scan.serverFrameworks.includes('Koa')) rules['server-koa'] = buildServerRule('server-koa', 'Koa', scan);
  if (scan.serverFrameworks.includes('Express')) rules['server-express'] = buildServerRule('server-express', 'Express', scan);
  if (scan.serverFrameworks.includes('Fastify')) rules['server-fastify'] = buildServerRule('server-fastify', 'Fastify', scan);
  if (scan.routeFiles.length > 0 || scan.middlewareFiles.length > 0 || scan.sourceSignals.includes('http-routing')) rules['routing-middleware'] = buildRoutingMiddlewareRule(scan);
  if (scan.templateEngines.length > 0 || scan.sourceSignals.includes('static-file-serving')) rules['views-static-assets'] = buildViewsStaticAssetsRule(scan);
  if (scan.buildTools.includes('gulp')) rules['build-gulp'] = buildGulpRule(scan);
  if (scan.styleSystems.length > 0) rules['styling-assets'] = buildStylingAssetsRule(scan);
  if (scan.i18nSignals.length > 0) rules.i18n = buildI18nRule(scan);
  if (scan.uiFrameworks.length > 0 || scan.mobileFrameworks.length > 0) rules.theme = buildThemeRule(scan);
  if (scan.uiFrameworks.length > 0 || scan.mobileFrameworks.length > 0 || scan.styleSystems.includes('tailwind')) rules['design-tokens'] = buildDesignTokensRule(scan);
  if (scan.sourceSignals.includes('environment-variables') || scan.deploymentSignals.includes('env-template') || scan.configFiles.length > 0) rules['configuration-env'] = buildConfigurationEnvRule(scan);
  if (scan.databaseSignals.length > 0) rules['data-access'] = buildDataAccessRule(scan);
  if (scan.deploymentSignals.length > 0) rules.deployment = buildDeploymentRule(scan);

  return rules;
}

function buildRulesGenerationPrompt(scan: ProjectScanSummary): string {
  return `# Generate Personalized Oh My Engine Rules

You are running inside an AI agent editor such as Codex, Claude Code, or Antigravity.

## Goal

Rewrite the Markdown files under \`${ENGINE_DIR}/rules/\` so they reflect this repository's latest code, architecture, tooling, and team conventions.

## Required Context

- Read \`${ENGINE_DIR}/context/project-scan.json\` first.
- Inspect representative source files from the scan, including entrypoints, route files, middleware files, config files, tests, and sample files.
- Inspect package scripts and existing tests before changing testing or tooling rules.
- Preserve \`${ENGINE_DIR}/rules/\` as the only source of truth for project rules.
- After editing rules, run \`ome rules sync\` so platform files are regenerated.

## Current Scan Summary

${renderProjectProfile(scan)}
## Output Expectations

- Keep rules specific to this repository, not generic framework advice.
- Generate as many or as few rule files as the project needs. Do not force everything into four template files.
- Add framework/domain-specific rule files when the source supports them, such as \`server-koa.md\`, \`routing-middleware.md\`, \`build-gulp.md\`, \`views-static-assets.md\`, \`data-access.md\`, or \`deployment.md\`.
- Remove or avoid UI/mobile rules when the repository does not contain those frameworks or assets.
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

  const { installAgents } = require('./agents');
  const projectAgentTargets = installAgents({
    platforms: [],
    all: true,
    project: true,
    projectRoot: options.projectRoot
  }).map((result: Record<string, any>) => `${result.platform}: ${result.target}`);

  let installedAgentTargets: string[] = [];
  if (options.installAgents === true) {
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
    projectAgentTargets,
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
    `Project agent commands installed: ${result.projectAgentTargets.length}`,
    ...result.projectAgentTargets.map(target => `  - ${target}`),
    `Agent commands installed: ${result.installedAgentTargets.length}`,
    ...result.installedAgentTargets.map(target => `  - ${target}`),
    'Created directories:',
    `  - ${ENGINE_DIR}/`,
    '  - openspec/',
    'Next steps:',
    `  - Run \`ome init-rules\` after major code changes to refresh the dynamic rule set`,
    `  - Review ${ENGINE_DIR}/rules/ for the local scan-based rule drafts`,
    `  - In any Agent editor, run \`ome-init-rules\` or load ${ENGINE_DIR}/context/rules-generation-prompt.md to personalize rules from the latest source code`
  ].join('\n') + '\n';
}
