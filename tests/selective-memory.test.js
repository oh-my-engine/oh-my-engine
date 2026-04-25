const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

function createWorkspace() {
  const workspace = fs.mkdtempSync(
    path.join(os.tmpdir(), 'oh-my-engine-selective-memory-')
  );

  fs.cpSync(path.join(REPO_ROOT, 'skills'), path.join(workspace, 'skills'), {
    recursive: true
  });

  return workspace;
}

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8'
  });
}

function recordExecutionEvent(workspace, event) {
  const eventFile = path.join(
    workspace,
    `execution-event-${Math.random().toString(16).slice(2, 10)}.json`
  );

  fs.writeFileSync(eventFile, `${JSON.stringify(event, null, 2)}\n`, 'utf8');
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/record-execution-memory.js'
      ),
      '--project-root',
      workspace,
      '--event-file',
      eventFile
    ],
    REPO_ROOT
  );
  fs.unlinkSync(eventFile);
}

function findExecutionFiles(workspace, workflow) {
  const directory = path.join(
    workspace,
    '.oh-my-engine',
    'memory',
    'executions',
    workflow
  );

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.jsonl'))
    .map(name => path.join(directory, name))
    .sort();
}

function readExecutionRecords(workspace, workflow) {
  return findExecutionFiles(workspace, workflow).flatMap(filePath =>
    fs
      .readFileSync(filePath, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
  );
}

function writeValidFeatureDocs(workspace, change) {
  const changeDirectory = path.join(workspace, 'openspec', 'changes', change);

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
- \`openspec/specs/${change}/spec.md\`
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

function seedEvolutionWorkspace(workspace) {
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
      filesTouched: ['openspec/changes/demo/spec.md'],
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

  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/record-preference-memory.js'
      ),
      '--project-root',
      workspace,
      '--scope',
      'user',
      '--statement',
      'Prefer concise reports'
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/record-preference-memory.js'
      ),
      '--project-root',
      workspace,
      '--scope',
      'user',
      '--statement',
      'Prefer concise reports'
    ],
    REPO_ROOT
  );

  return JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-evolve/scripts/run-evolve.js'
        ),
        '--project-root',
        workspace,
        '--format',
        'json'
      ],
      REPO_ROOT
    )
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

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  run(
    'sh',
    ['skills/oh-my-engine-spec/scripts/propose-change.sh', 'demo-memory'],
    workspace
  );

  const executionFiles = findExecutionFiles(workspace, 'spec');
  assert.ok(
    executionFiles.length > 0,
    'expected spec execution memory to be written'
  );

  const firstRecord = fs
    .readFileSync(executionFiles[0], 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
    .find(record => record.changeId === 'demo-memory');

  assert.ok(firstRecord, 'expected a record for the proposed change');
  assert.equal(firstRecord.workflow, 'spec');
  assert.equal(firstRecord.phase, 'propose');
  assert.equal(firstRecord.source, 'workflow_command');
  assert.equal(firstRecord.captureLevel, 'rich');
  assert.equal(firstRecord.whyStored, 'workflow_command_high_complexity');

  const output = run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-memory/scripts/view-memory.js'
      ),
      '--project-root',
      workspace,
      '--type',
      'executions',
      '--workflow',
      'spec',
      '--format',
      'json'
    ],
    REPO_ROOT
  );

  const report = JSON.parse(output);
  assert.equal(report.summary.totalRecords, 1);
  assert.equal(report.summary.byWorkflow.spec, 1);
  assert.equal(report.records[0].changeId, 'demo-memory');
  assert.equal(report.records[0].whyStored, 'workflow_command_high_complexity');
});

test('project init writes selective memory defaults', () => {
  const workspace = createWorkspace();

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);

  const config = JSON.parse(
    fs.readFileSync(
      path.join(workspace, '.oh-my-engine', 'config.json'),
      'utf8'
    )
  );

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

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  run(
    'sh',
    ['skills/oh-my-engine-spec/scripts/propose-change.sh', 'demo-lifecycle'],
    workspace
  );

  writeValidFeatureDocs(workspace, 'demo-lifecycle');

  run(
    'sh',
    ['skills/oh-my-engine-spec/scripts/plan-change.sh', 'demo-lifecycle'],
    workspace
  );
  run(
    'sh',
    [
      'skills/oh-my-engine-spec/scripts/apply-change.sh',
      'demo-lifecycle',
      '--all-tasks',
      '--all-acceptance'
    ],
    workspace
  );
  run(
    'sh',
    ['skills/oh-my-engine-spec/scripts/verify-change.sh', 'demo-lifecycle'],
    workspace
  );
  run(
    'sh',
    ['skills/oh-my-engine-spec/scripts/archive-change.sh', 'demo-lifecycle'],
    workspace
  );

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

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/record-preference-memory.js'
      ),
      '--project-root',
      workspace,
      '--scope',
      'user',
      '--statement',
      'Prefer concise reports'
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/record-preference-memory.js'
      ),
      '--project-root',
      workspace,
      '--scope',
      'user',
      '--statement',
      'Prefer concise reports'
    ],
    REPO_ROOT
  );

  const preferenceFile = path.join(
    workspace,
    '.oh-my-engine',
    'memory',
    'preferences',
    'user.json'
  );

  assert.ok(fs.existsSync(preferenceFile), 'expected preference file to exist');

  const output = run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-memory/scripts/view-memory.js'
      ),
      '--project-root',
      workspace,
      '--type',
      'preferences',
      '--format',
      'json'
    ],
    REPO_ROOT
  );

  const report = JSON.parse(output);
  assert.equal(report.summary.totalRecords, 1);
  assert.equal(report.summary.byScope.user, 1);
  assert.equal(report.records[0].statement, 'Prefer concise reports');
  assert.equal(report.records[0].source, 'explicit_remember');
  assert.equal(report.records[0].whyStored, 'explicit_remember');
  assert.equal(report.records[0].evidenceCount, 2);
});

test('evolve analyzer persists learning and skill candidates from repeated patterns', () => {
  const workspace = createWorkspace();

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  const report = seedEvolutionWorkspace(workspace);
  assert.equal(report.summary.learningCandidates, 1);
  assert.equal(report.summary.skillCandidates, 1);
  assert.equal(report.summary.adoptedPreferences, 1);
  assert.equal(report.learningCandidates[0].status, 'candidate');
  assert.equal(report.skillCandidates[0].status, 'candidate');
  assert.equal(report.adoptedPreferences[0].statement, 'Prefer concise reports');

  const learningCandidateFile = path.join(
    workspace,
    '.oh-my-engine',
    'memory',
    'learnings',
    'candidates',
    'spec-verify-verified-the-spec-change-and-acceptance-state.json'
  );
  const skillCandidateFile = path.join(
    workspace,
    '.oh-my-engine',
    'memory',
    'skill-candidates',
    'react-event-handler-invocation.json'
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
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-memory/scripts/view-memory.js'
        ),
        '--project-root',
        workspace,
        '--type',
        'learnings',
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );
  const skillView = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-memory/scripts/view-memory.js'
        ),
        '--project-root',
        workspace,
        '--type',
        'skill-candidates',
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );

  assert.equal(learningView.summary.totalRecords, 1);
  assert.equal(learningView.summary.byStatus.candidate, 1);
  assert.equal(
    learningView.records[0].slug,
    'spec-verify-verified-the-spec-change-and-acceptance-state'
  );
  assert.equal(skillView.summary.totalRecords, 1);
  assert.equal(skillView.records[0].patternId, 'react-event-handler-invocation');
});

test('learning candidates must be verified before adoption and preserve adopted state across evolve reruns', () => {
  const workspace = createWorkspace();
  const learningSlug =
    'spec-verify-verified-the-spec-change-and-acceptance-state';

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  seedEvolutionWorkspace(workspace);

  assert.throws(
    () =>
      run(
        'node',
        [
          path.join(
            REPO_ROOT,
            'skills/oh-my-engine/scripts/adopt-learning-candidate.js'
          ),
          '--project-root',
          workspace,
          '--slug',
          learningSlug
        ],
        REPO_ROOT
      ),
    /must be verified before adoption/
  );

  const verifyOutput = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-evolve/scripts/verify-learning-candidate.js'
        ),
        '--project-root',
        workspace,
        '--slug',
        learningSlug
      ],
      REPO_ROOT
    )
  );

  assert.equal(verifyOutput.record.status, 'verified');
  assert.equal(verifyOutput.record.verification.state, 'passed');

  const adoptOutput = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine/scripts/adopt-learning-candidate.js'
        ),
        '--project-root',
        workspace,
        '--slug',
        learningSlug
      ],
      REPO_ROOT
    )
  );

  assert.equal(adoptOutput.record.status, 'adopted');
  assert.ok(adoptOutput.record.adoptedAt);

  const adoptedLearningPath = path.join(
    workspace,
    '.oh-my-engine',
    'memory',
    'learnings',
    'adopted',
    `${learningSlug}.json`
  );
  assert.ok(
    fs.existsSync(adoptedLearningPath),
    'expected adopted learning artifact to exist'
  );

  const rerunReport = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-evolve/scripts/run-evolve.js'
        ),
        '--project-root',
        workspace,
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );

  assert.equal(rerunReport.learningCandidates[0].status, 'adopted');
  assert.equal(
    rerunReport.learningCandidates[0].verification.state,
    'passed'
  );

  const learningView = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-memory/scripts/view-memory.js'
        ),
        '--project-root',
        workspace,
        '--type',
        'learnings',
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );

  assert.equal(learningView.summary.totalRecords, 1);
  assert.equal(learningView.summary.byStatus.adopted, 1);
  assert.equal(learningView.records[0].status, 'adopted');
  assert.equal(learningView.records[0].verification.state, 'passed');
});

test('skill candidates must be verified before adoption and preserve adopted state across evolve reruns', () => {
  const workspace = createWorkspace();

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  seedEvolutionWorkspace(workspace);

  assert.throws(
    () =>
      run(
        'node',
        [
          path.join(
            REPO_ROOT,
            'skills/oh-my-engine/scripts/adopt-skill-candidate.js'
          ),
          '--project-root',
          workspace,
          '--slug',
          'react-event-handler-invocation'
        ],
        REPO_ROOT
      ),
    /must be verified before adoption/
  );

  const verifyOutput = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-evolve/scripts/verify-skill-candidate.js'
        ),
        '--project-root',
        workspace,
        '--slug',
        'react-event-handler-invocation'
      ],
      REPO_ROOT
    )
  );

  assert.equal(verifyOutput.record.status, 'verified');
  assert.equal(verifyOutput.record.verification.state, 'passed');

  const adoptOutput = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine/scripts/adopt-skill-candidate.js'
        ),
        '--project-root',
        workspace,
        '--slug',
        'react-event-handler-invocation'
      ],
      REPO_ROOT
    )
  );

  assert.equal(adoptOutput.record.status, 'adopted');
  assert.ok(adoptOutput.record.adoptedAt);

  const generatedSkillPath = path.join(
    workspace,
    '.oh-my-engine',
    'generated-skills',
    'react-event-handler-invocation.json'
  );
  assert.ok(
    fs.existsSync(generatedSkillPath),
    'expected adopted generated skill artifact to exist'
  );

  const rerunReport = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-evolve/scripts/run-evolve.js'
        ),
        '--project-root',
        workspace,
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );

  assert.equal(rerunReport.skillCandidates[0].status, 'adopted');
  assert.equal(rerunReport.skillCandidates[0].verification.state, 'passed');

  const candidateView = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-memory/scripts/view-memory.js'
        ),
        '--project-root',
        workspace,
        '--type',
        'skill-candidates',
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );

  assert.equal(candidateView.summary.totalRecords, 1);
  assert.equal(candidateView.summary.byStatus.adopted, 1);
  assert.equal(candidateView.records[0].status, 'adopted');
  assert.equal(candidateView.records[0].verification.state, 'passed');
});

test('spec plan and apply load adopted engine memory context', () => {
  const workspace = createWorkspace();
  const learningSlug =
    'spec-verify-verified-the-spec-change-and-acceptance-state';

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
  seedEvolutionWorkspace(workspace);

  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-evolve/scripts/verify-learning-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      learningSlug
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/adopt-learning-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      learningSlug
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-evolve/scripts/verify-skill-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      'react-event-handler-invocation'
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/adopt-skill-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      'react-event-handler-invocation'
    ],
    REPO_ROOT
  );

  run(
    'sh',
    [
      'skills/oh-my-engine-spec/scripts/propose-change.sh',
      'engine-memory-demo',
      '--capability',
      'auth'
    ],
    workspace
  );

  const planOutput = run(
    'sh',
    ['skills/oh-my-engine-spec/scripts/plan-change.sh', 'engine-memory-demo'],
    workspace
  );

  const engineMemoryContextPath = path.join(
    workspace,
    'openspec',
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
    /openspec\/changes\/engine-memory-demo\/context\/engine-memory\.md/
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

  const applyOutput = run(
    'sh',
    [
      'skills/oh-my-engine-spec/scripts/apply-change.sh',
      'engine-memory-demo'
    ],
    workspace
  );

  assert.match(
    applyOutput,
    /openspec\/changes\/engine-memory-demo\/context\/engine-memory\.md/
  );
  assert.match(
    applyOutput,
    /Execution directives from adopted skills:/
  );
  assert.match(
    applyOutput,
    /Avoid immediate invocation in React JSX event handlers/
  );

  const generatedSkillArtifact = JSON.parse(
    fs.readFileSync(
      path.join(
        workspace,
        '.oh-my-engine',
        'generated-skills',
        'react-event-handler-invocation.json'
      ),
      'utf8'
    )
  );

  assert.ok(
    Array.isArray(generatedSkillArtifact.executionDirectives),
    'expected adopted skill artifact to contain execution directives'
  );
  assert.match(
    generatedSkillArtifact.executionDirectives[0],
    /React JSX event handlers/
  );

  const statusOutput = run(
    'sh',
    [
      'skills/oh-my-engine-spec/scripts/status-change.sh',
      'engine-memory-demo'
    ],
    workspace
  );

  assert.match(statusOutput, /engine-memory\.md/);
  assert.match(statusOutput, /Execution directives: [1-9]/);

  const adoptedLearningView = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-memory/scripts/view-memory.js'
        ),
        '--project-root',
        workspace,
        '--type',
        'adopted-learnings',
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );
  const generatedSkillView = JSON.parse(
    run(
      'node',
      [
        path.join(
          REPO_ROOT,
          'skills/oh-my-engine-memory/scripts/view-memory.js'
        ),
        '--project-root',
        workspace,
        '--type',
        'generated-skills',
        '--format',
        'json'
      ],
      REPO_ROOT
    )
  );

  assert.equal(adoptedLearningView.summary.totalRecords, 1);
  assert.equal(adoptedLearningView.records[0].status, 'adopted');
  assert.equal(generatedSkillView.summary.totalRecords, 1);
  assert.equal(generatedSkillView.records[0].slug, 'react-event-handler-invocation');
  assert.ok(
    Array.isArray(generatedSkillView.records[0].executionDirectives),
    'expected generated skills viewer to expose execution directives'
  );
});

test('non-spec workflows surface adopted learnings and generated skill directives', () => {
  const workspace = createWorkspace();
  const specLearningSlug =
    'spec-verify-verified-the-spec-change-and-acceptance-state';
  const uiLearningSlug =
    'ui-restore-apply-reuse-themedstyle-and-design-tokens-for-generated-ui';

  run('sh', ['skills/oh-my-engine-init/scripts/init-project.sh'], workspace);
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

  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-evolve/scripts/run-evolve.js'
      ),
      '--project-root',
      workspace,
      '--format',
      'json'
    ],
    REPO_ROOT
  );

  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-evolve/scripts/verify-learning-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      specLearningSlug
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/adopt-learning-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      specLearningSlug
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-evolve/scripts/verify-learning-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      uiLearningSlug
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/adopt-learning-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      uiLearningSlug
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine-evolve/scripts/verify-skill-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      'react-event-handler-invocation'
    ],
    REPO_ROOT
  );
  run(
    'node',
    [
      path.join(
        REPO_ROOT,
        'skills/oh-my-engine/scripts/adopt-skill-candidate.js'
      ),
      '--project-root',
      workspace,
      '--slug',
      'react-event-handler-invocation'
    ],
    REPO_ROOT
  );

  const bugOutput = run(
    'sh',
    [
      'skills/oh-my-engine-bug/scripts/prepare-context.sh',
      'Login button click does nothing'
    ],
    workspace
  );
  const uiOutput = run(
    'sh',
    [
      'skills/oh-my-engine-ui/scripts/prepare-context.sh',
      'https://mastergo.com/goto/demo'
    ],
    workspace
  );
  const componentOutput = run(
    'sh',
    [
      'skills/oh-my-engine-comp/scripts/prepare-context.sh',
      'UserCard'
    ],
    workspace
  );
  const apiOutput = run(
    'sh',
    [
      'skills/oh-my-engine-api/scripts/prepare-context.sh',
      './specs/user-api.yaml'
    ],
    workspace
  );

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
