const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const { ENGINE_DIR, currentEnginePath, migrateLegacyEngineDirectory, repoEnginePath } = require('./paths');
const { syncRules } = require('./rules');
const { renderScanSummary, scanProject } = require('./project-scanner');
const { outputLanguageDisplayName, resolveOutputLanguage, isOutputLanguageChinese } = require('./output-language');
import type { ProjectScanSummary } from './project-scanner';
import type { OutputLanguageResolution } from './output-language';

export interface InitOptions {
  force: boolean;
  forceRules?: boolean;
  template: string;
  projectRoot: string;
  repoRoot: string;
  sync?: boolean;
  projectEntries?: boolean;
  migrate?: boolean;
  installAgents?: boolean;
  installOpenSpec?: boolean;
  home?: string;
  specRoot?: string;
  openspecInit?: boolean;
  outputLanguage?: string;
  defaultProjectPlatforms?: boolean;
}

export interface InitResult {
  projectRoot: string;
  template: string;
  configCreated: boolean;
  projectCreated: boolean;
  rulesUpdated: number;
  rulesCreated: number;
  rulesOverwritten: number;
  rulesPreserved: number;
  rulesBackupPath?: string;
  directories: string[];
  migratedLegacy: boolean;
  syncedTargets: string[];
  projectSkillTargets: string[];
  projectPlatformTargets: string[];
  projectSkillMirrorTargets: string[];
  installedAgentTargets: string[];
  openspecStatus: string;
  agentGuidanceFiles: string[];
  scanSummary: string;
  contextFilesUpdated: number;
  outputLanguage: string;
  outputLanguageSource: string;
}

export interface InitRulesResult {
  projectRoot: string;
  scanSummary: string;
  contextFilesUpdated: number;
  rulesUpdated: number;
  rulesCreated: number;
  rulesOverwritten: number;
  rulesPreserved: number;
  rulesBackupPath?: string;
  promptPath: string;
  ruleNames: string[];
  outputLanguage: string;
  outputLanguageSource: string;
}

const ENGINE_DIRECTORIES = [
  `${ENGINE_DIR}/workflows`,
  `${ENGINE_DIR}/rules`,
  `${ENGINE_DIR}/context`,
  `${ENGINE_DIR}/skills`,
  `${ENGINE_DIR}/generated-skills`,
  `${ENGINE_DIR}/memory/executions`,
  `${ENGINE_DIR}/memory/learnings/candidates`,
  `${ENGINE_DIR}/memory/learnings/adopted`,
  `${ENGINE_DIR}/memory/preferences`,
  `${ENGINE_DIR}/memory/skill-candidates`,
  `${ENGINE_DIR}/memory/specs`
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

function timestampForPath(date: Date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-');
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

function moveDirectoryContents(sourcePath: string, targetPath: string): void {
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  ensureDirectory(targetPath);

  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const sourceEntryPath = path.join(sourcePath, entry.name);
    const targetEntryPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      moveDirectoryContents(sourceEntryPath, targetEntryPath);
      if (fs.existsSync(sourceEntryPath) && fs.readdirSync(sourceEntryPath).length === 0) {
        fs.rmdirSync(sourceEntryPath);
      }
      continue;
    }

    if (fs.existsSync(targetEntryPath)) {
      fs.rmSync(sourceEntryPath, { force: true });
      continue;
    }

    ensureDirectory(path.dirname(targetEntryPath));
    fs.renameSync(sourceEntryPath, targetEntryPath);
  }

  if (fs.existsSync(sourcePath) && fs.readdirSync(sourcePath).length === 0) {
    fs.rmdirSync(sourcePath);
  }
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
    'agent-behavior',
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

function buildDefaultConfig(
  scan: ProjectScanSummary,
  template: string,
  specRoot: string,
  outputLanguage: OutputLanguageResolution
): any {
  const ruleSet = new Set(planRuleNames(scan));
  const allRules = Array.from(ruleSet);
  const uiRules = ['theme', 'design-tokens', 'i18n', 'views-static-assets', 'styling-assets'].filter(rule => ruleSet.has(rule));
  const apiRules = ['agent-behavior', 'server-koa', 'server-express', 'server-fastify', 'routing-middleware', 'data-access', 'configuration-env', 'security', 'logging-error-handling'].filter(rule => ruleSet.has(rule));
  const componentRules = ['agent-behavior', 'code-style', 'architecture', 'tooling', 'views-static-assets', 'styling-assets', 'theme', 'design-tokens'].filter(rule => ruleSet.has(rule));

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
    output: {
      language: outputLanguage.code,
      languageSource: outputLanguage.source,
      displayName: outputLanguageDisplayName(outputLanguage),
      ...(outputLanguage.requested ? { requested: outputLanguage.requested } : {}),
      ...(outputLanguage.systemLocale ? { systemLocale: outputLanguage.systemLocale } : {})
    },
    version: '1.0.0',
    workflows: {
      'ui-restore': {
        enabled: uiRules.length > 0,
        rules: uiRules
      },
      'bug-analysis': {
        enabled: true,
        rules: ['agent-behavior', 'project-overview', 'code-style', 'architecture', 'testing', 'tooling', 'security', 'logging-error-handling'].filter(rule => ruleSet.has(rule))
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
        enabled: false,
        provider: 'openspec',
        format: 'openspec',
        options: {
          specRoot,
          changesDir: `${specRoot}/changes`,
          specsDir: `${specRoot}/specs`,
          archiveDir: `${specRoot}/archive`,
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

function buildOMEMarkdown(
  scan: ProjectScanSummary,
  template: string,
  specRoot: string,
  outputLanguage: OutputLanguageResolution
): string {
  const config = buildDefaultConfig(scan, template, specRoot, outputLanguage);
  const frontmatter = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  const docs = isOutputLanguageChinese(outputLanguage)
    ? `# Oh My Engine 配置

## 项目信息

- **项目名称**: ${scan.projectName}
- **模板**: ${template}
- **项目类型**: ${scan.projectType}
- **框架**: ${formatList(scan.frameworks)}
- **语言**: ${scan.language}
- **包管理器**: ${scan.packageManager}
- **版本**: 1.0.0
- **输出语言**: ${outputLanguageDisplayName(outputLanguage)} (${outputLanguage.code})

## 项目扫描

- **扫描文件数**: ${scan.filesScanned}
- **源码目录**: ${formatList(scan.sourceDirectories)}
- **入口文件**: ${formatList(scan.entrypoints)}
- **测试框架**: ${formatList(scan.testFrameworks)}
- **工具链**: ${formatList(scan.tooling)}
- **构建工具**: ${formatList(scan.buildTools)}
- **检测到的模式**: ${formatList(scan.detectedPatterns)}

## 工作流

当前项目启用以下工作流：

- **ui-restore**: ${scan.hasUi ? '使用 UI 规则的界面恢复工作流' : '未检测到 UI 框架，默认禁用'}
- **bug-analysis**: 结合项目代码、架构和工具链规则的缺陷分析工作流
- **component-gen**: 组件生成工作流
- **api-integration**: API 集成工作流
- **spec**: 默认禁用；仅在需要高级兼容流程时使用 \`ome spec\`

## 记忆系统

记忆系统已启用选择性捕获模式，会记录：
- 工作流命令执行
- 显式记忆请求
- 运行后的候选提升

## 演进系统

演进系统会分析模式并提出改进建议，采纳前需要验证。

## Agent 个性化

如需更深入的 AI 辅助个性化，请让 Agent 编辑器遵循 \`${ENGINE_DIR}/context/rules-generation-prompt.md\`。

## 开始使用

运行 \`ome help\` 查看可用命令。
`
    : `# Oh My Engine Configuration

## Project Information

- **Project Name**: ${scan.projectName}
- **Template**: ${template}
- **Project Type**: ${scan.projectType}
- **Frameworks**: ${formatList(scan.frameworks)}
- **Language**: ${scan.language}
- **Package Manager**: ${scan.packageManager}
- **Version**: 1.0.0
- **Output Language**: ${outputLanguageDisplayName(outputLanguage)} (${outputLanguage.code})

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
- **spec**: disabled by default; use \`ome spec\` only as an advanced compatibility workflow

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

function formatListZh(values: string[], fallback: string = '未检测到'): string {
  return values.length > 0 ? values.join(', ') : fallback;
}

function renderProjectProfileZh(scan: ProjectScanSummary): string {
  const extensions = Object.entries(scan.sourceExtensions)
    .map(([extension, count]) => `${extension}: ${count}`)
    .join(', ') || '未检测到';

  const sampleFiles = scan.sampleFiles.slice(0, 24).map(file => `  - ${file}`).join('\n') || '  - 未检测到';
  const configFiles = scan.configFiles.slice(0, 24).map(file => `  - ${file}`).join('\n') || '  - 未检测到';

  return [
    '## 项目画像',
    '',
    `- 项目类型: ${scan.projectType}`,
    `- 主要框架: ${scan.framework}`,
    `- 框架: ${formatListZh(scan.frameworks)}`,
    `- 语言: ${scan.language}`,
    `- 包管理器: ${scan.packageManager}`,
    `- 扫描文件数: ${scan.filesScanned}`,
    `- 源码目录: ${formatListZh(scan.sourceDirectories)}`,
    `- 入口文件: ${formatListZh(scan.entrypoints)}`,
    `- 路由文件: ${formatListZh(scan.routeFiles.slice(0, 12))}`,
    `- 中间件文件: ${formatListZh(scan.middlewareFiles.slice(0, 12))}`,
    `- 测试框架: ${formatListZh(scan.testFrameworks)}`,
    `- 测试文件: ${formatListZh(scan.testFiles.slice(0, 12))}`,
    `- 工具链: ${formatListZh(scan.tooling)}`,
    `- 构建工具: ${formatListZh(scan.buildTools)}`,
    `- 服务端框架: ${formatListZh(scan.serverFrameworks)}`,
    `- UI 框架: ${formatListZh(scan.uiFrameworks)}`,
    `- 移动端框架: ${formatListZh(scan.mobileFrameworks)}`,
    `- 模板引擎: ${formatListZh(scan.templateEngines)}`,
    `- 样式系统: ${formatListZh(scan.styleSystems)}`,
    `- i18n 信号: ${formatListZh(scan.i18nSignals)}`,
    `- 数据库信号: ${formatListZh(scan.databaseSignals)}`,
    `- 部署信号: ${formatListZh(scan.deploymentSignals)}`,
    `- 源码信号: ${formatListZh(scan.sourceSignals)}`,
    `- 源码扩展名: ${extensions}`,
    `- 已有规则文件: ${formatListZh(scan.existingRuleFiles)}`,
    `- 检测到的模式: ${formatListZh(scan.detectedPatterns)}`,
    '',
    '## 代表性文件',
    '',
    sampleFiles,
    '',
    '## 配置文件',
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

function ruleListZh(values: string[], fallback: string = '- 未检测到。'): string {
  return values.length > 0 ? values.map(value => `- \`${value}\``).join('\n') : fallback;
}

function commandFor(scan: ProjectScanSummary, scriptName: string): string {
  if (!scan.scripts[scriptName]) return 'not configured';
  if (scriptName === 'test' && scan.packageManager === 'npm') return '`npm test`';
  return `\`${scan.packageManager} run ${scriptName}\``;
}

function commandForZh(scan: ProjectScanSummary, scriptName: string): string {
  const command = commandFor(scan, scriptName);
  return command === 'not configured' ? '未配置' : command;
}

function buildAgentBehaviorRule(): string {
  return buildRule('agent-behavior', 'Agent behavior rules for simple, surgical, verifiable changes', 'agent-behavior', `
# Agent Behavior

## Purpose

Keep AI-assisted implementation cautious, simple, scoped, and verifiable. These rules are adapted for Oh My Engine workflows from Karpathy-style coding-agent guidelines.

## Rules

- State material assumptions before implementation when requirements are ambiguous.
- Ask for clarification instead of silently choosing between materially different interpretations.
- Surface simpler approaches and tradeoffs when the requested path appears overbuilt.
- Prefer the smallest implementation that satisfies the current request.
- Do not add speculative features, abstractions, configuration, or error handling for scenarios the task does not require.
- Touch only files and lines required by the task.
- Do not refactor adjacent code, comments, formatting, or naming unless the task requires it.
- Match existing style even when a different style would be preferred.
- Remove imports, variables, files, or functions only when the current change made them unused.
- Do not delete pre-existing dead code unless explicitly asked.
- Every changed line should trace back to the user request, accepted plan, or required verification.
- Convert implementation work into verifiable goals before coding.
- For bug fixes, reproduce the bug before fixing when feasible.
- For refactors, verify behavior before and after.
- Report verification honestly, including checks that could not be run.

## Behavioral Quality Gate

Before final handoff, check:

- Assumptions: important assumptions were confirmed or stated.
- Simplicity: the solution is the minimum code needed now.
- Surgical scope: the diff avoids unrelated edits and drive-by cleanup.
- Verification: tests or checks prove the behavior, or gaps are explicit.

## Tradeoff

These rules bias toward caution over speed. For trivial typo fixes or obvious one-line changes, apply judgment without expanding the workflow.

## Attribution

Inspired by Karpathy-style behavioral guidelines from \`https://github.com/multica-ai/andrej-karpathy-skills\`.
Original license: MIT. Adapted for Oh My Engine rule workflows.
`);
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

function buildAgentBehaviorRuleZh(): string {
  return buildRule('agent-behavior', '面向简单、聚焦、可验证变更的 Agent 行为规则', 'agent-behavior', `
# Agent 行为

## 目标

让 AI 辅助实现保持谨慎、简单、范围明确并可验证。这些规则基于 Oh My Engine 工作流对常见编码 Agent 指南的项目化改写。

## 规则

- 当需求存在歧义时，先说明关键假设。
- 面对会明显影响实现方向的不同选择时，先澄清而不是静默决定。
- 当请求路径明显过度设计时，说明更简单方案和取舍。
- 优先采用满足当前需求的最小实现。
- 不添加当前任务不需要的推测性功能、抽象、配置或错误处理。
- 只修改完成任务所需的文件和代码行。
- 除非任务要求，不重构邻近代码、注释、格式或命名。
- 即使个人偏好不同，也要匹配现有风格。
- 只删除本次改动导致未使用的 import、变量、文件或函数。
- 不主动删除既有死代码，除非明确要求。
- 每一行改动都应能追溯到用户请求、已接受方案或必要验证。
- 编码前把实现工作转化为可验证目标。
- 修复缺陷时，在可行情况下先复现问题。
- 重构前后都要验证行为。
- 如实报告验证结果，包括无法运行的检查。

## 行为质量门

最终交付前检查：

- 假设：重要假设已确认或已说明。
- 简洁：方案是当前需要的最小代码。
- 范围：diff 避免无关编辑和顺手清理。
- 验证：测试或检查能证明行为，未验证缺口已说明。

## 取舍

这些规则偏向谨慎而不是速度。对明显的一行修正或拼写修复，可按常识裁剪流程。

## 来源

受 \`https://github.com/multica-ai/andrej-karpathy-skills\` 中 Karpathy 风格编码 Agent 指南启发。
原始许可证：MIT。已为 Oh My Engine 规则工作流改写。
`);
}

function buildProjectOverviewRuleZh(scan: ProjectScanSummary): string {
  return buildRule('project-overview', `${scan.projectName} 的仓库画像`, 'project-profile', `
# 项目概览

${renderProjectProfileZh(scan)}
## 规则

- 将 \`${ENGINE_DIR}/context/project-scan.json\` 作为机器可读基线，再查看当前源码后再做架构判断。
- 优先使用能指出实际目录、入口、脚本、依赖和框架信号的规则。
- 平台生成文件必须通过 \`ome rules sync\` 从 \`${ENGINE_DIR}/rules/\` 派生。
- 除非扫描结果列出相关框架或信号，不要假设 React、React Native、移动端或 UI 约定。

## 更新清单

- 重大目录、框架或构建系统变化后，运行 \`ome init-rules\` 刷新此规则。
- 编辑任何规则文件后，运行 \`ome rules sync\` 重新生成 Agent 平台文件。
`);
}

function buildCodeStyleRuleZh(scan: ProjectScanSummary): string {
  return buildRule('code-style', `${scan.language} ${scan.framework} 项目的代码风格规则`, 'code-quality', `
# 代码风格

${renderProjectProfileZh(scan)}
## 规则

- 匹配 ${formatListZh(scan.sourceDirectories, '仓库源码目录')} 中现有的 ${scan.language} 风格。
- 修改共享代码时，优先使用类型化接口和明确返回形状。
- 保持模块边界与当前目录结构一致。
- 使用现有包管理器（${scan.packageManager}）和脚本，不新增并行工具链。
- 保留源码中检测到的模块约定：${formatListZh(scan.sourceSignals.filter(signal => signal.includes('commonjs') || signal.includes('esm')), '编辑前检查 import/export')}.
- 让改动贴近扫描出的代表性源码文件和命名模式，不引入泛化模板。

## 验证

- 检查脚本: ${commandForZh(scan, 'check')}。
- Lint 脚本: ${commandForZh(scan, 'lint')}。
- 构建脚本: ${commandForZh(scan, 'build')}。
`);
}

function buildTestingRuleZh(scan: ProjectScanSummary): string {
  return buildRule('testing', `${formatListZh(scan.testFrameworks, scan.language)} 的测试规则`, 'testing', `
# 测试

${renderProjectProfileZh(scan)}
## 规则

- 在行为附近新增或更新测试。
- 优先使用检测到的测试框架：${formatListZh(scan.testFrameworks)}。
- 扫描到的现有测试文件：
${ruleListZh(scan.testFiles.slice(0, 20))}
- 保持测试 fixture 小而确定。
- 如果修改代码但未检测到测试框架，添加最小的本地测试，并遵循最接近的现有文件命名约定。

## 验证

- 主要测试命令: ${commandForZh(scan, 'test')}。
- 完整验证命令: ${commandForZh(scan, 'verify')}。
`);
}

function buildArchitectureRuleZh(scan: ProjectScanSummary): string {
  return buildRule('architecture', `${scan.projectType} 项目的架构规则`, 'architecture', `
# 架构

${renderProjectProfileZh(scan)}
## 规则

- 将改动保持在现有顶层职责内：${formatListZh(scan.sourceDirectories)}。
- 修改跨切面行为前，先用检测到的入口文件定位：${formatListZh(scan.entrypoints)}。
- 框架特定行为应留在已经承载该框架、路由或中间件职责的文件里。
- 将生成的项目上下文放在 \`${ENGINE_DIR}/context/\`，将源规则放在 \`${ENGINE_DIR}/rules/\`。
- 平台特定生成文件必须通过 \`ome rules sync\` 从 \`${ENGINE_DIR}/rules/\` 派生。
`);
}

function buildToolingRuleZh(scan: ProjectScanSummary): string {
  const scriptLines = Object.entries(scan.scripts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, command]) => `- \`${name}\`: \`${command}\``)
    .join('\n') || '- 未检测到 package scripts。';

  return buildRule('tooling', `${scan.packageManager} 工具链规则`, 'toolchain', `
# 工具链

${renderProjectProfileZh(scan)}
## Package Scripts

${scriptLines}

## 规则

- 依赖和脚本命令使用 ${scan.packageManager}。
- 优先使用现有构建工具：${formatListZh(scan.buildTools)}。
- 扫描到的配置文件：
${ruleListZh(scan.configFiles.slice(0, 24))}
- 让生成文件保持确定性，便于测试断言精确行为。
- 不为本地项目扫描新增运行时依赖。
`);
}

function buildServerRuleZh(ruleName: string, framework: string, scan: ProjectScanSummary): string {
  return buildRule(ruleName, `${framework} 服务端规则`, 'server', `
# ${framework} 服务端

${renderProjectProfileZh(scan)}
## 规则

- 遵循检测到的 ${framework} 应用形态，不替换为其他服务端框架。
- 新增中间件前，先检查入口文件和路由注册：${formatListZh(scan.entrypoints)}。
- 保持请求生命周期行为与检测到的源码信号一致：${formatListZh(scan.sourceSignals.filter(signal => signal.includes('routing') || signal.includes('context') || signal.includes('handlers') || signal.includes('body')), '先检查服务端文件')}。
- 当已有对应目录时，将新 handler、service 和 middleware 放回现有目录。

## 服务端文件

${ruleListZh([...scan.entrypoints, ...scan.routeFiles.slice(0, 16), ...scan.middlewareFiles.slice(0, 16)])}
`);
}

function buildRoutingMiddlewareRuleZh(scan: ProjectScanSummary): string {
  return buildRule('routing-middleware', '路由和中间件规则', 'server', `
# 路由与中间件

${renderProjectProfileZh(scan)}
## 规则

- 新增 endpoint 前先阅读现有路由和中间件文件。
- 明确保持路由注册顺序；只有属于现有服务启动路径的行为才添加为全局中间件。
- 保持请求上下文、params、query、body 解析、状态码和错误传播的框架约定。
- 当具名 handler 或 service 更符合项目结构时，不要把业务行为藏进匿名中间件。

## 路由文件

${ruleListZh(scan.routeFiles.slice(0, 30))}

## 中间件文件

${ruleListZh(scan.middlewareFiles.slice(0, 30))}
`);
}

function buildViewsStaticAssetsRuleZh(scan: ProjectScanSummary): string {
  return buildRule('views-static-assets', '服务端渲染视图和静态资源规则', 'ui', `
# 视图与静态资源

${renderProjectProfileZh(scan)}
## 规则

- 当存在模板引擎或静态资源目录时，将项目视为服务端渲染或资源托管项目。
- 复用检测到的模板引擎：${formatListZh(scan.templateEngines)}。
- 保持 public/static/assets 路径与现有中间件和构建脚本兼容。
- 除非检测到相关框架，否则不要生成 React Native、移动端或 app-router 假设。

## 相关信号

- 模板引擎: ${formatListZh(scan.templateEngines)}
- 样式系统: ${formatListZh(scan.styleSystems)}
- 静态托管信号: ${formatListZh(scan.sourceSignals.filter(signal => signal.includes('static')))}
`);
}

function buildGulpRuleZh(scan: ProjectScanSummary): string {
  return buildRule('build-gulp', 'Gulp 构建流水线规则', 'toolchain', `
# Gulp 构建流水线

${renderProjectProfileZh(scan)}
## 规则

- 编辑构建行为时保留现有 Gulp 流水线和任务名。
- 修改资源处理前，先检查 \`gulpfile.*\` 以及调用 \`gulp\` 的脚本。
- 保持生成资源、watch 任务和生产构建任务确定。
- 除非仓库已经使用或任务明确要求迁移，不要新增并行的 Vite/Webpack 流水线。

## 验证

- 构建命令: ${commandForZh(scan, 'build')}。
- 测试命令: ${commandForZh(scan, 'test')}。
`);
}

function buildStylingAssetsRuleZh(scan: ProjectScanSummary): string {
  return buildRule('styling-assets', '样式和前端资源规则', 'ui', `
# 样式与资源

${renderProjectProfileZh(scan)}
## 规则

- 复用检测到的样式系统：${formatListZh(scan.styleSystems)}。
- 将样式放在现有资源目录和扩展名约定内。
- 当存在模板和 public/static 目录时，保留服务端渲染模板兼容性。
- 除非仓库已经有 token、UI 框架约定或任务明确要求，不要引入 design token 层。
`);
}

function buildI18nRuleZh(scan: ProjectScanSummary): string {
  return buildRule('i18n', '国际化规则', 'localization', `
# 国际化

${renderProjectProfileZh(scan)}
## 规则

- 遵循现有本地化信号：${formatListZh(scan.i18nSignals)}。
- 复用当前 locale 目录、消息格式和翻译 helper 名称。
- 除非项目已有本地化用法，不要向无关 UI 或后端文件添加 i18n 脚手架。
- 用户可见字符串要与检测到的模板、组件或服务端渲染层保持一致。
`);
}

function buildThemeRuleZh(scan: ProjectScanSummary): string {
  return buildRule('theme', `${formatListZh(scan.uiFrameworks.concat(scan.templateEngines), scan.framework)} 的主题规则`, 'ui', `
# 主题

${renderProjectProfileZh(scan)}
## 规则

- 主题变更必须基于本仓库实际存在的 UI、模板和样式文件。
- 保留现有 CSS、Sass、Less、Tailwind 或组件样式约定。
- 除非检测到 React Native 或 Expo，不要假设 React Native 主题 API。
`);
}

function buildDesignTokensRuleZh(scan: ProjectScanSummary): string {
  return buildRule('design-tokens', '设计令牌规则', 'ui', `
# 设计令牌

${renderProjectProfileZh(scan)}
## 规则

- 只有当仓库已有 token 类来源、theme config、Tailwind config、CSS 变量，或任务明确要求时，才新增或修改 token。
- Token 命名要兼容现有样式系统：${formatListZh(scan.styleSystems)}。
- 除非扫描检测到 React Native 或 Expo，不要创建移动端特定 token 规则。
`);
}

function buildConfigurationEnvRuleZh(scan: ProjectScanSummary): string {
  return buildRule('configuration-env', '配置和环境变量规则', 'configuration', `
# 配置与环境

${renderProjectProfileZh(scan)}
## 规则

- 新增设置前先检查配置文件。
- 环境变量命名要与现有 \`process.env\` 用法和 env 模板文件保持一致。
- 不要把密钥或 API key 写入规则、配置、示例或 prompt。
- 新增必需配置时，优先提供文档化默认值和显式校验。

## 配置文件

${ruleListZh(scan.configFiles.slice(0, 40))}
`);
}

function buildDataAccessRuleZh(scan: ProjectScanSummary): string {
  return buildRule('data-access', '数据访问规则', 'data', `
# 数据访问

${renderProjectProfileZh(scan)}
## 规则

- 遵循检测到的数据访问层和依赖信号：${formatListZh(scan.databaseSignals)}。
- 查询、迁移、模型和 repository 改动应贴近现有目录。
- 除非仓库已经混用，不要混合 ORM 和 raw-driver 模式。
- 修改 schema、查询或 repository 边界时，补充围绕持久化行为的测试或 fixture。
`);
}

function buildDeploymentRuleZh(scan: ProjectScanSummary): string {
  return buildRule('deployment', '部署和运行时规则', 'deployment', `
# 部署与运行时

${renderProjectProfileZh(scan)}
## 规则

- 保留现有部署目标和运行时假设：${formatListZh(scan.deploymentSignals)}。
- 修改端口、构建输出、public path 或进程命令前，先检查 Docker、Nginx、PM2 和 CI 文件。
- 保持本地脚本和生产命令一致。
`);
}

function buildSecurityRuleZh(scan: ProjectScanSummary): string {
  return buildRule('security', '安全规则', 'security', `
# 安全

${renderProjectProfileZh(scan)}
## 规则

- 新增服务端行为时，在路由或服务边界验证请求输入。
- 不记录 secret、token、password、原始授权头或完整请求体。
- 保持认证、授权、CORS、body parsing、静态托管和文件上传行为与现有中间件一致。
- 除非是明确示例，否则将环境变量和部署配置视为敏感信息。
`);
}

function buildLoggingErrorHandlingRuleZh(scan: ProjectScanSummary): string {
  return buildRule('logging-error-handling', '日志和错误处理规则', 'observability', `
# 日志与错误处理

${renderProjectProfileZh(scan)}
## 规则

- 保留路由、中间件、CLI 和 service 代码中的现有错误传播约定。
- 日志要可行动，避免在库代码或测试代码中制造噪音 console 输出。
- 新增日志依赖前，先使用仓库当前 logger 或 console 约定。
- 将预期的校验错误或用户错误转换为框架合适的响应；只有异常路径才抛出错误。
`);
}

function buildGeneratedRules(scan: ProjectScanSummary, outputLanguage: OutputLanguageResolution): Record<string, string> {
  if (isOutputLanguageChinese(outputLanguage)) {
    const rules: Record<string, string> = {
      'agent-behavior': buildAgentBehaviorRuleZh(),
      'project-overview': buildProjectOverviewRuleZh(scan),
      'code-style': buildCodeStyleRuleZh(scan),
      testing: buildTestingRuleZh(scan),
      architecture: buildArchitectureRuleZh(scan),
      tooling: buildToolingRuleZh(scan),
      security: buildSecurityRuleZh(scan),
      'logging-error-handling': buildLoggingErrorHandlingRuleZh(scan)
    };

    if (scan.serverFrameworks.includes('Koa')) rules['server-koa'] = buildServerRuleZh('server-koa', 'Koa', scan);
    if (scan.serverFrameworks.includes('Express')) rules['server-express'] = buildServerRuleZh('server-express', 'Express', scan);
    if (scan.serverFrameworks.includes('Fastify')) rules['server-fastify'] = buildServerRuleZh('server-fastify', 'Fastify', scan);
    if (scan.routeFiles.length > 0 || scan.middlewareFiles.length > 0 || scan.sourceSignals.includes('http-routing')) rules['routing-middleware'] = buildRoutingMiddlewareRuleZh(scan);
    if (scan.templateEngines.length > 0 || scan.sourceSignals.includes('static-file-serving')) rules['views-static-assets'] = buildViewsStaticAssetsRuleZh(scan);
    if (scan.buildTools.includes('gulp')) rules['build-gulp'] = buildGulpRuleZh(scan);
    if (scan.styleSystems.length > 0) rules['styling-assets'] = buildStylingAssetsRuleZh(scan);
    if (scan.i18nSignals.length > 0) rules.i18n = buildI18nRuleZh(scan);
    if (scan.uiFrameworks.length > 0 || scan.mobileFrameworks.length > 0) rules.theme = buildThemeRuleZh(scan);
    if (scan.uiFrameworks.length > 0 || scan.mobileFrameworks.length > 0 || scan.styleSystems.includes('tailwind')) rules['design-tokens'] = buildDesignTokensRuleZh(scan);
    if (scan.sourceSignals.includes('environment-variables') || scan.deploymentSignals.includes('env-template') || scan.configFiles.length > 0) rules['configuration-env'] = buildConfigurationEnvRuleZh(scan);
    if (scan.databaseSignals.length > 0) rules['data-access'] = buildDataAccessRuleZh(scan);
    if (scan.deploymentSignals.length > 0) rules.deployment = buildDeploymentRuleZh(scan);

    return rules;
  }

  const rules: Record<string, string> = {
    'agent-behavior': buildAgentBehaviorRule(),
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

function buildRulesGenerationPrompt(scan: ProjectScanSummary, outputLanguage: OutputLanguageResolution): string {
  if (isOutputLanguageChinese(outputLanguage)) {
    return `# 生成个性化 Oh My Engine 规则

你正在 Codex、Claude Code 或 Antigravity 等 AI Agent 编辑器中运行。

## 目标

重写 \`${ENGINE_DIR}/rules/\` 下的 Markdown 文件，使其反映此仓库最新的代码、架构、工具链和团队约定。

## 必需上下文

- 先阅读 \`${ENGINE_DIR}/context/project-scan.json\`。
- 检查扫描结果中的代表性源码文件，包括入口、路由文件、中间件文件、配置文件、测试和样例文件。
- 修改 testing 或 tooling 规则前，先检查 package scripts 和现有测试。
- 保留 \`${ENGINE_DIR}/rules/\` 作为项目规则的唯一事实来源。
- 编辑规则后运行 \`ome rules sync\`，重新生成平台文件。
- 所有人类可读的规则正文、标题和说明必须使用 ${outputLanguageDisplayName(outputLanguage)}（${outputLanguage.code}）。
- 保留代码标识符、命令、路径、frontmatter 键和机器可读 schema 字段的原始英文形式。

## 当前扫描摘要

${renderProjectProfileZh(scan)}
## 输出期望

- 规则必须贴合此仓库，不要写成通用框架建议。
- 根据项目实际需要生成任意数量的规则文件，不要强行塞进四个模板文件。
- 当源码支持时，添加框架或领域规则文件，例如 \`server-koa.md\`、\`routing-middleware.md\`、\`build-gulp.md\`、\`views-static-assets.md\`、\`data-access.md\` 或 \`deployment.md\`。
- 当仓库没有对应框架或资源时，移除或避免 UI/mobile 规则。
- 当仓库定义了验证命令时，写入具体命令。
- 不要向 CLI 添加 API key、模型调用或外部网络依赖。
`;
  }

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
- Generate human-readable rule prose, titles, and descriptions in ${outputLanguageDisplayName(outputLanguage)} (${outputLanguage.code}).
- Keep code identifiers, commands, paths, frontmatter keys, and machine-readable schema fields in their original English form.

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

function updateOMEMarkdownOutputLanguage(projectRoot: string, outputLanguage: OutputLanguageResolution): boolean {
  const omemdPath = path.join(projectRoot, 'OME.md');
  if (!fs.existsSync(omemdPath)) {
    return false;
  }

  const current = fs.readFileSync(omemdPath, 'utf8');
  const frontmatterMatch = current.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return false;
  }

  const config = (yaml.load(frontmatterMatch[1]) || {}) as Record<string, any>;
  const nextOutput = {
    language: outputLanguage.code,
    languageSource: outputLanguage.source,
    displayName: outputLanguageDisplayName(outputLanguage),
    ...(outputLanguage.requested ? { requested: outputLanguage.requested } : {}),
    ...(outputLanguage.systemLocale ? { systemLocale: outputLanguage.systemLocale } : {})
  };

  if (JSON.stringify(config.output || {}) === JSON.stringify(nextOutput)) {
    return false;
  }

  config.output = nextOutput;
  const nextFrontmatter = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true
  });
  const next = current.replace(frontmatterMatch[0], `---\n${nextFrontmatter}---`);
  fs.writeFileSync(omemdPath, next, 'utf8');
  return true;
}

function defaultSpecRoot(projectRoot: string, requested?: string): string {
  if (requested) return requested;
  if (fs.existsSync(path.join(projectRoot, '.ome', 'omespec'))) return '.ome/omespec';
  return 'openspec';
}

function writeProjectContext(projectRoot: string, scan: ProjectScanSummary, force: boolean, outputLanguage: OutputLanguageResolution): number {
  let updated = 0;
  if (writeFileIfNeeded(currentEnginePath(projectRoot, 'context', 'project-scan.json'), JSON.stringify(scan, null, 2), force)) updated += 1;
  if (writeFileIfNeeded(currentEnginePath(projectRoot, 'context', 'rules-generation-prompt.md'), buildRulesGenerationPrompt(scan, outputLanguage), force)) updated += 1;
  return updated;
}

function writeGeneratedRules(projectRoot: string, scan: ProjectScanSummary, force: boolean, outputLanguage: OutputLanguageResolution): {
  updated: number;
  created: number;
  overwritten: number;
  preserved: number;
  backupPath?: string;
  ruleNames: string[];
} {
  const generatedRules = buildGeneratedRules(scan, outputLanguage);
  let updated = 0;
  let created = 0;
  let overwritten = 0;
  let preserved = 0;
  let backupPath: string | undefined;

  for (const [rule, content] of Object.entries(generatedRules)) {
    const rulePath = currentEnginePath(projectRoot, 'rules', `${rule}.md`);
    const nextContent = content.endsWith('\n') ? content : `${content}\n`;
    const exists = fs.existsSync(rulePath);

    if (exists && !force) {
      preserved += 1;
      continue;
    }

    if (exists && fs.readFileSync(rulePath, 'utf8') === nextContent) {
      preserved += 1;
      continue;
    }

    if (exists && force) {
      if (!backupPath) {
        const createdBackupPath = currentEnginePath(projectRoot, 'backups', 'rules', timestampForPath());
        backupPath = createdBackupPath;
        ensureDirectory(createdBackupPath);
      }
      const targetBackupPath = backupPath;
      fs.copyFileSync(rulePath, path.join(targetBackupPath, `${rule}.md`));
    }

    if (writeFileIfNeeded(rulePath, content, force)) {
      updated += 1;
      if (exists) overwritten += 1;
      else created += 1;
    }
  }

  return { updated, created, overwritten, preserved, backupPath, ruleNames: Object.keys(generatedRules).sort() };
}

export function parseInitArgs(args: string[], defaults: Partial<InitOptions> = {}): InitOptions {
  const options: InitOptions = {
    force: false,
    template: 'default',
    projectRoot: defaults.projectRoot || process.cwd(),
    repoRoot: defaults.repoRoot || process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..'),
    sync: defaults.sync ?? true,
    projectEntries: defaults.projectEntries ?? false,
    migrate: defaults.migrate ?? true,
    installAgents: defaults.installAgents ?? false,
    installOpenSpec: defaults.installOpenSpec ?? false,
    home: defaults.home,
    specRoot: defaults.specRoot,
    openspecInit: defaults.openspecInit ?? false,
    outputLanguage: defaults.outputLanguage,
    defaultProjectPlatforms: defaults.defaultProjectPlatforms ?? true
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    if (argument === '--force-rules') {
      options.forceRules = true;
      continue;
    }

    if (argument === '--no-sync') {
      options.sync = false;
      continue;
    }

    if (argument === '--project-entries' || argument === '--sync-project-entries') {
      options.projectEntries = true;
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

    if (argument === '--no-install-openspec') {
      options.installOpenSpec = false;
      continue;
    }

    if (argument === '--install-openspec') {
      options.installOpenSpec = true;
      continue;
    }

    if (argument === '--no-openspec-init') {
      options.openspecInit = false;
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

    if (argument === '--spec-root') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --spec-root');
      }
      options.specRoot = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--language' || argument === '--output-language') {
      if (index + 1 >= args.length) {
        throw new Error(`Missing value for ${argument}`);
      }
      options.outputLanguage = args[index + 1];
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
  const refreshManagedFiles = options.force || options.sync || false;

  const oldSpecPath = path.join(options.projectRoot, '.ome', 'spec');
  const newSpecPath = path.join(options.projectRoot, '.ome', 'omespec');
  if (fs.existsSync(oldSpecPath)) {
    if (!fs.existsSync(newSpecPath)) {
      fs.renameSync(oldSpecPath, newSpecPath);
    } else {
      moveDirectoryContents(oldSpecPath, newSpecPath);
    }
  }

  const scan = scanProject(options.projectRoot) as ProjectScanSummary;
  const createdDirectories: string[] = [];
  const specRoot = defaultSpecRoot(options.projectRoot, options.specRoot);
  const outputLanguage = resolveOutputLanguage(options.projectRoot, {
    explicit: options.outputLanguage
  });

  for (const directory of ENGINE_DIRECTORIES) {
    const target = path.join(options.projectRoot, directory);
    ensureDirectory(target);
    createdDirectories.push(directory);
  }

  const configCreated = writeFileIfNeeded(
    path.join(options.projectRoot, 'OME.md'),
    buildOMEMarkdown(scan, options.template, specRoot, outputLanguage),
    options.force
  );
  if (!configCreated) {
    updateOMEMarkdownOutputLanguage(options.projectRoot, outputLanguage);
  }

  const { initializeOpenSpecWorkspace } = require('./openspec');
  const openspec = initializeOpenSpecWorkspace(options.projectRoot, specRoot, options.force, options.openspecInit !== false);
  const projectCreated = openspec.projectCreated;

  copyFileIfNeeded(
    repoEnginePath(options.repoRoot, 'platforms.json'),
    currentEnginePath(options.projectRoot, 'platforms.json'),
    refreshManagedFiles
  );

  // `.ome/rules/*.md` 是项目本地的事实来源，用户会手工个性化编辑。
  // sync/update 只追加新检测到的规则（writeFileIfNeeded 对缺失文件总会写入），
  // 已存在的规则一律保留；仅 --force-rules 才整体覆盖。skill 源与 context 快照仍随 sync 刷新。
  const shouldForceRules = options.forceRules === true;
  const generatedRules = writeGeneratedRules(options.projectRoot, scan, shouldForceRules, outputLanguage);
  const rulesUpdated = generatedRules.updated;

  const contextFilesUpdated = writeProjectContext(options.projectRoot, scan, refreshManagedFiles, outputLanguage);

  appendGitignoreOnce(options.projectRoot, `${ENGINE_DIR}/memory/`);

  // 生成所有平台的 skill 源和平台入口
  const {
    DEFAULT_PROJECT_AGENT_PLATFORMS,
    detectInitializedAgentPlatforms,
    generateAllAgentGuidanceFiles,
    initializeProjectSkillSources,
    installAgents,
    syncExistingProjectAgents,
    syncExistingProjectSkillMirrors
  } = require('./agents');
  const initializedPlatforms = detectInitializedAgentPlatforms(options.projectRoot);
  const projectPlatforms = initializedPlatforms.length > 0
    ? initializedPlatforms
    : options.defaultProjectPlatforms !== false
      ? DEFAULT_PROJECT_AGENT_PLATFORMS
      : [];
  const skillSourceResults = initializeProjectSkillSources(options.projectRoot, refreshManagedFiles, outputLanguage);
  const projectSkillTargets = skillSourceResults
    .filter((result: Record<string, any>) => result.action !== 'skipped')
    .map((result: Record<string, any>) => `${result.workflow}: ${result.path}`);

  const syncedTargets = options.sync !== false
    ? projectPlatforms.length > 0
      ? syncRules(projectPlatforms, options.projectRoot, {
      outputLanguage,
      preserveExistingMultiFile: options.forceRules !== true
    }).map((result: Record<string, any>) => `${result.platform}: ${result.target}`)
      : []
    : [];

  const agentGuidanceResults = generateAllAgentGuidanceFiles(options.projectRoot, scan, {
    outputLanguage,
    preserveExistingMultiFile: options.forceRules !== true,
    platforms: projectPlatforms
  });
  const agentGuidanceFiles = agentGuidanceResults
    .filter((r: any) => r.action !== 'skipped')
    .map((r: any) => `${r.platform}: ${r.path}`);

  const projectPlatformTargets = options.sync && options.projectEntries === true
    ? syncExistingProjectAgents(options.projectRoot, outputLanguage).map((result: Record<string, any>) => `${result.platform}: ${result.target}`)
    : [];

  const projectSkillMirrorTargets = options.sync && options.projectEntries === true
    ? syncExistingProjectSkillMirrors(options.projectRoot, outputLanguage).map((result: Record<string, any>) => `${result.platform}: ${result.target}`)
    : [];

  let installedAgentTargets: string[] = [];
  if (options.installAgents === true) {
    const agentResults = installAgents({
      platforms: [],
      all: true,
      home: options.home,
      installOpenSpec: options.installOpenSpec,
      outputLanguage
    });
    installedAgentTargets = agentResults.map((result: Record<string, any>) => {
      if (result.kind === 'openspec-cli') return `${result.tool}: ${result.status} ${result.target}`;
      return `${result.platform}: ${result.target}`;
    });
  }

  return {
    projectRoot: options.projectRoot,
    template: options.template,
    configCreated,
    projectCreated,
    rulesUpdated,
    rulesCreated: generatedRules.created,
    rulesOverwritten: generatedRules.overwritten,
    rulesPreserved: generatedRules.preserved,
    rulesBackupPath: generatedRules.backupPath,
    directories: createdDirectories,
    migratedLegacy: Boolean(migration.migrated),
    syncedTargets,
    projectSkillTargets,
    projectPlatformTargets,
    projectSkillMirrorTargets,
    installedAgentTargets,
    openspecStatus: `${openspec.initializedBy}: ${openspec.message}`,
    agentGuidanceFiles,
    scanSummary: renderScanSummary(scan),
    contextFilesUpdated,
    outputLanguage: outputLanguage.code,
    outputLanguageSource: outputLanguage.source
  };
}

export function initializeProjectRules(projectRoot: string = process.cwd(), force: boolean = false, outputLanguageOption?: string): InitRulesResult {
  ensureDirectory(currentEnginePath(projectRoot, 'rules'));
  ensureDirectory(currentEnginePath(projectRoot, 'context'));

  const scan = scanProject(projectRoot) as ProjectScanSummary;
  const outputLanguage = resolveOutputLanguage(projectRoot, {
    explicit: outputLanguageOption
  });
  updateOMEMarkdownOutputLanguage(projectRoot, outputLanguage);
  const generatedRules = writeGeneratedRules(projectRoot, scan, force, outputLanguage);
  const contextFilesUpdated = writeProjectContext(projectRoot, scan, force, outputLanguage);

  return {
    projectRoot,
    scanSummary: renderScanSummary(scan),
    contextFilesUpdated,
    rulesUpdated: generatedRules.updated,
    rulesCreated: generatedRules.created,
    rulesOverwritten: generatedRules.overwritten,
    rulesPreserved: generatedRules.preserved,
    rulesBackupPath: generatedRules.backupPath,
    promptPath: currentEnginePath(projectRoot, 'context', 'rules-generation-prompt.md'),
    ruleNames: generatedRules.ruleNames,
    outputLanguage: outputLanguage.code,
    outputLanguageSource: outputLanguage.source
  };
}

export function renderInitRulesResult(result: InitRulesResult): string {
  return [
    `Initialized personalized rule context in ${result.projectRoot}`,
    `Project scan: ${result.scanSummary}`,
    `Output language: ${result.outputLanguage} (${result.outputLanguageSource})`,
    `Rule source files: created ${result.rulesCreated}, overwritten ${result.rulesOverwritten}, preserved ${result.rulesPreserved}`,
    ...(result.rulesBackupPath ? [`Rule backup: ${result.rulesBackupPath}`] : []),
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
    `Output language: ${result.outputLanguage} (${result.outputLanguageSource})`,
    `Config: ${result.configCreated ? 'created' : 'preserved'}`,
    `Rule source files: created ${result.rulesCreated}, overwritten ${result.rulesOverwritten}, preserved ${result.rulesPreserved}`,
    ...(result.rulesBackupPath ? [`Rule backup: ${result.rulesBackupPath}`] : []),
    `Agent context files updated: ${result.contextFilesUpdated}`,
    `Agent guidance files generated: ${result.agentGuidanceFiles.length}`,
    ...result.agentGuidanceFiles.map(file => `  - ${file}`),
    `Project skills installed: ${result.projectSkillTargets.length}`,
    ...result.projectSkillTargets.map(target => `  - ${target}`),
    `Project skill mirrors synced: ${result.projectSkillMirrorTargets.length}`,
    ...result.projectSkillMirrorTargets.map(target => `  - ${target}`),
    `Integration targets synced: ${result.syncedTargets.length}`,
    ...result.syncedTargets.map(target => `  - ${target}`),
    `Project command entries synced: ${result.projectPlatformTargets.length}`,
    ...result.projectPlatformTargets.map(target => `  - ${target}`),
    `Global skills installed: ${result.installedAgentTargets.length}`,
    ...result.installedAgentTargets.map(target => `  - ${target}`),
    'Created directories:',
    `  - ${ENGINE_DIR}/`,
    'Next steps:',
    `  - Run \`ome init-rules\` after major code changes to refresh the dynamic rule set`,
    `  - Review ${ENGINE_DIR}/rules/ for the local scan-based rule drafts`,
    `  - In any Agent editor, run \`ome-init-rules\` or load ${ENGINE_DIR}/context/rules-generation-prompt.md to personalize rules from the latest source code`,
    `  - ${result.agentGuidanceFiles.length} configured Agent platform(s) now have auto-detection rules for automatic OME command usage`
  ].join('\n') + '\n';
}
