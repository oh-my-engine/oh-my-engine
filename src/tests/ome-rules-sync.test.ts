const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { OME_BIN, repoPath } = require('./helpers');

function createWorkspace(): string {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-rules-'));
  fs.mkdirSync(path.join(workspace, '.ome'), { recursive: true });
  fs.cpSync(repoPath('.ome', 'config.json'), path.join(workspace, '.ome', 'config.json'));
  fs.cpSync(repoPath('.ome', 'platforms.json'), path.join(workspace, '.ome', 'platforms.json'));
  fs.cpSync(repoPath('.ome', 'rules'), path.join(workspace, '.ome', 'rules'), { recursive: true });
  fs.mkdirSync(path.join(workspace, 'node_modules'), { recursive: true });
  return workspace;
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, args, { cwd, encoding: 'utf8' });
}

test('ome rules sync writes single-file and multi-file platform targets through TypeScript core', () => {
  const workspace = createWorkspace();

  const output = runOme(['rules', 'sync', 'codex', 'cursor'], workspace);
  assert.match(output, /codex/);
  assert.match(output, /cursor/);

  const agentsPath = path.join(workspace, 'AGENTS.md');
  assert.equal(fs.existsSync(agentsPath), true);
  assert.match(fs.readFileSync(agentsPath, 'utf8'), /规则索引/);
  assert.match(fs.readFileSync(agentsPath, 'utf8'), /ome rules sync/);

  const cursorRule = path.join(workspace, '.cursor', 'rules', 'typescript-react-native.mdc');
  assert.equal(fs.existsSync(cursorRule), true);
  assert.match(fs.readFileSync(cursorRule, 'utf8'), /^---/);
  assert.match(fs.readFileSync(cursorRule, 'utf8'), /description:/);
});

test('ome rules sync replaces legacy .ome/rules-sync.js entrypoint', () => {
  const workspace = createWorkspace();

  const output = runOme(['rules', 'sync', 'windsurf'], workspace);

  assert.match(output, /windsurf/);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurfrules')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules-sync.js')), false);
});

test('ome rules sync preserves user content in single-file targets', () => {
  const workspace = createWorkspace();
  const agentsPath = path.join(workspace, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# User rules\n\nKeep this section.\n', 'utf8');

  runOme(['rules', 'sync', 'codex'], workspace);

  const content = fs.readFileSync(agentsPath, 'utf8');
  assert.match(content, /Keep this section/);
  assert.match(content, /<!-- OME:START -->/);
  assert.match(content, /<!-- OME:END -->/);
});

export {};
