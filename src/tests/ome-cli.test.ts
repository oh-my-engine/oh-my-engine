const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');

const { OME_BIN, REPO_ROOT, omeArgs } = require('./helpers');

function runOme(args: string[]): string {
  return execFileSync(OME_BIN, omeArgs(args), {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
}

test('ome help lists productized command groups', () => {
  const output = runOme(['--help']);

  assert.match(output, /rules validate/);
  assert.match(output, /agents <command>/);
  assert.match(output, /bug <description>/);
  assert.match(output, /spec <command>/);
  assert.match(output, /guidance <workflow>/);
  assert.match(output, /memory view/);
  assert.match(output, /evolve adopt-learning/);
  assert.match(output, /evolve adopt-skill/);
  assert.match(output, /adapters list/);
});

test('ome rules validate reports local rules', () => {
  const output = runOme(['rules', 'validate']);

  assert.match(output, /Rules valid: yes/);
  assert.match(output, /code-style/);
});

test('ome rules preview reports platform targets', () => {
  const output = runOme(['rules', 'preview', 'codex']);

  assert.match(output, /Rules sync preview/);
  assert.match(output, /codex:/);
});

test('ome adapters list reports configured platforms', () => {
  const output = runOme(['adapters', 'list']);

  assert.match(output, /claude-code/);
  assert.match(output, /codex/);
});

test('ome bug renders project workflow guidance', () => {
  const output = runOme(['bug', 'login fails']);

  assert.match(output, /Bug Analysis Workflow/);
  assert.match(output, /\.ome\/rules/);
  assert.match(output, /login fails/);
});

test('ome unknown command exits non-zero with a clear error', () => {
  const result = spawnSync(OME_BIN, omeArgs(['missing-command']), {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown command: missing-command/);
});

export {};
