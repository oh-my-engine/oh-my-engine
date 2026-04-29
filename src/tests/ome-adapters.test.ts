const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { listAdapterManifests, previewAdapterSync } = require('../adapters');
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

test('adapters expose manifests and dry-run sync plans', () => {
  const workspace = createWorkspace();
  fs.mkdirSync(path.join(workspace, '.ome'), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, '.ome', 'platforms.json'),
    JSON.stringify({
      enabled: ['codex', 'cursor'],
      platforms: {
        codex: { name: 'Codex', type: 'single-file', file: 'AGENTS.md' },
        cursor: { name: 'Cursor', type: 'multi-file', directory: '.cursor/rules' }
      }
    }, null, 2),
    'utf8'
  );
  fs.writeFileSync(path.join(workspace, 'AGENTS.md'), '# Rules\n', 'utf8');

  const manifests = listAdapterManifests(workspace);

  assert.equal(manifests.length, 2);
  assert.equal(manifests[0].id, 'codex');
  assert.equal(manifests[0].detected, true);
  assert.deepEqual(manifests[0].config, { name: 'Codex', type: 'single-file', file: 'AGENTS.md' });

  assert.deepEqual(previewAdapterSync(workspace, 'codex'), {
    platform: 'codex',
    target: 'AGENTS.md',
    action: 'update'
  });
  assert.deepEqual(previewAdapterSync(workspace, 'cursor', ['code-style.md']), {
    platform: 'cursor',
    target: '.cursor/rules',
    action: 'create',
    files: ['code-style.md']
  });
});

export {};
