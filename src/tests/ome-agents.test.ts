const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { OME_BIN, omeArgs } = require('./helpers');

function createWorkspace(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, omeArgs(args), { cwd, encoding: 'utf8' });
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
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-define.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-plan.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-ship.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-mcp.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-define', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-review', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-init-rules', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-superpowers', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-mcp', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.cursor', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.trae', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.qoder', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.config', 'opencode', 'command', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-init-rules.md')), true);

  const claudeCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-bug.md'), 'utf8');
  const initCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-init.md'), 'utf8');
  const initRulesCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-init-rules.md'), 'utf8');
  const codexSkill = fs.readFileSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md'), 'utf8');
  const antigravityWorkflow = fs.readFileSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-bug.md'), 'utf8');
  assert.match(claudeCommand, /## Purpose/);
  assert.match(claudeCommand, /## When to Use/);
  assert.match(claudeCommand, /## Process/);
  assert.match(claudeCommand, /## Red Flags/);
  assert.match(claudeCommand, /## Output Contract/);
  assert.match(claudeCommand, /ome-bug/);
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'ome-review', 'SKILL.md'), 'utf8'), /^---\nname: ome-review\n/);
  assert.match(codexSkill, /## Purpose/);
  assert.match(codexSkill, /## When to Use/);
  assert.match(codexSkill, /## Process/);
  assert.match(codexSkill, /## Red Flags/);
  assert.match(codexSkill, /## Common Rationalizations/);
  assert.match(codexSkill, /## Verification/);
  assert.match(codexSkill, /## Output Contract/);
  assert.match(initCommand, /## Purpose/);
  assert.match(initRulesCommand, /## Purpose/);
  assert.match(initRulesCommand, /\.ome\/context\/project-scan\.json/);
  assert.match(initRulesCommand, /Do not create UI, mobile, or design-token rules unless the repository signals them/);
  assert.match(initRulesCommand, /Sync platform rule files after editing the source rules/);
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'ome-mcp', 'SKILL.md'), 'utf8'), /## Purpose/);
  assert.match(codexSkill, /^---\nname: ome-bug\n/);
  assert.match(codexSkill, /\ntags: \[ome, bug, debug, workflow\]\n---\n/);
  assert.match(antigravityWorkflow, /^---\ndescription: Analyze, diagnose, and plan a bug fix using project rules\.\n---\n/);
  assert.match(antigravityWorkflow, /Antigravity workflow notes:/);
});

test('ome agents install --project writes project command entries', () => {
  const workspace = createWorkspace('ome-agents-project-');

  runOme(['agents', 'install', '--project', '--project-root', workspace, '--all'], workspace);

  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.cursor', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.cursor', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurf', 'workflows', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.qoder', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.opencode', 'command', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.agent', 'workflows', 'ome-bug.md')), true);
  assert.match(fs.readFileSync(path.join(workspace, '.agent', 'workflows', 'ome-bug.md'), 'utf8'), /^---\ndescription:/);
});

test('ome init preserves existing agent files and merges OME guidance blocks', () => {
  const workspace = createWorkspace('ome-init-merge-');
  const claudePath = path.join(workspace, 'CLAUDE.md');
  const agentsPath = path.join(workspace, 'AGENTS.md');

  fs.writeFileSync(claudePath, '# Team Claude Rules\n\nKeep the existing Claude contract.\n', 'utf8');
  fs.writeFileSync(agentsPath, '# Team Agent Rules\n\nKeep the existing Codex/OpenCode contract.\n', 'utf8');

  runOme(['init'], workspace);

  const claude = fs.readFileSync(claudePath, 'utf8');
  const agents = fs.readFileSync(agentsPath, 'utf8');
  assert.match(claude, /Keep the existing Claude contract/);
  assert.match(claude, /<!-- OME:START -->/);
  assert.match(claude, /Rule source: `\.ome\/rules\/`/);
  assert.match(claude, /Skill source: `\.ome\/skills\/`/);
  assert.match(agents, /Keep the existing Codex\/OpenCode contract/);
  assert.match(agents, /<!-- OME:START -->/);
  assert.match(agents, /read `OME\.md`, the relevant `\.ome\/rules\/\*\.md` files/);

  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md')), false);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md')), false);
  assert.equal(fs.existsSync(path.join(workspace, '.agents', 'skills', 'ome-bug', 'SKILL.md')), false);
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
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md')), true);
  } finally {
    fs.readSync = originalReadSync;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: originalIsTTY });
  }
});

test('ome agents doctor reports missing workflow names instead of a single init check', () => {
  const home = createWorkspace('ome-agents-doctor-home-');

  runOme(['agents', 'install', '--home', home, 'claude-code'], process.cwd());
  fs.rmSync(path.join(home, '.claude', 'commands', 'ome-init-rules.md'));

  const output = runOme(['agents', 'doctor', '--home', home, 'claude-code'], process.cwd());

  assert.match(output, /claude-code:/);
  assert.match(output, /global=ome-init-rules/);
});

test('ome superpowers install and doctor cover all agent editor wrappers', () => {
  const home = createWorkspace('ome-superpowers-home-');
  fs.mkdirSync(path.join(home, '.codex', 'superpowers', 'skills'), { recursive: true });

  const output = runOme(['superpowers', 'install', '--home', home, 'all'], process.cwd());

  assert.match(output, /Official Superpowers installation/);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'superpowers')), true);
  assert.equal(fs.existsSync(path.join(home, '.cursor', 'commands', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.trae', 'commands', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.qoder', 'commands', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.config', 'opencode', 'command', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-superpowers.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-superpowers.md')), true);

  const doctor = runOme(['superpowers', 'doctor', '--home', home, 'all'], process.cwd());
  assert.match(doctor, /codex: wrapper=missing native=installed/);
  assert.match(doctor, /antigravity: wrapper=installed/);
  assert.match(doctor, /opencode: wrapper=installed/);
});

test('ome init --install-agents initializes project rules and global commands', () => {
  const workspace = createWorkspace('ome-init-agents-');
  const home = createWorkspace('ome-init-agents-home-');

  const output = runOme(['init', '--install-agents', '--home', home], workspace);

  assert.match(output, /Integration targets synced:/);
  assert.match(output, /Project skills installed:/);
  assert.match(output, /Project command entries synced: 0/);
  assert.match(output, /Global skills installed:/);
  assert.equal(fs.existsSync(path.join(workspace, 'OME.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.agents', 'skills', 'ome-bug', 'SKILL.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md')), true);
});

export {};
