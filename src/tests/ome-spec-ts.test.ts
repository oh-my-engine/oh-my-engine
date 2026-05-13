const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { OME_BIN, omeArgs } = require('./helpers');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-spec-ts-'));
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, omeArgs(args), {
    cwd,
    encoding: 'utf8'
  });
}

test('ome spec propose creates scaffold and status through TypeScript implementation', () => {
  const workspace = createWorkspace();

  const proposeOutput = runOme(['spec', 'propose', 'User Authentication', '--capability', 'auth'], workspace);
  assert.match(proposeOutput, /Created change scaffold/);

  const changeDir = path.join(workspace, '.ome', 'omespec', 'changes', 'user-authentication');
  assert.equal(fs.existsSync(path.join(changeDir, 'proposal.md')), true);
  assert.equal(fs.existsSync(path.join(changeDir, 'design.md')), true);
  assert.equal(fs.existsSync(path.join(changeDir, 'tasks.md')), true);
  assert.equal(fs.existsSync(path.join(changeDir, 'specs', 'auth', 'spec.md')), true);

  const memory = JSON.parse(fs.readFileSync(path.join(workspace, '.ome', 'memory', 'specs', 'user-authentication.json'), 'utf8'));
  assert.equal(memory.changeId, 'User Authentication');
  assert.equal(memory.changeSlug, 'user-authentication');
  assert.equal(memory.capability, 'auth');
  assert.equal(memory.status, 'proposed');

  const statusOutput = runOme(['spec', 'status', 'User Authentication'], workspace);
  assert.match(statusOutput, /Change: User Authentication/);
  assert.match(statusOutput, /Capability: auth/);
  assert.match(statusOutput, /Status: proposed/);
});

test('ome spec propose supports design-first and force overwrite', () => {
  const workspace = createWorkspace();

  runOme(['spec', 'propose', 'new-flow', '--design-first'], workspace);
  const designPath = path.join(workspace, '.ome', 'omespec', 'changes', 'new-flow', 'design.md');
  assert.match(fs.readFileSync(designPath, 'utf8'), /Planning Mode/);

  fs.writeFileSync(designPath, 'custom\n', 'utf8');
  assert.throws(() => runOme(['spec', 'propose', 'new-flow'], workspace), /Change already exists/);

  runOme(['spec', 'propose', 'new-flow', '--force'], workspace);
  assert.doesNotMatch(fs.readFileSync(designPath, 'utf8'), /^custom$/);
});

export {};

test('ome spec plan and apply update lifecycle state through TypeScript implementation', () => {
  const workspace = createWorkspace();

  runOme(['spec', 'propose', 'checkout-flow'], workspace);
  const planOutput = runOme(['spec', 'plan', 'checkout-flow'], workspace);
  assert.match(planOutput, /Planned change: checkout-flow/);

  const changeDir = path.join(workspace, '.ome', 'omespec', 'changes', 'checkout-flow');
  assert.match(fs.readFileSync(path.join(changeDir, 'design.md'), 'utf8'), /Planning Notes/);

  let memory = JSON.parse(fs.readFileSync(path.join(workspace, '.ome', 'memory', 'specs', 'checkout-flow.json'), 'utf8'));
  assert.equal(memory.status, 'planned');
  assert.equal(memory.phase, 'plan');

  const applyOutput = runOme([
    'spec',
    'apply',
    'checkout-flow',
    '--task',
    'Confirm impacted files',
    '--acceptance',
    'Add the first acceptance',
    '--note',
    'Implementation owner confirmed'
  ], workspace);
  assert.match(applyOutput, /Apply context for change: checkout-flow/);
  assert.match(applyOutput, /Progress files updated/);

  const tasks = fs.readFileSync(path.join(changeDir, 'tasks.md'), 'utf8');
  assert.match(tasks, /- \[x\] Confirm impacted files and capabilities/);
  assert.match(tasks, /- Note: Implementation owner confirmed/);

  const proposal = fs.readFileSync(path.join(changeDir, 'proposal.md'), 'utf8');
  assert.match(proposal, /- \[x\] TBD: Add the first acceptance criterion/);

  memory = JSON.parse(fs.readFileSync(path.join(workspace, '.ome', 'memory', 'specs', 'checkout-flow.json'), 'utf8'));
  assert.equal(memory.status, 'in_progress');
  assert.equal(memory.phase, 'apply');
  assert.equal(memory.completedTasks, 1);
  assert.equal(memory.openAcceptanceCriteria, 1);
});

test('ome spec apply supports all and undo operations', () => {
  const workspace = createWorkspace();

  runOme(['spec', 'propose', 'undo-flow'], workspace);
  runOme(['spec', 'apply', 'undo-flow', '--all-tasks', '--all-acceptance'], workspace);

  let status = runOme(['spec', 'status', 'undo-flow'], workspace);
  assert.match(status, /Open tasks: 0/);
  assert.match(status, /Open acceptance criteria: 0/);

  runOme(['spec', 'apply', 'undo-flow', '--undo-task', 'Run focused verification', '--undo-acceptance', 'second acceptance'], workspace);
  status = runOme(['spec', 'status', 'undo-flow'], workspace);
  assert.match(status, /Open tasks: 1/);
  assert.match(status, /Open acceptance criteria: 1/);
});

test('ome spec import and decompose are TypeScript-backed', () => {
  const workspace = createWorkspace();
  const assetPath = path.join(workspace, 'asset.txt');
  fs.writeFileSync(assetPath, 'asset body\n', 'utf8');

  const importOutput = runOme([
    'spec',
    'import',
    'intake-flow',
    '--source-text',
    'Users need a saved checkout flow.',
    '--prompt-text',
    'Prioritize mobile behavior.',
    '--asset',
    assetPath
  ], workspace);
  assert.match(importOutput, /Imported context/);

  const contextDir = path.join(workspace, '.ome/omespec', 'changes', 'intake-flow', 'context');
  assert.match(fs.readFileSync(path.join(contextDir, 'source.md'), 'utf8'), /saved checkout flow/);
  assert.match(fs.readFileSync(path.join(contextDir, 'prompt.md'), 'utf8'), /Prioritize mobile behavior/);
  assert.equal(fs.existsSync(path.join(contextDir, 'assets', 'asset.txt')), true);

  const decomposeOutput = runOme(['spec', 'decompose', 'intake-flow', '--capability', 'checkout'], workspace);
  assert.match(decomposeOutput, /Decomposed change/);
  assert.equal(fs.existsSync(path.join(contextDir, 'analysis.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome/omespec', 'changes', 'intake-flow', 'specs', 'checkout', 'spec.md')), true);
});

test('ome spec verify and archive are TypeScript-backed', () => {
  const workspace = createWorkspace();
  runOme(['spec', 'propose', 'accepted-flow', '--capability', 'checkout'], workspace);
  runOme(['spec', 'apply', 'accepted-flow', '--all-tasks', '--all-acceptance'], workspace);

  const changeDir = path.join(workspace, '.ome/omespec', 'changes', 'accepted-flow');
  fs.writeFileSync(
    path.join(changeDir, 'proposal.md'),
    `# Change Proposal\n\n## Summary\nAccepted checkout flow.\n\n## Acceptance Criteria\n- [x] Checkout succeeds.\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(changeDir, 'design.md'),
    `# Technical Design\n\n## Overview\nUse the existing checkout service.\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(changeDir, 'specs', 'checkout', 'spec.md'),
    `# Spec Delta\n\n## Capability\n\`checkout\`\n\n## Change Type\n- [x] Add\n- [ ] Modify\n- [ ] Remove\n\n## Requirements\n### Requirement: Saved Checkout Flow\nThe system MUST persist checkout progress for signed-in users.\n\n#### Scenario: User returns later\n- **WHEN** a signed-in user reopens checkout\n- **THEN** the system restores the saved checkout progress\n\n## Compatibility Notes\n- Backward compatibility: Existing checkout sessions remain valid.\n`,
    'utf8'
  );

  const verifyOutput = runOme(['spec', 'verify', 'accepted-flow'], workspace);
  assert.match(verifyOutput, /Verification passed/);

  const archiveOutput = runOme(['spec', 'archive', 'accepted-flow'], workspace);
  assert.match(archiveOutput, /Archived change/);

  assert.equal(fs.existsSync(changeDir), false);
  const specPath = path.join(workspace, '.ome/omespec', 'specs', 'checkout', 'spec.md');
  assert.match(fs.readFileSync(specPath, 'utf8'), /Saved Checkout Flow/);

  const memory = JSON.parse(fs.readFileSync(path.join(workspace, '.ome', 'memory', 'specs', 'accepted-flow.json'), 'utf8'));
  assert.equal(memory.status, 'archived');
  assert.equal(memory.phase, 'archive');
  assert.match(memory.archivedPath, /\.ome[\/\\]omespec[\/\\]archive[\/\\]/);
});

