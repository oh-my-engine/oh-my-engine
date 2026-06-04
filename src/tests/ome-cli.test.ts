const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { OME_BIN, REPO_ROOT, omeArgs, runtimePath } = require('./helpers');

function runOme(args: string[]): string {
  return execFileSync(OME_BIN, omeArgs(args), {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
}

function createWorkspace(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runOmeInWorkspace(workspace: string, args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(OME_BIN, omeArgs(args), {
    cwd: workspace,
    encoding: 'utf8'
  });
}

function parseJsonOutput(result: ReturnType<typeof spawnSync>): any {
  return JSON.parse(result.stdout);
}

test('ome help lists the default delivery lifecycle without spec commands', () => {
  const output = runOme(['--help']);

  assert.match(output, /Default delivery workflow/);
  assert.match(output, /rules validate/);
  assert.match(output, /agents <command>/);
  assert.match(output, /bug <description>/);
  assert.match(output, /define <target>/);
  assert.match(output, /plan <target>/);
  assert.match(output, /build <target>/);
  assert.match(output, /test <target>/);
  assert.match(output, /review <target>/);
  assert.match(output, /ship <target>/);
  assert.match(output, /run <command>/);
  assert.doesNotMatch(output, /spec <command>/);
  assert.doesNotMatch(output, /Spec commands:/);
  assert.match(output, /guidance <workflow>/);
  assert.match(output, /memory view/);
  assert.match(output, /history view/);
  assert.match(output, /View active engine recall/);
  assert.match(output, /View execution history/);
  assert.match(output, /memory remember/);
  assert.match(output, /remember <text>/);
  assert.match(output, /evolve adopt-learning/);
  assert.match(output, /evolve adopt-skill/);
  assert.match(output, /adapters list/);
});

test('ome spec help and ome-spec shortcut help list spec subcommands', () => {
  const specHelp = runOme(['spec', 'help']);
  assert.match(specHelp, /Spec commands:/);
  assert.match(specHelp, /apply/);
  assert.match(specHelp, /verify/);
  assert.match(specHelp, /archive/);

  const shortcutHelp = execFileSync(process.execPath, [runtimePath('bin', 'ome-spec.js'), '--help'], {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
  assert.match(shortcutHelp, /Usage:/);
  assert.match(shortcutHelp, /ome spec <command>/);
  assert.match(shortcutHelp, /ome-spec <command>/);
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

test('ome run start creates an active delivery run with JSON output', () => {
  const workspace = createWorkspace('ome-run-start-');

  const result = runOmeInWorkspace(workspace, ['run', 'start', 'add login']);

  assert.equal(result.status, 0);
  const payload = parseJsonOutput(result);
  assert.match(payload.runId, /^run-/);
  assert.equal(payload.status, 'active');
  assert.equal(payload.stage, 'validate');
  assert.deepEqual(payload.requiredEvidence, ['requirement_summary']);
  assert.equal(payload.blockingIssues.length, 0);
  assert.match(payload.nextAction, /Clarify/i);
  assert.match(payload.exitCodeMeaning, /0 means/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'runs', payload.runId, 'state.json')), true);
});

test('ome run status reads the active run and can render text', () => {
  const workspace = createWorkspace('ome-run-status-');
  const start = runOmeInWorkspace(workspace, ['run', 'start', 'add login']);
  const runId = parseJsonOutput(start).runId;

  const jsonStatus = runOmeInWorkspace(workspace, ['run', 'status']);
  const textStatus = runOmeInWorkspace(workspace, ['run', 'status', '--text']);

  assert.equal(jsonStatus.status, 0);
  assert.equal(parseJsonOutput(jsonStatus).runId, runId);
  assert.equal(textStatus.status, 0);
  assert.match(textStatus.stdout, /Run:/);
  assert.match(textStatus.stdout, /Stage: validate/);
});

test('ome run next blocks until required stage evidence is registered', () => {
  const workspace = createWorkspace('ome-run-next-');
  runOmeInWorkspace(workspace, ['run', 'start', 'add login']);

  const blocked = runOmeInWorkspace(workspace, ['run', 'next']);

  assert.notEqual(blocked.status, 0);
  const blockedPayload = parseJsonOutput(blocked);
  assert.equal(blockedPayload.stage, 'validate');
  assert.deepEqual(blockedPayload.requiredEvidence, ['requirement_summary']);
  assert.match(blockedPayload.blockingIssues[0], /requirement_summary/);

  const evidence = runOmeInWorkspace(workspace, [
    'run',
    'evidence',
    'requirement_summary',
    'Goal: login; Scope: auth UI; Success: tests pass'
  ]);
  const advanced = runOmeInWorkspace(workspace, ['run', 'next']);

  assert.equal(evidence.status, 0);
  assert.equal(advanced.status, 0);
  const advancedPayload = parseJsonOutput(advanced);
  assert.equal(advancedPayload.stage, 'define');
  assert.deepEqual(advancedPayload.requiredEvidence, ['requirement_summary']);
});

test('ome run finish requires ship evidence and completes the active run', () => {
  const workspace = createWorkspace('ome-run-finish-');
  const start = runOmeInWorkspace(workspace, ['run', 'start', 'add login']);
  const runId = parseJsonOutput(start).runId;
  const evidenceByStage = [
    'requirement_summary',
    'requirement_summary',
    'plan_artifact',
    'implementation_summary',
    'verification_command',
    'review_summary',
    'ship_summary'
  ];

  for (const evidenceType of evidenceByStage) {
    assert.equal(runOmeInWorkspace(workspace, ['run', 'evidence', evidenceType, `${evidenceType} done`]).status, 0);
    assert.equal(runOmeInWorkspace(workspace, ['run', 'next']).status, 0);
  }

  const finish = runOmeInWorkspace(workspace, ['run', 'finish']);
  const statusAfterFinish = runOmeInWorkspace(workspace, ['run', 'status']);

  assert.equal(finish.status, 0);
  const finishPayload = parseJsonOutput(finish);
  assert.equal(finishPayload.runId, runId);
  assert.equal(finishPayload.status, 'completed');
  assert.equal(finishPayload.stage, 'learn');
  assert.notEqual(statusAfterFinish.status, 0);
  assert.match(parseJsonOutput(statusAfterFinish).blockingIssues[0], /No active run/);
});

test('ome run enforces a single active run until cancellation', () => {
  const workspace = createWorkspace('ome-run-single-active-');
  runOmeInWorkspace(workspace, ['run', 'start', 'add login']);

  const duplicate = runOmeInWorkspace(workspace, ['run', 'start', 'add checkout']);
  const cancelled = runOmeInWorkspace(workspace, ['run', 'cancel', 'changed priority']);
  const restarted = runOmeInWorkspace(workspace, ['run', 'start', 'add checkout']);

  assert.notEqual(duplicate.status, 0);
  assert.match(parseJsonOutput(duplicate).blockingIssues[0], /active run already exists/i);
  assert.equal(cancelled.status, 0);
  assert.equal(parseJsonOutput(cancelled).status, 'cancelled');
  assert.equal(restarted.status, 0);
  assert.equal(parseJsonOutput(restarted).request, 'add checkout');
});

test('ome run status fails clearly when active run state is invalid', () => {
  const workspace = createWorkspace('ome-run-corrupt-state-');
  const statePath = path.join(workspace, '.ome', 'runs', 'run-broken', 'state.json');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, '{ invalid json', 'utf8');

  const result = runOmeInWorkspace(workspace, ['run', 'status']);

  assert.notEqual(result.status, 0);
  const payload = parseJsonOutput(result);
  assert.equal(payload.status, 'error');
  assert.match(payload.blockingIssues[0], /Run state is invalid/);
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
    env.PATH = '';
  } else {
    env.PATH = '';
  }
  env.OME_REPO_ROOT = REPO_ROOT;

  const result = spawnSync(OME_BIN, omeArgs(['update', '--global']), {
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

test('ome update preserves a local development engine by default', () => {
  const env: NodeJS.ProcessEnv = { ...process.env, OME_REPO_ROOT: REPO_ROOT };
  if (process.platform === 'win32') {
    env.Path = '';
    env.PATH = '';
  } else {
    env.PATH = '';
  }

  const result = spawnSync(OME_BIN, omeArgs(['update']), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /检测到本地开发引擎，已跳过全局 npm 更新/);
  assert.match(result.stdout, /当前项目已同步/);
  assert.doesNotMatch(result.stdout, /正在从 npm 市场获取最新版本/);
  assert.doesNotMatch(result.stderr, /CLI 工具更新跳过/);
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

test('ome update does not initialize platforms missing from the project', () => {
  const workspace = createWorkspace('ome-update-platform-scope-');
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

  const missingPlatformTargets = [
    path.join(workspace, '.cursor', 'rules', '00-ome-auto-detection.mdc'),
    path.join(workspace, '.cursor', 'rules', '00-ome-rules.mdc'),
    path.join(workspace, '.qoder', 'rules', '00-ome-auto-detection.md'),
    path.join(workspace, '.qoder', 'rules', '00-ome-rules.md'),
    path.join(workspace, '.trae', 'rules', '00-ome-auto-detection.md'),
    path.join(workspace, '.trae', 'rules', '00-ome-rules.md'),
    path.join(workspace, '.agent', 'rules', '00-ome-auto-detection.md'),
    path.join(workspace, '.agents', 'rules', '00-ome-rules.md')
  ];

  for (const target of missingPlatformTargets) {
    assert.equal(fs.existsSync(target), false, `${target} should not exist before update`);
  }

  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only', '--force']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(workspace, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'AGENTS.md')), true);
  for (const target of missingPlatformTargets) {
    assert.equal(fs.existsSync(target), false, `${target} should not be initialized by update`);
  }
  assert.match(result.stdout, /Rule integrations synced: 2/);
  assert.match(result.stdout, /Agent guidance files generated: 2/);
});

test('ome update skips project entries by default and refreshes them when requested', () => {
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
  const codeStylePath = path.join(workspace, '.ome', 'rules', 'code-style.md');
  const customCodeStyle = '---\nrule: code-style\nversion: 1.0.0\n---\n\n# Custom Code Style\n\n- Keep my local rule.\n';
  fs.writeFileSync(codeStylePath, customCodeStyle, 'utf8');
  const testingPath = path.join(workspace, '.ome', 'rules', 'testing.md');
  const customTesting = [
    '---',
    'rule: testing',
    'version: 2.0.0',
    'description: Testing rules for PHP Swoft projects',
    'category: testing',
    '---',
    '',
    '# Testing',
    '',
    '## Project Profile',
    '',
    '- Primary framework: swoft',
    '- Language: PHP 8.1+',
    ''
  ].join('\n');
  fs.writeFileSync(testingPath, customTesting, 'utf8');
  const securityPath = path.join(workspace, '.ome', 'rules', 'security.md');
  fs.rmSync(securityPath, { force: true });
  fs.writeFileSync(path.join(workspace, '.ome', 'context', 'rules-generation-prompt.md'), 'stale context\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.claude', 'commands'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'stale project command\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.claude', 'skills', 'ome-bug'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.claude', 'skills', 'ome-bug', 'SKILL.md'), 'stale mirrored skill\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.windsurf', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md'), 'stale project workflow\n', 'utf8');
  const customCursorRulesEntry = '---\nglob: "**/*"\nalwaysApply: true\n---\n\n# Custom Cursor Rules\n\nKeep this generated platform rule.\n';
  const customQoderGuidance = '---\ntrigger: always_on\n---\n\n# Custom Qoder Auto Detection\n\nKeep this generated guidance rule.\n';
  const customAgentGuidance = '# Custom Antigravity Auto Detection\n\nKeep this generated guidance rule.\n';
  const cursorRulesEntryPath = path.join(workspace, '.cursor', 'rules', '00-ome-rules.mdc');
  const qoderGuidancePath = path.join(workspace, '.qoder', 'rules', '00-ome-auto-detection.md');
  const agentGuidancePath = path.join(workspace, '.agent', 'rules', '00-ome-auto-detection.md');
  fs.mkdirSync(path.dirname(cursorRulesEntryPath), { recursive: true });
  fs.mkdirSync(path.dirname(qoderGuidancePath), { recursive: true });
  fs.mkdirSync(path.dirname(agentGuidancePath), { recursive: true });
  fs.writeFileSync(cursorRulesEntryPath, customCursorRulesEntry, 'utf8');
  fs.writeFileSync(qoderGuidancePath, customQoderGuidance, 'utf8');
  fs.writeFileSync(agentGuidancePath, customAgentGuidance, 'utf8');

  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.match(fs.readFileSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md'), 'utf8'), /## Purpose/);
  assert.match(fs.readFileSync(path.join(workspace, '.ome', 'context', 'rules-generation-prompt.md'), 'utf8'), /Read `\.ome\/context\/project-scan\.json` first/);
  assert.equal(fs.readFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'utf8'), 'stale project command\n');
  assert.equal(fs.readFileSync(path.join(workspace, '.claude', 'skills', 'ome-bug', 'SKILL.md'), 'utf8'), 'stale mirrored skill\n');
  assert.equal(fs.readFileSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md'), 'utf8'), 'stale project workflow\n');
  assert.equal(fs.readFileSync(codeStylePath, 'utf8'), customCodeStyle);
  assert.equal(fs.readFileSync(testingPath, 'utf8'), customTesting);
  assert.equal(fs.readFileSync(cursorRulesEntryPath, 'utf8'), customCursorRulesEntry);
  assert.equal(fs.readFileSync(qoderGuidancePath, 'utf8'), customQoderGuidance);
  assert.equal(fs.readFileSync(agentGuidancePath, 'utf8'), customAgentGuidance);
  assert.equal(fs.existsSync(securityPath), true);
  assert.match(result.stdout, /Project skills updated: /);
  assert.match(result.stdout, /Project skill mirrors synced: 0/);
  assert.match(result.stdout, /Project command entries synced: 0/);
  assert.match(result.stdout, /Rule integrations synced: [1-9]\d*/);
  assert.match(result.stdout, /Rule source files: created [1-9]\d*, overwritten 0, preserved [1-9]\d*/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'omespec', 'project.md')), false);

  const projectEntriesResult = spawnSync(OME_BIN, omeArgs(['update', '--project-only', '--project-entries']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(projectEntriesResult.status, 0);
  assert.match(fs.readFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'utf8'), /## Purpose/);
  assert.match(fs.readFileSync(path.join(workspace, '.claude', 'skills', 'ome-bug', 'SKILL.md'), 'utf8'), /## Purpose/);
  assert.match(fs.readFileSync(path.join(workspace, '.windsurf', 'workflows', 'ome-bug.md'), 'utf8'), /## Purpose/);
  assert.match(projectEntriesResult.stdout, /Project skill mirrors synced: [1-9]\d*/);
  assert.match(projectEntriesResult.stdout, /Project command entries synced: [1-9]\d*/);

  const forcedResult = spawnSync(OME_BIN, omeArgs(['update', '--project-only', '--force']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(forcedResult.status, 0);
  assert.equal(fs.readFileSync(codeStylePath, 'utf8'), customCodeStyle);
  assert.equal(fs.readFileSync(testingPath, 'utf8'), customTesting);
  assert.equal(fs.readFileSync(cursorRulesEntryPath, 'utf8'), customCursorRulesEntry);
  assert.equal(fs.readFileSync(qoderGuidancePath, 'utf8'), customQoderGuidance);
  assert.equal(fs.readFileSync(agentGuidancePath, 'utf8'), customAgentGuidance);
  assert.match(forcedResult.stdout, /Project skill mirrors synced: 0/);
  assert.match(forcedResult.stdout, /Project command entries synced: 0/);
  assert.match(forcedResult.stdout, /Rule source files: created 0, overwritten 0, preserved [1-9]\d*/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'omespec', 'project.md')), false);

  const agents = fs.readFileSync(path.join(workspace, 'AGENTS.md'), 'utf8');
  const claude = fs.readFileSync(path.join(workspace, 'CLAUDE.md'), 'utf8');
  assert.match(agents, /# Local agent notes/);
  assert.match(agents, /<!-- OME:START -->/);
  assert.match(agents, /Skill source: `\.ome\/skills\/`/);
  assert.match(claude, /# Local claude notes/);
  assert.match(claude, /<!-- OME:START -->/);
  assert.match(claude, /Rule source: `\.ome\/rules\/`/);
});

test('ome update skips project skill refresh when global OME skills are installed', () => {
  const workspace = createWorkspace('ome-update-global-skills-');
  const globalHome = createWorkspace('ome-update-global-home-');
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    OME_AGENT_HOME: globalHome,
    OME_REPO_ROOT: REPO_ROOT
  };
  if (process.platform === 'win32') {
    env.Path = '';
  } else {
    env.PATH = '';
  }

  execFileSync(OME_BIN, omeArgs(['agents', 'install', '--home', globalHome, '--no-install-openspec', 'codex']), {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, OME_REPO_ROOT: REPO_ROOT }
  });
  execFileSync(OME_BIN, omeArgs(['init', '--home', globalHome]), {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, OME_REPO_ROOT: REPO_ROOT }
  });

  const localSkillPath = path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md');
  const mirrorSkillPath = path.join(workspace, '.claude', 'skills', 'ome-bug', 'SKILL.md');
  assert.equal(fs.existsSync(localSkillPath), false);

  fs.mkdirSync(path.dirname(localSkillPath), { recursive: true });
  fs.writeFileSync(localSkillPath, 'local override skill\n', 'utf8');
  fs.mkdirSync(path.dirname(mirrorSkillPath), { recursive: true });
  fs.writeFileSync(mirrorSkillPath, 'stale mirrored skill\n', 'utf8');

  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only', '--project-entries', '--home', globalHome]), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.equal(fs.readFileSync(localSkillPath, 'utf8'), 'local override skill\n');
  assert.equal(fs.readFileSync(mirrorSkillPath, 'utf8'), 'stale mirrored skill\n');
  assert.match(result.stdout, /Project skills updated: 0/);
  assert.match(result.stdout, /Project skills skipped: global OME skills already installed at /);
  assert.match(result.stdout, /Project skill mirrors synced: 0/);
});

test('ome update applies explicit Chinese output language without overwriting existing rules', () => {
  const workspace = createWorkspace('ome-update-language-');
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

  const codeStylePath = path.join(workspace, '.ome', 'rules', 'code-style.md');
  const customCodeStyle = '---\nrule: code-style\nversion: 1.0.0\n---\n\n# Custom Code Style\n\n- Keep this project-specific rule.\n';
  fs.writeFileSync(codeStylePath, customCodeStyle, 'utf8');
  fs.writeFileSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md'), 'stale skill\n', 'utf8');
  fs.mkdirSync(path.join(workspace, '.claude', 'commands'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'stale command\n', 'utf8');

  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only', '--project-entries', '--language', 'zh-CN']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.equal(fs.readFileSync(codeStylePath, 'utf8'), customCodeStyle);

  const omeConfig = fs.readFileSync(path.join(workspace, 'OME.md'), 'utf8');
  assert.match(omeConfig, /language: zh-CN/);

  const bugSkill = fs.readFileSync(path.join(workspace, '.ome', 'skills', 'ome-bug', 'SKILL.md'), 'utf8');
  assert.match(bugSkill, /## 用途/);
  assert.match(bugSkill, /## 工作流会话开始（必需）/);

  const claudeCommand = fs.readFileSync(path.join(workspace, '.claude', 'commands', 'ome-bug.md'), 'utf8');
  assert.match(claudeCommand, /## 用途/);
  assert.match(claudeCommand, /## 工作流会话开始（必需）/);
  assert.match(result.stdout, /Rule source files: created 0, overwritten 0, preserved [1-9]\d*/);
});

test('ome update force-rules overwrites rule sources after backing them up', () => {
  const workspace = createWorkspace('ome-update-force-rules-');
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

  const codeStylePath = path.join(workspace, '.ome', 'rules', 'code-style.md');
  const customCodeStyle = '---\nrule: code-style\nversion: 1.0.0\n---\n\n# Custom Code Style\n\n- This should be backed up.\n';
  fs.writeFileSync(codeStylePath, customCodeStyle, 'utf8');

  const result = spawnSync(OME_BIN, omeArgs(['update', '--project-only', '--force-rules']), {
    cwd: workspace,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.notEqual(fs.readFileSync(codeStylePath, 'utf8'), customCodeStyle);
  assert.match(result.stdout, /Rule source files: created 0, overwritten [1-9]\d*, preserved/);
  assert.match(result.stdout, /Rule backup: /);

  const backupsRoot = path.join(workspace, '.ome', 'backups', 'rules');
  const backupDirectories = fs.readdirSync(backupsRoot);
  assert.equal(backupDirectories.length, 1);
  const backupCodeStyle = path.join(backupsRoot, backupDirectories[0], 'code-style.md');
  assert.equal(fs.readFileSync(backupCodeStyle, 'utf8'), customCodeStyle);
});

test('ome update uses cmd wrapper for npm install on Windows', () => {
  if (process.platform !== 'win32') return;

  const fakeBin = createWorkspace('ome-update-fake-npm-');
  const markerPath = path.join(fakeBin, 'npm-invocation.txt');
  fs.writeFileSync(
    path.join(fakeBin, 'npm.cmd'),
    `@echo off\r\necho %* > "${markerPath}"\r\nexit /b 0\r\n`,
    'utf8'
  );
  const system32 = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32');
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    OME_REPO_ROOT: REPO_ROOT,
    Path: `${fakeBin};${system32}`,
    PATH: `${fakeBin};${system32}`
  };
  delete env.npm_config_user_agent;

  const result = spawnSync(OME_BIN, omeArgs(['update', '--global']), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env
  });

  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stderr, /spawnSync npm\.cmd EINVAL/);
  assert.match(fs.readFileSync(markerPath, 'utf8'), /install -g oh-my-engine/);
});

export {};
