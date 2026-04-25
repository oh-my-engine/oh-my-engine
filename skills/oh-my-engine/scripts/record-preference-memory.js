#!/usr/bin/env node

const path = require('node:path');

const { recordPreferenceMemory } = require('../lib/memory-store');

function parseArgs(argv) {
  const options = {
    source: 'explicit_remember'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--scope') {
      options.scope = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--statement') {
      options.statement = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--source') {
      options.source = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--stability') {
      options.stability = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument === '--reuse-potential') {
      options.reusePotential = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument === '--novelty') {
      options.novelty = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.projectRoot) {
    throw new Error('Missing required argument: --project-root');
  }

  if (!options.statement) {
    throw new Error('Missing required argument: --statement');
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = recordPreferenceMemory(path.resolve(options.projectRoot), {
    source: options.source,
    scope: options.scope || 'user',
    statement: options.statement,
    complexity: 'low',
    confidence: 'high',
    sensitivity: 'low',
    stability: Number.isFinite(options.stability) ? options.stability : 1,
    reusePotential: Number.isFinite(options.reusePotential)
      ? options.reusePotential
      : 1,
    novelty: Number.isFinite(options.novelty) ? options.novelty : 0.2
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
