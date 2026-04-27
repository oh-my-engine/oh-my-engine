#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

const { recordExecutionMemory } = require('../lib/memory-store');

function parseArgs(argv: string[]): Record<string, any> {
  const options: Record<string, any> = {};

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

export function recordExecutionMemoryFromFile(projectRootInput: string, eventFileInput: string): Record<string, any> {
  const eventPath = path.resolve(eventFileInput);
  const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  return recordExecutionMemory(path.resolve(projectRootInput), payload);
}

export function runRecordExecutionMemory(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const result = recordExecutionMemoryFromFile(options.projectRoot, options.eventFile);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    runRecordExecutionMemory();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
