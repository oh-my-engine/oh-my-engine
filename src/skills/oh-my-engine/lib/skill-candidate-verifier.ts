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

function verifySkillCandidate(projectRoot: string, slug: string): MemoryRecord {
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

  const checkedAt = new Date().toISOString();

  if (errors.length > 0) {
    return updateSkillCandidateRecord(projectRoot, slug, (current: MemoryRecord) => ({
      ...current,
      verification: {
        ...(current.verification || {}),
        state: 'failed',
        checkedAt,
        errors
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
      errors: []
    }
  }));
}

module.exports = {
  verifySkillCandidate
};

export {};
