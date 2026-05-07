#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { engineDirectory } = require('../../../core/paths');
const { getErrorMessage } = require('../../../core/errors');
const { assessSkillMarkdown } = require('../../oh-my-engine/lib/skill-candidate-verifier');
const {
  listLearningCandidateRecords,
  listSkillCandidateRecords
} = require('../../oh-my-engine/lib/memory-store');

type MemoryRecord = Record<string, any>;

function buildReviewSkillMarkdown(candidate: MemoryRecord): string {
  return [
    `# ${candidate.title || candidate.slug || 'Skill Candidate'}`,
    '',
    '## Purpose',
    candidate.summary || 'Apply the learned candidate pattern safely.',
    '',
    '## When to Use',
    '- Use when the current task matches the repeated evidence pattern.',
    '- Do not use when project rules or current code contradict the candidate.',
    '',
    '## Inputs',
    '- User task input.',
    '- Relevant source files and tests.',
    '- `OME.md` and `.ome/rules/`.',
    '',
    '## Process',
    '1. Read project rules and relevant code.',
    '2. Confirm the candidate applies to this task.',
    '3. Make the smallest focused change using existing patterns.',
    '4. Add or refresh regression coverage when behavior changes.',
    '5. Run relevant verification.',
    '',
    '## Red Flags',
    '- Scope expands into unrelated cleanup.',
    '- New dependency is needed without explicit user request.',
    '- Verification cannot prove the behavior.',
    '',
    '## Common Rationalizations',
    '- The pattern is obvious, so tests are not needed.',
    '- Similar files can be changed without inspection.',
    '- No error output means complete.',
    '',
    '## Verification',
    '- Run tests, typecheck, build, or equivalent verification.',
    '- Record blockers and remaining risks when checks cannot run.',
    '',
    '## Output Contract',
    '- Changed files',
    '- What changed',
    '- Verification',
    '- Remaining risks'
  ].join('\n');
}

function loadPendingLearningCandidates(projectRoot: string): MemoryRecord[] {
  const markdownCandidates = listLearningCandidateRecords(projectRoot)
    .filter((candidate: MemoryRecord) => candidate.status !== 'adopted' && candidate.status !== 'rejected');

  if (markdownCandidates.length > 0) {
    return markdownCandidates;
  }

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
  const markdownCandidates = listSkillCandidateRecords(projectRoot)
    .filter((candidate: MemoryRecord) => candidate.status !== 'adopted' && candidate.status !== 'rejected');

  if (markdownCandidates.length > 0) {
    return markdownCandidates;
  }

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
      const quality = assessSkillMarkdown(candidate.skillMarkdown || buildReviewSkillMarkdown(candidate));
      const totalScore = Object.values(quality.score).reduce((sum: number, value: unknown) => sum + Number(value), 0);
      process.stdout.write(`     Quality: ${quality.ok ? 'pass' : 'fail'} (${totalScore}/30)\n`);
      if (quality.rejectionReasons.length > 0) {
        process.stdout.write(`     Rejection reasons: ${quality.rejectionReasons.join('; ')}\n`);
      }
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
