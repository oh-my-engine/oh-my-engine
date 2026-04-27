const { collectWorkflowGuidance, renderWorkflowGuidanceText } = require('../skills/oh-my-engine/lib/workflow-guidance');

interface GuidanceOptions {
  workflow: string;
  input: string;
  format: string;
}

function parseGuidanceArgs(args: string[]): GuidanceOptions {
  if (args.length < 1) {
    throw new Error('Usage: ome guidance <workflow> [--input <text>] [--format text|json]');
  }

  const options: GuidanceOptions = {
    workflow: args[0],
    input: '',
    format: 'text'
  };

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--input') {
      if (index + 1 >= args.length) throw new Error('Missing value for --input');
      options.input = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--format') {
      if (index + 1 >= args.length) throw new Error('Missing value for --format');
      options.format = args[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown guidance option: ${argument}`);
  }

  return options;
}

export function runGuidanceCommand(args: string[]): void {
  const options = parseGuidanceArgs(args);
  const guidance = collectWorkflowGuidance(process.cwd(), options.workflow);

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

  throw new Error(`Unsupported guidance output format: ${options.format}`);
}

export {};
