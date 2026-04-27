const fs = require('node:fs');
const path = require('node:path');

const { ENGINE_DIR, engineDirectory } = require('./paths');

export type WorkflowName = 'bug' | 'ui' | 'comp' | 'api';

interface WorkflowMeta {
  title: string;
  usage: string;
  rules: string[];
  objective: string;
}

const WORKFLOWS: Record<WorkflowName, WorkflowMeta> = {
  bug: {
    title: 'Bug Analysis Workflow',
    usage: 'ome bug "<issue description>"',
    rules: ['code-style'],
    objective: 'Diagnose the bug, identify root cause, propose a focused fix, and verify behavior.'
  },
  ui: {
    title: 'UI Restoration Workflow',
    usage: 'ome ui <design-url-or-description>',
    rules: ['theme', 'i18n', 'design-tokens'],
    objective: 'Restore UI from a design source while following theme, i18n, and design token rules.'
  },
  comp: {
    title: 'Component Generation Workflow',
    usage: 'ome comp <component-name>',
    rules: ['code-style', 'design-tokens', 'theme'],
    objective: 'Generate a reusable component consistent with project structure and rules.'
  },
  api: {
    title: 'API Integration Workflow',
    usage: 'ome api <api-spec-or-description>',
    rules: ['code-style'],
    objective: 'Integrate an API contract or endpoint with typed, maintainable project code.'
  }
};

function existingRules(projectRoot: string, rules: string[]): string[] {
  const base = engineDirectory(projectRoot);
  return rules
    .map(rule => path.join(base, 'rules', `${rule}.md`))
    .filter(rulePath => fs.existsSync(rulePath))
    .map(rulePath => path.relative(projectRoot, rulePath));
}

export function renderWorkflowCommand(workflow: WorkflowName, args: string[] = [], projectRoot: string = process.cwd()): string {
  const meta = WORKFLOWS[workflow];
  const input = args.join(' ').trim() || '(no input provided)';
  const rules = existingRules(projectRoot, meta.rules);

  return [
    `# ${meta.title}`,
    '',
    `Usage: ${meta.usage}`,
    `Input: ${input}`,
    '',
    'Project context:',
    `- Config: ${ENGINE_DIR}/config.json`,
    `- Rules directory: ${ENGINE_DIR}/rules/`,
    `- Relevant rules: ${rules.join(', ') || meta.rules.map(rule => `${ENGINE_DIR}/rules/${rule}.md`).join(', ')}`,
    '',
    'Instructions for the Agent:',
    `1. Read ${ENGINE_DIR}/config.json if it exists.`,
    `2. Read the relevant rule files under ${ENGINE_DIR}/rules/.`,
    `3. Execute this objective: ${meta.objective}`,
    '4. Keep changes focused and verify before claiming completion.',
    '5. If project files are missing, ask the user to run `ome init` in the project root.',
    '',
    'Terminal equivalent:',
    `- ${meta.usage}`
  ].join('\n') + '\n';
}
