#!/usr/bin/env node

const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

type MemoryRecord = Record<string, any>;

const {
  readLearningCandidateRecord,
  updateLearningCandidateRecord,
  writeAdoptedLearningArtifact
} = require('../lib/memory-store');

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

export function adoptLearningCandidate(projectRootInput: string, slug: string): MemoryRecord {
  const projectRoot = path.resolve(projectRootInput);
  const { record } = readLearningCandidateRecord(projectRoot, slug);

  if (record.status !== 'verified' || !record.verification || record.verification.state !== 'passed') {
    throw new Error(
      `Learning candidate ${slug} must be verified before adoption`
    );
  }

  const adoptedAt = new Date().toISOString();
  const adoptedArtifact = writeAdoptedLearningArtifact(projectRoot, slug, {
    slug: record.slug,
    title: record.title,
    category: record.category,
    workflow: record.workflow,
    phase: record.phase,
    summary: record.summary,
    appliesTo: record.appliesTo,
    reusability: record.reusability,
    evidenceCount: record.evidenceCount,
    adoptedAt,
    adoptedFrom: `.ome/memory/learnings/candidates/${record.slug}.json`,
    source: record.source,
    status: 'adopted'
  });

  const updated = updateLearningCandidateRecord(projectRoot, slug, (current: MemoryRecord) => ({
    ...current,
    status: 'adopted',
    adoptedAt,
    adoptedFrom: `.ome/memory/learnings/adopted/${current.slug}.json`
  }));

  return {
    ...updated,
    adoptedArtifact
  };
}

export function runAdoptLearningCandidate(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const result = adoptLearningCandidate(options.projectRoot, options.slug);

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
    runAdoptLearningCandidate();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}
