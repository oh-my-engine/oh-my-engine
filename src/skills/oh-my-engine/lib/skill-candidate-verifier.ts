const {
  readSkillCandidateRecord,
  updateSkillCandidateRecord
} = require('./memory-store');

const ALLOWED_STATUSES = new Set([
  'candidate',
  'verified',
  'adopted',
  'rejected'
]);

type MemoryRecord = Record<string, any>;

const REQUIRED_SECTIONS = [
  'Purpose',
  'When to Use',
  'Inputs',
  'Process',
  'Red Flags',
  'Common Rationalizations',
  'Verification',
  'Output Contract'
];

interface SkillQualityScore {
  specificity: number;
  actionability: number;
  verification: number;
  scopeControl: number;
  reuseOfExistingPatterns: number;
  riskAwareness: number;
}

interface SkillMarkdownAssessment {
  ok: boolean;
  score: SkillQualityScore;
  missingSections: string[];
  rejectionReasons: string[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(5, value));
}

function hasSection(markdown: string, section: string): boolean {
  const pattern = new RegExp(`^##\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
  return pattern.test(markdown);
}

function countMatches(markdown: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(markdown) ? 1 : 0), 0);
}

export function assessSkillMarkdown(skillMarkdown: string): SkillMarkdownAssessment {
  const markdown = String(skillMarkdown || '');
  const missingSections = REQUIRED_SECTIONS.filter(section => !hasSection(markdown, section));
  const rejectionReasons: string[] = [];

  if (missingSections.length > 0) {
    rejectionReasons.push(`missing required sections: ${missingSections.join(', ')}`);
  }

  const score: SkillQualityScore = {
    specificity: clampScore(
      2 +
      countMatches(markdown, [
        /when to use/i,
        /inputs/i,
        /out of scope|not use|not applicable/i
      ])
    ),
    actionability: clampScore(
      1 +
      countMatches(markdown, [
        /^1\.\s+/m,
        /read .*rules|read .*files|inspect/i,
        /run .*test|verify|check/i,
        /output contract/i
      ])
    ),
    verification: clampScore(
      countMatches(markdown, [
        /##\s+Verification/i,
        /test|typecheck|build|lint/i,
        /regression|failing reproduction|evidence/i,
        /remaining risks|could not verify/i,
        /must/i
      ])
    ),
    scopeControl: clampScore(
      countMatches(markdown, [
        /scope/i,
        /unrelated cleanup|unrelated/i,
        /no new dependencies|dependencies/i,
        /smallest|minimal|focused/i,
        /out of scope/i
      ])
    ),
    reuseOfExistingPatterns: clampScore(
      1 +
      countMatches(markdown, [
        /existing/i,
        /project rules|\.ome\/rules/i,
        /reuse|pattern/i,
        /OME\.md/i
      ])
    ),
    riskAwareness: clampScore(
      countMatches(markdown, [
        /red flags/i,
        /risk/i,
        /conflict/i,
        /security|safety/i,
        /assumption/i
      ])
    )
  };

  const totalScore = Object.values(score).reduce((sum, value) => sum + value, 0);

  if (score.verification < 4) {
    rejectionReasons.push('verification score must be at least 4');
  }
  if (score.scopeControl < 4) {
    rejectionReasons.push('scope_control score must be at least 4');
  }
  if (totalScore < 24) {
    rejectionReasons.push('total score must be at least 24');
  }
  if (/skip tests|skip verification|test later|no tests needed/i.test(markdown)) {
    rejectionReasons.push('skill must not encourage skipping verification');
  }

  return {
    ok: missingSections.length === 0 && rejectionReasons.length === 0,
    score,
    missingSections,
    rejectionReasons
  };
}

function buildCandidateSkillMarkdown(record: MemoryRecord): string {
  const evidenceCount = Number(record.evidenceCount || 0);
  const title = record.title || record.slug || 'Generated Skill Candidate';
  const summary = record.summary || `Apply the learned pattern ${record.patternId || record.slug || 'candidate'} safely.`;

  return [
    `# ${title}`,
    '',
    '## Purpose',
    summary,
    '',
    '## When to Use',
    '- Use when the same verified pattern appears in the current task.',
    '- Do not use when the current code or project rules contradict the learned evidence.',
    '- Out of scope: unrelated cleanup or refactoring.',
    '',
    '## Inputs',
    '- User task input.',
    '- Relevant source files and tests.',
    '- `OME.md` and `.ome/rules/` when present.',
    '- Candidate evidence records.',
    '',
    '## Process',
    '1. Read project rules and relevant code before applying the pattern.',
    '2. Confirm the current task matches the candidate evidence and scope.',
    '3. Apply the smallest focused change that reuses existing project patterns.',
    '4. Add or refresh regression coverage when behavior changes.',
    '5. Run the relevant checks and collect verification evidence.',
    '6. Report changed files, verification, and remaining risks.',
    '',
    '## Red Flags',
    '- The pattern conflicts with current project rules or architecture.',
    '- The fix requires new dependencies that the user did not request.',
    '- The change scope expands into unrelated cleanup.',
    '- The behavior cannot be verified with tests or equivalent evidence.',
    '',
    '## Common Rationalizations',
    '- This repeated pattern is obvious, so no verification is needed.',
    '- I can apply the pattern broadly across unrelated files out of scope.',
    '- I can add a helper dependency to make the fix easier.',
    '- Passing once means all similar cases are fixed.',
    '',
    '## Verification',
    '- Run the nearest relevant test, typecheck, build, or manual verification.',
    '- Bugfix candidates must include regression coverage or explain the equivalent evidence.',
    '- If verification cannot run, record the blocker and residual risk.',
    '',
    '## Output Contract',
    '- Changed files',
    '- What changed',
    '- Verification',
    '- Remaining risks',
    '',
    '## Evidence',
    `- Evidence count: ${evidenceCount}`
  ].join('\n');
}

export function verifySkillCandidate(projectRoot: string | { skillMarkdown: string; strict?: boolean }, slug?: string): MemoryRecord | SkillMarkdownAssessment {
  if (typeof projectRoot !== 'string') {
    return assessSkillMarkdown(projectRoot.skillMarkdown);
  }

  if (!slug) {
    throw new Error('Missing required skill candidate slug');
  }

  const { record } = readSkillCandidateRecord(projectRoot, slug);
  const errors: string[] = [];

  if (!record.slug || record.slug !== slug) {
    errors.push('slug must match the candidate filename');
  }

  if (!record.title || typeof record.title !== 'string') {
    errors.push('title is required');
  }

  if (!record.patternId || typeof record.patternId !== 'string') {
    errors.push('patternId is required');
  }

  if (!ALLOWED_STATUSES.has(record.status)) {
    errors.push('status must be candidate, verified, adopted, or rejected');
  }

  if (!Number.isFinite(Number(record.evidenceCount)) || Number(record.evidenceCount) < 1) {
    errors.push('evidenceCount must be at least 1');
  }

  if (!Array.isArray(record.evidence) || record.evidence.length < 1) {
    errors.push('evidence must contain at least one item');
  }

  if (!record.verification || typeof record.verification !== 'object') {
    errors.push('verification metadata is required');
  }

  const quality = assessSkillMarkdown(record.skillMarkdown || buildCandidateSkillMarkdown(record));

  if (!quality.ok) {
    errors.push(...quality.rejectionReasons);
  }

  const checkedAt = new Date().toISOString();

  if (errors.length > 0) {
    return updateSkillCandidateRecord(projectRoot, slug, (current: MemoryRecord) => ({
      ...current,
      verification: {
        ...(current.verification || {}),
        state: 'failed',
        checkedAt,
        errors,
        quality
      }
    }));
  }

  return updateSkillCandidateRecord(projectRoot, slug, (current: MemoryRecord) => ({
    ...current,
    status: current.status === 'adopted' ? 'adopted' : 'verified',
    verification: {
      ...(current.verification || {}),
      state: 'passed',
      checkedAt,
      errors: [],
      quality
    }
  }));
}

module.exports = {
  assessSkillMarkdown,
  verifySkillCandidate
};

export {};
