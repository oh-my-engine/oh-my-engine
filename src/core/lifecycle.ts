const { ENGINE_DIR } = require('./paths');
const { createSession } = require('./session');

export type LifecycleWorkflowName = 'define' | 'plan' | 'build' | 'test' | 'review' | 'ship';

interface LifecycleMeta {
  title: string;
  usage: string;
  purpose: string;
  behavior: string[];
  output: string[];
  references: string[];
}

const LIFECYCLE_WORKFLOWS: Record<LifecycleWorkflowName, LifecycleMeta> = {
  define: {
    title: 'Define Workflow',
    usage: 'ome define "<task or requirement>"',
    purpose: 'Clarify the goal, boundaries, success criteria, and missing information before implementation.',
    behavior: [
      'Extract the user goal and expected outcome.',
      'Separate required scope, optional scope, and explicit non-goals.',
      'Name missing information and assumptions instead of guessing.',
      'Produce an executable requirement summary without changing project files.'
    ],
    output: ['Goal', 'Success criteria', 'In scope', 'Out of scope', 'Open questions', 'Assumptions'],
    references: ['documentation.md', 'skill-quality.md']
  },
  plan: {
    title: 'Plan Workflow',
    usage: 'ome plan "<task or requirement>"',
    purpose: 'Design the implementation approach, public interface changes, data flow, edge cases, and tests.',
    behavior: [
      `Read OME.md, ${ENGINE_DIR}/rules/, relevant source files, and existing tests before planning.`,
      'Identify dependencies, risks, compatibility constraints, and the smallest viable path.',
      'Define verification before implementation starts.',
      'Do not modify project files while producing the plan.'
    ],
    output: ['Implementation approach', 'Public API / type changes', 'Data flow', 'Edge cases', 'Test plan', 'Assumptions'],
    references: ['testing.md', 'code-review.md', 'documentation.md']
  },
  build: {
    title: 'Build Workflow',
    usage: 'ome build "<task or plan>"',
    purpose: 'Implement a scoped change in small verified slices while reusing existing project patterns.',
    behavior: [
      `Read OME.md, ${ENGINE_DIR}/rules/, relevant source files, and related tests before editing.`,
      'Work in minimal slices and verify each slice when practical.',
      'Prefer existing utilities and patterns; do not add dependencies unless explicitly requested.',
      'Keep unrelated cleanup out of scope.'
    ],
    output: ['Changed files', 'Slice summary', 'Verification', 'Remaining risks'],
    references: ['testing.md', 'cleanup.md', 'code-review.md']
  },
  test: {
    title: 'Test Workflow',
    usage: 'ome test "<target or behavior>"',
    purpose: 'Design or run behavior-focused tests, regression tests, and failure diagnosis.',
    behavior: [
      'For behavior bugs, write or identify a failing reproduction test before fixing.',
      'Prefer behavior and outcome assertions over implementation details.',
      'Choose unit, integration, or end-to-end coverage based on risk and blast radius.',
      'If tests fail, diagnose the failure before claiming completion.'
    ],
    output: ['Test strategy', 'Tests added or changed', 'Failing-before evidence when applicable', 'Final verification'],
    references: ['testing.md']
  },
  review: {
    title: 'Review Workflow',
    usage: 'ome review "<path, diff, or PR description>"',
    purpose: 'Review correctness, readability, architecture, security, performance, and test coverage.',
    behavior: [
      'Lead with findings ordered by severity and grounded in file references.',
      'Check correctness, readability, architecture, security, performance, and test coverage.',
      'Call out open questions and verification gaps separately.',
      'Do not rewrite the change while reviewing unless explicitly asked.'
    ],
    output: ['Findings first', 'Severity and file references', 'Open questions', 'Residual risks', 'Verification gaps'],
    references: ['code-review.md', 'security.md', 'performance.md']
  },
  ship: {
    title: 'Ship Workflow',
    usage: 'ome ship "<completed change>"',
    purpose: 'Run final readiness checks, summarize the change, and prepare commit or release notes when requested.',
    behavior: [
      'Confirm lint, typecheck, build, and test status appropriate to the change.',
      'Summarize user-visible changes and any compatibility notes.',
      'Check for unfinished work or known gaps before declaring readiness.',
      'When committing, use the Lore Commit Protocol.'
    ],
    output: ['Final change summary', 'Verification evidence', 'Known gaps', 'Commit message draft when relevant'],
    references: ['git.md', 'documentation.md', 'code-review.md']
  }
};

export interface LifecycleGuidanceOptions {
  workflow: LifecycleWorkflowName;
  input?: string;
  cwd?: string;
}

export function lifecycleWorkflowNames(): LifecycleWorkflowName[] {
  return Object.keys(LIFECYCLE_WORKFLOWS) as LifecycleWorkflowName[];
}

export function isLifecycleWorkflow(value: string): value is LifecycleWorkflowName {
  return Object.prototype.hasOwnProperty.call(LIFECYCLE_WORKFLOWS, value);
}

export function renderLifecycleGuidance(options: LifecycleGuidanceOptions): string {
  const workflow = options.workflow;
  const meta = LIFECYCLE_WORKFLOWS[workflow];
  const input = (options.input || '').trim() || '(no input provided)';
  const projectRoot = options.cwd || process.cwd();
  const session = createSession(workflow, input, projectRoot);

  return [
    `# ${meta.title}`,
    '',
    `Session ID: ${session.id}`,
    `Usage: ${meta.usage}`,
    `Input: ${input}`,
    '',
    'Purpose:',
    `- ${meta.purpose}`,
    '',
    'Project context:',
    '- Read `OME.md` if present.',
    `- Read relevant rule files under \`${ENGINE_DIR}/rules/\`.`,
    `- Load references when useful from \`skills/oh-my-engine/references/\`: ${meta.references.join(', ')}`,
    '',
    'Behavior:',
    ...meta.behavior.map(item => `- ${item}`),
    '',
    'Common rationalizations to reject:',
    '- "This is too small to verify."',
    '- "I can test it later."',
    '- "A quick unrelated cleanup will help."',
    '- "No error output means it is done."',
    '',
    'Output contract:',
    ...meta.output.map(item => `- ${item}`),
    '',
    'Terminal equivalent:',
    `- ${meta.usage}`
  ].join('\n') + '\n';
}

module.exports = {
  lifecycleWorkflowNames,
  isLifecycleWorkflow,
  renderLifecycleGuidance
};
