#!/usr/bin/env node

const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

const {
  verifyLearningCandidate
} = require('../../oh-my-engine/lib/learning-candidate-verifier');

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

export function runVerifyLearningCandidate(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const result = verifyLearningCandidate(
    path.resolve(options.projectRoot),
    options.slug
  );

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    runVerifyLearningCandidate();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
