const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  OME_ENGINEER_POLICY,
  createRunState,
  transitionRun
} = require('../core/run-engine');
const { renderLifecycleGuidanceText } = require('../core/lifecycle');

function evidence(state: any, type: string, summary: string, extra: Record<string, unknown> = {}): any {
  return transitionRun(state, {
    type: 'record-evidence',
    evidence: {
      type,
      stage: state.stage,
      summary,
      createdAt: '2026-09-02T00:00:00.000Z',
      ...extra
    }
  }, OME_ENGINEER_POLICY).state;
}

test('OME engineer policy starts at define and requires evidence before advancing', () => {
  const original = createRunState('deliver plugin', {
    runId: 'run-1',
    now: '2026-09-02T00:00:00.000Z',
    policy: OME_ENGINEER_POLICY
  });
  const blocked = transitionRun(original, { type: 'advance' }, OME_ENGINEER_POLICY);

  assert.equal(original.stage, 'define');
  assert.equal(blocked.state.stage, 'define');
  assert.match(blocked.blockingIssues.join('\n'), /requirement_summary/);
  assert.deepEqual(original.evidence, []);

  const defined = evidence(original, 'requirement_summary', 'Scoped requirement');
  const advanced = transitionRun(defined, { type: 'advance' }, OME_ENGINEER_POLICY);
  assert.equal(advanced.state.stage, 'plan');
  assert.deepEqual(advanced.blockingIssues, []);
});

test('plan cannot enter build until a user-command approval is recorded', () => {
  let state = createRunState('deliver plugin', {
    runId: 'run-2',
    now: '2026-09-02T00:00:00.000Z',
    policy: OME_ENGINEER_POLICY
  });
  state = evidence(state, 'requirement_summary', 'Defined');
  state = transitionRun(state, { type: 'advance' }, OME_ENGINEER_POLICY).state;
  state = evidence(state, 'plan_artifact', 'Decision-complete plan');

  const blocked = transitionRun(state, { type: 'advance' }, OME_ENGINEER_POLICY);
  assert.equal(blocked.state.stage, 'plan');
  assert.match(blocked.blockingIssues.join('\n'), /user command/);

  state = transitionRun(state, {
    type: 'approve-plan',
    approvedAt: '2026-09-02T00:01:00.000Z',
    source: 'user-command'
  }, OME_ENGINEER_POLICY).state;
  const advanced = transitionRun(state, { type: 'advance' }, OME_ENGINEER_POLICY);
  assert.equal(advanced.state.stage, 'build');
});

test('verification stage requires executed evidence and rejects stage skipping', () => {
  let state = createRunState('verify plugin', {
    runId: 'run-3',
    now: '2026-09-02T00:00:00.000Z',
    policy: OME_ENGINEER_POLICY
  });
  state.stage = 'verify';
  state = evidence(state, 'verification_command', 'npm test', { verificationStatus: 'asserted' });

  const asserted = transitionRun(state, { type: 'advance' }, OME_ENGINEER_POLICY);
  assert.match(asserted.blockingIssues.join('\n'), /verification_command/);

  state = evidence(state, 'verification_command', 'npm test', {
    verificationStatus: 'executed',
    toolCallId: 'tool-1'
  });
  const skipped = transitionRun(state, { type: 'advance', toStage: 'ship' }, OME_ENGINEER_POLICY);
  assert.equal(skipped.state.stage, 'verify');
  assert.match(skipped.blockingIssues.join('\n'), /directly to ship/);

  const advanced = transitionRun(state, { type: 'advance' }, OME_ENGINEER_POLICY);
  assert.equal(advanced.state.stage, 'review');
});

test('pure lifecycle guidance does not create an OME session file', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ome-guidance-pure-'));
  const output = renderLifecycleGuidanceText({
    workflow: 'plan',
    input: 'build a plugin',
    cwd: workspace,
    now: new Date('2026-09-02T00:00:00.000Z')
  });

  assert.match(output, /# Plan Workflow/);
  assert.match(output, /\.ome\/plans\/2026-09-02-build-a-plugin\.md/);
  assert.doesNotMatch(output, /Session ID:/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', '.session')), false);
});

test('strict runs complete only at learn and cancellation is terminal', () => {
  const active = createRunState('complete plugin', {
    runId: 'run-4',
    now: '2026-09-02T00:00:00.000Z',
    policy: OME_ENGINEER_POLICY
  });
  const premature = transitionRun(active, { type: 'finish' }, OME_ENGINEER_POLICY);
  assert.equal(premature.state.status, 'active');
  assert.match(premature.blockingIssues.join('\n'), /not ready/);

  const learn = { ...active, stage: 'learn' as const };
  const completed = transitionRun(learn, {
    type: 'finish',
    completedAt: '2026-09-02T00:10:00.000Z'
  }, OME_ENGINEER_POLICY);
  assert.equal(completed.state.status, 'completed');
  assert.equal(completed.state.completedAt, '2026-09-02T00:10:00.000Z');

  const cancelled = transitionRun(active, {
    type: 'cancel',
    reason: 'user stopped',
    cancelledAt: '2026-09-02T00:05:00.000Z'
  }, OME_ENGINEER_POLICY);
  assert.equal(cancelled.state.status, 'cancelled');
  const afterCancel = transitionRun(cancelled.state, { type: 'advance' }, OME_ENGINEER_POLICY);
  assert.equal(afterCancel.state.stage, 'define');
  assert.match(afterCancel.blockingIssues.join('\n'), /cancelled/);
});

export {};
