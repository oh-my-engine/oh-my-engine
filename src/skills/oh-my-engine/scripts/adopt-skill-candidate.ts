#!/usr/bin/env node

const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

type MemoryRecord = Record<string, any>;

const {
  readSkillCandidateRecord,
  updateSkillCandidateRecord,
  writeGeneratedSkillArtifact
} = require('../lib/memory-store');
const {
  buildGeneratedSkillArtifact
} = require('../lib/generated-skill-artifact');

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

export function adoptSkillCandidate(projectRootInput: string, slug: string): MemoryRecord {
  const projectRoot = path.resolve(projectRootInput);
  const { record } = readSkillCandidateRecord(projectRoot, slug);

  if (record.status !== 'verified' || !record.verification || record.verification.state !== 'passed') {
    throw new Error(
      `Skill candidate ${slug} must be verified before adoption`
    );
  }

  const adoptedAt = new Date().toISOString();
  const generatedArtifact = writeGeneratedSkillArtifact(
    projectRoot,
    slug,
    buildGeneratedSkillArtifact(record, adoptedAt)
  );

  const updated = updateSkillCandidateRecord(projectRoot, slug, (current: MemoryRecord) => ({
    ...current,
    status: 'adopted',
    adoptedAt,
    adoptedFrom: `.ome/generated-skills/${current.slug}.json`
  }));

  return {
    ...updated,
    generatedArtifact
  };
}

export function runAdoptSkillCandidate(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const result = adoptSkillCandidate(options.projectRoot, options.slug);

  process.stdout.write(
    `${JSON.stringify(
      result,
      null,
      2
    )}\n`
  );
}

if (require.main === module) {
  try {
    runAdoptSkillCandidate();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}
