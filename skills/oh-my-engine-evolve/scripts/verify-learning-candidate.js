#!/usr/bin/env node

const path = require('node:path');

const {
  verifyLearningCandidate
} = require('../../oh-my-engine/lib/learning-candidate-verifier');

function parseArgs(argv) {
  const options = {
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

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = verifyLearningCandidate(
    path.resolve(options.projectRoot),
    options.slug
  );

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
