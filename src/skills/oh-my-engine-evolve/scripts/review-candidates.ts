#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { engineDirectory } = require('../../../core/paths');
const { getErrorMessage } = require('../../../core/errors');

type MemoryRecord = Record<string, any>;

function loadPendingLearningCandidates(projectRoot: string): MemoryRecord[] {
  const candidatesDir = path.join(engineDirectory(projectRoot), 'memory', 'learnings', 'candidates');

  if (!fs.existsSync(candidatesDir)) {
    return [];
  }

  const files = fs.readdirSync(candidatesDir).filter((f: string) => f.endsWith('.json'));
  const pending: MemoryRecord[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(candidatesDir, file), 'utf8');
      const candidate = JSON.parse(content);

      if (candidate.reviewRequested && candidate.status !== 'adopted' && candidate.status !== 'rejected') {
        pending.push(candidate);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  return pending;
}

function loadPendingSkillCandidates(projectRoot: string): MemoryRecord[] {
  const candidatesDir = path.join(engineDirectory(projectRoot), 'memory', 'skill-candidates');

  if (!fs.existsSync(candidatesDir)) {
    return [];
  }

  const files = fs.readdirSync(candidatesDir).filter((f: string) => f.endsWith('.json'));
  const pending: MemoryRecord[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(candidatesDir, file), 'utf8');
      const candidate = JSON.parse(content);

      if (candidate.reviewRequested && candidate.status !== 'adopted' && candidate.status !== 'rejected') {
        pending.push(candidate);
      }
    } catch (error) {
      // Skip invalid files
    }
  }

  return pending;
}

export function runReviewCandidates(argv: string[] = process.argv.slice(2)): void {
  const projectRoot = process.cwd();

  const learningCandidates = loadPendingLearningCandidates(projectRoot);
  const skillCandidates = loadPendingSkillCandidates(projectRoot);

  if (learningCandidates.length === 0 && skillCandidates.length === 0) {
    process.stdout.write('✅ No candidates pending review.\n');
    return;
  }

  process.stdout.write(`\n📋 Candidates Pending Review\n\n`);

  if (learningCandidates.length > 0) {
    process.stdout.write(`Learning Candidates (${learningCandidates.length}):\n\n`);

    for (const candidate of learningCandidates) {
      const confidence = candidate.confidence || {};
      const risk = candidate.risk || {};

      process.stdout.write(`  📚 ${candidate.slug}\n`);
      process.stdout.write(`     Title: ${candidate.title || 'N/A'}\n`);
      process.stdout.write(`     Confidence: ${((confidence.overall || 0) * 100).toFixed(0)}%\n`);
      process.stdout.write(`     Risk: ${risk.level || 'unknown'}\n`);
      process.stdout.write(`     Reason: ${candidate.reviewReason || 'N/A'}\n`);
      process.stdout.write(`     Evidence: ${candidate.evidenceCount || 0} executions\n`);
      process.stdout.write(`\n     To approve: ome evolve adopt-learning --slug ${candidate.slug}\n`);
      process.stdout.write(`     To reject:  ome evolve reject-learning --slug ${candidate.slug}\n\n`);
    }
  }

  if (skillCandidates.length > 0) {
    process.stdout.write(`Skill Candidates (${skillCandidates.length}):\n\n`);

    for (const candidate of skillCandidates) {
      const confidence = candidate.confidence || {};
      const risk = candidate.risk || {};

      process.stdout.write(`  🔧 ${candidate.slug}\n`);
      process.stdout.write(`     Title: ${candidate.title || 'N/A'}\n`);
      process.stdout.write(`     Confidence: ${((confidence.overall || 0) * 100).toFixed(0)}%\n`);
      process.stdout.write(`     Risk: ${risk.level || 'unknown'}\n`);
      process.stdout.write(`     Reason: ${candidate.reviewReason || 'N/A'}\n`);
      process.stdout.write(`     Evidence: ${candidate.evidenceCount || 0} executions\n`);
      process.stdout.write(`\n     To approve: ome evolve adopt-skill --slug ${candidate.slug}\n`);
      process.stdout.write(`     To reject:  ome evolve reject-skill --slug ${candidate.slug}\n\n`);
    }
  }
}

if (require.main === module) {
  try {
    runReviewCandidates();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
