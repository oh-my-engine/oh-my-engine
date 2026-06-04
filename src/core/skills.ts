const fs = require('node:fs');
const path = require('node:path');
const { isOutputLanguageChinese } = require('./output-language');
import type { OutputLanguageResolution } from './output-language';

export interface WorkflowDefinition {
  id: string;
  command: string;
  title: string;
  usage: string;
  description: string;
}

export interface SkillSourceResult {
  workflow: string;
  path: string;
  action: 'created' | 'updated' | 'skipped';
}

export interface PlatformSkillEntryOptions {
  style: 'skill' | 'slash' | 'workflow';
  platformId: string;
  outputLanguage?: OutputLanguageResolution;
}

type SkillLanguage = OutputLanguageResolution | undefined;

const COMMON_RATIONALIZATIONS = [
  '"The obvious fix is good enough without a closer read of the rules."',
  '"I can skip verification because the change is small."',
  '"I should broaden the patch while I am here."',
  '"A vague summary is enough for handoff."'
];

const COMMON_RATIONALIZATIONS_ZH = [
  '"这个修复很明显，不需要回归测试。"',
  '"改动很小，可以跳过验证。"',
  '"旁边代码也需要整理，所以一起改掉。"',
  '"简单总结一下就足够交付。"'
];

const SUPERPOWERS_REPO = 'https://github.com/obra/superpowers';

export const OME_ACTION_MARKER = '<!-- OME:ACTION -->';

const ACTION_SKILLS: Record<string, { cli: string; humanLabel: string; humanLabelZh: string }> = {
  memory: { cli: 'ome memory view', humanLabel: 'memory recall', humanLabelZh: '记忆召回结果' },
  remember: { cli: 'ome memory remember', humanLabel: 'explicit memory recording', humanLabelZh: '显式记忆写入结果' },
  evolve: { cli: 'ome evolve analyze', humanLabel: 'evolution analysis', humanLabelZh: '演化分析结果' }
};

const SESSION_MANAGED_WORKFLOW_IDS = new Set([
  'define', 'plan', 'build', 'test', 'review', 'ship',
  'bug', 'ui', 'comp', 'api'
]);

const COMPLETION_LIFECYCLE_IDS = SESSION_MANAGED_WORKFLOW_IDS;

function isSessionManagedWorkflow(workflow: WorkflowDefinition): boolean {
  return SESSION_MANAGED_WORKFLOW_IDS.has(workflow.id);
}

function workflowSessionCommand(workflow: WorkflowDefinition): string {
  return `ome ${workflow.id}`;
}

function usesChinese(outputLanguage?: SkillLanguage): boolean {
  return Boolean(outputLanguage && isOutputLanguageChinese(outputLanguage));
}

function workflowDescription(workflow: WorkflowDefinition, outputLanguage?: SkillLanguage): string {
  if (!usesChinese(outputLanguage)) {
    return workflow.description;
  }

  const descriptions: Record<string, string> = {
    init: '初始化 .ome 项目配置和 Agent 规则。',
    'init-rules': '刷新扫描上下文、检查当前源码、更新 .ome/rules 并同步 Agent 规则。',
    bug: '结合项目规则分析、诊断并规划缺陷修复。',
    ui: '基于设计源和项目设计规则恢复 UI 组件。',
    comp: '使用项目代码和设计规则生成可复用组件。',
    api: '使用项目规则集成 API 客户端、服务和契约。',
    memory: '检查本地 Oh My Engine 记忆和已采纳经验。',
    remember: '显式记住可复用的偏好或指令。',
    evolve: '分析本地记忆，发现学习和 skill 候选项。',
    superpowers: '为支持的 Agent 编辑器安装、更新或检查 Superpowers bridge 条目。',
    mcp: '为 Agent 编辑器初始化、同步、预览或检查 Figma 和 MasterGo MCP 配置。',
    define: '在实现前澄清目标、范围、成功标准和假设。',
    plan: '生成包含接口、边界情况和测试策略的实现指导。',
    build: '依据项目规则小步实现有边界的改动。',
    test: '设计面向行为的测试、回归覆盖和失败诊断。',
    review: '评审正确性、可读性、架构、安全、性能和测试。',
    ship: '运行最终就绪检查，并准备面向用户的交付说明或提交记录。',
    spec: '运行 OME spec 工作流。'
  };

  return descriptions[workflow.id] || workflow.description;
}

function renderWorkflowStartSection(workflow: WorkflowDefinition, outputLanguage?: SkillLanguage): string {
  const command = workflowSessionCommand(workflow);
  const windowsFallback = `cmd.exe /c ome.cmd ${workflow.id} $ARGUMENTS`;

  if (usesChinese(outputLanguage)) {
    return [
      '## 工作流会话开始（必需）',
      '',
      '在读取源文件、制定计划、编辑或运行验证之前，必须先运行以下 OME 工作流命令：',
      '',
      '```bash',
      `${command} $ARGUMENTS`,
      '```',
      '',
      '这会创建 `.ome/.session`，让最后的 `ome finish` 可以把执行记录写入 `.ome/memory/executions/`。',
      '',
      `如果 Windows PowerShell 策略阻止 \`ome\` shim，请通过跨 shell fallback 运行：\`${windowsFallback}\`。不要在非 Windows 平台硬编码该 fallback。`,
      '',
      'Claude Code 快捷路径（其他 Agent 忽略开头的 `!`，通过自己的 shell 工具运行不带 `!` 的命令）：',
      '',
      '```',
      `!${command} $ARGUMENTS`,
      '```',
      ''
    ].join('\n');
  }

  return [
    '## Workflow Session Start (MANDATORY)',
    '',
    'Before reading source files, planning, editing, or running verification for this workflow, you MUST start the OME workflow session by running:',
    '',
    '```bash',
    `${command} $ARGUMENTS`,
    '```',
    '',
    'This creates `.ome/.session` so the final `ome finish` command can record the execution into `.ome/memory/executions/`.',
    '',
    `If a Windows PowerShell policy blocks the \`ome\` shim, run the same step through the cross-shell fallback: \`${windowsFallback}\`. Do not hardcode this fallback on non-Windows platforms.`,
    '',
    'Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):',
    '',
    '```',
    `!${command} $ARGUMENTS`,
    '```',
    ''
  ].join('\n');
}

function renderSubstantiveWorkflowCompletionSection(_outputLanguage?: SkillLanguage): string {
  return [
    '## Workflow Completion (SUBSTANTIVE WORK ONLY)',
    '',
    'Run `ome finish` only after a substantive workflow loop is complete, and only after you have reported results to the user.',
    '',
    'Substantive work means at least one of these is true:',
    '- You changed files or wrote new code/docs.',
    '- You ran verification and the result matters to the task outcome.',
    '- You made a durable technical decision, diagnosis, or reusable learning that should be available later.',
    '',
    'Do NOT run `ome finish` for ordinary conversation, quick explanations, brainstorming with no conclusion, or read-only exploration that produced no reusable outcome.',
    '',
    'When the work is substantive, run this as the final shell command:',
    '',
    '```bash',
    'ome finish',
    '```',
    '',
    'This records the execution into `.ome/memory/executions/`; the engine policy decides whether it is valuable enough to persist or later evolve.',
    '',
    'Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):',
    '',
    '```',
    '!ome finish',
    '```',
    ''
  ].join('\n');
}

function insertAfterPrimaryHeading(content: string, section: string): string {
  const headingPattern = /^# [^\r\n]+(?:\r?\n|$)/m;
  if (!headingPattern.test(content)) {
    return `${content.trimEnd()}\n\n${section.trimEnd()}\n`;
  }

  return content.replace(headingPattern, match => `${match}\n${section.trimEnd()}\n`);
}

function hasWorkflowStartSection(content: string): boolean {
  return content.includes('## Workflow Session Start (MANDATORY)') ||
    content.includes('## 工作流会话开始（必需）');
}

function hasWorkflowCompletionSection(content: string): boolean {
  return content.includes('## Workflow Completion (SUBSTANTIVE WORK ONLY)') ||
    content.includes('## Workflow Completion (MANDATORY)') ||
    content.includes('## 工作流收尾（必需）');
}

function isWorkflowCompletionHeading(line: string): boolean {
  const heading = line.trim();
  return heading === '## Workflow Completion (SUBSTANTIVE WORK ONLY)' ||
    heading === '## Workflow Completion (MANDATORY)' ||
    heading.includes('\u5de5\u4f5c\u6d41\u6536\u5c3e');
}

function replaceWorkflowCompletionSection(content: string, section: string): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex(isWorkflowCompletionHeading);
  if (start < 0) return content;

  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith('## ')) {
    end += 1;
  }

  return [
    ...lines.slice(0, start),
    ...section.trimEnd().split('\n'),
    ...lines.slice(end)
  ].join('\n');
}

function ensureWorkflowSessionSections(workflow: WorkflowDefinition, content: string, outputLanguage?: SkillLanguage): string {
  if (!isSessionManagedWorkflow(workflow)) return content;

  let next = content;
  if (!hasWorkflowStartSection(next)) {
    next = insertAfterPrimaryHeading(next, renderWorkflowStartSection(workflow, outputLanguage));
  }

  const completionSection = renderSubstantiveWorkflowCompletionSection(outputLanguage);
  if (hasWorkflowCompletionSection(next)) {
    next = replaceWorkflowCompletionSection(next, completionSection);
  } else {
    next = `${next.trimEnd()}\n\n${completionSection.trimEnd()}\n`;
  }

  return next.endsWith('\n') ? next : `${next}\n`;
}

function repoRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFileIfNeeded(filePath: string, content: string, force: boolean): boolean {
  if (force || !fs.existsSync(filePath)) {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    return true;
  }

  return false;
}

function readFileIfExists(filePath: string): string | undefined {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
}

function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? content.slice(match[0].length).replace(/^\n+/, '') : content;
}

function replaceFrontmatterName(content: string, name: string): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return content;

  const body = content.slice(match[0].length).replace(/^\n+/, '');
  const frontmatterLines = match[1].split(/\r?\n/).filter(Boolean);
  const hasName = frontmatterLines.some(line => /^name:\s*/.test(line));
  const updatedLines = hasName
    ? frontmatterLines.map(line => (/^name:\s*/.test(line) ? `name: ${name}` : line))
    : [`name: ${name}`, ...frontmatterLines];

  return [
    '---',
    ...updatedLines,
    '---',
    '',
    body
  ].join('\n');
}

export function renderFrontmatterBlock(description: string): string {
  return [
    '---',
    `description: ${description}`,
    '---',
    ''
  ].join('\n');
}

function renderBulletList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}

function renderOrderedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function renderStructuredSkill(options: {
  command: string;
  description: string;
  tags: string[];
  purpose: string;
  whenToUse: string[];
  inputs: string[];
  process: string[];
  redFlags: string[];
  rationalizations?: string[];
  verification: string[];
  outputContract: string[];
  workflowId?: string;
  outputLanguage?: SkillLanguage;
}): string {
  const chinese = usesChinese(options.outputLanguage);
  const sections = [
    '---',
    `name: ${options.command}`,
    'version: 1.0.0',
    `description: ${options.description}`,
    'author: oh-my-engine',
    `tags: [${options.tags.join(', ')}]`,
    '---',
    '',
    `# ${options.command}`,
    '',
    chinese ? '## 用途' : '## Purpose',
    options.purpose,
    '',
    chinese ? '## 适用场景' : '## When to Use',
    renderBulletList(options.whenToUse),
    '',
    chinese ? '## 输入' : '## Inputs',
    renderBulletList(options.inputs),
    '',
    chinese ? '## 流程' : '## Process',
    renderOrderedList(options.process),
    '',
    chinese ? '## 风险信号' : '## Red Flags',
    renderBulletList(options.redFlags),
    '',
    chinese ? '## 常见误区' : '## Common Rationalizations',
    renderBulletList(options.rationalizations || (chinese ? COMMON_RATIONALIZATIONS_ZH : COMMON_RATIONALIZATIONS)),
    '',
    chinese ? '## 验证' : '## Verification',
    renderBulletList(options.verification),
    '',
    chinese ? '## 输出要求' : '## Output Contract',
    chinese ? '最终回复必须包含：' : 'Final response must include:',
    renderBulletList(options.outputContract),
    ''
  ];

  if (options.workflowId && COMPLETION_LIFECYCLE_IDS.has(options.workflowId)) {
    sections.push('', renderSubstantiveWorkflowCompletionSection(options.outputLanguage));
  } else {
    const inferredId = options.command.replace(/^ome-/, '');
    if (COMPLETION_LIFECYCLE_IDS.has(inferredId)) {
      sections.push('', renderSubstantiveWorkflowCompletionSection(options.outputLanguage));
    }
  }

  return sections.join('\n');
}

export function renderActionSkillSource(
  workflow: WorkflowDefinition,
  options: { cli: string; humanLabel: string; humanLabelZh: string },
  outputLanguage?: SkillLanguage
): string {
  const tag = workflow.id;
  const chinese = usesChinese(outputLanguage);
  return [
    '---',
    `name: ${workflow.command}`,
    'version: 1.0.0',
    `description: ${workflowDescription(workflow, outputLanguage)}`,
    'author: oh-my-engine',
    `tags: [ome, ${tag}, action]`,
    `allowed-tools: Bash(${options.cli}:*)`,
    '---',
    '',
    OME_ACTION_MARKER,
    `# ${workflow.command}`,
    '',
    ...(chinese
      ? [
        '> **动作命令：执行，不要讲解。**',
        '> 当用户调用此命令时，必须在任何推理或说明之前完成以下步骤：',
        '>',
        '> 1. 精确运行这个 shell 命令（将 `$ARGUMENTS` 替换为用户传入内容，没有则留空）：',
        '>',
        '>    ```bash',
        `>    ${options.cli} $ARGUMENTS`,
        '>    ```',
        '>',
        '> 2. 向用户展示原始输出。',
        '> 3. 只有用户明确要求时，才在输出之后补充说明。',
        '>',
        `> 除非用户问“怎么使用”，不要打印下面的参考章节。用户调用此命令是为了查看${options.humanLabelZh}，不是阅读文档。`,
        '',
        'Claude Code 快捷路径：下面以 `!` 开头的行会被自动预执行。其他 Agent 忽略开头的 `!`，通过自己的 shell 工具运行不带 `!` 的命令，并遵循上面的说明。'
      ]
      : [
        '> **Action command: execute, do not narrate.**',
        '> When the user invokes this command, you MUST do the following before any other reasoning or commentary:',
        '>',
        '> 1. Run this shell command exactly (substitute `$ARGUMENTS` with whatever the user passed, empty if none):',
        '>',
        '>    ```bash',
        `>    ${options.cli} $ARGUMENTS`,
        '>    ```',
        '>',
        '> 2. Show the raw output to the user.',
        '> 3. Add commentary ONLY after the output is shown, and only if the user explicitly asks.',
        '>',
        `> Do NOT print the Reference section below unless the user asks "how do I use this". The user invoked this command to see ${options.humanLabel} results, not docs.`,
        '',
        'Claude Code fast path: the line below starting with `!` is pre-executed automatically. Other agents: ignore the leading `!` and run the bare command via your shell tool, following the instructions above.'
      ]),
    '',
    `!${options.cli} $ARGUMENTS`,
    '',
    '---',
    '',
    chinese ? '## 参考（仅在用户询问时展示）' : '## Reference (only show when the user asks)',
    '',
    chinese ? `底层 CLI：\`${options.cli}\`` : `Underlying CLI: \`${options.cli}\``,
    '',
    chinese
      ? `如需详细 flags 和示例，运行 \`${options.cli} --help\` 或直接阅读 \`.ome/skills/${workflow.command}/SKILL.md\`。`
      : `For detailed flags and examples, run \`${options.cli} --help\` or read \`.ome/skills/${workflow.command}/SKILL.md\` directly.`,
    ''
  ].join('\n');
}

const TEMPLATE_SKILLS: Record<string, string> = {
  bug: 'skills/oh-my-engine-bug/SKILL.md',
  api: 'skills/oh-my-engine-api/SKILL.md',
  comp: 'skills/oh-my-engine-comp/SKILL.md',
  ui: 'skills/oh-my-engine-ui/SKILL.md',
  init: 'skills/oh-my-engine-init/SKILL.md',
  evolve: 'skills/oh-my-engine-evolve/SKILL.md',
  memory: 'skills/oh-my-engine-memory/SKILL.md',
  spec: 'skills/oh-my-engine-spec/SKILL.md'
};

function localizedGenericSkillSource(workflow: WorkflowDefinition, outputLanguage: OutputLanguageResolution): string {
  const description = workflowDescription(workflow, outputLanguage);

  return renderStructuredSkill({
    command: workflow.command,
    description,
    tags: ['ome', workflow.id, 'workflow'],
    purpose: `${description}请结合 \`OME.md\`、相关 \`.ome/rules/*.md\` 和当前源码执行。`,
    whenToUse: [
      '当用户请求与该工作流匹配时使用。',
      '当任务需要结合项目规则、源码和验证结果执行时使用。',
      '如果另一个 OME 工作流明显更贴合任务形态，不要使用此工作流。'
    ],
    inputs: [
      '用户请求和任何附带上下文。',
      '`OME.md`、相关 `.ome/rules/*.md` 文件，以及匹配的 `.ome/skills/ome-*/SKILL.md` 文件。',
      '与当前工作流相关的源码、测试、日志、配置或设计/接口资料。'
    ],
    process: [
      '先阅读 OME 指南、项目规则和相关文件。',
      '识别当前任务真正需要改变或验证的最小范围。',
      '优先复用项目已有模式、工具和边界。',
      '按最小可验证步骤执行分析、实现或同步。',
      '运行能证明结果的最近相关检查，需要时扩大验证范围。',
      '避免无关清理、宽泛重构或推测性新增功能。',
      '报告变更文件、核心结论、验证证据和剩余风险。'
    ],
    redFlags: [
      '工作流与用户请求不匹配。',
      '改动范围超出当前任务需要。',
      '跳过验证或验证无法证明结论。',
      '结果无法追溯到项目规则、源码证据或用户目标。'
    ],
    verification: [
      '运行当前工作流最接近的有效检查。',
      '确认输出符合用户请求和项目规则。',
      '说明无法验证的部分和原因。',
      '没有证据时不要声称完成。'
    ],
    outputContract: [
      '工作流总结',
      '变更文件或产物',
      '验证证据',
      '剩余风险'
    ],
    workflowId: workflow.id,
    outputLanguage
  });
}

function genericSkillSource(workflow: WorkflowDefinition): string {
  switch (workflow.id) {
    case 'init-rules':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'rules', 'workflow'],
        purpose: 'Refresh the local project scan, rewrite repository-specific rules, and keep platform rules in sync.',
        whenToUse: [
          'Use when the repository has changed enough that the existing `.ome/rules/*.md` are stale.',
          'Use when you need to personalize rule drafts from the current source tree.',
          'Do not use when you only need to inspect the current rules without changing them.'
        ],
        inputs: [
          'Project root, `OME.md`, `.ome/context/project-scan.json`, and `.ome/context/rules-generation-prompt.md`.',
          'Representative source files, tests, scripts, configs, and any existing conventions.',
          'The current `.ome/rules/*.md` files and the target platform rule files.'
        ],
        process: [
          'Read the current scan and prompt before editing any rule file.',
          'Inspect representative source files and existing project conventions.',
          'Rewrite `.ome/rules/*.md` so they match this repository instead of generic framework advice.',
          'Add, rename, or remove rules only when the scan supports the change.',
          'Sync platform rule files after editing the source rules.',
          'Report the changed rule files and verification commands.',
          'Do not create UI, mobile, or design-token rules unless the repository signals them.'
        ],
        redFlags: [
          'The scan conflicts with the source code or package scripts.',
          'A rule would be generic and not tied to the repository.',
          'The change would invent unnecessary UI or mobile rules.',
          'The platform sync step is skipped after editing source rules.'
        ],
        verification: [
          'Check that the updated rule set matches the scan and source tree.',
          'Run the relevant sync command and confirm platform rule outputs were regenerated.',
          'State any rule files or project signals that could not be verified.'
        ],
        outputContract: [
          'Changed rule files',
          'Scan summary',
          'Verification commands',
          'Remaining risks'
        ]
      });

    case 'define':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'define', 'workflow'],
        purpose: 'Clarify the task, lock scope, and produce a decision-ready problem statement before implementation.',
        whenToUse: [
          'Use when the request is ambiguous, broad, or under-specified.',
          'Use when the goal, constraints, or success criteria are still moving.',
          'Do not use when an approved implementation plan already exists.'
        ],
        inputs: [
          'User task description and any attached context.',
          'Relevant project rules, scans, or docs that can resolve ambiguity.',
          'Known constraints, deadlines, compatibility requirements, and non-goals.'
        ],
        process: [
          'State the goal in one sentence.',
          'Identify the user, the workflow, and the success criteria.',
          'Separate known facts from assumptions and open questions.',
          'List the minimum scope needed to solve the problem.',
          'Call out any blocking ambiguity that needs a decision.',
          'Keep the result concise and decision-ready.',
          'Do not speculate beyond the evidence you can ground.'
        ],
        redFlags: [
          'The task can be answered by reading the repo or docs directly.',
          'The scope keeps expanding while the request stays vague.',
          'A hidden assumption would materially change the implementation.',
          'The request is really a planning or build task rather than a definition task.'
        ],
        verification: [
          'Confirm the statement matches the user intent.',
          'Confirm assumptions are explicit and limited.',
          'Confirm any open questions are actually blocking.',
          'State what is known versus what still needs a decision.'
        ],
        outputContract: [
          'Goal statement',
          'Scope and non-goals',
          'Assumptions and open questions',
          'Next decision required'
        ]
      });

    case 'plan':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'plan', 'workflow'],
        purpose: 'Turn a clarified task into an implementation plan with interfaces, edge cases, and test strategy.',
        whenToUse: [
          'Use when the goal is known but the implementation still needs design decisions.',
          'Use when you need a precise sequence of edits before writing code.',
          'Do not use when the task is already a tiny, obvious change.'
        ],
        inputs: [
          'The clarified goal and scope.',
          'Relevant project rules, source files, and existing patterns.',
          'Known edge cases, compatibility constraints, and verification expectations.'
        ],
        process: [
          'Summarize the goal and any constraints that matter.',
          'Identify the narrowest implementation path that preserves existing behavior.',
          'List interfaces, files, or modules that may change.',
          'Call out edge cases and failure modes before coding.',
          'Define the test strategy and acceptance criteria.',
          'Produce a plan that another engineer could implement without guessing.',
          'Avoid writing code in the planning step.'
        ],
        redFlags: [
          'The plan makes undocumented assumptions about public interfaces.',
          'The approach requires broad refactors without a clear need.',
          'Tests or edge cases are missing from the proposal.',
          'The result is really implementation disguised as planning.'
        ],
        verification: [
          'Check that the plan covers interfaces, edge cases, and tests.',
          'Check that assumptions and dependencies are explicit.',
          'Check that the plan stays within the requested scope.',
          'Check that the next implementation step is unambiguous.'
        ],
        outputContract: [
          'Implementation summary',
          'Files or interfaces that may change',
          'Test plan',
          'Assumptions and risks'
        ]
      });

    case 'build':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'build', 'workflow'],
        purpose: 'Implement scoped changes in small verified slices using the repository rules and plan.',
        whenToUse: [
          'Use when the change is approved and the next step is implementation.',
          'Use when the scope is small enough to verify in slices.',
          'Do not use when the request still needs definition or planning.'
        ],
        inputs: [
          'The approved task or plan.',
          'Relevant source files, tests, and project rules.',
          'Any known constraints that must survive the change.'
        ],
        process: [
          'Start with the smallest slice that proves the change.',
          'Keep edits close to the existing project structure and patterns.',
          'Lock behavior with tests when the change is risky.',
          'Apply the fix or feature in incremental steps.',
          'Run the nearest meaningful verification after each meaningful slice.',
          'Avoid unrelated cleanup or broad refactors.',
          'Report the changed files, implementation summary, and verification.'
        ],
        redFlags: [
          'The patch expands beyond the approved scope.',
          'A testable behavior change is made without verification.',
          'The implementation invents new abstractions unnecessarily.',
          'The change depends on a hidden assumption that was not confirmed.'
        ],
        verification: [
          'Run targeted tests or behavior checks that prove the slice.',
          'Broaden verification when the blast radius warrants it.',
          'State any validation that could not be run.',
          'Confirm no unrelated files were changed.'
        ],
        outputContract: [
          'Changed files',
          'Implementation summary',
          'Verification',
          'Remaining risks'
        ]
      });

    case 'test':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'test', 'workflow'],
        purpose: 'Design behavior-focused tests and regression coverage that prove the intended project behavior.',
        whenToUse: [
          'Use when a behavior change needs coverage or a regression needs protection.',
          'Use when you need to reproduce a failure before fixing it.',
          'Do not use when the task is only a documentation or planning exercise.'
        ],
        inputs: [
          'The behavior, failure, or feature under test.',
          'Relevant source files, fixtures, and existing test patterns.',
          'The narrowest command or check that can prove the case.'
        ],
        process: [
          'Identify the behavior that must be protected.',
          'Find the nearest existing test style or fixture pattern.',
          'Add the smallest deterministic test that proves the behavior.',
          'Include failing-before evidence when the task is a regression fix.',
          'Keep the test close to the changed code.',
          'Run the relevant tests and broaden only when needed.',
          'Report what is covered and what remains unverified.'
        ],
        redFlags: [
          'The test only checks implementation details.',
          'The fixture is noisy or nondeterministic.',
          'A failing regression is not demonstrated when one is expected.',
          'The verification command does not prove the behavior.'
        ],
        verification: [
          'Run the new or updated test.',
          'Run any nearby regression or type checks needed for confidence.',
          'State exact failures or gaps if the test cannot run.',
          'Confirm the test is behavior-focused rather than incidental.'
        ],
        outputContract: [
          'Tests added or updated',
          'Behavior verified',
          'Verification commands',
          'Remaining gaps'
        ]
      });

    case 'review':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'review', 'workflow'],
        purpose: 'Review code for correctness, maintainability, risk, and missing verification before it ships.',
        whenToUse: [
          'Use when a diff, PR, or file set needs a real engineering review.',
          'Use when correctness or regressions matter more than style alone.',
          'Do not use when you need to implement the change yourself.'
        ],
        inputs: [
          'The diff, file list, or PR description.',
          'Relevant project rules and adjacent code.',
          'Any tests, logs, or expected behavior that frame the review.'
        ],
        process: [
          'Read the changed code and the nearby context.',
          'Check the change against the project rules and existing patterns.',
          'Look for correctness bugs, regression risks, and missing tests.',
          'Apply the behavioral quality gate: assumptions surfaced, simplicity preserved, scope stayed surgical, and verification is concrete.',
          'Call out maintainability or architecture concerns that matter.',
          'Prioritize findings by severity and likelihood.',
          'Avoid hand-wavy praise or summary-only responses.',
          'End with concrete issues, assumptions, behavioral-gate result, and residual risk.'
        ],
        redFlags: [
          'The review does not identify specific files or lines.',
          'The change alters behavior without sufficient test coverage.',
          'A security, correctness, or compatibility concern is ignored.',
          'The review turns into implementation advice instead of findings.',
          'The review ignores overengineering, speculative abstractions, drive-by refactors, or unrelated edits.',
          'The review accepts vague verification instead of concrete tests, checks, or stated gaps.'
        ],
        verification: [
          'Confirm findings are tied to the actual diff.',
          'Confirm severity is grounded in real behavior or risk.',
          'Confirm any missing test or verification concern is stated plainly.',
          'Confirm every behavioral quality gate dimension is pass, warning, fail, or not applicable.',
          'State if no issues were found and why.'
        ],
        outputContract: [
          'Findings ordered by severity',
          'Open questions or assumptions',
          'Behavioral quality gate: assumptions, simplicity, surgical scope, verification',
          'Concise change summary',
          'Residual risk'
        ]
      });

    case 'ship':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'ship', 'workflow'],
        purpose: 'Run final readiness checks and prepare a clean handoff or commit note for the finished change.',
        whenToUse: [
          'Use when the change is implemented and ready for final checks.',
          'Use when you need to package the work for handoff or commit.',
          'Do not use when the task is still being planned or built.'
        ],
        inputs: [
          'The completed change and any outstanding risks.',
          'Relevant verification output or test results.',
          'Any release, handoff, or commit constraints.'
        ],
        process: [
          'Confirm the change is complete and scoped as expected.',
          'Run the final verification that proves readiness.',
          'Check for missing documentation, notes, or follow-up items.',
          'Summarize the implementation and verification cleanly.',
          'Call out any residual risk or known gap explicitly.',
          'Prepare the final handoff or commit-oriented summary.',
          'Do not reopen the implementation unless a real defect appears.'
        ],
        redFlags: [
          'The change still has unresolved correctness issues.',
          'Final verification has not been run or is inconclusive.',
          'Important risks are hidden in a vague summary.',
          'The handoff introduces new scope instead of closing the current one.'
        ],
        verification: [
          'Run the final relevant checks.',
          'Confirm the output matches the changed behavior.',
          'State what could not be verified and why.',
          'Confirm the summary is ready for the next owner.'
        ],
        outputContract: [
          'Completion summary',
          'Verification evidence',
          'Remaining risks',
          'Handoff or commit notes'
        ]
      });

    case 'mcp':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'mcp', 'workflow'],
        purpose: 'Initialize, sync, preview, and inspect project MCP configuration for design-tool integrations.',
        whenToUse: [
          'Use when the project needs Figma or MasterGo MCP setup.',
          'Use when editor-specific MCP files need regeneration from a single source.',
          'Do not use when the task is unrelated to MCP configuration.'
        ],
        inputs: [
          'The current `.ome/mcp/source.json` or project MCP request.',
          'Environment variable names and any required token strategy.',
          'The target editors or platforms that need synced MCP files.'
        ],
        process: [
          'Read the MCP source and current environment assumptions first.',
          'Generate or update the project MCP source files.',
          'Sync editor-specific MCP outputs from the source.',
          'Keep tokens out of repository files and use environment variables instead.',
          'Preview or doctor the generated configuration when needed.',
          'Report which files were written and which settings still depend on the environment.',
          'Do not hardcode real secrets into the repo.'
        ],
        redFlags: [
          'A real token or secret would be written to disk.',
          'The editor outputs diverge from the source without explanation.',
          'The task tries to bypass the source-based MCP flow.',
          'The environment assumptions are undocumented.'
        ],
        verification: [
          'Check that source and generated outputs are in sync.',
          'Confirm secrets remain in environment variables.',
          'Run the available MCP doctor or preview command if available.',
          'State any platform-specific limitations.'
        ],
        outputContract: [
          'Generated MCP files',
          'Environment assumptions',
          'Verification',
          'Remaining risks'
        ]
      });

    case 'superpowers':
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', 'superpowers', 'workflow'],
        purpose: 'Install, update, or inspect Superpowers bridge entries for supported Agent editors.',
        whenToUse: [
          'Use when the user wants Superpowers installed or refreshed.',
          'Use when the editor-specific bridge needs inspection or repair.',
          'Do not use when the task is unrelated to Superpowers integration.'
        ],
        inputs: [
          'The target editors and install location.',
          'Any existing bridge or wrapper state in the user home directory.',
          'The Superpowers repository or release source when updates are required.'
        ],
        process: [
          'Check the current install or doctor state first.',
          'Prefer the native installer or bridge path for each supported editor.',
          'Write or refresh the wrapper only when native support is not available.',
          'Keep the bridge files consistent with the source repository.',
          'Verify the install state after writing.',
          'Report the platform coverage and any manual follow-up steps.',
          'Do not copy unrelated third-party sources into the project rules.'
        ],
        redFlags: [
          'A native install path exists but the wrapper is used anyway.',
          'The bridge would copy external sources into project rules.',
          'The user home paths are not checked before writing.',
          'The install state cannot be verified after the change.'
        ],
        verification: [
          'Run the doctor or status command after install/update.',
          'Confirm the expected platform targets exist.',
          'State any native installer step that remains manual.',
          'Record any home-directory path assumptions.'
        ],
        outputContract: [
          'Installed or updated targets',
          'Doctor or status result',
          'Manual follow-up steps',
          'Remaining risks'
        ]
      });

    default:
      return renderStructuredSkill({
        command: workflow.command,
        description: workflow.description,
        tags: ['ome', workflow.id, 'workflow'],
        purpose: workflow.description,
        whenToUse: [
          `Use for ${workflow.description.toLowerCase()}.`,
          'Use when the workflow name matches the user request.',
          'Do not use when a more specific OME workflow is clearly a better fit.'
        ],
        inputs: [
          'The user request and any relevant project context.',
          'The project rules and source files that apply to the workflow.',
          'Any artifact specific to the workflow domain.'
        ],
        process: [
          'Read OME guidance and relevant project rules first.',
          'Inspect the files and signals that matter for the requested workflow.',
          'Apply the smallest useful change or analysis path.',
          'Verify the result with the nearest meaningful check.',
          'Avoid unrelated cleanup or broad refactors.',
          'Report the files, reasoning, verification, and remaining risk.',
          'Do not treat a vague summary as completion.'
        ],
        redFlags: [
          'The workflow is being used for the wrong task shape.',
          'The change expands beyond the requested scope.',
          'Verification is skipped or inconclusive.',
          'The result cannot be tied back to the project rules.'
        ],
        verification: [
          'Run the nearest meaningful check for the workflow.',
          'Confirm the result matches the request.',
          'State any gaps that could not be verified.',
          'Avoid claiming completion without evidence.'
        ],
        outputContract: [
          'Workflow summary',
          'Files or artifacts changed',
          'Verification',
          'Remaining risks'
        ]
      });
  }
}

function templateSkillContent(workflow: WorkflowDefinition): string | undefined {
  const templateRelativePath = TEMPLATE_SKILLS[workflow.id];
  if (!templateRelativePath) return undefined;
  const templatePath = path.join(repoRoot(), templateRelativePath);
  const source = readFileIfExists(templatePath);
  if (!source) return undefined;
  return replaceFrontmatterName(source, workflow.command);
}

export function buildWorkflowSkillSource(workflow: WorkflowDefinition, outputLanguage?: SkillLanguage): string {
  const action = ACTION_SKILLS[workflow.id];
  if (action) {
    const template = usesChinese(outputLanguage) ? undefined : templateSkillContent(workflow);
    if (template && template.includes(OME_ACTION_MARKER)) return template;
    return renderActionSkillSource(workflow, action, outputLanguage);
  }
  const template = usesChinese(outputLanguage) ? undefined : templateSkillContent(workflow);
  const source = outputLanguage && usesChinese(outputLanguage)
    ? localizedGenericSkillSource(workflow, outputLanguage)
    : template || genericSkillSource(workflow);
  return ensureWorkflowSessionSections(workflow, source, outputLanguage);
}

export function skillSourcePath(projectRoot: string, workflow: WorkflowDefinition): string {
  return path.join(projectRoot, '.ome', 'skills', workflow.command, 'SKILL.md');
}

export function resolveWorkflowSkillSource(projectRoot: string, workflow: WorkflowDefinition, outputLanguage?: SkillLanguage): string {
  const projectSourcePath = skillSourcePath(projectRoot, workflow);
  const projectSource = readFileIfExists(projectSourcePath);
  if (projectSource) return ensureWorkflowSessionSections(workflow, projectSource, outputLanguage);
  return buildWorkflowSkillSource(workflow, outputLanguage);
}

export function initializeWorkflowSkillSources(
  projectRoot: string,
  workflows: WorkflowDefinition[],
  force: boolean = false,
  outputLanguage?: SkillLanguage
): SkillSourceResult[] {
  const results: SkillSourceResult[] = [];

  for (const workflow of workflows) {
    const filePath = skillSourcePath(projectRoot, workflow);
    const content = buildWorkflowSkillSource(workflow, outputLanguage);
    const created = writeFileIfNeeded(filePath, content, force);
    results.push({
      workflow: workflow.command,
      path: filePath,
      action: created ? (fs.existsSync(filePath) && !force ? 'created' : 'updated') : 'skipped'
    });
  }

  return results;
}

export function renderPlatformSkillEntry(options: PlatformSkillEntryOptions, workflow: WorkflowDefinition, sourceContent: string): string {
  const preparedContent = ensureWorkflowSessionSections(workflow, sourceContent, options.outputLanguage);
  const isAction = preparedContent.includes(OME_ACTION_MARKER);

  if (options.style === 'skill') {
    return preparedContent.endsWith('\n') ? preparedContent : `${preparedContent}\n`;
  }

  const body = stripFrontmatter(preparedContent).trimEnd();
  const sections: string[] = [];

  if (isAction && options.platformId === 'claude-code') {
    sections.push(renderActionFrontmatterFor('claude-code', workflow, options.outputLanguage));
  } else {
    sections.push(renderFrontmatterBlock(workflowDescription(workflow, options.outputLanguage)));
  }

  if (isAction && options.platformId !== 'claude-code') {
    sections.push(stripPreExecutedShellLine(body));
  } else {
    sections.push(body);
  }

  if (options.platformId === 'antigravity') {
    if (usesChinese(options.outputLanguage)) {
      sections.push(
        '',
        'Antigravity 工作流说明：',
        `- 当 Antigravity 支持工作流命令时，使用 \`/${workflow.command}\` 调用此工作流。`,
        '- 如果安装后没有立即出现，请重新加载 Antigravity 窗口。'
      );
    } else {
      sections.push(
        '',
        'Antigravity workflow notes:',
        `- Use this workflow from Antigravity as \`/${workflow.command}\` when workflow commands are available.`,
        '- If it does not appear immediately, reload the Antigravity window after installing workflows.'
      );
    }
  }

  return `${sections.join('\n')}\n`;
}

function renderActionFrontmatterFor(platformId: string, workflow: WorkflowDefinition, outputLanguage?: SkillLanguage): string {
  const action = ACTION_SKILLS[workflow.id];
  const allowedTools = action ? `Bash(${action.cli}:*)` : 'Bash(ome:*)';
  return [
    '---',
    `description: ${workflowDescription(workflow, outputLanguage)}`,
    `allowed-tools: ${allowedTools}`,
    '---',
    ''
  ].join('\n');
}

function stripPreExecutedShellLine(body: string): string {
  // Remove the `!ome ...` Claude-Code-specific pre-execution line so that
  // platforms which do not understand the `!` prefix don't try to literally
  // echo it back. The surrounding natural-language instructions remain.
  return body
    .split(/\r?\n/)
    .filter(line => !/^![a-zA-Z0-9_.-]+/.test(line.trimStart()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}
