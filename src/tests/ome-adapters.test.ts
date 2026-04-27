const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getAdapters } = require('../adapters/registry');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-adapters-'));
}

test('adapter registry exposes known platform adapters and capabilities', () => {
  const ids = getAdapters().map((adapter: any) => adapter.id).sort();

  assert.deepEqual(ids, ['antigravity', 'claude-code', 'codex', 'cursor', 'opencode', 'qoder', 'trae', 'windsurf']);
  assert.deepEqual(getAdapter('cursor').capabilities, ['rules:mdc']);
  assert.ok(getAdapter('codex').capabilities.includes('skills:codex'));
});

test('file and directory adapters detect generated targets', () => {
  const workspace = createWorkspace();
  fs.writeFileSync(path.join(workspace, 'AGENTS.md'), '# Rules\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.cursor', 'rules'), { recursive: true });

  const codex = getAdapter('codex');
  const cursor = getAdapter('cursor');

  assert.equal(codex.detect(workspace, { file: 'AGENTS.md', type: 'single-file' }), true);
  assert.equal(cursor.detect(workspace, { directory: '.cursor/rules', type: 'multi-file' }), true);
  assert.equal(codex.detect(workspace, { file: 'MISSING.md', type: 'single-file' }), false);
});

export {};
