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

  const output = runOme(['agents', 'install', '--home', home, '--all', '--no-install-openspec'], process.cwd());

  assert.match(output, /claude-code/);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-define.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-plan.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-ship.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-superpowers.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-mcp.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-memory.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-remember.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-spec.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-define', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-review', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-memory', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-spec', 'SKILL.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-define', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-review', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-init-rules', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-superpowers', 'SKILL.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-mcp', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-memory', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-remember', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-spec', 'SKILL.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.cursor', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.cursor', 'commands', 'ome-remember.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.trae', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.trae', 'commands', 'ome-remember.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.qoder', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.qoder', 'commands', 'ome-remember.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.config', 'opencode', 'command', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.config', 'opencode', 'command', 'ome-remember.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-remember.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-remember.md')), true);

  const claudeCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-bug.md'), 'utf8');
  const initCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-init.md'), 'utf8');
  const initRulesCommand = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-init-rules.md'), 'utf8');
  const codexSkill = fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md'), 'utf8');
  const legacyCodexSkill = fs.readFileSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md'), 'utf8');
  const antigravityWorkflow = fs.readFileSync(path.join(home, '.gemini', 'antigravity', 'global_workflows', 'ome-bug.md'), 'utf8');
  assert.match(claudeCommand, /## Purpose/);
  assert.match(claudeCommand, /## When to Use/);
  assert.match(claudeCommand, /## Process/);
  assert.match(claudeCommand, /## Red Flags/);
  assert.match(claudeCommand, /## Output Contract/);
  assert.match(claudeCommand, /ome-bug/);
  assert.match(fs.readFileSync(path.join(home, '.agents', 'skills', 'ome-review', 'SKILL.md'), 'utf8'), /^---\r?\nname: ome-review\r?\n/);
  assert.match(codexSkill, /## Purpose/);
  assert.match(codexSkill, /## When to Use/);
  assert.match(codexSkill, /## Process/);
  assert.match(codexSkill, /## Red Flags/);
  assert.match(codexSkill, /## Common Rationalizations/);
  assert.match(codexSkill, /## Verification/);
  assert.match(codexSkill, /## Output Contract/);
  assert.match(claudeCommand, /## Workflow Session Start \(MANDATORY\)/);
  assert.match(claudeCommand, /ome bug \$ARGUMENTS/);
  assert.match(claudeCommand, /cmd\.exe \/c ome\.cmd bug \$ARGUMENTS/);
  assert.match(claudeCommand, /## Workflow Completion \(SUBSTANTIVE WORK ONLY\)/);
  assert.match(claudeCommand, /ome finish/);
  assert.match(codexSkill, /## Workflow Session Start \(MANDATORY\)/);
  assert.match(codexSkill, /ome bug \$ARGUMENTS/);
  assert.match(codexSkill, /## Workflow Completion \(SUBSTANTIVE WORK ONLY\)/);
  assert.match(legacyCodexSkill, /## Workflow Session Start \(MANDATORY\)/);
  assert.match(legacyCodexSkill, /ome bug \$ARGUMENTS/);
  assert.match(initCommand, /^---\r?\ndescription: Initialize \.ome project configuration and Agent rules\.\r?\n---\r?\n/);
  assert.match(initCommand, /\n# ome-init\r?\n/);
  assert.doesNotMatch(initCommand, /\nname: ome-init\r?\n/);
  assert.match(initRulesCommand, /## Purpose/);
  assert.match(initRulesCommand, /\.ome\/context\/project-scan\.json/);
  assert.match(initRulesCommand, /Do not create UI, mobile, or design-token rules unless the repository signals them/);
  assert.match(initRulesCommand, /Sync platform rule files after editing the source rules/);
  assert.match(fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-mcp', 'SKILL.md'), 'utf8'), /## Purpose/);
  assert.match(codexSkill, /^---\r?\nname: ome-bug\r?\n/);
  assert.match(codexSkill, /\r?\ntags: \[ome, bug, debug, workflow\]\r?\n---\r?\n/);
  assert.match(antigravityWorkflow, /^---\r?\ndescription: Analyze, diagnose, and plan a bug fix using project rules\.\r?\n---\r?\n/);
  assert.match(antigravityWorkflow, /Antigravity workflow notes:/);

  // Action-style commands (ome-memory, ome-evolve): Claude Code keeps the bang
  // line and `allowed-tools`, other platforms keep MUST/Action wording but
  // strip the `!ome ...` line so they don't echo a Claude-specific prefix.
  const claudeMemory = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-memory.md'), 'utf8');
  assert.match(claudeMemory, /<!-- OME:ACTION -->/);
  assert.match(claudeMemory, /Action command — execute, do not narrate/);
  assert.match(claudeMemory, /you MUST do the following/);
  assert.match(claudeMemory, /allowed-tools:\s*Bash\(ome memory view:\*\)/);
  assert.match(claudeMemory, /^!ome memory view \$ARGUMENTS$/m);

  const opencodeMemory = fs.readFileSync(path.join(home, '.config', 'opencode', 'command', 'ome-memory.md'), 'utf8');
  assert.match(opencodeMemory, /<!-- OME:ACTION -->/);
  assert.match(opencodeMemory, /you MUST do the following/);
  assert.doesNotMatch(opencodeMemory, /^!ome memory view/m);

  const cursorMemory = fs.readFileSync(path.join(home, '.cursor', 'commands', 'ome-memory.md'), 'utf8');
  assert.match(cursorMemory, /you MUST do the following/);
  assert.doesNotMatch(cursorMemory, /^!ome memory view/m);

  const codexMemorySkill = fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-memory', 'SKILL.md'), 'utf8');
  // Codex skill style preserves the full source verbatim (including the bang line).
  assert.match(codexMemorySkill, /<!-- OME:ACTION -->/);
  assert.match(codexMemorySkill, /^!ome memory view \$ARGUMENTS$/m);
  assert.match(codexMemorySkill, /allowed-tools:\s*Bash\(ome memory view:\*\)/);

  const claudeRemember = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-remember.md'), 'utf8');
  assert.match(claudeRemember, /<!-- OME:ACTION -->/);
  assert.match(claudeRemember, /ome memory remember \$ARGUMENTS/);
  assert.match(claudeRemember, /allowed-tools:\s*Bash\(ome memory remember:\*\)/);
  assert.match(claudeRemember, /^!ome memory remember \$ARGUMENTS$/m);

  const opencodeRemember = fs.readFileSync(path.join(home, '.config', 'opencode', 'command', 'ome-remember.md'), 'utf8');
  assert.match(opencodeRemember, /ome memory remember \$ARGUMENTS/);
  assert.doesNotMatch(opencodeRemember, /^!ome memory remember/m);

  const codexRememberSkill = fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-remember', 'SKILL.md'), 'utf8');
  assert.match(codexRememberSkill, /^---\r?\nname: ome-remember\r?\n/);
  assert.match(codexRememberSkill, /^!ome memory remember \$ARGUMENTS$/m);
  assert.match(codexRememberSkill, /allowed-tools:\s*Bash\(ome memory remember:\*\)/);

  // Lifecycle workflows must carry the substantive completion section in every
  // platform-rendered file, and must start the CLI workflow session before
  // doing real work so `ome finish` can find `.ome/.session`.
  const claudeBuild = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-build.md'), 'utf8');
  const codexBuild = fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-build', 'SKILL.md'), 'utf8');
  const opencodeBuild = fs.readFileSync(path.join(home, '.config', 'opencode', 'command', 'ome-build.md'), 'utf8');
  const windsurfBuild = fs.readFileSync(path.join(home, '.codeium', 'windsurf', 'global_workflows', 'ome-build.md'), 'utf8');
  for (const content of [claudeBuild, codexBuild, opencodeBuild, windsurfBuild]) {
    assert.match(content, /## Workflow Session Start \(MANDATORY\)/);
    assert.match(content, /you MUST start the OME workflow session/);
    assert.match(content, /ome build \$ARGUMENTS/);
    assert.match(content, /cmd\.exe \/c ome\.cmd build \$ARGUMENTS/);
    assert.match(content, /## Workflow Completion \(SUBSTANTIVE WORK ONLY\)/);
    assert.match(content, /Run `ome finish` only after a substantive workflow loop/);
    assert.match(content, /Do NOT run `ome finish` for ordinary conversation/);
    assert.match(content, /ome finish/);
  }

  const claudePlan = fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-plan.md'), 'utf8');
  const codexPlan = fs.readFileSync(path.join(home, '.codex', 'skills', 'ome-plan', 'SKILL.md'), 'utf8');
  for (const content of [claudePlan, codexPlan]) {
    assert.match(content, /## Workflow Session Start \(MANDATORY\)/);
    assert.match(content, /ome plan \$ARGUMENTS/);
    assert.match(content, /## Workflow Completion \(SUBSTANTIVE WORK ONLY\)/);
  }

  // Non-session commands must NOT receive lifecycle session start/completion blocks.
  const nonSessionEntries = [
    fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-memory.md'), 'utf8'),
    fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-remember.md'), 'utf8'),
    fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-evolve.md'), 'utf8'),
    fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-mcp.md'), 'utf8'),
    fs.readFileSync(path.join(home, '.claude', 'commands', 'ome-init-rules.md'), 'utf8')
  ];
  for (const content of nonSessionEntries) {
    assert.doesNotMatch(content, /## Workflow Session Start \(MANDATORY\)/);
    assert.doesNotMatch(content, /## Workflow Completion \(MANDATORY\)/);
    assert.doesNotMatch(content, /## Workflow Completion \(SUBSTANTIVE WORK ONLY\)/);
  }
});

test('ome agents install --project writes project command entries', () => {
  const workspace = createWorkspace('ome-agents-project-');

  runOme(['agents', 'install', '--project', '--project-root', workspace, '--all'], workspace);

  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-superpowers.md')), false);
  assert.equal(fs.existsSync(path.join(workspace, '.cursor', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.cursor', 'commands', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.windsurf', 'workflows', 'ome-init-rules.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.qoder', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.opencode', 'command', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.agent', 'workflows', 'ome-bug.md')), true);
  assert.match(fs.readFileSync(path.join(workspace, '.agent', 'workflows', 'ome-bug.md'), 'utf8'), /^---\r?\ndescription:/);
});

test('ome agents clean-project removes generated entries without deleting custom commands', () => {
  const workspace = createWorkspace('ome-agents-clean-project-');
  const customCommandPath = path.join(workspace, '.claude', 'commands', 'ome-plan.md');

  runOme(['agents', 'install', '--project', '--project-root', workspace, 'claude-code'], workspace);
  fs.writeFileSync(customCommandPath, '# custom command\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.ome', 'skills', 'ome-bug'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md'), '# local source skill\n', 'utf8');

  const output = runOme(['agents', 'clean-project', '--project-root', workspace, 'claude-code'], workspace);

  assert.match(output, /Removed: [1-9]\d*/);
  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md')), false);
  assert.equal(fs.existsSync(path.join(workspace, '.claude', 'commands', 'ome-build.md')), false);
  assert.equal(fs.readFileSync(customCommandPath, 'utf8'), '# custom command\n');
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.match(output, /skipped claude-code: .*ome-plan\.md.*not recognized as an OME-generated project entry/);
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
    const results = installAgents({ platforms: [], home, installOpenSpec: false });
  assert.equal(results.length > 0, true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md')), true);
  } finally {
    fs.readSync = originalReadSync;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: originalIsTTY });
  }
});

test('ome agents doctor reports missing workflow names instead of a single init check', () => {
  const home = createWorkspace('ome-agents-doctor-home-');

  runOme(['agents', 'install', '--home', home, '--no-install-openspec', 'claude-code'], process.cwd());
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

  const output = runOme(['init', '--install-agents', '--no-install-openspec', '--home', home], workspace);

  assert.match(output, /Integration targets synced:/);
  assert.match(output, /Project skills installed:/);
  assert.match(output, /Project command entries synced: 0/);
  assert.match(output, /Global skills installed:/);
  assert.equal(fs.existsSync(path.join(workspace, 'OME.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.claude', 'commands', 'ome-bug.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.agents', 'skills', 'ome-bug', 'SKILL.md')), false);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'skills', 'ome-bug', 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(home, '.agents', 'skills', 'ome-bug', 'SKILL.md')), true);
});

test('ome agents install reports OpenSpec CLI status separately from Agent entries', () => {
  const home = createWorkspace('ome-agents-openspec-home-');

  const output = runOme(['agents', 'install', '--home', home, '--all', '--no-install-openspec'], process.cwd());

  assert.match(output, /claude-code/);
  assert.doesNotMatch(output, /openspec:/);
});

export {};
