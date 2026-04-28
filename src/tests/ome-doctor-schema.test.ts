const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const { OME_BIN } = require('./helpers');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-doctor-'));
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, args, { cwd, encoding: 'utf8' });
}

test('ome doctor validates schemas for initialized projects', () => {
  const workspace = createWorkspace();
  runOme(['init'], workspace);

  const result = spawnSync(OME_BIN, ['doctor'], { cwd: workspace, encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /OME\.md validation: valid/);
});

test('ome doctor reports schema failures', () => {
  const workspace = createWorkspace();
  runOme(['init'], workspace);

  // Write invalid OME.md (missing required fields)
  fs.writeFileSync(path.join(workspace, 'OME.md'), '---\nversion: "1.0.0"\n---\n\n# Invalid Config\n', 'utf8');

  const result = spawnSync(OME_BIN, ['doctor'], { cwd: workspace, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /OME\.md validation: invalid/);
});

export {};
