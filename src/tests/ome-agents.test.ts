const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { OME_BIN } = require('./helpers');

function createWorkspace(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, args, { cwd, encoding: 'utf8' });
}

test('ome agents list reports command and rules support matrix', () => {
  const output = runOme(['agents', 'list'], process.cwd());

  assert.match(output, /claude-code/);
  assert.match(output, /codex/);
  assert.match(output, /cursor/);
  assert.match(output, /windsurf/);
  assert.match(output, /qoder/);
  assert.match(output, /opencode/);
  assert.match(output, /antigravity/);
});

test('ome agents install writes global short command entries', () => {
  const home = createWorkspace('ome-agents-home-');

  const output = runOme(['agents', 'install', '--home', home, '--all'], process.cwd());

  assert.match(output, /claude-code/);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.qoder', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-bug.md')), true);

  const claudeCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-bug.md'), 'utf8');
  const codexSkill = fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md'), 'utf8');
  assert.match(claudeCommand, /Read `.ome\/config.json`/);
  assert.match(claudeCommand, /ome-bug/);
  assert.match(codexSkill, /^---\nname: ome-bug\n/);
  assert.match(codexSkill, /\ntags: \[ome, bug, workflow\]\n---\n/);
});

test('ome agents install --project writes project command entries', () => {
  const workspace = createWorkspace('ome-agents-project-');

  runOme(['agents', 'install', '--project', '--project-root', workspace, '--all'], workspace);

  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.cursor', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.qoder', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.opencode', 'command', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.agent', 'workflows', 'ome-bug.md')), true);
});

test('ome agents install falls back to all when interactive read is unavailable', () => {
  const home = createWorkspace('ome-agents-eagain-home-');
  const { installAgents } = require('../core/agents');
  const originalReadSync = fs.readSync;
  const originalIsTTY = process.stdin.isTTY;

  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
  fs.readSync = (() => {
    const error = new Error('resource temporarily unavailable') as NodeJS.ErrnoException;
    error.code = 'EAGAIN';
    throw error;
  }) as typeof fs.readSync;

  try {
    const results = installAgents({ platforms: [], home });
    assert.equal(results.length > 0, true);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
    assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md')), true);
  } finally {
    fs.readSync = originalReadSync;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: originalIsTTY });
  }
});

test('ome init --install-agents initializes project rules and global commands', () => {
  const workspace = createWorkspace('ome-init-agents-');
  const home = createWorkspace('ome-init-agents-home-');

  const output = runOme(['init', '--install-agents', '--home', home], workspace);

  assert.match(output, /Integration targets synced:/);
  assert.match(output, /Agent commands installed:/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'config.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
});

export {};
