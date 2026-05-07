const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

export interface AgentInstallOptions {
  platforms: string[];
  all?: boolean;
  project?: boolean;
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
  projectRules: string;
  commandStyle: 'slash' | 'skill' | 'workflow';
}

interface ReadError {
  code?: string;
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
  { id: 'superpowers', command: 'ome-superpowers', title: 'Superpowers Bridge', usage: 'ome superpowers <install|update|doctor>', description: 'Install, update, or inspect Superpowers bridge entries for supported Agent editors.' }
];

const AGENTS: AgentDefinition[] = [
  { id: 'claude-code', name: 'Claude Code', globalCommandDirectory: '.claude/commands', projectCommandDirectory: '.claude/commands', projectRules: 'CLAUDE.md', commandStyle: 'slash' },
  { id: 'codex', name: 'Codex', globalCommandDirectory: '.codex/skills', projectRules: 'AGENTS.md', commandStyle: 'skill' },
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

function normalizeHome(home?: string): string {
  return home ? path.resolve(home) : os.homedir();
}

function selectedAgents(platforms: string[], all?: boolean): AgentDefinition[] {
  if (all || platforms.length === 0) return AGENTS;
  const wanted = new Set(platforms);
  return AGENTS.filter(agent => wanted.has(agent.id));
}

function renderCommandPrompt(agent: AgentDefinition, workflow: WorkflowDefinition): string {
  const trigger = agent.commandStyle === 'skill' ? workflow.command : `/${workflow.command}`;
  const body = [
    `# ${workflow.command}`,
    '',
    `Use ${workflow.title} for the current project.`,
    '',
    `Trigger: \`${trigger}\``,
    `Terminal equivalent: \`${workflow.usage}\``,
    '',
    'Before making changes:',
    '- Read `OME.md` if present.',
    '- Read relevant files under `.ome/rules/`.',
    '- Treat `.ome/` as the project-local source of truth.',
    '- If `.ome/` is missing, ask the user to run `ome init` in the project root.',
    '',
    'Task:',
    `- ${workflow.description}`,
    ...workflowSpecificInstructions(workflow),
    '- Use the user arguments as the workflow input.',
    '- Keep generated project rules in the project; do not write project rules to the global Agent directory.',
    '',
    'Arguments:',
    '- Claude/Cursor/Qoder/OpenCode style commands receive the user text after the command.',
    '- Codex skill clients should pass the same arguments after the skill name.',
    '',
    'If shell execution is available, prefer running the equivalent `ome-*` command and then continue from its guidance.'
  ];

  if (agent.commandStyle === 'skill') {
    return [
      '---',
      `name: ${workflow.command}`,
      'version: 1.0.0',
      `description: ${workflow.description}`,
      'author: oh-my-engine',
      `tags: [ome, ${workflow.id}, workflow]`,
      '---',
      '',
      ...body
    ].join('\n');
  }

  if (agent.id === 'antigravity') {
    return [
      '---',
      `description: ${workflow.description}`,
      '---',
      '',
      ...body,
      '',
      'Antigravity workflow notes:',
      `- Use this workflow from Antigravity as \`/${workflow.command}\` when workflow commands are available.`,
      '- If it does not appear immediately, reload the Antigravity window after installing workflows.'
    ].join('\n');
  }

  return body.join('\n');
}

function workflowSpecificInstructions(workflow: WorkflowDefinition): string[] {
  if (workflow.id === 'init') {
    return [
      '- Run or guide the equivalent `ome init` command first.',
      '- After initialization, continue with the `ome-init-rules` workflow in the same project.',
      '- Do not stop after summarizing initialization; personalize `.ome/rules/*.md` from the current source code.',
      '- Finish by running `ome rules sync` so all Agent editor files receive the updated rules.'
    ];
  }

  if (workflow.id === 'init-rules') {
    return [
      '- Run or guide `ome init-rules` to refresh `.ome/context/project-scan.json` and `.ome/context/rules-generation-prompt.md`.',
      '- If `ome init-rules` is unavailable, do not stop; read the existing `.ome/context/rules-generation-prompt.md` and continue manually.',
      '- Read `OME.md`, `.ome/context/project-scan.json`, and `.ome/context/rules-generation-prompt.md`.',
      '- Inspect representative current source files, tests, scripts, and existing conventions before editing rules.',
      '- Rewrite `.ome/rules/*.md` so they are specific to this repository, not generic framework advice.',
      '- Run `ome rules sync` after editing rules.',
      '- Report which rule files changed and which verification commands were run.'
    ];
  }

  if (workflow.id === 'superpowers') {
    return [
      '- Run or guide `ome superpowers doctor` first to inspect support status.',
      '- Use `ome superpowers install all` when the user asks to install across Agent editors.',
      '- For editors without native Superpowers support, use the generated Oh My Engine wrapper workflow.',
      '- Do not copy third-party Superpowers sources into project rules.'
    ];
  }

  return [];
}

function targetPath(baseDirectory: string, agent: AgentDefinition, workflow: WorkflowDefinition): string {
  if (agent.commandStyle === 'skill') return path.join(baseDirectory, workflow.command, 'SKILL.md');
  return path.join(baseDirectory, `${workflow.command}.md`);
}

function installForAgent(agent: AgentDefinition, options: AgentInstallOptions): AgentInstallResult[] {
  const base = options.project
    ? agent.projectCommandDirectory && path.join(options.projectRoot || process.cwd(), agent.projectCommandDirectory)
    : agent.globalCommandDirectory && path.join(normalizeHome(options.home), agent.globalCommandDirectory);

  if (!base) {
    return [{ platform: agent.id, target: '(not supported)', kind: options.project ? 'project-command' : 'global-command', status: 'skipped' }];
  }

  return WORKFLOWS.map(workflow => {
    const filePath = targetPath(base, agent, workflow);
    writeFile(filePath, renderCommandPrompt(agent, workflow));
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

function applyInteractiveSelection(options: AgentInstallOptions): AgentInstallOptions {
  if (options.all || options.platforms.length > 0 || !process.stdin.isTTY) {
    return options.platforms.length === 0 ? { ...options, all: true } : options;
  }

  process.stdout.write('Select Agent/editor commands to install (default: all):\n');
  AGENTS.forEach((agent, index) => {
    process.stdout.write(`  ${index + 1}) [x] ${agent.id} - ${agent.name}\n`);
  });
  process.stdout.write('Enter comma-separated ids/numbers, or exclusions like -cursor,-trae. Press Enter for all.\n');
  const answer = readLineSync('Selection: ');
  if (!answer) return { ...options, all: true };

  const tokens = answer.split(',').map((token: string) => token.trim()).filter(Boolean);
  const excluded = new Set(tokens.filter((token: string) => token.startsWith('-')).map((token: string) => token.slice(1)));
  if (excluded.size > 0) {
    return { ...options, platforms: AGENTS.map(agent => agent.id).filter(id => !excluded.has(id)) };
  }

  return {
    ...options,
    platforms: tokens.map((token: string) => {
      const numeric = Number(token);
      if (Number.isInteger(numeric) && numeric >= 1 && numeric <= AGENTS.length) return AGENTS[numeric - 1].id;
      return token;
    })
  };
}

export function installAgents(options: AgentInstallOptions): AgentInstallResult[] {
  const normalized = applyInteractiveSelection(options);
  return selectedAgents(normalized.platforms, normalized.all).flatMap(agent => installForAgent(agent, normalized));
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
