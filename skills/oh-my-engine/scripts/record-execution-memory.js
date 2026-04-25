#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { recordExecutionMemory } = require('../lib/memory-store');

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--event-file') {
      options.eventFile = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.projectRoot) {
    throw new Error('Missing required argument: --project-root');
  }

  if (!options.eventFile) {
    throw new Error('Missing required argument: --event-file');
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const eventPath = path.resolve(options.eventFile);
  const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const result = recordExecutionMemory(path.resolve(options.projectRoot), payload);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
