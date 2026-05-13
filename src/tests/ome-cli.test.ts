const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { OME_BIN, REPO_ROOT, omeArgs } = require('./helpers');

function runOme(args: string[]): string {
  return execFileSync(OME_BIN, omeArgs(args), {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
}

function createWorkspace(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('ome help lists productized command groups', () => {
  const output = runOme(['--help']);

  assert.match(output, /rules validate/);
  assert.match(output, /agents <command>/);
  assert.match(output, /bug <description>/);
  assert.match(output, /define <target>/);
  assert.match(output, /plan <target>/);
  assert.match(output, /build <target>/);
  assert.match(output, /test <target>/);
  assert.match(output, /review <target>/);
  assert.match(output, /ship <target>/);
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

test('ome lifecycle commands render structured guidance', () => {
  const define = runOme(['define', 'add user login']);
  const plan = runOme(['plan', 'add user login']);
  const review = runOme(['review', 'current diff']);

  assert.match(define, /Define Workflow/);
  assert.match(define, /Success criteria/);
  assert.match(define, /Assumptions/);
  assert.match(plan, /Plan Workflow/);
  assert.match(plan, /Implementation approach/);
  assert.match(plan, /Test plan/);
  assert.match(review, /Review Workflow/);
  assert.match(review, /correctness, readability, architecture, security, performance, and test coverage/i);
  assert.match(review, /Verification gaps/);
});

test('ome unknown command exits non-zero with a clear error', () => {
  const result = spawnSync(OME_BIN, omeArgs(['missing-command']), {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown command: missing-command/);
});

test('ome update surfaces npm failure details before continuing project sync', () => {
  const env = { ...process.env };
  if (process.platform === 'win32') {
    env.Path = '';
  } else {
    env.PATH = '';
  }
  env.OME_REPO_ROOT = REPO_ROOT;

  const result = spawnSync(OME_BIN, omeArgs(['update']), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.match(result.stderr, /CLI 工具更新跳过/);
  assert.match(result.stderr, /npm 更新失败，请检查网络或权限。详细信息:/);
  assert.match(result.stdout, /继续尝试更新项目配置/);
  assert.match(result.stdout, /当前项目已同步/);
});

test('ome update supports project-only sync without global npm update', () => {
  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only']), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, OME_REPO_ROOT: REPO_ROOT }
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /已跳过全局 CLI 更新，仅同步项目配置/);
  assert.doesNotMatch(result.stdout, /正在从 npm 市场获取最新版本/);
  assert.match(result.stdout, /当前项目已同步/);
});

test('ome update refreshes managed project assets beyond .ome skills', () => {
  const workspace = createWorkspace('ome-update-sync-');
  const env: NodeJS.ProcessEnv = { ...process.env, OME_REPO_ROOT: REPO_ROOT };
  if (process.platform === 'win32') {
    env.Path = '';
  } else {
    env.PATH = '';
  }

  execFileSync(OME_BIN, omeArgs(['init']), {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, OME_REPO_ROOT: REPO_ROOT }
  });

  fs.writeFileSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md'), 'stale skill\n', 'utf8');
  fs.writeFileSync(path.join(workspace, 'AGENTS.md'), '# Local agent notes\n\nstale guidance\n', 'utf8');
  fs.writeFileSync(path.join(workspace, 'CLAUDE.md'), '# Local claude notes\n\nstale guidance\n', 'utf8');
  fs.writeFileSync(path.join(workspace, '.ome', 'context', 'rules-generation-prompt.md'), 'stale context\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.claude', 'commands'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'stale project command\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.claude', 'skills', 'ome-bug'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.claude', 'skills', 'ome-bug', 'SKILL.md'), 'stale mirrored skill\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.windsurf', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md'), 'stale project workflow\n', 'utf8');

  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.match(fs.readFileSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md'), 'utf8'), /## Purpose/);
  assert.match(fs.readFileSync(path.join(workspace, '.ome', 'context', 'rules-generation-prompt.md'), 'utf8'), /Read `\.ome\/context\/project-scan\.json` first/);
  assert.match(fs.readFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'utf8'), /## Purpose/);
  assert.match(fs.readFileSync(path.join(workspace, '.claude', 'skills', 'ome-bug', 'SKILL.md'), 'utf8'), /## Purpose/);
  assert.match(fs.readFileSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md'), 'utf8'), /## Purpose/);
  assert.match(result.stdout, /Project skills updated: /);
  assert.match(result.stdout, /Project skill mirrors synced: [1-9]\d*/);
  assert.match(result.stdout, /Project command entries synced: [1-9]\d*/);
  assert.match(result.stdout, /Rule integrations synced: [1-9]\d*/);

  const agents = fs.readFileSync(path.join(workspace, 'AGENTS.md'), 'utf8');
  const claude = fs.readFileSync(path.join(workspace, 'CLAUDE.md'), 'utf8');
  assert.match(agents, /# Local agent notes/);
  assert.match(agents, /<!-- OME:START -->/);
  assert.match(agents, /Skill source: `\.ome\/skills\/`/);
  assert.match(claude, /# Local claude notes/);
  assert.match(claude, /<!-- OME:START -->/);
  assert.match(claude, /Rule source: `\.ome\/rules\/`/);
});

test('ome update uses cmd wrapper for npm install on Windows', () => {
  if (process.platform !== 'win32') return;

  const env: NodeJS.ProcessEnv = { ...process.env, OME_REPO_ROOT: REPO_ROOT };
  delete env.npm_config_user_agent;

  const result = spawnSync(OME_BIN, omeArgs(['update']), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stderr, /spawnSync npm\.cmd EINVAL/);
});

export {};
