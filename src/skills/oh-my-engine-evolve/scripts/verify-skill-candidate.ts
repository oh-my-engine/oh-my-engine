#!/usr/bin/env node

const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

const {
  verifySkillCandidate
} = require('../../oh-my-engine/lib/skill-candidate-verifier');

function parseArgs(argv: string[]): Record<string, any> {
  const options: Record<string, any> = {
    projectRoot: process.cwd()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--slug') {
      options.slug = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.slug) {
    throw new Error('Missing required argument: --slug');
  }

  return options;
}

export function runVerifySkillCandidate(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const result = verifySkillCandidate(
    path.resolve(options.projectRoot),
    options.slug
  ) as Record<string, any>;

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    runVerifySkillCandidate();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
