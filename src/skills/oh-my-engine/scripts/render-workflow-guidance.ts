#!/usr/bin/env node

const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

const {
  collectWorkflowGuidance,
  renderWorkflowGuidanceText
} = require('../lib/workflow-guidance');

function parseArgs(argv: string[]): Record<string, any> {
  const options: Record<string, any> = {
    projectRoot: process.cwd(),
    format: 'text',
    input: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--workflow') {
      options.workflow = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--input') {
      options.input = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--format') {
      options.format = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.workflow) {
    throw new Error('Missing required argument: --workflow');
  }

  return options;
}

export function runRenderWorkflowGuidance(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const guidance = collectWorkflowGuidance(
    path.resolve(options.projectRoot),
    options.workflow
  );

  if (options.format === 'json') {
    process.stdout.write(
      `${JSON.stringify(
        {
          workflow: guidance.workflow,
          input: options.input,
          adoptedLearnings: guidance.adoptedLearnings,
          generatedSkills: guidance.generatedSkills,
          executionDirectives: guidance.executionDirectives
        },
        null,
        2
      )}\n`
    );
    return;
  }

  if (options.format === 'text') {
    process.stdout.write(renderWorkflowGuidanceText(guidance, options.input));
    return;
  }

  throw new Error(`Unsupported format: ${options.format}`);
}

if (require.main === module) {
  try {
    runRenderWorkflowGuidance();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
