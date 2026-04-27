#!/usr/bin/env node

const path = require('node:path');

const { analyzeEvolution } = require('../../oh-my-engine/lib/evolution-engine');
const { getErrorMessage } = require('../../../core/errors');

function parseArgs(argv: string[]): Record<string, any> {
  const options: Record<string, any> = {
    projectRoot: process.cwd(),
    format: 'text'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
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

  return options;
}

export function renderEvolutionTextReport(report: any): string {
  const lines = [];

  lines.push('Evolution analysis');
  lines.push(`Execution records: ${report.summary.executionRecords}`);
  lines.push(`Preference records: ${report.summary.preferenceRecords}`);
  lines.push(`Learning candidates: ${report.summary.learningCandidates}`);
  lines.push(`Skill candidates: ${report.summary.skillCandidates}`);
  lines.push(`Adopted preferences: ${report.summary.adoptedPreferences}`);

  if (report.learningCandidates.length > 0) {
    lines.push('');
    lines.push('Learning candidates:');
    for (const candidate of report.learningCandidates) {
      lines.push(`- ${candidate.title} [evidence=${candidate.evidenceCount}]`);
    }
  }

  if (report.skillCandidates.length > 0) {
    lines.push('');
    lines.push('Skill candidates:');
    for (const candidate of report.skillCandidates) {
      lines.push(`- ${candidate.patternId} [evidence=${candidate.evidenceCount}]`);
    }
  }

  if (report.adoptedPreferences.length > 0) {
    lines.push('');
    lines.push('Adopted preferences:');
    for (const preference of report.adoptedPreferences) {
      lines.push(`- ${preference.statement} [evidence=${preference.evidenceCount}]`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function runEvolveAnalyzeCommand(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const report = analyzeEvolution(path.resolve(options.projectRoot));

  if (options.format === 'json') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (options.format === 'text') {
    process.stdout.write(renderEvolutionTextReport(report));
    return;
  }

  throw new Error(`Unsupported output format: ${options.format}`);
}

if (require.main === module) {
  try {
    runEvolveAnalyzeCommand();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
