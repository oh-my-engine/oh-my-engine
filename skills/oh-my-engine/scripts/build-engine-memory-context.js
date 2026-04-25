#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  collectWorkflowGuidance,
  sortByEvidenceDescending
} = require('../lib/workflow-guidance');

function parseArgs(argv) {
  const options = {
    projectRoot: process.cwd(),
    workflow: 'spec'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--change-slug') {
      options.changeSlug = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--capability') {
      options.capability = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--workflow') {
      options.workflow = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!options.changeSlug) {
    throw new Error('Missing required argument: --change-slug');
  }

  if (!options.capability) {
    throw new Error('Missing required argument: --capability');
  }

  return options;
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function buildMarkdown(options, guidance) {
  const lines = [];

  lines.push('# Engine Memory Context');
  lines.push('');
  lines.push(
    'This file is auto-generated from adopted engine learnings and project-local generated skills.'
  );
  lines.push('');
  lines.push(`- Change: \`${options.changeSlug}\``);
  lines.push(`- Capability: \`${options.capability}\``);
  lines.push(`- Workflow: \`${options.workflow}\``);
  lines.push('');
  lines.push('## Adopted Learnings');
  lines.push('');

  if (guidance.adoptedLearnings.length === 0) {
    lines.push('- No adopted learnings currently apply to this workflow.');
  } else {
    for (const record of guidance.adoptedLearnings) {
      lines.push(`- ${record.title}`);
      if (record.summary) {
        lines.push(`  Summary: ${record.summary}`);
      }
      if (record.workflow || record.phase) {
        lines.push(`  Source: ${record.workflow || 'unknown'}/${record.phase || 'unknown'}`);
      }
      if (Array.isArray(record.appliesTo) && record.appliesTo.length > 0) {
        lines.push(`  Applies to: ${record.appliesTo.join(', ')}`);
      }
      lines.push(`  Evidence: ${record.evidenceCount || 0}`);
    }
  }

  lines.push('');
  lines.push('## Generated Skills');
  lines.push('');

  if (guidance.generatedSkills.length === 0) {
    lines.push('- No generated skills have been adopted yet.');
  } else {
    for (const record of sortByEvidenceDescending(guidance.generatedSkills)) {
      lines.push(`- ${record.slug}`);
      if (record.title) {
        lines.push(`  Title: ${record.title}`);
      }
      if (record.summary) {
        lines.push(`  Summary: ${record.summary}`);
      }
      if (record.patternId) {
        lines.push(`  Pattern: ${record.patternId}`);
      }
      lines.push(`  Evidence: ${record.evidenceCount || 0}`);
    }
  }

  lines.push('');
  lines.push('## Execution Directives');
  lines.push('');

  if (guidance.executionDirectives.length === 0) {
    lines.push('- No execution directives generated from adopted skills yet.');
  } else {
    for (const item of guidance.executionDirectives) {
      lines.push(`- [${item.slug}] ${item.directive}`);
    }
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(options.projectRoot);
  const guidance = collectWorkflowGuidance(projectRoot, options.workflow);

  const filePath = path.join(
    projectRoot,
    'openspec',
    'changes',
    options.changeSlug,
    'context',
    'engine-memory.md'
  );

  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, buildMarkdown(options, guidance), 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        filePath,
        summary: {
          adoptedLearnings: guidance.adoptedLearnings.length,
          generatedSkills: guidance.generatedSkills.length,
          executionDirectives: guidance.executionDirectives.length
        }
      },
      null,
      2
    )}\n`
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
