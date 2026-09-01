const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const matter = require('gray-matter');

const { OME_BIN, RUNTIME_ROOT, omeArgs, repoPath } = require('./helpers');
const {
  recordExecutionMemory,
  recordPreferenceMemory
} = require('../skills/oh-my-engine/lib/memory-store');
const {
  autoAnalyzeEvolution,
  loadAnalysisState
} = require('../skills/oh-my-engine/lib/auto-evolution');

function createWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), 'oh-my-engine-selective-memory-')
  );

  fs.cpSync(repoPath('skills'), path.join(workspace, 'skills'), {
    recursive: true
  });
  fs.cpSync(repoPath('bin'), path.join(workspace, 'bin'), { recursive: true });
  fs.cpSync(RUNTIME_ROOT, path.join(workspace, 'dist'), { recursive: true });

  return workspace;
}

function run(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_PATH: repoPath('node_modules')
    }
  });
}

function runOme(workspace: string, args: string[]): string {
  return run(OME_BIN, omeArgs(args), workspace);
}

function runGit(workspace: string, args: string[]): string {
  return run('git', args, workspace);
}

function recordExecutionEvent(workspace: string, event: Record<string, any>): void {
  recordExecutionMemory(workspace, event);
}

function recordPreference(workspace: string, statement: string): void {
  recordPreferenceMemory(workspace, {
    source: 'explicit_remember',
    scope: 'user',
    statement,
    complexity: 'low',
    confidence: 'high',
    sensitivity: 'low',
    stability: 1,
    reusePotential: 1,
    novelty: 0.2
  });
}

function findExecutionFiles(workspace: string, workflow: string): string[] {
  const directory = path.join(
    workspace,
    '.ome',
    'memory',
    'executions',
    workflow
  );

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((name: string) => name.endsWith('.md'))
    .map((name: string) => path.join(directory, name))
    .sort();
}

function readExecutionRecords(workspace: string, workflow: string): any[] {
  return findExecutionFiles(workspace, workflow).map(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    return data;
  });
}

function writeValidFeatureDocs(workspace: string, change: string): void {
  const changeDirectory = path.join(workspace, '.ome', 'omespec', 'changes', change);

  fs.writeFileSync(
    path.join(changeDirectory, 'proposal.md'),
    `# Change Proposal

## Change ID
\`${change}\`

## Summary
Add a reusable auth gate for protected routes.

## Problem
Protected routes currently duplicate auth checks in multiple handlers.

## Goals
- Centralize route authentication
- Keep public routes unchanged

## Non-Goals
- Rebuild the session model
- Change token storage

## User Impact
- Authenticated users reach protected routes consistently
- Public routes keep existing behavior
- Login UX remains unchanged

## Acceptance Criteria
- [x] Protected routes reject anonymous requests through one shared gate
- [x] Existing public routes still bypass auth checks

## Risks
- Risk: middleware order could block public endpoints
  Mitigation: scope the gate to protected routes only

## Rollout Notes
- Feature flag: not needed
- Migration: none
- Monitoring: watch protected-route 401 volume

## Related Capability Specs
- \`.ome/omespec/specs/${change}/spec.md\`
`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(changeDirectory, 'design.md'),
    `# Technical Design

## Overview
Add a shared route guard that validates auth before protected handlers run.

## Architecture
- Components involved: route guard, auth service, protected route registry
- Boundaries: public routes skip the guard, protected routes require a valid session
- Data flow: request -> guard -> auth service -> protected handler

## Interfaces
### Public/API Interfaces
- Endpoint or command: protected HTTP routes
- Input: request headers with session token
- Output: 401 for anonymous requests, handler response for valid sessions

### Internal Interfaces
- Module: auth guard middleware
- Responsibility: validate session state before protected handlers execute

## Data Model
- New entities: none
- Changed entities: protected route metadata
- Migration concerns: none

## Failure Modes
- Failure mode: auth service timeout
  Handling: fail closed with a 401 and structured error log

## Risks and Tradeoffs
- Tradeoff: one extra guard hop per protected request
- Rejected alternative: duplicate auth checks in each handler

## Verification Plan
- Unit: guard accepts valid sessions and rejects missing tokens
- Integration: protected routes require auth while public routes remain open
- Manual: hit one protected and one public route in a local environment
`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(changeDirectory, 'specs', change, 'spec.md'),
    `# Spec Delta

## Capability
\`${change}\`

## Change Type
- [x] Add
- [ ] Modify
- [ ] Remove

## Requirements
### Requirement: Shared Protected Route Guard
The system MUST validate protected routes through a shared auth guard before handlers execute.

#### Scenario: Anonymous request is rejected
- **WHEN** an anonymous request reaches a protected route
- **THEN** the auth guard returns a 401 before the handler runs

### Requirement: Public Routes Stay Public
The system SHOULD leave explicitly public routes untouched by the new guard.

#### Scenario: Public route bypasses the guard
- **WHEN** a request reaches a route marked as public
- **THEN** the request continues without the auth guard blocking it

## Compatibility Notes
- Backward compatibility: existing public routes keep their current behavior
- Migration notes: register protected routes with the guard
- Observability notes: log guard rejections with route metadata
`,
    'utf8'
  );
}

function seedEvolutionWorkspace(workspace: string): any {
  for (const changeId of ['alpha-auth', 'beta-auth', 'gamma-auth']) {
    recordExecutionEvent(workspace, {
      source: 'workflow_command',
      workflow: 'spec',
      phase: 'verify',
      changeId,
      changeSlug: changeId,
      capability: 'auth',
      complexity: 'high',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.8,
      stability: 0.9,
      novelty: 0.6,
      status: 'verified',
      summary: 'Verified the spec change and acceptance state.',
      filesTouched: ['.ome/omespec/changes/demo/spec.md'],
      testsRun: ['sh tests/spec-workflow-smoke.sh'],
      errors: [],
      metadata: {
        patternCategory: 'workflow_success'
      }
    });
  }

  for (let index = 1; index <= 3; index += 1) {
    recordExecutionEvent(workspace, {
      source: 'workflow_command',
      workflow: 'maintenance',
      phase: 'apply',
      changeId: `bugfix-${index}`,
      changeSlug: `bugfix-${index}`,
      capability: 'bugfix',
      complexity: 'medium',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.9,
      stability: 0.9,
      novelty: 0.5,
      status: 'fixed',
      summary: 'Fixed repeated react event handler invocation bug.',
      filesTouched: ['src/components/LoginButton.tsx'],
      testsRun: ['npm test'],
      errors: [],
      metadata: {
        patternCategory: 'bug_fix',
        patternId: 'react-event-handler-invocation'
      }
    });
  }

  recordPreference(workspace, 'Prefer concise reports');
  recordPreference(workspace, 'Prefer concise reports');

  return JSON.parse(
    runOme(workspace, ['evolve', 'analyze', '--format', 'json'])
  );
}

test('selective memory policy only persists allowed high-value events', () => {
  const { decideCapture } = require('../skills/oh-my-engine/lib/memory-policy');

  assert.deepEqual(
    decideCapture({
      source: 'chat',
      kind: 'execution',
      complexity: 'low',
      confidence: 'medium',
      sensitivity: 'low',
      reusePotential: 0.1,
      stability: 0.1,
      novelty: 0.1
    }),
    {
      shouldPersist: false,
      captureLevel: 'none',
      reason: 'source_not_allowed'
    }
  );

  assert.deepEqual(
    decideCapture({
      source: 'explicit_remember',
      kind: 'preference',
      complexity: 'low',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.9,
      stability: 0.95,
      novelty: 0.4
    }),
    {
      shouldPersist: true,
      captureLevel: 'summary',
      reason: 'explicit_remember'
    }
  );

  assert.deepEqual(
    decideCapture({
      source: 'workflow_command',
      kind: 'execution',
      complexity: 'high',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.8,
      stability: 0.8,
      novelty: 0.7
    }),
    {
      shouldPersist: true,
      captureLevel: 'rich',
      reason: 'workflow_command_high_complexity'
    }
  );
});

test('spec propose writes execution memory that the memory viewer can read', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  runOme(workspace, ['spec', 'propose', 'demo-memory']);

  const executionFiles = findExecutionFiles(workspace, 'spec');
  assert.ok(
    executionFiles.length > 0,
    'expected spec execution memory to be written'
  );

  const records = readExecutionRecords(workspace, 'spec');
  const firstRecord = records.find(
    (record: Record<string, any>) => record.changeId === 'demo-memory'
  );

  assert.ok(firstRecord, 'expected a record for the proposed change');
  assert.equal(firstRecord.workflow, 'spec');
  assert.equal(firstRecord.phase, 'propose');
  assert.equal(firstRecord.source, 'workflow_command');
  assert.equal(firstRecord.captureLevel, 'rich');
  assert.equal(firstRecord.whyStored, 'workflow_command_high_complexity');

  const output = runOme(workspace, [
    'memory',
    'view',
    '--type',
    'executions',
    '--workflow',
    'spec',
    '--format',
    'json'
  ]);

  const report = JSON.parse(output);
  assert.equal(report.summary.totalRecords, 1);
  assert.equal(report.summary.byWorkflow.spec, 1);
  assert.equal(report.records[0].changeId, 'demo-memory');
  assert.equal(report.records[0].whyStored, 'workflow_command_high_complexity');
});

test('project init writes selective memory defaults', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);

  const yaml = require('js-yaml');
  const omeContent = fs.readFileSync(
    path.join(workspace, 'OME.md'),
    'utf8'
  );

  // Extract YAML frontmatter
  const match = omeContent.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'OME.md should have YAML frontmatter');

  const config = yaml.load(match[1]);

  assert.equal(config.memory.captureMode, 'selective');
  assert.equal(config.memory.allowSources.workflow_command, true);
  assert.equal(config.memory.allowSources.explicit_remember, true);
  assert.equal(config.evolution.autoApply, false);
  assert.equal(config.evolution.requireVerification, true);
  assert.equal(config.evolution.candidateOnly, true);
  assert.equal(config.evolution.thresholds.learningCandidateMinEvidence, 3);
  assert.equal(config.evolution.thresholds.skillCandidateMinEvidence, 3);
  assert.equal(config.evolution.thresholds.adoptedPreferenceMinEvidence, 2);
});

test('spec lifecycle phases append execution memory records', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  runOme(workspace, ['spec', 'propose', 'demo-lifecycle']);

  writeValidFeatureDocs(workspace, 'demo-lifecycle');

  runOme(workspace, ['spec', 'plan', 'demo-lifecycle']);
  runOme(workspace, [
    'spec',
    'apply',
    'demo-lifecycle',
    '--all-tasks',
    '--all-acceptance'
  ]);
  runOme(workspace, ['spec', 'verify', 'demo-lifecycle']);
  runOme(workspace, ['spec', 'archive', 'demo-lifecycle']);

  const records = readExecutionRecords(workspace, 'spec').filter(
    record => record.changeId === 'demo-lifecycle'
  );
  const phases = records.map(record => record.phase).sort();

  assert.deepEqual(phases, ['apply', 'archive', 'plan', 'propose', 'verify']);
  assert.equal(
    records.find(record => record.phase === 'plan').status,
    'planned'
  );
  assert.equal(
    records.find(record => record.phase === 'apply').status,
    'in_progress'
  );
  assert.equal(
    records.find(record => record.phase === 'verify').status,
    'verified'
  );
  assert.equal(
    records.find(record => record.phase === 'archive').status,
    'archived'
  );
});

test('explicit remembered preferences are stored and visible in the memory viewer', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  recordPreference(workspace, 'Prefer concise reports');
  recordPreference(workspace, 'Prefer concise reports');

  const preferenceDir = path.join(
    workspace,
    '.ome',
    'memory',
    'preferences'
  );

  assert.ok(fs.existsSync(preferenceDir), 'expected preference directory to exist');

  const preferenceFiles = fs.readdirSync(preferenceDir).filter((name: string) => name.endsWith('.md'));
  assert.ok(preferenceFiles.length > 0, 'expected at least one preference file to exist');

  const output = runOme(workspace, [
    'memory',
    'view',
    '--type',
    'preferences',
    '--format',
    'json'
  ]);

  const report = JSON.parse(output);
  assert.equal(report.summary.totalRecords, 1);
  assert.equal(report.summary.byScope.user, 1);
  assert.equal(report.records[0].statement, 'Prefer concise reports');
  assert.equal(report.records[0].source, 'explicit_remember');
  assert.equal(report.records[0].whyStored, 'explicit_remember');
  assert.equal(report.records[0].evidenceCount, 2);
});

test('memory view defaults to active recall while history view shows executions', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  recordPreference(workspace, 'Prefer concise reports');
  recordExecutionEvent(workspace, {
    source: 'workflow_command',
    workflow: 'build',
    phase: 'execution',
    changeId: 'history-demo',
    changeSlug: 'build',
    capability: 'build',
    complexity: 'medium',
    confidence: 'high',
    sensitivity: 'low',
    reusePotential: 0.8,
    stability: 0.8,
    novelty: 0.5,
    status: 'success',
    summary: 'Record execution history separately from recall.',
    filesTouched: ['src/core/memory.ts'],
    testsRun: ['node --test dist/tests/selective-memory.test.js'],
    errors: []
  });

  const recall = JSON.parse(
    runOme(workspace, ['memory', 'view', '--format', 'json'])
  );
  assert.equal(recall.summary.preferences, 1);
  assert.equal(recall.summary.totalRecords, 1);
  assert.equal(recall.records[0].recallType, 'preference');
  assert.equal(recall.records[0].statement, 'Prefer concise reports');

  const history = JSON.parse(
    runOme(workspace, ['history', 'view', '--workflow', 'build', '--format', 'json'])
  );
  assert.equal(history.summary.totalRecords, 1);
  assert.equal(history.summary.byWorkflow.build, 1);
  assert.equal(history.records[0].changeId, 'history-demo');
});

test('memory and history views do not stale-clean active sessions', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  runOme(workspace, ['build', 'Read-only memory view should not record stale sessions']);

  const sessionPath = path.join(workspace, '.ome', '.session');
  const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  session.startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf8');

  fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'demo.ts'), 'export const demo = true;\n', 'utf8');

  const memoryOutput = runOme(workspace, ['memory', 'view']);
  const historyOutput = runOme(workspace, ['history', 'view']);

  assert.match(memoryOutput, /Engine memory recall/);
  assert.match(historyOutput, /Execution history/);
  assert.doesNotMatch(memoryOutput, /Found stale session/);
  assert.doesNotMatch(historyOutput, /Found stale session/);
  assert.equal(fs.existsSync(sessionPath), true);
  assert.equal(findExecutionFiles(workspace, 'build').length, 0);
});

test('bug finish writes diagnostic memory and filters preexisting platform noise', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  fs.mkdirSync(path.join(workspace, 'src', 'core'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'core', 'memory.ts'), 'export const value = 1;\n', 'utf8');

  runGit(workspace, ['init']);
  runGit(workspace, ['config', 'user.email', 'test@example.com']);
  runGit(workspace, ['config', 'user.name', 'Test User']);
  runGit(workspace, ['add', '.']);
  runGit(workspace, ['commit', '-m', 'seed workspace']);

  const platformNoisePath = path.join(workspace, '.claude', 'commands', 'ome-bug.md');
  fs.mkdirSync(path.dirname(platformNoisePath), { recursive: true });
  fs.writeFileSync(
    platformNoisePath,
    'preexisting platform noise\n',
    'utf8'
  );

  runOme(workspace, ['bug', 'Bug memory records noise instead of root cause']);

  const generatedNoiseFiles = [
    '.codex/skills/ome-explore/SKILL.md',
    '.codex/skills/ome-propose/SKILL.md',
    '.cursor/rules/00-ome-auto-detection.mdc',
    '.gitignore',
    '.ome/context/project-scan.json',
    '.ome/context/rules-generation-prompt.md',
    '.ome/platforms.json',
    '.ome/rules/testing.md',
    '.ome/skills/ome-bug/SKILL.md',
    '.qoder/rules/00-ome-auto-detection.md',
    '.trae/rules/00-ome-auto-detection.md',
    '.trae/skills/ome-apply-change/SKILL.md',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md'
  ];

  for (const generatedFile of generatedNoiseFiles) {
    const filePath = path.join(workspace, generatedFile);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `generated noise ${generatedFile}\n`, 'utf8');
  }

  fs.writeFileSync(
    path.join(workspace, 'src', 'core', 'memory.ts'),
    'export const value = 2;\n',
    'utf8'
  );

  runOme(workspace, [
    'finish',
    '--root-cause',
    'finish only wrote git status metadata and omitted diagnostic fields',
    '--evidence',
    'sample bug execution contained files touched but no root cause',
    '--fix',
    'render bug execution memory as a diagnostic case card',
    '--verification',
    'node:test coverage checked rendered memory content',
    '--learning',
    'Bug memories should preserve symptom, evidence, root cause, fix, and verification'
  ]);

  const executionFiles = findExecutionFiles(workspace, 'bug');
  assert.equal(executionFiles.length, 1);

  const content = fs.readFileSync(executionFiles[0], 'utf8');
  const parsed = matter(content);
  const ignoredNoise = parsed.data.metadata.noiseFilesIgnored || [];
  const filesTouchedSection = content.match(/## Files Touched\n\n([\s\S]*?)(?:\n## |\n```json|$)/)?.[1] || '';
  const noiseCovers = (expectedPath: string) =>
    ignoredNoise.some((ignoredPath: string) =>
      ignoredPath === expectedPath || expectedPath.startsWith(ignoredPath)
    );

  assert.deepEqual(parsed.data.filesTouched, ['src/core/memory.ts']);
  assert.ok(
    noiseCovers('.ome/.session'),
    'expected session file to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.codex/skills/ome-explore/SKILL.md'),
    'expected Codex skill sync output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.cursor/rules/00-ome-auto-detection.mdc'),
    'expected Cursor rule sync output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.ome/rules/testing.md'),
    'expected generated rule refresh output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.ome/skills/ome-bug/SKILL.md'),
    'expected project skill refresh output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.trae/skills/ome-apply-change/SKILL.md'),
    'expected Trae skill sync output to be tracked as ignored noise'
  );
  assert.doesNotMatch(filesTouchedSection, /\.claude\/commands\/ome-bug\.md/);
  assert.doesNotMatch(filesTouchedSection, /\.codex\/skills\/ome-explore\/SKILL\.md/);
  assert.doesNotMatch(filesTouchedSection, /\.cursor\/rules\/00-ome-auto-detection\.mdc/);
  assert.doesNotMatch(filesTouchedSection, /\.ome\/rules\/testing\.md/);
  assert.doesNotMatch(filesTouchedSection, /\.ome\/skills\/ome-bug\/SKILL\.md/);
  assert.doesNotMatch(filesTouchedSection, /\.trae\/skills\/ome-apply-change\/SKILL\.md/);
  assert.match(content, /## Symptom/);
  assert.match(content, /Bug memory records noise instead of root cause/);
  assert.match(content, /## Root Cause/);
  assert.match(content, /finish only wrote git status metadata/);
  assert.match(content, /## Evidence/);
  assert.match(content, /sample bug execution contained files touched/);
  assert.match(content, /## Reusable Learning/);
});

test('bug finish keeps real changes after ome update noise out of files touched', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  fs.mkdirSync(path.join(workspace, 'src', 'core'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'core', 'memory.ts'), 'export const value = 1;\n', 'utf8');
  const customTestingRule = [
    '---',
    'rule: testing',
    'version: 2.0.0',
    'description: Custom testing rule that must survive update',
    'category: testing',
    '---',
    '',
    '# Testing',
    '',
    '- Preserve this project-specific testing rule.',
    ''
  ].join('\n');
  const testingRulePath = path.join(workspace, '.ome', 'rules', 'testing.md');
  fs.writeFileSync(testingRulePath, customTestingRule, 'utf8');

  runGit(workspace, ['init']);
  runGit(workspace, ['config', 'user.email', 'test@example.com']);
  runGit(workspace, ['config', 'user.name', 'Test User']);
  runGit(workspace, ['add', '.']);
  runGit(workspace, ['commit', '-m', 'seed workspace']);

  runOme(workspace, ['bug', 'ome update noise dominates files touched']);

  const staleGeneratedFiles = [
    '.claude/commands/ome-bug.md',
    '.ome/context/project-scan.json'
  ];
  for (const staleFile of staleGeneratedFiles) {
    const filePath = path.join(workspace, staleFile);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `stale generated content for ${staleFile}\n`, 'utf8');
  }

  runOme(workspace, ['update', '--project-only']);
  assert.equal(
    fs.existsSync(path.join(workspace, '.ome', 'omespec', 'project.md')),
    false,
    'ome update must not initialize a spec workspace by default'
  );

  assert.equal(
    fs.readFileSync(testingRulePath, 'utf8'),
    customTestingRule,
    'ome update must not overwrite existing generated or customized rules'
  );

  fs.writeFileSync(
    path.join(workspace, 'src', 'core', 'memory.ts'),
    'export const value = 2;\n',
    'utf8'
  );
  const generatedSpecNoisePath = path.join(workspace, '.ome', 'omespec', 'changes', 'generated-noise', 'proposal.md');
  fs.mkdirSync(path.dirname(generatedSpecNoisePath), { recursive: true });
  fs.writeFileSync(generatedSpecNoisePath, '# Generated spec noise\n', 'utf8');

  runOme(workspace, [
    'finish',
    '--root-cause',
    'bug workflow memory included generated update synchronization output',
    '--evidence',
    'ome update refreshed platform entry files before the actual bug fix',
    '--fix',
    'filter generated update paths while preserving the real source file change',
    '--verification',
    'node:test runs ome update then verifies files touched contains only src/core/memory.ts'
  ]);

  const executionFiles = findExecutionFiles(workspace, 'bug');
  assert.equal(executionFiles.length, 1);

  const content = fs.readFileSync(executionFiles[0], 'utf8');
  const parsed = matter(content);
  const ignoredNoise = parsed.data.metadata.noiseFilesIgnored || [];
  const filesTouchedSection = content.match(/## Files Touched\n\n([\s\S]*?)(?:\n## |\n```json|$)/)?.[1] || '';
  const noiseCovers = (expectedPath: string) =>
    ignoredNoise.some((ignoredPath: string) =>
      ignoredPath === expectedPath || expectedPath.startsWith(ignoredPath)
    );

  assert.deepEqual(parsed.data.filesTouched, ['src/core/memory.ts']);
  assert.equal(parsed.data.filesTouchedTotal, 1);
  assert.ok(
    noiseCovers('.ome/context/project-scan.json'),
    'expected update context refresh output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.claude/commands/ome-bug.md'),
    'expected generated project command output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('OME.md'),
    'expected OME.md config refresh output to be tracked as ignored noise'
  );
  assert.ok(
    noiseCovers('.ome/omespec/'),
    'expected generated spec workspace output to be tracked as ignored noise'
  );
  assert.doesNotMatch(filesTouchedSection, /\.ome\/context\/project-scan\.json/);
  assert.doesNotMatch(filesTouchedSection, /\.ome\/omespec\//);
  assert.doesNotMatch(filesTouchedSection, /\.ome\/skills\/ome-bug\/SKILL\.md/);
  assert.doesNotMatch(filesTouchedSection, /\.claude\/commands\/ome-bug\.md/);
  assert.doesNotMatch(filesTouchedSection, /OME\.md/);
});

test('bug finish refuses empty diagnostic memory without core fields and keeps session retryable', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'bug.ts'), 'export const value = 1;\n', 'utf8');

  runGit(workspace, ['init']);
  runGit(workspace, ['config', 'user.email', 'test@example.com']);
  runGit(workspace, ['config', 'user.name', 'Test User']);
  runGit(workspace, ['add', '.']);
  runGit(workspace, ['commit', '-m', 'seed workspace']);

  runOme(workspace, ['bug', 'Empty bug memory should not persist']);

  fs.writeFileSync(path.join(workspace, 'src', 'bug.ts'), 'export const value = 2;\n', 'utf8');

  const output = runOme(workspace, ['finish']);

  assert.match(output, /Execution not persisted/);
  assert.match(output, /requires core diagnostic fields/);
  assert.equal(findExecutionFiles(workspace, 'bug').length, 0);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', '.session')), true);

  const retryOutput = runOme(workspace, [
    'finish',
    '--root-cause',
    'bug workflow finish was attempted before diagnostic fields were supplied',
    '--evidence',
    'the first finish explained the missing fields without recording memory',
    '--fix',
    'keep the active session available for a structured finish retry',
    '--verification',
    'node:test verifies retryable bug finish behavior'
  ]);

  assert.match(retryOutput, /Execution recorded/);
  assert.equal(findExecutionFiles(workspace, 'bug').length, 1);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', '.session')), false);
});

test('finish finalizes an old active session instead of stale-cleaning it first', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'bug.ts'), 'export const value = 1;\n', 'utf8');

  runGit(workspace, ['init']);
  runGit(workspace, ['config', 'user.email', 'test@example.com']);
  runGit(workspace, ['config', 'user.name', 'Test User']);
  runGit(workspace, ['add', '.']);
  runGit(workspace, ['commit', '-m', 'seed workspace']);

  runOme(workspace, ['bug', 'Long-running bug fix should still finish']);

  fs.writeFileSync(path.join(workspace, 'src', 'bug.ts'), 'export const value = 2;\n', 'utf8');

  const sessionPath = path.join(workspace, '.ome', '.session');
  const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  session.startTime = new Date(Date.now() - 16 * 60 * 1000).toISOString();
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf8');

  const output = runOme(workspace, [
    'finish',
    '--root-cause',
    'finish command cleaned up stale sessions before reading its own active session',
    '--evidence',
    'a long-running workflow reached finish after the stale-session threshold',
    '--fix',
    'skip stale cleanup for the finish command so it can close the current session',
    '--verification',
    'node:test verifies the original session id is recorded'
  ]);

  assert.doesNotMatch(output, /Found stale session/);
  assert.match(output, new RegExp(`Session: ${session.id}`));

  const executionFiles = findExecutionFiles(workspace, 'bug');
  assert.equal(executionFiles.length, 1);
  const parsed = matter(fs.readFileSync(executionFiles[0], 'utf8'));
  assert.equal(parsed.data.changeId, session.id);
  assert.equal(fs.existsSync(sessionPath), false);
});

test('finish records explicit diagnostic memory without an active session', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);

  const output = runOme(workspace, [
    'finish',
    '--symptom',
    'No active session prevented memory recording after completed work',
    '--impact',
    'The user could finish code and tests but lose the execution memory',
    '--root-cause',
    'finish required .ome/.session even when structured diagnostic fields were supplied',
    '--evidence',
    'ome finish printed No active workflow session found',
    '--fix',
    'allow explicit finish payloads to create ad-hoc execution memory',
    '--verification',
    'node:test verifies ad-hoc memory rendering',
    '--learning',
    'A structured finish command should be enough to record a completed diagnostic handoff'
  ]);

  assert.match(output, /Execution recorded/);
  assert.match(output, /Workflow: bug/);

  const executionFiles = findExecutionFiles(workspace, 'bug');
  assert.equal(executionFiles.length, 1);

  const content = fs.readFileSync(executionFiles[0], 'utf8');
  const parsed = matter(content);

  assert.equal(parsed.data.source, 'workflow_command');
  assert.equal(parsed.data.workflow, 'bug');
  assert.equal(parsed.data.symptom, 'No active session prevented memory recording after completed work');
  assert.match(content, /## Root Cause/);
  assert.match(content, /finish required \.ome\/\.session/);
  assert.match(content, /## Verification/);
  assert.match(content, /node:test verifies ad-hoc memory rendering/);
});

test('finish records Chinese diagnostic memory when project output language is Chinese', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init', '--language', 'zh-CN']);

  const output = runOme(workspace, [
    'finish',
    '--symptom',
    '生成的记忆没有遵循中文规范',
    '--impact',
    '用户需要手工重写执行记忆',
    '--root-cause',
    'memory store 未读取 OME.md 中的 output.language 配置',
    '--evidence',
    '执行记忆仍然使用英文标题 Root Cause 和 Verification',
    '--fix',
    '根据项目输出语言渲染记忆正文标题',
    '--verification',
    'node:test 检查中文标题和稳定 frontmatter',
    '--learning',
    '记忆正文应跟随项目语言，但 frontmatter 字段必须保持稳定英文 key'
  ]);

  assert.match(output, /Execution recorded/);

  const executionFiles = findExecutionFiles(workspace, 'bug');
  assert.equal(executionFiles.length, 1);

  const content = fs.readFileSync(executionFiles[0], 'utf8');
  const parsed = matter(content);

  assert.equal(parsed.data.workflow, 'bug');
  assert.equal(parsed.data.rootCause, 'memory store 未读取 OME.md 中的 output.language 配置');
  assert.equal(parsed.data.fixSummary, '根据项目输出语言渲染记忆正文标题');
  assert.equal(parsed.data.filesTouchedTotal, 0);
  assert.match(content, /## 根因/);
  assert.match(content, /## 证据/);
  assert.match(content, /## 验证/);
  assert.match(content, /## 可复用经验/);
  assert.doesNotMatch(content, /## Root Cause/);
  assert.doesNotMatch(content, /## Verification/);
});

test('sessionless finish refuses shallow diagnostic payloads', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);

  assert.throws(
    () => runOme(workspace, [
      'finish',
      '--symptom',
      'Only a symptom was supplied'
    ]),
    /requires core diagnostic fields/
  );

  assert.equal(findExecutionFiles(workspace, 'bug').length, 0);
});

test('execution memory truncates large file lists but records totals', () => {
  const workspace = createWorkspace();
  const filesTouched = Array.from({ length: 20 }, (_, index) => `src/file-${index}.ts`);

  recordExecutionEvent(workspace, {
    source: 'workflow_command',
    workflow: 'bug',
    phase: 'execution',
    changeId: 'large-file-list',
    changeSlug: 'bug',
    capability: 'bug',
    complexity: 'medium',
    confidence: 'high',
    sensitivity: 'low',
    reusePotential: 0.8,
    stability: 0.8,
    novelty: 0.6,
    status: 'success',
    summary: 'Large file list should not dominate memory',
    filesTouched,
    testsRun: [],
    errors: [],
    rootCause: 'file list rendering was too noisy',
    evidence: ['sample memory was dominated by filesTouched'],
    fixSummary: 'truncate file lists in rendered execution memory',
    verificationSummary: 'node:test checks file list truncation'
  });

  const executionFiles = findExecutionFiles(workspace, 'bug');
  assert.equal(executionFiles.length, 1);

  const content = fs.readFileSync(executionFiles[0], 'utf8');
  const parsed = matter(content);

  assert.equal(parsed.data.filesTouchedTotal, 20);
  assert.equal(parsed.data.filesTouchedOmitted, 8);
  assert.equal(parsed.data.filesTouched.length, 12);
  assert.match(content, /\.\.\. 8 more omitted from this memory file/);
  assert.doesNotMatch(content, /src\/file-19\.ts/);
});

test('ome remember shortcuts store explicit preference memory', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  const rememberOutput = runOme(workspace, [
    'remember',
    'Prefer cross-agent commands to work in every supported editor'
  ]);
  const rememberResult = JSON.parse(rememberOutput);
  assert.equal(rememberResult.persisted, true);

  const secondOutput = runOme(workspace, [
    'memory',
    'remember',
    '--scope',
    'project',
    '--statement',
    'Prefer explicit public memory commands over internal scripts'
  ]);
  const secondResult = JSON.parse(secondOutput);
  assert.equal(secondResult.persisted, true);

  const shortcutOutput = run(
    process.execPath,
    [
      path.join(workspace, 'dist', 'bin', 'ome-remember.js'),
      '--project-root',
      workspace,
      '--scope',
      'user',
      'Prefer short remember commands'
    ],
    workspace
  );
  const shortcutResult = JSON.parse(shortcutOutput);
  assert.equal(shortcutResult.persisted, true);

  const output = runOme(workspace, [
    'memory',
    'view',
    '--type',
    'preferences',
    '--format',
    'json'
  ]);

  const report = JSON.parse(output);
  assert.equal(report.summary.totalRecords, 3);
  assert.equal(report.summary.byScope.user, 2);
  assert.equal(report.summary.byScope.project, 1);
  assert.deepEqual(
    report.records.map((record: Record<string, any>) => record.statement).sort(),
    [
      'Prefer cross-agent commands to work in every supported editor',
      'Prefer explicit public memory commands over internal scripts',
      'Prefer short remember commands'
    ].sort()
  );
});

test('evolve analyzer persists learning and skill candidates from repeated patterns', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  const report = seedEvolutionWorkspace(workspace);
  assert.equal(report.summary.learningCandidates, 1);
  assert.equal(report.summary.skillCandidates, 1);
  assert.equal(report.summary.adoptedPreferences, 1);
  assert.equal(report.learningCandidates[0].status, 'candidate');
  assert.equal(report.skillCandidates[0].status, 'candidate');
  assert.equal(report.adoptedPreferences[0].statement, 'Prefer concise reports');

  const learningCandidateFile = path.join(
    workspace,
    '.ome',
    'memory',
    'learnings',
    'candidates',
    'spec-verify-verified-the-spec-change-and-acceptanc.md'
  );
  const skillCandidateFile = path.join(
    workspace,
    '.ome',
    'memory',
    'skill-candidates',
    'react-event-handler-invocation.md'
  );

  assert.ok(
    fs.existsSync(learningCandidateFile),
    'expected learning candidate file to exist'
  );
  assert.ok(
    fs.existsSync(skillCandidateFile),
    'expected skill candidate file to exist'
  );

  const learningView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'learnings',
      '--format',
      'json'
    ])
  );
  const skillView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'skill-candidates',
      '--format',
      'json'
    ])
  );

  assert.equal(learningView.summary.totalRecords, 1);
  assert.equal(learningView.summary.byStatus.candidate, 1);
  assert.equal(
    learningView.records[0].slug,
    'spec-verify-verified-the-spec-change-and-acceptanc'
  );
  assert.equal(skillView.summary.totalRecords, 1);
  assert.equal(skillView.records[0].patternId, 'react-event-handler-invocation');
});

test('auto evolution analyzes markdown execution memory after workflow completion', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);

  for (const changeId of ['auto-alpha', 'auto-beta', 'auto-gamma']) {
    recordExecutionEvent(workspace, {
      source: 'workflow_command',
      workflow: 'spec',
      phase: 'verify',
      changeId,
      changeSlug: changeId,
      capability: 'auth',
      complexity: 'high',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.8,
      stability: 0.9,
      novelty: 0.6,
      status: 'verified',
      summary: 'Verified automatic evolution candidates from markdown memory.',
      filesTouched: ['.ome/omespec/changes/demo/spec.md'],
      testsRun: ['npm test'],
      errors: [],
      metadata: {
        patternCategory: 'workflow_success'
      }
    });
  }

  autoAnalyzeEvolution(workspace);

  const candidatePath = path.join(
    workspace,
    '.ome',
    'memory',
    'learnings',
    'candidates',
    'spec-verify-verified-automatic-evolution-candidate.md'
  );
  assert.ok(
    fs.existsSync(candidatePath),
    'expected automatic analysis to write a learning candidate'
  );

  const candidate = matter(fs.readFileSync(candidatePath, 'utf8')).data;
  assert.equal(candidate.status, 'candidate');
  assert.equal(candidate.evidenceCount, 3);
  assert.equal(candidate.verification.state, 'pending');

  const state = loadAnalysisState(workspace);
  assert.equal(state.analysisCount, 1);
  assert.equal(state.lastCandidateCount, 1);
});

test('evolve analyzer ignores low-information workflow summaries', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);

  for (const changeId of ['diff-alpha', 'diff-beta', 'diff-gamma']) {
    recordExecutionEvent(workspace, {
      source: 'workflow_command',
      workflow: 'review',
      phase: 'execution',
      changeId,
      changeSlug: changeId,
      capability: 'review',
      complexity: 'medium',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.8,
      stability: 0.9,
      novelty: 0.5,
      status: 'verified',
      summary: 'current diff',
      filesTouched: ['src/example.ts'],
      testsRun: ['npm test'],
      errors: [],
      metadata: {
        patternCategory: 'workflow_success'
      }
    });
  }

  const report = JSON.parse(
    runOme(workspace, ['evolve', 'analyze', '--format', 'json'])
  );

  assert.equal(report.summary.learningCandidates, 0);
  assert.equal(
    fs.existsSync(
      path.join(
        workspace,
        '.ome',
        'memory',
        'learnings',
        'candidates',
        'review-execution-current-diff.md'
      )
    ),
    false
  );
});

test('evolve analyzer surfaces repeated agent behavior antipatterns as learning candidates', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);

  for (let index = 1; index <= 3; index += 1) {
    recordExecutionEvent(workspace, {
      source: 'workflow_command',
      workflow: 'review',
      phase: 'behavioral-gate',
      changeId: `behavior-${index}`,
      changeSlug: `behavior-${index}`,
      capability: 'agent-behavior',
      complexity: 'medium',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.9,
      stability: 0.9,
      novelty: 0.5,
      status: 'verified',
      summary: 'Detected overengineering and unnecessary abstraction in the implementation.',
      filesTouched: ['src/example.ts'],
      testsRun: ['npm test'],
      errors: [],
      metadata: {
        patternCategory: 'agent_behavior_antipattern',
        behaviorGate: 'overengineering'
      }
    });
  }

  const report = JSON.parse(runOme(workspace, ['evolve', 'analyze', '--format', 'json']));

  assert.equal(report.summary.behavioralAntipatternCandidates, 1);
  assert.equal(report.behavioralAntipatternCandidates[0].slug, 'agent-behavior-overengineering');
  assert.equal(report.behavioralAntipatternCandidates[0].category, 'agent_behavior_antipattern');
  assert.equal(report.behavioralAntipatternCandidates[0].evidenceCount, 3);

  const learningView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'learnings',
      '--format',
      'json'
    ])
  );

  assert.equal(learningView.records.some((record: Record<string, any>) => record.slug === 'agent-behavior-overengineering'), true);
});

test('learning candidates must be verified before adoption and preserve adopted state across evolve reruns', () => {
  const workspace = createWorkspace();
  const learningSlug =
    'spec-verify-verified-the-spec-change-and-acceptanc';

  runOme(workspace, ['init']);
  seedEvolutionWorkspace(workspace);

  assert.throws(
    () =>
      runOme(workspace, [
        'evolve',
        'adopt-learning',
        '--slug',
        learningSlug
      ]),
    /must be verified before adoption/
  );

  const verifyOutput = JSON.parse(
    runOme(workspace, [
      'evolve',
      'verify-learning',
      '--slug',
      learningSlug
    ])
  );

  assert.equal(verifyOutput.record.status, 'verified');
  assert.equal(verifyOutput.record.verification.state, 'passed');

  const adoptOutput = JSON.parse(
    runOme(workspace, [
      'evolve',
      'adopt-learning',
      '--slug',
      learningSlug
    ])
  );

  assert.equal(adoptOutput.record.status, 'adopted');
  assert.ok(adoptOutput.record.adoptedAt);

  const adoptedLearningPath = path.join(
    workspace,
    '.ome',
    'memory',
    'learnings',
    'adopted',
    `${learningSlug}.md`
  );
  assert.ok(
    fs.existsSync(adoptedLearningPath),
    'expected adopted learning artifact to exist'
  );

  const rerunReport = JSON.parse(
    runOme(workspace, ['evolve', 'analyze', '--format', 'json'])
  );

  assert.equal(rerunReport.learningCandidates[0].status, 'adopted');
  assert.equal(
    rerunReport.learningCandidates[0].verification.state,
    'passed'
  );

  const learningView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'learnings',
      '--format',
      'json'
    ])
  );

  assert.equal(learningView.summary.totalRecords, 1);
  assert.equal(learningView.summary.byStatus.adopted, 1);
  assert.equal(learningView.records[0].status, 'adopted');
  assert.equal(learningView.records[0].verification.state, 'passed');
});

test('skill candidates must be verified before adoption and preserve adopted state across evolve reruns', () => {
  const workspace = createWorkspace();

  runOme(workspace, ['init']);
  seedEvolutionWorkspace(workspace);

  assert.throws(
    () =>
      runOme(workspace, [
        'evolve',
        'adopt-skill',
        '--slug',
        'react-event-handler-invocation'
      ]),
    /must be verified before adoption/
  );

  const verifyOutput = JSON.parse(
    runOme(workspace, [
      'evolve',
      'verify-skill',
      '--slug',
      'react-event-handler-invocation'
    ])
  );

  if (verifyOutput.record.verification.state !== 'passed') {
    console.error('Verification failed:', JSON.stringify(verifyOutput.record.verification, null, 2));
  }

  assert.equal(verifyOutput.record.status, 'verified');
  assert.equal(verifyOutput.record.verification.state, 'passed');

  const adoptOutput = JSON.parse(
    runOme(workspace, [
      'evolve',
      'adopt-skill',
      '--slug',
      'react-event-handler-invocation'
    ])
  );

  assert.equal(adoptOutput.record.status, 'adopted');
  assert.ok(adoptOutput.record.adoptedAt);

  const generatedSkillPath = path.join(
    workspace,
    '.ome',
    'generated-skills',
    'react-event-handler-invocation.md'
  );
  assert.ok(
    fs.existsSync(generatedSkillPath),
    'expected adopted generated skill artifact to exist'
  );

  const rerunReport = JSON.parse(
    runOme(workspace, ['evolve', 'analyze', '--format', 'json'])
  );

  assert.equal(rerunReport.skillCandidates[0].status, 'adopted');
  assert.equal(rerunReport.skillCandidates[0].verification.state, 'passed');

  const candidateView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'skill-candidates',
      '--format',
      'json'
    ])
  );

  assert.equal(candidateView.summary.totalRecords, 1);
  assert.equal(candidateView.summary.byStatus.adopted, 1);
  assert.equal(candidateView.records[0].status, 'adopted');
  assert.equal(candidateView.records[0].verification.state, 'passed');
});

test('skill candidate verifier rejects incomplete markdown and accepts anatomy-complete markdown', () => {
  const { assessSkillMarkdown } = require('../skills/oh-my-engine/lib/skill-candidate-verifier');

  const incomplete = assessSkillMarkdown('# Weak Skill\n\n## Purpose\nDo a thing.\n');
  assert.equal(incomplete.ok, false);
  assert.ok(incomplete.missingSections.includes('Verification'));
  assert.ok(incomplete.rejectionReasons.length > 0);

  const complete = assessSkillMarkdown(`# Strong Skill

## Purpose
Apply a focused project pattern safely.

## When to Use
- Use when the current task matches verified evidence.
- Do not use for unrelated scope.
- Out of scope: unrelated cleanup or refactoring.

## Inputs
- User task input.
- Relevant source files and tests.
- OME.md and .ome/rules/.

## Process
1. Read project rules and relevant files.
2. Confirm assumptions and conflicts.
3. Make the smallest focused change using existing patterns.
4. Add regression coverage for behavior changes.
5. Run tests, typecheck, or build.
6. Report changed files and remaining risks.

## Red Flags
- Requirement conflict with current code.
- Security risk or unrequested dependencies.
- Scope expands into unrelated cleanup.

## Common Rationalizations
- This is too small to test.
- No error output means complete.
- I can clean unrelated code while here.

## Verification
- Run relevant tests, typecheck, build, or lint.
- Bugfix work must include regression evidence.
- If checks cannot run, report the blocker and remaining risks.

## Output Contract
- Changed files
- What changed
- Verification
- Remaining risks
`);

  assert.equal(complete.ok, true);
  assert.equal(complete.missingSections.length, 0);
  assert.equal(complete.rejectionReasons.length, 0);
  assert.ok(complete.score.verification >= 4);
  assert.ok(complete.score.scopeControl >= 4);
});

test('spec plan and apply load adopted engine memory context', () => {
  const workspace = createWorkspace();
  const learningSlug =
    'spec-verify-verified-the-spec-change-and-acceptanc';

  runOme(workspace, ['init']);
  seedEvolutionWorkspace(workspace);

  runOme(workspace, ['evolve', 'verify-learning', '--slug', learningSlug]);
  runOme(workspace, ['evolve', 'adopt-learning', '--slug', learningSlug]);
  runOme(workspace, [
    'evolve',
    'verify-skill',
    '--slug',
    'react-event-handler-invocation'
  ]);
  runOme(workspace, [
    'evolve',
    'adopt-skill',
    '--slug',
    'react-event-handler-invocation'
  ]);

  runOme(workspace, [
    'spec',
    'propose',
    'engine-memory-demo',
    '--capability',
    'auth'
  ]);

  const planOutput = runOme(workspace, [
    'spec',
    'plan',
    'engine-memory-demo'
  ]);

  const engineMemoryContextPath = path.join(
    workspace,
    '.ome',
    'omespec',
    'changes',
    'engine-memory-demo',
    'context',
    'engine-memory.md'
  );
  assert.ok(
    fs.existsSync(engineMemoryContextPath),
    'expected engine memory context to be generated during plan'
  );
  assert.match(
    planOutput,
    /\.ome[\/\\]omespec[\/\\]changes[\/\\]engine-memory-demo[\/\\]context[\/\\]engine-memory\.md/
  );
  assert.match(
    planOutput,
    /Execution directives from adopted skills:/
  );
  assert.match(
    planOutput,
    /Avoid immediate invocation in React JSX event handlers/
  );

  const engineMemoryContext = fs.readFileSync(engineMemoryContextPath, 'utf8');
  assert.match(engineMemoryContext, /Adopted Learnings/);
  assert.match(
    engineMemoryContext,
    /Verified the spec change and acceptance state\./
  );
  assert.match(engineMemoryContext, /Generated Skills/);
  assert.match(engineMemoryContext, /react-event-handler-invocation/);

  const applyOutput = runOme(workspace, [
    'spec',
    'apply',
    'engine-memory-demo'
  ]);

  assert.match(
    applyOutput,
    /\.ome[\/\\]omespec[\/\\]changes[\/\\]engine-memory-demo[\/\\]context[\/\\]engine-memory\.md/
  );
  assert.match(
    applyOutput,
    /Execution directives from adopted skills:/
  );
  assert.match(
    applyOutput,
    /Avoid immediate invocation in React JSX event handlers/
  );

  const generatedSkillArtifact = matter(
    fs.readFileSync(
      path.join(
        workspace,
        '.ome',
        'generated-skills',
        'react-event-handler-invocation.md'
      ),
      'utf8'
    )
  ).data;

  assert.ok(
    Array.isArray(generatedSkillArtifact.executionDirectives),
    'expected adopted skill artifact to contain execution directives'
  );
  assert.match(
    generatedSkillArtifact.executionDirectives[0],
    /React JSX event handlers/
  );

  const statusOutput = runOme(workspace, [
    'spec',
    'status',
    'engine-memory-demo'
  ]);

  assert.match(statusOutput, /engine-memory\.md/);
  assert.match(statusOutput, /Execution directives: [1-9]/);

  const adoptedLearningView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'adopted-learnings',
      '--format',
      'json'
    ])
  );
  const generatedSkillView = JSON.parse(
    runOme(workspace, [
      'memory',
      'view',
      '--type',
      'generated-skills',
      '--format',
      'json'
    ])
  );

  assert.equal(adoptedLearningView.summary.totalRecords, 1);
  assert.equal(adoptedLearningView.records[0].status, 'adopted');
  assert.equal(generatedSkillView.summary.totalRecords, 1);
  assert.equal(generatedSkillView.records[0].slug, 'react-event-handler-invocation');
  assert.match(generatedSkillView.records[0].adoptedFrom, /\.md$/);
  assert.ok(
    Array.isArray(generatedSkillView.records[0].evidence) &&
      generatedSkillView.records[0].evidence.length > 0,
    'expected generated skills viewer to preserve source evidence'
  );
  assert.ok(
    Array.isArray(generatedSkillView.records[0].executionDirectives),
    'expected generated skills viewer to expose execution directives'
  );
});

test('non-spec workflows surface adopted learnings and generated skill directives', () => {
  const workspace = createWorkspace();
  const specLearningSlug =
    'spec-verify-verified-the-spec-change-and-acceptanc';
  const uiLearningSlug =
    'ui-restore-apply-reuse-themedstyle-and-design-toke';

  runOme(workspace, ['init']);
  seedEvolutionWorkspace(workspace);

  for (let index = 1; index <= 3; index += 1) {
    recordExecutionEvent(workspace, {
      source: 'workflow_command',
      workflow: 'ui-restore',
      phase: 'apply',
      changeId: `ui-${index}`,
      changeSlug: `ui-${index}`,
      capability: 'ui',
      complexity: 'medium',
      confidence: 'high',
      sensitivity: 'low',
      reusePotential: 0.9,
      stability: 0.9,
      novelty: 0.4,
      status: 'success',
      summary: 'Reuse ThemedStyle and design tokens for generated UI.',
      filesTouched: ['src/components/LoginButton.tsx'],
      testsRun: ['npm test'],
      errors: [],
      metadata: {
        patternCategory: 'workflow_success'
      }
    });
  }

  runOme(workspace, ['evolve', 'analyze', '--format', 'json']);
  runOme(workspace, [
    'evolve',
    'verify-learning',
    '--slug',
    specLearningSlug
  ]);
  runOme(workspace, [
    'evolve',
    'adopt-learning',
    '--slug',
    specLearningSlug
  ]);
  runOme(workspace, [
    'evolve',
    'verify-learning',
    '--slug',
    uiLearningSlug
  ]);
  runOme(workspace, [
    'evolve',
    'adopt-learning',
    '--slug',
    uiLearningSlug
  ]);
  runOme(workspace, [
    'evolve',
    'verify-skill',
    '--slug',
    'react-event-handler-invocation'
  ]);
  runOme(workspace, [
    'evolve',
    'adopt-skill',
    '--slug',
    'react-event-handler-invocation'
  ]);

  const bugOutput = runOme(workspace, [
    'guidance',
    'bug-analysis',
    '--input',
    'Login button click does nothing'
  ]);
  const uiOutput = runOme(workspace, [
    'guidance',
    'ui-restore',
    '--input',
    'https://mastergo.com/goto/demo'
  ]);
  const componentOutput = runOme(workspace, [
    'guidance',
    'component-gen',
    '--input',
    'UserCard'
  ]);
  const apiOutput = runOme(workspace, [
    'guidance',
    'api-integration',
    '--input',
    './specs/user-api.yaml'
  ]);

  assert.match(bugOutput, /Workflow: bug-analysis/);
  assert.match(bugOutput, /Execution directives from adopted skills:/);
  assert.match(bugOutput, /react-event-handler-invocation/);

  assert.match(uiOutput, /Workflow: ui-restore/);
  assert.match(
    uiOutput,
    /Reuse ThemedStyle and design tokens for generated UI\./
  );
  assert.match(uiOutput, /Execution directives from adopted skills:/);

  assert.match(componentOutput, /Workflow: component-gen/);
  assert.match(componentOutput, /Execution directives from adopted skills:/);

  assert.match(apiOutput, /Workflow: api-integration/);
  assert.match(apiOutput, /Execution directives from adopted skills:/);
});

test('workflow guidance prioritizes contextually relevant adopted memory', () => {
  const workspace = createWorkspace();
  const adoptedDir = path.join(
    workspace,
    '.ome',
    'memory',
    'learnings',
    'adopted'
  );

  runOme(workspace, ['init']);
  fs.mkdirSync(adoptedDir, { recursive: true });

  fs.writeFileSync(
    path.join(adoptedDir, 'build-session-finish.md'),
    matter.stringify(
      [
        '# Preserve workflow session finish semantics',
        '',
        'When `ome finish` reports `No active workflow session found`, inspect `.ome/.session` and `src/core/session.ts` before changing memory storage.',
        ''
      ].join('\n'),
      {
        type: 'learning',
        status: 'adopted',
        title: 'Preserve workflow session finish semantics',
        workflow: 'build',
        phase: 'execution',
        evidenceCount: 2,
        appliesTo: ['build'],
        evidence: [
          {
            workflow: 'build',
            changeId: 'session-finish',
            filesTouched: ['src/core/session.ts'],
            errors: ['No active workflow session found']
          }
        ]
      }
    ),
    'utf8'
  );
  fs.writeFileSync(
    path.join(adoptedDir, 'build-color-theme.md'),
    matter.stringify(
      [
        '# Keep generated UI colors consistent',
        '',
        'When restoring UI, reuse color tokens and avoid hardcoded visual drift.',
        ''
      ].join('\n'),
      {
        type: 'learning',
        status: 'adopted',
        title: 'Keep generated UI colors consistent',
        workflow: 'build',
        phase: 'execution',
        evidenceCount: 5,
        appliesTo: ['build']
      }
    ),
    'utf8'
  );

  const output = runOme(workspace, [
    'guidance',
    'build',
    '--input',
    'Fix No active workflow session found from ome finish in src/core/session.ts and .ome/.session'
  ]);

  assert.match(output, /Preserve workflow session finish semantics/);
  assert.doesNotMatch(output, /Keep generated UI colors consistent/);
});

test('workflow guidance filters generated skill directives by contextual relevance', () => {
  const workspace = createWorkspace();
  const generatedSkillsDir = path.join(workspace, '.ome', 'generated-skills');

  runOme(workspace, ['init']);
  fs.mkdirSync(generatedSkillsDir, { recursive: true });

  fs.writeFileSync(
    path.join(generatedSkillsDir, 'session-finish-triage.md'),
    matter.stringify(
      [
        '# Session finish triage',
        '',
        'Use this skill when `ome finish` cannot find `.ome/.session`.',
        ''
      ].join('\n'),
      {
        slug: 'session-finish-triage',
        title: 'Session finish triage',
        summary: 'Diagnose No active workflow session found failures in src/core/session.ts.',
        evidenceCount: 2,
        executionDirectives: [
          'Inspect .ome/.session before changing src/core/session.ts.'
        ]
      }
    ),
    'utf8'
  );
  fs.writeFileSync(
    path.join(generatedSkillsDir, 'color-token-review.md'),
    matter.stringify(
      [
        '# Color token review',
        '',
        'Use this skill when generated UI colors drift from design tokens.',
        ''
      ].join('\n'),
      {
        slug: 'color-token-review',
        title: 'Color token review',
        summary: 'Review generated UI color token usage.',
        evidenceCount: 7,
        executionDirectives: [
          'Compare generated UI colors against design tokens.'
        ]
      }
    ),
    'utf8'
  );

  const output = runOme(workspace, [
    'guidance',
    'build',
    '--input',
    'Fix No active workflow session found from ome finish in src/core/session.ts and .ome/.session'
  ]);

  assert.match(output, /session-finish-triage/);
  assert.match(output, /Inspect \.ome\/\.session before changing src\/core\/session\.ts\./);
  assert.doesNotMatch(output, /color-token-review/);
  assert.doesNotMatch(output, /Compare generated UI colors against design tokens\./);
});

export {};


