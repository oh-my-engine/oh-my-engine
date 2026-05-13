const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  initializeWorkflowSkillSources,
  resolveWorkflowSkillSource,
  renderPlatformSkillEntry
} = require('./skills');

export interface AgentInstallOptions {
  platforms: string[];
  all?: boolean;
  project?: boolean;
  entries?: boolean;
  home?: string;
  projectRoot?: string;
}

export interface AgentInstallResult {
  platform: string;
  target: string;
  kind: 'global-command' | 'project-command';
  status: 'installed' | 'skipped';
}

interface AgentDefinition {
  id: string;
  name: string;
  globalCommandDirectory?: string;
  projectCommandDirectory?: string;
  projectSkillMirrorDirectory?: string;
  projectRules: string;
  commandStyle: 'slash' | 'skill' | 'workflow';
}

interface ReadError {
  code?: string;
}

interface InteractiveSelectionState {
  cursor: number;
  selected: boolean[];
}

interface WorkflowDefinition {
  id: string;
  command: string;
  title: string;
  usage: string;
  description: string;
}

const WORKFLOWS: WorkflowDefinition[] = [
  { id: 'init', command: 'ome-init', title: 'Initialize Oh My Engine', usage: 'ome-init [--install-agents]', description: 'Initialize .ome project configuration and Agent rules.' },
  { id: 'init-rules', command: 'ome-init-rules', title: 'Personalize Oh My Engine Rules', usage: 'ome init-rules', description: 'Refresh scan context, inspect current source code, rewrite .ome/rules, and sync Agent rules.' },
  { id: 'bug', command: 'ome-bug', title: 'Bug Analysis Workflow', usage: 'ome-bug "<issue description>"', description: 'Analyze, diagnose, and plan a bug fix using project rules.' },
  { id: 'ui', command: 'ome-ui', title: 'UI Restoration Workflow', usage: 'ome-ui <design-url-or-description>', description: 'Restore UI components from a design source with project design rules.' },
  { id: 'comp', command: 'ome-comp', title: 'Component Generation Workflow', usage: 'ome-comp <component-name>', description: 'Generate reusable components using project code and design rules.' },
  { id: 'api', command: 'ome-api', title: 'API Integration Workflow', usage: 'ome-api <api-spec-or-description>', description: 'Integrate API clients, services, and contracts using project rules.' },
  { id: 'spec', command: 'ome-spec', title: 'Spec Workflow', usage: 'ome-spec <command> [args]', description: 'Run OpenSpec-compatible proposal, plan, apply, verify, and archive workflows.' },
  { id: 'memory', command: 'ome-memory', title: 'Memory Viewer', usage: 'ome-memory [options]', description: 'Inspect local Oh My Engine memory and adopted learnings.' },
  { id: 'evolve', command: 'ome-evolve', title: 'Evolution Analyzer', usage: 'ome-evolve [options]', description: 'Analyze local memory for learning and skill candidates.' },
  { id: 'superpowers', command: 'ome-superpowers', title: 'Superpowers Bridge', usage: 'ome superpowers <install|update|doctor>', description: 'Install, update, or inspect Superpowers bridge entries for supported Agent editors.' },
  { id: 'mcp', command: 'ome-mcp', title: 'MCP Setup', usage: 'ome mcp <init|sync|preview|doctor> [figma|mastergo|all]', description: 'Initialize, sync, preview, or inspect Figma and MasterGo MCP configuration for Agent editors.' },
  { id: 'define', command: 'ome-define', title: 'Define Workflow', usage: 'ome define "<task or requirement>"', description: 'Clarify goal, scope, success criteria, and assumptions before implementation.' },
  { id: 'plan', command: 'ome-plan', title: 'Plan Workflow', usage: 'ome plan "<task or requirement>"', description: 'Create implementation guidance with interfaces, edge cases, and test strategy.' },
  { id: 'build', command: 'ome-build', title: 'Build Workflow', usage: 'ome build "<task or plan>"', description: 'Implement scoped changes in small verified slices using project rules.' },
  { id: 'test', command: 'ome-test', title: 'Test Workflow', usage: 'ome test "<target or behavior>"', description: 'Design behavior-focused tests, regression coverage, and failure diagnosis.' },
  { id: 'review', command: 'ome-review', title: 'Review Workflow', usage: 'ome review "<path, diff, or PR description>"', description: 'Review correctness, readability, architecture, security, performance, and tests.' },
  { id: 'ship', command: 'ome-ship', title: 'Ship Workflow', usage: 'ome ship "<completed change>"', description: 'Run final readiness checks and prepare user-facing handoff or commit notes.' }
];

export const AGENTS: AgentDefinition[] = [
  { id: 'claude-code', name: 'Claude Code', globalCommandDirectory: '.claude/commands', projectCommandDirectory: '.claude/commands', projectSkillMirrorDirectory: '.claude/skills', projectRules: 'CLAUDE.md', commandStyle: 'slash' },
  { id: 'codex', name: 'Codex', globalCommandDirectory: '.agents/skills', projectCommandDirectory: '.agents/skills', projectRules: 'AGENTS.md', commandStyle: 'skill' },
  { id: 'cursor', name: 'Cursor', globalCommandDirectory: '.cursor/commands', projectCommandDirectory: '.cursor/commands', projectRules: '.cursor/rules/*.mdc', commandStyle: 'slash' },
  { id: 'trae', name: 'Trae', globalCommandDirectory: '.trae/commands', projectCommandDirectory: '.trae/commands', projectRules: '.trae/rules/*.md', commandStyle: 'slash' },
  { id: 'windsurf', name: 'Windsurf', globalCommandDirectory: '.codeium/windsurf/global_workflows', projectCommandDirectory: '.windsurf/workflows', projectRules: '.windsurf/rules/*.md / .windsurfrules', commandStyle: 'workflow' },
  { id: 'qoder', name: 'Qoder', globalCommandDirectory: '.qoder/commands', projectCommandDirectory: '.qoder/commands', projectRules: '.qoder/rules/*.md', commandStyle: 'slash' },
  { id: 'opencode', name: 'OpenCode', globalCommandDirectory: '.config/opencode/command', projectCommandDirectory: '.opencode/command', projectRules: 'AGENTS.md', commandStyle: 'slash' },
  { id: 'antigravity', name: 'Antigravity', globalCommandDirectory: '.gemini/antigravity/global_workflows', projectCommandDirectory: '.agent/workflows', projectRules: 'AGENTS.md / GEMINI.md / .agent/rules/*.md', commandStyle: 'workflow' }
];

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFile(filePath: string, content: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function writeManagedFileBlock(filePath: string, content: string): void {
  const start = '<!-- OME:START -->';
  const end = '<!-- OME:END -->';
  const block = `${start}\n${content.trimEnd()}\n${end}\n`;

  if (!fs.existsSync(filePath)) {
    writeFile(filePath, block);
    return;
  }

  const current = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.trimEnd()}\n\n${block}`;
  writeFile(filePath, next);
}

function normalizeHome(home?: string): string {
  return home ? path.resolve(home) : os.homedir();
}

function selectedAgents(platforms: string[], all?: boolean): AgentDefinition[] {
  if (all || platforms.length === 0) return AGENTS;
  const wanted = new Set(platforms);
  return AGENTS.filter(agent => wanted.has(agent.id));
}

function renderCommandPrompt(agent: AgentDefinition, workflow: WorkflowDefinition, projectRoot: string): string {
  const sourceContent = resolveWorkflowSkillSource(projectRoot, workflow);
  return renderPlatformSkillEntry({ style: agent.commandStyle, platformId: agent.id }, workflow, sourceContent);
}

function targetPath(baseDirectory: string, agent: AgentDefinition, workflow: WorkflowDefinition): string {
  if (agent.commandStyle === 'skill') return path.join(baseDirectory, workflow.command, 'SKILL.md');
  return path.join(baseDirectory, `${workflow.command}.md`);
}

function projectCommandBase(projectRoot: string, agent: AgentDefinition): string | undefined {
  return agent.projectCommandDirectory
    ? path.join(projectRoot, agent.projectCommandDirectory)
    : undefined;
}

function projectSkillMirrorBase(projectRoot: string, agent: AgentDefinition): string | undefined {
  return agent.projectSkillMirrorDirectory
    ? path.join(projectRoot, agent.projectSkillMirrorDirectory)
    : undefined;
}

function installForAgent(agent: AgentDefinition, options: AgentInstallOptions): AgentInstallResult[] {
  const base = options.project
    ? projectCommandBase(options.projectRoot || process.cwd(), agent)
    : agent.globalCommandDirectory && path.join(normalizeHome(options.home), agent.globalCommandDirectory);

  if (!base) {
    return [{ platform: agent.id, target: '(not supported)', kind: options.project ? 'project-command' : 'global-command', status: 'skipped' }];
  }

  return WORKFLOWS.map(workflow => {
    const filePath = targetPath(base, agent, workflow);
    writeFile(filePath, renderCommandPrompt(agent, workflow, options.projectRoot || process.cwd()));
    return {
      platform: agent.id,
      target: filePath,
      kind: options.project ? 'project-command' : 'global-command',
      status: 'installed'
    };
  });
}

function parseInstallArgs(args: string[]): AgentInstallOptions {
  const platforms: string[] = [];
  const options: AgentInstallOptions = { platforms };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--all') {
      options.all = true;
      continue;
    }
    if (argument === '--project') {
      options.project = true;
      continue;
    }
    if (argument === '--entries') {
      options.entries = true;
      continue;
    }
    if (argument === '--home') {
      if (index + 1 >= args.length) throw new Error('Missing value for --home');
      options.home = args[index + 1];
      index += 1;
      continue;
    }
    if (argument === '--project-root') {
      if (index + 1 >= args.length) throw new Error('Missing value for --project-root');
      options.projectRoot = args[index + 1];
      index += 1;
      continue;
    }
    platforms.push(argument);
  }

  return options;
}

function readLineSync(prompt: string): string {
  process.stdout.write(prompt);
  const buffer = Buffer.alloc(4096);
  let bytesRead = 0;
  try {
    bytesRead = fs.readSync(0, buffer, 0, buffer.length, null);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? (error as ReadError).code : undefined;
    if (code === 'EAGAIN' || code === 'EWOULDBLOCK' || code === 'EOF') {
      process.stdout.write('\nNo interactive input was available; using default selection: all.\n');
      return '';
    }
    throw error;
  }
  return buffer.toString('utf8', 0, bytesRead).trim();
}

function parseSelectionAnswer(answer: string): string[] {
  const tokens = answer.split(',').map((token: string) => token.trim()).filter(Boolean);
  const excluded = new Set(tokens.filter((token: string) => token.startsWith('-')).map((token: string) => token.slice(1)));
  if (excluded.size > 0) {
    return AGENTS.map(agent => agent.id).filter(id => !excluded.has(id));
  }

  return tokens.map((token: string) => {
    const numeric = Number(token);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= AGENTS.length) return AGENTS[numeric - 1].id;
    return token;
  });
}

function renderInteractiveSelection(state: InteractiveSelectionState): void {
  const lines = [
    'Select Agent/editor commands to install:',
    'Use ↑/↓ to move, Space to toggle, number keys to toggle directly, a to toggle all, Enter to confirm.',
    ''
  ];

  AGENTS.forEach((agent, index) => {
    const pointer = state.cursor === index ? '>' : ' ';
    const marker = state.selected[index] ? '[x]' : '[ ]';
    lines.push(`${pointer} ${index + 1}) ${marker} ${agent.id} - ${agent.name}`);
  });

  lines.push('');
  lines.push('Default is all selected. Press Ctrl+C to cancel.');
  process.stdout.write(`\x1b[2J\x1b[H${lines.join('\n')}`);
}

function readInteractiveSelection(): string[] | undefined {
  if (typeof process.stdin.setRawMode !== 'function') return undefined;

  const state: InteractiveSelectionState = {
    cursor: 0,
    selected: AGENTS.map(() => true)
  };
  const buffer = Buffer.alloc(8);
  const wasRaw = process.stdin.isRaw;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdout.write('\x1b[?25l');

  try {
    renderInteractiveSelection(state);
    while (true) {
      let bytesRead = 0;
      try {
        bytesRead = fs.readSync(0, buffer, 0, buffer.length, null);
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? (error as ReadError).code : undefined;
        if (code === 'EAGAIN' || code === 'EWOULDBLOCK' || code === 'EOF') {
          process.stdout.write('\nNo interactive input was available; using default selection: all.\n');
          return AGENTS.map(agent => agent.id);
        }
        throw error;
      }

      const input = buffer.toString('utf8', 0, bytesRead);
      if (input === '\u0003') throw new Error('Agent install selection cancelled.');
      if (input === '\r' || input === '\n') {
        const selected = AGENTS.filter((_, index) => state.selected[index]).map(agent => agent.id);
        return selected.length > 0 ? selected : AGENTS.map(agent => agent.id);
      }
      if (input === '\u001b[A') {
        state.cursor = (state.cursor + AGENTS.length - 1) % AGENTS.length;
        renderInteractiveSelection(state);
        continue;
      }
      if (input === '\u001b[B') {
        state.cursor = (state.cursor + 1) % AGENTS.length;
        renderInteractiveSelection(state);
        continue;
      }
      if (input === ' ') {
        state.selected[state.cursor] = !state.selected[state.cursor];
        renderInteractiveSelection(state);
        continue;
      }
      if (input.toLowerCase() === 'a') {
        const shouldSelectAll = state.selected.some(selected => !selected);
        state.selected = AGENTS.map(() => shouldSelectAll);
        renderInteractiveSelection(state);
        continue;
      }

      const numeric = Number(input);
      if (Number.isInteger(numeric) && numeric >= 1 && numeric <= AGENTS.length) {
        const index = numeric - 1;
        state.cursor = index;
        state.selected[index] = !state.selected[index];
        renderInteractiveSelection(state);
      }
    }
  } finally {
    process.stdout.write('\x1b[?25h\n');
    process.stdin.setRawMode(Boolean(wasRaw));
    process.stdin.pause();
  }
}

function applyInteractiveSelection(options: AgentInstallOptions): AgentInstallOptions {
  if (options.all || options.platforms.length > 0 || !process.stdin.isTTY) {
    return options.platforms.length === 0 ? { ...options, all: true } : options;
  }

  const selected = readInteractiveSelection();
  if (selected) return { ...options, platforms: selected };

  process.stdout.write('Select Agent/editor commands to install (default: all):\n');
  AGENTS.forEach((agent, index) => {
    process.stdout.write(`  ${index + 1}) [x] ${agent.id} - ${agent.name}\n`);
  });
  process.stdout.write('Enter comma-separated ids/numbers, or exclusions like -cursor,-trae. Press Enter for all.\n');
  const answer = readLineSync('Selection: ');
  if (!answer) return { ...options, all: true };
  return { ...options, platforms: parseSelectionAnswer(answer) };
}

export function installAgents(options: AgentInstallOptions): AgentInstallResult[] {
  const normalized = applyInteractiveSelection(options);
  return selectedAgents(normalized.platforms, normalized.all).flatMap(agent => installForAgent(agent, normalized));
}

export function syncExistingProjectAgents(projectRoot: string): AgentInstallResult[] {
  return AGENTS.flatMap(agent => {
    const base = projectCommandBase(projectRoot, agent);
    if (!base || !fs.existsSync(base)) {
      return [];
    }

    return installForAgent(agent, {
      platforms: [agent.id],
      project: true,
      projectRoot
    });
  });
}

export function syncExistingProjectSkillMirrors(projectRoot: string): AgentInstallResult[] {
  return AGENTS.flatMap(agent => {
    const base = projectSkillMirrorBase(projectRoot, agent);
    if (!base || !fs.existsSync(base)) {
      return [];
    }

    return WORKFLOWS.map(workflow => {
      const sourceContent = resolveWorkflowSkillSource(projectRoot, workflow);
      const filePath = path.join(base, workflow.command, 'SKILL.md');
      writeFile(filePath, sourceContent);
      return {
        platform: agent.id,
        target: filePath,
        kind: 'project-command' as const,
        status: 'installed' as const
      };
    });
  });
}

export function renderAgentsList(): string {
  const lines = ['Oh My Engine Agent Support', ''];
  lines.push('platform\tglobal-command\tproject-command\tproject-rules');
  for (const agent of AGENTS) {
    lines.push(`${agent.id}\t${agent.globalCommandDirectory || '-'}\t${agent.projectCommandDirectory || '-'}\t${agent.projectRules}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderAgentsDoctor(options: AgentInstallOptions): string {
  const home = normalizeHome(options.home);
  const projectRoot = options.projectRoot || process.cwd();
  const lines = ['Oh My Engine Agents Doctor', ''];

  for (const agent of selectedAgents(options.platforms, options.all || options.platforms.length === 0)) {
    const globalStatus = agent.globalCommandDirectory ? missingWorkflows(path.join(home, agent.globalCommandDirectory), agent).join(', ') || 'installed' : 'not-supported';
    const projectStatus = agent.projectCommandDirectory ? missingWorkflows(path.join(projectRoot, agent.projectCommandDirectory), { ...agent, commandStyle: 'slash' }).join(', ') || 'installed' : 'not-supported';
    lines.push(`${agent.id}: global=${globalStatus} project=${projectStatus} rules=${agent.projectRules}`);
  }

  return `${lines.join('\n')}\n`;
}

function missingWorkflows(baseDirectory: string, agent: AgentDefinition): string[] {
  return WORKFLOWS
    .filter(workflow => !fs.existsSync(targetPath(baseDirectory, agent, workflow)))
    .map(workflow => workflow.command);
}

export function runAgentsCommand(args: string[]): void {
  const subcommand = args[0] || 'list';

  if (subcommand === 'list') {
    process.stdout.write(renderAgentsList());
    return;
  }

  if (subcommand === 'install') {
    const results = installAgents(parseInstallArgs(args.slice(1)));
    for (const result of results) {
      process.stdout.write(`${result.status === 'installed' ? '✅' : '↷'} ${result.platform}: ${result.target}\n`);
    }
    return;
  }

  if (subcommand === 'doctor') {
    process.stdout.write(renderAgentsDoctor(parseInstallArgs(args.slice(1))));
    return;
  }

  throw new Error(`Unknown agents command: ${subcommand}`);
}

export function workflowCommands(): string[] {
  return WORKFLOWS.map(workflow => workflow.command);
}

export function initializeProjectSkillSources(projectRoot: string, force: boolean = false): { workflow: string; path: string; action: 'created' | 'updated' | 'skipped' }[] {
  return initializeWorkflowSkillSources(projectRoot, WORKFLOWS, force);
}

// ============================================================================
// Agent Guidance File Generation
// ============================================================================

export interface AgentGuidanceResult {
  platform: string;
  path: string;
  action: 'created' | 'updated' | 'skipped';
}

/**
 * 判断平台是单文件还是多文件类型
 */
function isSingleFilePlatform(platform: AgentDefinition): boolean {
  // 单文件平台使用根目录的单个文件
  const singleFilePatterns = ['CLAUDE.md', 'AGENTS.md', '.windsurfrules', 'GEMINI.md'];
  return singleFilePatterns.some(pattern => platform.projectRules.includes(pattern) && !platform.projectRules.includes('*'));
}

/**
 * 获取文件扩展名
 */
function getFileExtension(platform: AgentDefinition): string {
  if (platform.id === 'cursor') return '.mdc';
  return '.md';
}

/**
 * 获取平台的自动检测规则文件路径
 */
function getAutoDetectionFilePath(projectRoot: string, platform: AgentDefinition): string {
  // 单文件平台
  if (isSingleFilePlatform(platform)) {
    if (platform.id === 'claude-code') return path.join(projectRoot, 'CLAUDE.md');
    if (platform.id === 'codex' || platform.id === 'opencode') return path.join(projectRoot, 'AGENTS.md');
    if (platform.id === 'windsurf') return path.join(projectRoot, '.windsurfrules');
    if (platform.id === 'antigravity') return path.join(projectRoot, 'GEMINI.md');
  }

  // 多文件平台
  if (platform.id === 'cursor') return path.join(projectRoot, '.cursor', 'rules', '00-ome-auto-detection.mdc');
  if (platform.id === 'trae') return path.join(projectRoot, '.trae', 'rules', '00-ome-auto-detection.md');
  if (platform.id === 'qoder') return path.join(projectRoot, '.qoder', 'rules', '00-ome-auto-detection.md');
  if (platform.id === 'antigravity') return path.join(projectRoot, '.agent', 'rules', '00-ome-auto-detection.md');

  return path.join(projectRoot, 'AGENTS.md'); // fallback
}

/**
 * 构建命令示例（根据平台风格）
 */
function buildCommandExample(platform: AgentDefinition, command: string): string {
  if (platform.commandStyle === 'skill') return command;
  return `/${command}`;
}

/**
 * 构建自动检测规则内容
 */
function buildAgentGuidanceContent(platform: AgentDefinition, scan: any): string {
  const cmdBug = buildCommandExample(platform, 'ome-bug');
  const cmdUi = buildCommandExample(platform, 'ome-ui');
  const cmdApi = buildCommandExample(platform, 'ome-api');
  const cmdComp = buildCommandExample(platform, 'ome-comp');
  const cmdDefine = buildCommandExample(platform, 'ome-define');
  const cmdPlan = buildCommandExample(platform, 'ome-plan');
  const cmdBuild = buildCommandExample(platform, 'ome-build');
  const cmdTest = buildCommandExample(platform, 'ome-test');
  const cmdReview = buildCommandExample(platform, 'ome-review');
  const cmdShip = buildCommandExample(platform, 'ome-ship');
  const cmdSpec = buildCommandExample(platform, 'ome-spec');

  const lines: string[] = [];

  if (platform.id === 'cursor') {
    lines.push('---');
    lines.push('glob: "**/*"');
    lines.push('alwaysApply: true');
    lines.push('---');
    lines.push('');
  }

  lines.push(`# Oh My Engine - ${platform.name} Integration`);
  lines.push('');
  lines.push('## Project Context');
  lines.push('');
  lines.push(`- Project name: ${scan.projectName || 'Unknown'}`);
  lines.push(`- Project type: ${scan.projectType || 'Unknown'}`);
  lines.push(`- Framework: ${scan.framework || 'Unknown'}`);
  lines.push('- Project config: `OME.md`');
  lines.push('- Rule source: `.ome/rules/`');
  lines.push('- Skill source: `.ome/skills/`');
  lines.push('');
  lines.push('## Operating Contract');
  lines.push('');
  lines.push('- Keep this file as a platform entry point only.');
  lines.push('- Before executing a task, read `OME.md`, the relevant `.ome/rules/*.md` files, and the matching `.ome/skills/ome-*/SKILL.md` file.');
  lines.push('- Treat `.ome/rules/` and `.ome/skills/` as the project-local source of truth.');
  lines.push('- Do not copy full rule or skill content into platform files; regenerate platform views from `.ome` instead.');
  lines.push('');
  lines.push('## Workflow Routing');
  lines.push('');
  lines.push(`- Bug investigation or fix planning: \`${cmdBug} "<issue description>"\` -> read \`.ome/skills/ome-bug/SKILL.md\``);
  lines.push(`- API client, service, or contract work: \`${cmdApi} "<api or contract>"\` -> read \`.ome/skills/ome-api/SKILL.md\``);
  lines.push(`- UI restoration from a design source: \`${cmdUi} "<design source>"\` -> read \`.ome/skills/ome-ui/SKILL.md\``);
  lines.push(`- Reusable component work: \`${cmdComp} "<component>"\` -> read \`.ome/skills/ome-comp/SKILL.md\``);
  lines.push(`- Clarify scope and success criteria: \`${cmdDefine} "<task>"\` -> read \`.ome/skills/ome-define/SKILL.md\``);
  lines.push(`- Plan implementation and tests: \`${cmdPlan} "<task>"\` -> read \`.ome/skills/ome-plan/SKILL.md\``);
  lines.push(`- Implement a scoped change: \`${cmdBuild} "<task>"\` -> read \`.ome/skills/ome-build/SKILL.md\``);
  lines.push(`- Design or run tests: \`${cmdTest} "<target>"\` -> read \`.ome/skills/ome-test/SKILL.md\``);
  lines.push(`- Review code or a diff: \`${cmdReview} "<target>"\` -> read \`.ome/skills/ome-review/SKILL.md\``);
  lines.push(`- Prepare final handoff or release checks: \`${cmdShip} "<change>"\` -> read \`.ome/skills/ome-ship/SKILL.md\``);
  lines.push(`- Spec workflow: \`${cmdSpec} <command> [args]\` -> read \`.ome/skills/ome-spec/SKILL.md\``);
  lines.push('');
  lines.push('## Rule Loading');
  lines.push('');
  lines.push('- Load general rules from `.ome/rules/project-overview.md`, `.ome/rules/code-style.md`, `.ome/rules/architecture.md`, `.ome/rules/testing.md`, and `.ome/rules/tooling.md` when they exist.');
  lines.push('- Load domain rules only when the task touches that domain, such as security, API routing, data access, deployment, UI, accessibility, performance, or i18n.');
  lines.push('- If a needed rule or skill file is missing, continue with the nearest available `.ome` guidance and report the gap.');

  return lines.join('\n');

}


export function generateAgentGuidanceFile(
  projectRoot: string,
  platform: AgentDefinition,
  scan: any
): AgentGuidanceResult {
  const managedFilePath = getAutoDetectionFilePath(projectRoot, platform);
  const managedFileExists = fs.existsSync(managedFilePath);
  const managedContent = buildAgentGuidanceContent(platform, scan);
  if (isSingleFilePlatform(platform)) {
    writeManagedFileBlock(managedFilePath, managedContent);
  } else {
    writeFile(managedFilePath, managedContent);
  }
  return {
    platform: platform.id,
    path: managedFilePath,
    action: managedFileExists ? 'updated' : 'created'
  };
}


export function generateAllAgentGuidanceFiles(
  projectRoot: string,
  scan: any
): AgentGuidanceResult[] {
  const results: AgentGuidanceResult[] = [];
  const createdFiles = new Set<string>();

  for (const platform of AGENTS) {
    const filePath = getAutoDetectionFilePath(projectRoot, platform);

    // 跳过已创建的共享文件
    if (createdFiles.has(filePath)) {
      results.push({ platform: platform.id, path: filePath, action: 'skipped' });
      continue;
    }

    const result = generateAgentGuidanceFile(projectRoot, platform, scan);
    results.push(result);

    if (result.action !== 'skipped') {
      createdFiles.add(filePath);
    }
  }

  return results;
}
