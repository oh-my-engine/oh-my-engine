#!/usr/bin/env node

const path = require('node:path');

const {
  readSkillCandidateRecord,
  updateSkillCandidateRecord,
  writeGeneratedSkillArtifact
} = require('../lib/memory-store');
const {
  buildGeneratedSkillArtifact
} = require('../lib/generated-skill-artifact');

function parseArgs(argv) {
  const options = {};

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

  if (!options.projectRoot) {
    throw new Error('Missing required argument: --project-root');
  }

  if (!options.slug) {
    throw new Error('Missing required argument: --slug');
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(options.projectRoot);
  const { record } = readSkillCandidateRecord(projectRoot, options.slug);

  if (record.status !== 'verified' || !record.verification || record.verification.state !== 'passed') {
    throw new Error(
      `Skill candidate ${options.slug} must be verified before adoption`
    );
  }

  const adoptedAt = new Date().toISOString();
  const generatedArtifact = writeGeneratedSkillArtifact(
    projectRoot,
    options.slug,
    buildGeneratedSkillArtifact(record, adoptedAt)
  );

  const updated = updateSkillCandidateRecord(projectRoot, options.slug, current => ({
    ...current,
    status: 'adopted',
    adoptedAt,
    adoptedFrom: `.oh-my-engine/generated-skills/${current.slug}.json`
  }));

  process.stdout.write(
    `${JSON.stringify(
      {
        ...updated,
        generatedArtifact
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
