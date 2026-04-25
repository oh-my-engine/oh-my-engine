const {
  readLearningCandidateRecord,
  updateLearningCandidateRecord
} = require('./memory-store');

const ALLOWED_STATUSES = new Set([
  'candidate',
  'verified',
  'adopted',
  'rejected'
]);

function verifyLearningCandidate(projectRoot, slug) {
  const { record } = readLearningCandidateRecord(projectRoot, slug);
  const errors = [];

  if (!record.slug || record.slug !== slug) {
    errors.push('slug must match the candidate filename');
  }

  if (!record.title || typeof record.title !== 'string') {
    errors.push('title is required');
  }

  if (!record.category || typeof record.category !== 'string') {
    errors.push('category is required');
  }

  if (!record.workflow || typeof record.workflow !== 'string') {
    errors.push('workflow is required');
  }

  if (!record.phase || typeof record.phase !== 'string') {
    errors.push('phase is required');
  }

  if (!record.summary || typeof record.summary !== 'string') {
    errors.push('summary is required');
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

  if (!Array.isArray(record.appliesTo) || record.appliesTo.length < 1) {
    errors.push('appliesTo must contain at least one workflow');
  }

  if (
    !Number.isFinite(Number(record.reusability)) ||
    Number(record.reusability) < 0 ||
    Number(record.reusability) > 1
  ) {
    errors.push('reusability must be between 0 and 1');
  }

  if (!record.verification || typeof record.verification !== 'object') {
    errors.push('verification metadata is required');
  }

  const checkedAt = new Date().toISOString();

  if (errors.length > 0) {
    return updateLearningCandidateRecord(projectRoot, slug, current => ({
      ...current,
      verification: {
        ...(current.verification || {}),
        state: 'failed',
        checkedAt,
        errors
      }
    }));
  }

  return updateLearningCandidateRecord(projectRoot, slug, current => ({
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
  verifyLearningCandidate
};
