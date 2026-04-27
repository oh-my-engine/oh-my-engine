const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { OME_BIN, repoPath } = require('./helpers');

function createWorkspace(): string {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-rules-'));
  fs.mkdirSync(path.join(workspace, '.oh-my-engine'), { recursive: true });
  fs.cpSync(repoPath('.oh-my-engine', 'config.json'), path.join(workspace, '.oh-my-engine', 'config.json'));
  fs.cpSync(repoPath('.oh-my-engine', 'platforms.json'), path.join(workspace, '.oh-my-engine', 'platforms.json'));
  fs.cpSync(repoPath('.oh-my-engine', 'rules'), path.join(workspace, '.oh-my-engine', 'rules'), { recursive: true });
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

test('ome rules sync replaces legacy .oh-my-engine/rules-sync.js entrypoint', () => {
  const workspace = createWorkspace();

  const output = runOme(['rules', 'sync', 'windsurf'], workspace);

  assert.match(output, /windsurf/);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurfrules')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.oh-my-engine', 'rules-sync.js')), false);
});

export {};
