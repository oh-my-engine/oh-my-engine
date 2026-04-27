const {
  listExecutionRecords,
  listPreferenceRecords,
  upsertLearningCandidate,
  upsertSkillCandidate,
  slugifyForFile,
  loadProjectConfig
} = require('./memory-store');

type MemoryRecord = Record<string, any>;
type EvolutionThresholds = {
  learningCandidateMinEvidence: number;
  skillCandidateMinEvidence: number;
  adoptedPreferenceMinEvidence: number;
};
type EvolutionGroup = {
  workflow?: string;
  phase?: string;
  summary: string;
  patternId?: string;
  evidence: MemoryRecord[];
};

const SUCCESS_STATUSES = new Set([
  'success',
  'verified',
  'archived',
  'fixed'
]);

function isSuccessfulExecution(record: MemoryRecord): boolean {
  return (
    SUCCESS_STATUSES.has(record.status) &&
    Array.isArray(record.errors) &&
    record.errors.length === 0
  );
}

const DEFAULT_THRESHOLDS = {
  learningCandidateMinEvidence: 3,
  skillCandidateMinEvidence: 3,
  adoptedPreferenceMinEvidence: 2
};

function loadEvolutionThresholds(projectRoot: string): EvolutionThresholds {
  const config = loadProjectConfig(projectRoot);
  const thresholds =
    config.evolution && config.evolution.thresholds
      ? config.evolution.thresholds
      : {};

  return {
    ...DEFAULT_THRESHOLDS,
    ...thresholds
  };
}

function buildLearningGroups(executionRecords: MemoryRecord[], thresholds: EvolutionThresholds): EvolutionGroup[] {
  const groups = new Map<string, EvolutionGroup>();

  for (const record of executionRecords) {
    if (!isSuccessfulExecution(record)) {
      continue;
    }

    if (record.metadata && record.metadata.patternCategory === 'bug_fix') {
      continue;
    }

    if (!record.summary || !record.workflow || !record.phase) {
      continue;
    }

    const key = `${record.workflow}|${record.phase}|${record.summary}`;
    const group: EvolutionGroup = groups.get(key) || {
      workflow: record.workflow,
      phase: record.phase,
      summary: record.summary,
      evidence: []
    };

    group.evidence.push({
      changeId: record.changeId,
      timestamp: record.timestamp,
      status: record.status,
      workflow: record.workflow,
      phase: record.phase
    });
    groups.set(key, group);
  }

  return [...groups.values()].filter(
    group => group.evidence.length >= thresholds.learningCandidateMinEvidence
  );
}

function buildSkillGroups(executionRecords: MemoryRecord[], thresholds: EvolutionThresholds): EvolutionGroup[] {
  const groups = new Map<string, EvolutionGroup>();

  for (const record of executionRecords) {
    if (!isSuccessfulExecution(record)) {
      continue;
    }

    if (!record.metadata || record.metadata.patternCategory !== 'bug_fix') {
      continue;
    }

    const patternId =
      record.metadata.patternId || slugifyForFile(record.summary || 'bug-fix');
    const group: EvolutionGroup = groups.get(patternId) || {
      patternId,
      summary: record.summary || '',
      evidence: []
    };

    group.evidence.push({
      changeId: record.changeId,
      timestamp: record.timestamp,
      status: record.status,
      workflow: record.workflow,
      phase: record.phase
    });
    groups.set(patternId, group);
  }

  return [...groups.values()].filter(
    group => group.evidence.length >= thresholds.skillCandidateMinEvidence
  );
}

function collectAdoptedPreferences(preferenceRecords: MemoryRecord[], thresholds: EvolutionThresholds): MemoryRecord[] {
  return preferenceRecords.filter(
    (record: MemoryRecord) =>
      record.status === 'adopted' &&
      Number(record.evidenceCount || 0) >=
        thresholds.adoptedPreferenceMinEvidence &&
      record.explicit === true
  );
}

function analyzeEvolution(projectRoot: string): MemoryRecord {
  const thresholds = loadEvolutionThresholds(projectRoot);
  const executionRecords = listExecutionRecords(projectRoot);
  const preferenceRecords = listPreferenceRecords(projectRoot);

  const learningCandidates = buildLearningGroups(
    executionRecords,
    thresholds
  ).map((group: EvolutionGroup) => {
    const title = `${group.workflow} ${group.phase}: ${group.summary}`;
    const candidate = {
      slug: slugifyForFile(`${group.workflow}-${group.phase}-${group.summary}`),
      title,
      category: 'best_practice',
      source: 'post_run_promotion',
      status: 'candidate',
      workflow: group.workflow,
      phase: group.phase,
      summary: group.summary,
      evidenceCount: group.evidence.length,
      evidence: group.evidence,
      appliesTo: [group.workflow],
      reusability: 0.9,
      whyStored: 'promoted_knowledge',
      verification: {
        state: 'pending',
        required: true
      }
    };

    return upsertLearningCandidate(projectRoot, candidate).record;
  });

  const skillCandidates = buildSkillGroups(executionRecords, thresholds).map((group: EvolutionGroup) => {
    const candidate = {
      slug: slugifyForFile(group.patternId),
      title: `Automate fix for ${group.patternId}`,
      source: 'post_run_promotion',
      status: 'candidate',
      patternCategory: 'bug_fix',
      patternId: group.patternId,
      summary: group.summary,
      evidenceCount: group.evidence.length,
      evidence: group.evidence,
      whyStored: 'promoted_skill_candidate',
      verification: {
        state: 'pending',
        required: true
      }
    };

    return upsertSkillCandidate(projectRoot, candidate).record;
  });

  const adoptedPreferences = collectAdoptedPreferences(
    preferenceRecords,
    thresholds
  );

  return {
    summary: {
      executionRecords: executionRecords.length,
      preferenceRecords: preferenceRecords.length,
      learningCandidates: learningCandidates.length,
      skillCandidates: skillCandidates.length,
      adoptedPreferences: adoptedPreferences.length
    },
    learningCandidates,
    skillCandidates,
    adoptedPreferences
  };
}

module.exports = {
  analyzeEvolution
};

export {};
