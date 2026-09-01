const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  recordExecutionMemory,
  listAdoptedLearningRecords,
  writeAdoptedLearningArtifact,
  writeGeneratedSkillArtifact
} = require('../skills/oh-my-engine/lib/memory-store');
const {
  collectWorkflowGuidance
} = require('../skills/oh-my-engine/lib/workflow-guidance');
const {
  trackEffectiveness
} = require('../skills/oh-my-engine/lib/effectiveness-tracker');
const {
  autoCleanupIneffective
} = require('../skills/oh-my-engine/lib/auto-cleanup');
const {
  assessSkillMarkdown
} = require('../skills/oh-my-engine/lib/skill-candidate-verifier');

function createWorkspace(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('Chinese workflow input selects relevant memory instead of returning every record', () => {
  const workspace = createWorkspace('ome-eval-chinese-guidance-');

  writeAdoptedLearningArtifact(workspace, 'login-timeout', {
    slug: 'login-timeout',
    title: '登录超时处理',
    summary: '登录接口超时时应保留原始错误并重试一次。',
    workflow: 'bug',
    appliesTo: ['bug'],
    evidenceCount: 4,
    status: 'adopted'
  });
  writeAdoptedLearningArtifact(workspace, 'invoice-layout', {
    slug: 'invoice-layout',
    title: '发票布局规范',
    summary: '发票打印时使用固定页边距。',
    workflow: 'bug',
    appliesTo: ['bug'],
    evidenceCount: 8,
    status: 'adopted'
  });
  writeGeneratedSkillArtifact(workspace, 'login-retry', {
    slug: 'login-retry',
    title: '登录重试',
    summary: '定位登录超时并验证重试边界。',
    evidenceCount: 3,
    executionDirectives: ['先复现登录超时，再检查重试次数。'],
    status: 'adopted'
  });
  writeGeneratedSkillArtifact(workspace, 'invoice-export', {
    slug: 'invoice-export',
    title: '发票导出',
    summary: '生成发票导出文件。',
    evidenceCount: 6,
    executionDirectives: ['检查发票分页。'],
    status: 'adopted'
  });

  const guidance = collectWorkflowGuidance(workspace, 'bug', {
    input: '修复登录接口超时和重试问题'
  });

  assert.deepEqual(guidance.adoptedLearnings.map((item: any) => item.slug), ['login-timeout']);
  assert.deepEqual(guidance.generatedSkills.map((item: any) => item.slug), ['login-retry']);
  assert.deepEqual(guidance.executionDirectives.map((item: any) => item.slug), ['login-retry']);

  const noMatch = collectWorkflowGuidance(workspace, 'bug', {
    input: 'quantum battery calibration'
  });
  assert.deepEqual(noMatch.adoptedLearnings, []);
  assert.deepEqual(noMatch.generatedSkills, []);
  assert.deepEqual(noMatch.executionDirectives, []);
});

test('effectiveness tracking reads current Markdown memory records', () => {
  const workspace = createWorkspace('ome-eval-effectiveness-');
  const adoptedAt = '2026-01-02T00:00:00.000Z';

  writeAdoptedLearningArtifact(workspace, 'safe-retry', {
    slug: 'safe-retry',
    title: 'Safe retry',
    summary: 'Retry transient failures once.',
    evidenceCount: 3,
    status: 'adopted',
    adoptedAt
  });

  const common = {
    source: 'workflow_command',
    workflow: 'bug',
    phase: 'execution',
    complexity: 'medium',
    captureLevel: 'summary',
    whyStored: 'Evaluation fixture',
    filesTouched: ['src/retry.ts'],
    testsRun: ['node --test'],
    durationMs: 100,
    errors: [],
    rootCause: 'Transient request failure',
    evidence: ['Reproduced with deterministic fixture'],
    fixSummary: 'Apply a bounded retry',
    verificationSummary: 'Regression test executed'
  };

  recordExecutionMemory(workspace, {
    ...common,
    id: 'exec-before',
    timestamp: '2026-01-01T00:00:00.000Z',
    summary: 'Failure before adopted retry guidance',
    status: 'failed'
  });
  recordExecutionMemory(workspace, {
    ...common,
    id: 'exec-after',
    timestamp: '2026-01-03T00:00:00.000Z',
    summary: 'Success after adopted retry guidance',
    status: 'success'
  });

  const metrics = trackEffectiveness(workspace, 'safe-retry');

  assert.equal(metrics.executionsBefore, 1);
  assert.equal(metrics.executionsAfter, 1);
  assert.equal(metrics.errorRateBefore, 1);
  assert.equal(metrics.errorRateAfter, 0);
  assert.equal(metrics.status, 'effective');
});

test('auto cleanup deprecates harmful adopted Markdown learning after enough evidence', () => {
  const workspace = createWorkspace('ome-eval-auto-cleanup-');
  const adoptedAt = '2026-02-02T00:00:00.000Z';
  writeAdoptedLearningArtifact(workspace, 'harmful-retry', {
    slug: 'harmful-retry',
    title: 'Harmful retry',
    summary: 'Retry every failure repeatedly.',
    workflow: 'bug',
    appliesTo: ['bug'],
    evidenceCount: 3,
    status: 'adopted',
    adoptedAt
  });

  const common = {
    source: 'workflow_command',
    workflow: 'bug',
    phase: 'execution',
    complexity: 'medium',
    durationMs: 50,
    filesTouched: ['src/retry.ts'],
    testsRun: ['node --test'],
    errors: [],
    rootCause: 'Retry policy',
    evidence: ['Deterministic cleanup fixture'],
    fixSummary: 'Apply retry guidance',
    verificationSummary: 'Fixture executed'
  };
  recordExecutionMemory(workspace, {
    ...common,
    id: 'cleanup-before',
    timestamp: '2026-02-01T00:00:00.000Z',
    summary: 'Successful execution before harmful learning',
    status: 'success'
  });
  for (let index = 0; index < 10; index += 1) {
    recordExecutionMemory(workspace, {
      ...common,
      id: `cleanup-after-${index}`,
      timestamp: `2026-02-${String(index + 3).padStart(2, '0')}T00:00:00.000Z`,
      summary: `Failed execution after harmful learning ${index}`,
      status: 'failed'
    });
  }

  autoCleanupIneffective(workspace);

  const updated = listAdoptedLearningRecords(workspace)
    .find((item: any) => item.slug === 'harmful-retry');
  assert.equal(updated.status, 'deprecated');
  assert.match(updated.deprecationReason, /error rate increased/i);
});

test('skill quality gate rejects keyword stuffing without executable section content', () => {
  const stuffed = `# Keyword-stuffed skill

## Purpose
Test scope risk existing minimal must.

## When to Use
Inputs and out of scope.

## Inputs
Existing files.

## Process
1. Verify test.

## Red Flags
Risk conflict security assumption.

## Common Rationalizations
Unrelated cleanup and dependencies.

## Verification
Test typecheck build lint regression evidence remaining risks must.

## Output Contract
Output contract.
`;

  const assessment = assessSkillMarkdown(stuffed);

  assert.equal(assessment.ok, false);
  assert.match(assessment.rejectionReasons.join('\n'), /concrete list items|numbered executable steps/);
});

export {};
