const fs = require('node:fs');
const path = require('node:path');

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
}

const COMMON_RATIONALIZATIONS = [
  '"The obvious fix is good enough without a closer read of the rules."',
  '"I can skip verification because the change is small."',
  '"I should broaden the patch while I am here."',
  '"A vague summary is enough for handoff."'
];

const SUPERPOWERS_REPO = 'https://github.com/obra/superpowers';

export const OME_ACTION_MARKER = '<!-- OME:ACTION -->';

const ACTION_SKILLS: Record<string, { cli: string; humanLabel: string }> = {
  memory: { cli: 'ome memory view', humanLabel: 'memory inspection' },
  remember: { cli: 'ome memory remember', humanLabel: 'explicit memory recording' },
  evolve: { cli: 'ome evolve analyze', humanLabel: 'evolution analysis' }
};

const COMPLETION_LIFECYCLE_IDS = new Set([
  'define', 'plan', 'build', 'test', 'review', 'ship',
  'bug', 'ui', 'comp', 'api'
]);

function renderWorkflowCompletionSection(): string {
  return [
    '## Workflow Completion (MANDATORY)',
    '',
    'After you finish the work for this workflow — successful or not — you MUST run the following shell command as the very last step, AFTER you have reported results to the user:',
    '',
    '```bash',
    'ome finish',
    '```',
    '',
    'This records the execution into `.ome/memory/executions/` so the engine can learn from it.',
    '',
    'Skip ONLY if all of these are true:',
    '- The user explicitly said "do not record" or "just testing".',
    '- You made zero file changes.',
    '- You wrote zero new code.',
    '- You ran zero verifications.',
    '',
    'Do NOT skip because "the task was small" or "nothing interesting happened" — the engine\'s policy gate decides what to keep, not you.',
    '',
    'Claude Code fast path (other agents: ignore the leading `!` and run the bare command via your shell tool):',
    '',
    '```',
    '!ome finish',
    '```',
    ''
  ].join('\n');
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
}): string {
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
    '## Purpose',
    options.purpose,
    '',
    '## When to Use',
    renderBulletList(options.whenToUse),
    '',
    '## Inputs',
    renderBulletList(options.inputs),
    '',
    '## Process',
    renderOrderedList(options.process),
    '',
    '## Red Flags',
    renderBulletList(options.redFlags),
    '',
    '## Common Rationalizations',
    renderBulletList(options.rationalizations || COMMON_RATIONALIZATIONS),
    '',
    '## Verification',
    renderBulletList(options.verification),
    '',
    '## Output Contract',
    'Final response must include:',
    renderBulletList(options.outputContract),
    ''
  ];

  if (options.workflowId && COMPLETION_LIFECYCLE_IDS.has(options.workflowId)) {
    sections.push('', renderWorkflowCompletionSection());
  } else {
    const inferredId = options.command.replace(/^ome-/, '');
    if (COMPLETION_LIFECYCLE_IDS.has(inferredId)) {
      sections.push('', renderWorkflowCompletionSection());
    }
  }

  return sections.join('\n');
}

export function renderActionSkillSource(workflow: WorkflowDefinition, options: { cli: string; humanLabel: string }): string {
  const tag = workflow.id;
  return [
    '---',
    `name: ${workflow.command}`,
    'version: 1.0.0',
    `description: ${workflow.description}`,
    'author: oh-my-engine',
    `tags: [ome, ${tag}, action]`,
    `allowed-tools: Bash(${options.cli}:*)`,
    '---',
    '',
    OME_ACTION_MARKER,
    `# ${workflow.command}`,
    '',
    `> **Action command — execute, do not narrate.**`,
    '> When the user invokes this command, you MUST do the following before any other reasoning or commentary:',
    '>',
    `> 1. Run this shell command exactly (substitute \`$ARGUMENTS\` with whatever the user passed, empty if none):`,
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
    'Claude Code fast path — the line below starting with `!` is pre-executed automatically. Other agents: ignore the leading `!` and run the bare command via your shell tool, following the instructions above.',
    '',
    `!${options.cli} $ARGUMENTS`,
    '',
    '---',
    '',
    '## Reference (only show when the user asks)',
    '',
    `Underlying CLI: \`${options.cli}\``,
    '',
    `For detailed flags and examples, run \`${options.cli} --help\` or read \`.ome/skills/${workflow.command}/SKILL.md\` directly.`,
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

export function buildWorkflowSkillSource(workflow: WorkflowDefinition): string {
  const action = ACTION_SKILLS[workflow.id];
  if (action) {
    const template = templateSkillContent(workflow);
    if (template && template.includes(OME_ACTION_MARKER)) return template;
    return renderActionSkillSource(workflow, action);
  }
  const template = templateSkillContent(workflow);
  if (template) return template;
  return genericSkillSource(workflow);
}

export function skillSourcePath(projectRoot: string, workflow: WorkflowDefinition): string {
  return path.join(projectRoot, '.ome', 'skills', workflow.command, 'SKILL.md');
}

export function resolveWorkflowSkillSource(projectRoot: string, workflow: WorkflowDefinition): string {
  const projectSourcePath = skillSourcePath(projectRoot, workflow);
  const projectSource = readFileIfExists(projectSourcePath);
  if (projectSource) return projectSource;
  return buildWorkflowSkillSource(workflow);
}

export function initializeWorkflowSkillSources(projectRoot: string, workflows: WorkflowDefinition[], force: boolean = false): SkillSourceResult[] {
  const results: SkillSourceResult[] = [];

  for (const workflow of workflows) {
    const filePath = skillSourcePath(projectRoot, workflow);
    const content = buildWorkflowSkillSource(workflow);
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
  const isAction = sourceContent.includes(OME_ACTION_MARKER);

  if (options.style === 'skill') {
    return sourceContent.endsWith('\n') ? sourceContent : `${sourceContent}\n`;
  }

  const body = stripFrontmatter(sourceContent).trimEnd();
  const sections: string[] = [];

  if (isAction && options.platformId === 'claude-code') {
    sections.push(renderActionFrontmatterFor('claude-code', workflow));
  } else {
    sections.push(renderFrontmatterBlock(workflow.description));
  }

  if (isAction && options.platformId !== 'claude-code') {
    sections.push(stripPreExecutedShellLine(body));
  } else {
    sections.push(body);
  }

  if (options.platformId === 'antigravity') {
    sections.push(
      '',
      'Antigravity workflow notes:',
      `- Use this workflow from Antigravity as \`/${workflow.command}\` when workflow commands are available.`,
      '- If it does not appear immediately, reload the Antigravity window after installing workflows.'
    );
  }

  return `${sections.join('\n')}\n`;
}

function renderActionFrontmatterFor(platformId: string, workflow: WorkflowDefinition): string {
  const action = ACTION_SKILLS[workflow.id];
  const allowedTools = action ? `Bash(${action.cli}:*)` : 'Bash(ome:*)';
  return [
    '---',
    `description: ${workflow.description}`,
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
