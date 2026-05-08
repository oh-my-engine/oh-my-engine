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
  { id: 'superpowers', command: 'ome-superpowers', title: 'Superpowers Bridge', usage: 'ome superpowers <install|update|doctor>', description: 'Install, update, or inspect Superpowers bridge entries for supported Agent editors.' },
  { id: 'mcp', command: 'ome-mcp', title: 'MCP Setup', usage: 'ome mcp <init|sync|preview|doctor> [figma|mastergo|all]', description: 'Initialize, sync, preview, or inspect Figma and MasterGo MCP configuration for Agent editors.' },
  { id: 'define', command: 'ome-define', title: 'Define Workflow', usage: 'ome define "<task or requirement>"', description: 'Clarify goal, scope, success criteria, and assumptions before implementation.' },
  { id: 'plan', command: 'ome-plan', title: 'Plan Workflow', usage: 'ome plan "<task or requirement>"', description: 'Create implementation guidance with interfaces, edge cases, and test strategy.' },
  { id: 'build', command: 'ome-build', title: 'Build Workflow', usage: 'ome build "<task or plan>"', description: 'Implement scoped changes in small verified slices using project rules.' },
  { id: 'test', command: 'ome-test', title: 'Test Workflow', usage: 'ome test "<target or behavior>"', description: 'Design behavior-focused tests, regression coverage, and failure diagnosis.' },
  { id: 'review', command: 'ome-review', title: 'Review Workflow', usage: 'ome review "<path, diff, or PR description>"', description: 'Review correctness, readability, architecture, security, performance, and tests.' },
  { id: 'ship', command: 'ome-ship', title: 'Ship Workflow', usage: 'ome ship "<completed change>"', description: 'Run final readiness checks and prepare user-facing handoff or commit notes.' }
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
    'Skill anatomy discipline:',
    '- Start by deciding whether the task is define, plan, build, test, review, or ship work.',
    '- Name assumptions before relying on them.',
    '- Stop and surface concrete conflicts when requirements, code, tests, or rules disagree.',
    '- Prefer the smallest project-consistent implementation and avoid unrelated cleanup.',
    '- Reject shortcuts such as skipping tests, testing later, or treating no error output as proof.',
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

  // Claude Code and other slash-command platforms: add frontmatter for description
  if (agent.commandStyle === 'slash') {
    return [
      '---',
      `description: ${workflow.description}`,
      '---',
      '',
      ...body
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
      '- Add, rename, or remove rule files as needed; do not force the project into a fixed four-rule template.',
      '- Use project-specific rule names when the scan supports them, such as `server-koa`, `routing-middleware`, `build-gulp`, `views-static-assets`, `data-access`, or `deployment`.',
      '- Do not create React Native, theme, design-token, or i18n rules unless current source/dependencies show those signals.',
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

  if (workflow.id === 'mcp') {
    return [
      '- Run or guide `ome mcp doctor` first to inspect current MCP support and token environment status.',
      '- Use `ome mcp init --all` to create `.ome/mcp/source.json` and the initial setup notes.',
      '- Use `ome mcp sync` after editing `.ome/mcp/source.json` so editor-specific MCP config files stay in sync.',
      '- Read `.ome/mcp/README.md` and `.ome/mcp/source.json` before using design MCP tools.',
      '- Do not write real Figma or MasterGo tokens into repository files, rules, commands, or prompts.',
      '- Configure tokens through environment variables such as `FIGMA_API_KEY` and `MG_MCP_TOKEN`.',
      '- Use generated `.ome/mcp/*.json` files only as manual import material for editors without a stable project-level MCP config path.'
    ];
  }

  if (['define', 'plan', 'build', 'test', 'review', 'ship'].includes(workflow.id)) {
    return [
      '- Use the lifecycle output contract named by this workflow; do not substitute a vague summary.',
      '- Load relevant references from `skills/oh-my-engine/references/` when available.',
      '- Finish with verification evidence or a clear statement of what could not be verified.'
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

  const hasUi = scan.hasUi || (scan.uiFrameworks && scan.uiFrameworks.length > 0);

  const lines: string[] = [];

  // MDC frontmatter for Cursor
  if (platform.id === 'cursor') {
    lines.push('---');
    lines.push('glob: "**/*"');
    lines.push('alwaysApply: true');
    lines.push('---');
    lines.push('');
  }

  lines.push(`# Oh My Engine - ${platform.name} Integration`);
  lines.push('');
  lines.push('## 项目信息');
  lines.push('');
  lines.push(`- **项目名称**: ${scan.projectName || 'Unknown'}`);
  lines.push(`- **项目类型**: ${scan.projectType || 'Unknown'}`);
  lines.push(`- **框架**: ${scan.framework || 'Unknown'}`);
  lines.push('- **配置文件**: OME.md');
  lines.push('- **规则目录**: .ome/rules/');
  lines.push('');
  lines.push('## 🤖 自动命令检测');
  lines.push('');
  lines.push('当用户提出以下类型的任务时，**自动使用对应的 OME 命令**，无需用户明确指定：');
  lines.push('');

  // Bug 分析
  lines.push('### Bug 分析和修复');
  lines.push('**触发条件**:');
  lines.push('- 用户描述 bug 或错误现象');
  lines.push('- 用户说"这个功能不工作"、"报错了"、"有问题"');
  lines.push('- 用户提供错误日志或堆栈跟踪');
  lines.push('');
  lines.push(`**自动使用**: \`${cmdBug} "<issue description>"\``);
  lines.push('');
  lines.push('**示例**:');
  lines.push(`- "登录按钮点击没反应" → \`${cmdBug} "登录按钮点击没反应"\``);
  lines.push(`- "API 返回 500 错误" → \`${cmdBug} "API 返回 500 错误"\``);
  lines.push('');

  // UI 还原（仅当项目有 UI 时）
  if (hasUi) {
    lines.push('### UI 还原');
    lines.push('**触发条件**:');
    lines.push('- 用户提供设计稿 URL 或截图');
    lines.push('- 用户说"还原这个界面"、"实现这个 UI"');
    lines.push('- 用户描述 UI 组件的视觉需求');
    lines.push('');
    lines.push(`**自动使用**: \`${cmdUi} <design-url-or-description>\``);
    lines.push('');
    lines.push('**示例**:');
    lines.push(`- "还原这个登录页面 [URL]" → \`${cmdUi} [URL]\``);
    lines.push(`- "实现一个卡片组件，圆角、阴影" → \`${cmdUi} "卡片组件，圆角、阴影"\``);
    lines.push('');
  }

  // API 集成
  lines.push('### API 集成');
  lines.push('**触发条件**:');
  lines.push('- 用户说"集成 XX API"、"调用 XX 接口"');
  lines.push('- 用户提供 API 文档或 OpenAPI spec');
  lines.push('- 用户描述需要对接的后端服务');
  lines.push('');
  lines.push(`**自动使用**: \`${cmdApi} <api-spec-or-description>\``);
  lines.push('');
  lines.push('**示例**:');
  lines.push(`- "集成用户登录 API" → \`${cmdApi} "用户登录 API"\``);
  lines.push(`- "对接支付接口" → \`${cmdApi} "支付接口"\``);
  lines.push('');

  // 组件生成（仅当项目有 UI 时）
  if (hasUi) {
    lines.push('### 组件生成');
    lines.push('**触发条件**:');
    lines.push('- 用户说"生成一个 XX 组件"');
    lines.push('- 用户描述可复用组件的需求');
    lines.push('- 用户要求创建通用 UI 元素');
    lines.push('');
    lines.push(`**自动使用**: \`${cmdComp} <component-name>\``);
    lines.push('');
    lines.push('**示例**:');
    lines.push(`- "生成一个按钮组件" → \`${cmdComp} "Button"\``);
    lines.push(`- "创建一个表单输入组件" → \`${cmdComp} "FormInput"\``);
    lines.push('');
  }

  // 生命周期阶段检测
  lines.push('### 生命周期阶段检测');
  lines.push('');
  lines.push('当用户的任务不明确属于哪个阶段时，**自动判断并使用对应的生命周期命令**：');
  lines.push('');
  lines.push(`- **需求不清晰** → \`${cmdDefine} "<task>"\``);
  lines.push(`- **需要设计方案** → \`${cmdPlan} "<task>"\``);
  lines.push(`- **开始编码实现** → \`${cmdBuild} "<task>"\``);
  lines.push(`- **测试或调试** → \`${cmdTest} "<target>"\``);
  lines.push(`- **代码审查** → \`${cmdReview} "<target>"\``);
  lines.push(`- **准备提交** → \`${cmdShip} "<change>"\``);
  lines.push('');

  // 命令使用优先级
  lines.push('## 📋 命令使用优先级');
  lines.push('');
  lines.push('1. **优先使用任务特定命令**: 如果任务明确是 bug、UI、API、组件，使用对应的命令');
  lines.push('2. **其次使用生命周期命令**: 如果任务不属于特定类型，根据阶段使用 define/plan/build 等');
  lines.push('3. **最后直接实现**: 只有在任务非常简单（单行修改、明显的小改动）时才直接实现，不使用 OME 命令');
  lines.push('');

  // 项目上下文
  lines.push('## 📖 项目上下文');
  lines.push('');
  lines.push('在执行任何 OME 命令前，确保：');
  lines.push('1. 读取 `OME.md` 了解项目配置');
  lines.push('2. 根据任务类型读取 `.ome/rules/` 中的相关规则');
  lines.push('3. 遵循项目特定的代码风格和架构约定');
  lines.push('');

  // 工作流程
  lines.push('## 🔄 工作流程');
  lines.push('');
  lines.push('```');
  lines.push('用户任务 → 判断任务类型 → 选择对应 OME 命令 → 读取项目规则 → 执行工作流 → 验证结果');
  lines.push('```');
  lines.push('');

  // 单文件平台：添加 OME 标记块
  if (isSingleFilePlatform(platform)) {
    lines.push('---');
    lines.push('');
    lines.push('<!-- OME:START -->');
    lines.push('# Claude Code Rules');
    lines.push('');
    lines.push('> 本文件由 .ome/rules/ 自动生成，请勿手动编辑 OME 标记块');
    lines.push('> 运行 `ome rules sync` 更新');
    lines.push('');
    lines.push('## 规则索引');
    lines.push('');
    lines.push('规则索引将由 `ome rules sync` 自动生成。');
    lines.push('<!-- OME:END -->');
  }

  return lines.join('\n');
}

/**
 * 为单个平台生成自动检测规则文件
 */
export function generateAgentGuidanceFile(
  projectRoot: string,
  platform: AgentDefinition,
  scan: any
): AgentGuidanceResult {
  const filePath = getAutoDetectionFilePath(projectRoot, platform);

  // 检查文件是否已存在
  const fileExists = fs.existsSync(filePath);

  // 如果是共享文件（AGENTS.md），检查是否已被其他平台创建
  if (fileExists && (platform.id === 'opencode' || platform.id === 'antigravity')) {
    const basename = path.basename(filePath);
    if (basename === 'AGENTS.md') {
      return { platform: platform.id, path: filePath, action: 'skipped' };
    }
  }

  // 构建指导内容
  const content = buildAgentGuidanceContent(platform, scan);

  // 单文件平台：检查是否有 OME 标记块
  if (isSingleFilePlatform(platform) && fileExists) {
    const existing = fs.readFileSync(filePath, 'utf8');
    const omeStartMarker = '<!-- OME:START -->';
    const omeEndMarker = '<!-- OME:END -->';

    if (existing.includes(omeStartMarker) && existing.includes(omeEndMarker)) {
      // 保留标记块外的用户内容，只更新自动检测规则部分
      const markerStart = existing.indexOf(omeStartMarker);
      const userContent = existing.substring(0, markerStart).trim();

      // 如果用户内容存在，保留它
      if (userContent) {
        return { platform: platform.id, path: filePath, action: 'skipped' };
      }
    }
  }

  // 写入文件
  writeFile(filePath, content);

  return {
    platform: platform.id,
    path: filePath,
    action: fileExists ? 'updated' : 'created'
  };
}

/**
 * 为所有平台生成自动检测规则文件
 */
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
