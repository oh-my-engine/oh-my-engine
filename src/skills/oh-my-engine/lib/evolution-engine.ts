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

type BehavioralAntipattern = {
  id: string;
  title: string;
  summary: string;
  match: RegExp;
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

const BEHAVIORAL_ANTIPATTERNS: BehavioralAntipattern[] = [
  {
    id: 'agent-behavior-overengineering',
    title: 'Avoid overengineering and speculative abstractions',
    summary: 'Repeated feedback or execution metadata indicates overengineering, speculative abstractions, or unnecessary configurability. Prefer the smallest implementation that satisfies the current request.',
    match: /over[- ]?engineer|overcomplicat|too complex|unnecessary abstraction|speculative|bloated|过度设计|过度工程|太复杂|不必要的抽象/i
  },
  {
    id: 'agent-behavior-unrelated-edits',
    title: 'Avoid unrelated edits and drive-by refactors',
    summary: 'Repeated feedback or execution metadata indicates unrelated edits, drive-by cleanup, formatting churn, or refactors outside the requested scope. Keep changes surgical.',
    match: /unrelated|drive[- ]?by|scope creep|formatting churn|changed too much|refactor.*unrelated|无关修改|顺手|改多了|范围蔓延/i
  },
  {
    id: 'agent-behavior-missing-verification',
    title: 'Require concrete verification before handoff',
    summary: 'Repeated feedback or execution metadata indicates missing tests, vague verification, or unverified completion claims. Report concrete checks or explicit gaps.',
    match: /missing (test|verification)|unverified|no test|skip.*test|vague verification|缺少测试|未验证|没有验证|跳过测试/i
  },
  {
    id: 'agent-behavior-hidden-assumptions',
    title: 'Surface assumptions before implementation',
    summary: 'Repeated feedback or execution metadata indicates hidden assumptions or silently chosen interpretations. State assumptions and ask when ambiguity changes the implementation.',
    match: /assum|clarif|ambiguous|silently chose|wrong interpretation|假设|澄清|不明确|歧义|理解错/i
  }
];

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

function searchableBehaviorText(record: MemoryRecord): string {
  return [
    record.summary,
    record.whyStored,
    ...(Array.isArray(record.errors) ? record.errors : []),
    record.metadata ? JSON.stringify(record.metadata) : ''
  ].filter(Boolean).join('\n');
}

function buildBehavioralAntipatternGroups(executionRecords: MemoryRecord[], thresholds: EvolutionThresholds): EvolutionGroup[] {
  return BEHAVIORAL_ANTIPATTERNS.map(pattern => {
    const evidence = executionRecords
      .filter(record => pattern.match.test(searchableBehaviorText(record)))
      .map(record => ({
        changeId: record.changeId,
        timestamp: record.timestamp,
        status: record.status,
        workflow: record.workflow,
        phase: record.phase
      }));

    return {
      patternId: pattern.id,
      summary: pattern.summary,
      evidence
    };
  }).filter(group => group.evidence.length >= thresholds.learningCandidateMinEvidence);
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

  const behavioralAntipatternCandidates = buildBehavioralAntipatternGroups(executionRecords, thresholds).map((group: EvolutionGroup) => {
    const pattern = BEHAVIORAL_ANTIPATTERNS.find(item => item.id === group.patternId);
    const candidate = {
      slug: slugifyForFile(group.patternId),
      title: pattern?.title || `Avoid ${group.patternId}`,
      category: 'agent_behavior_antipattern',
      source: 'post_run_promotion',
      status: 'candidate',
      workflow: 'all',
      phase: 'review',
      summary: group.summary,
      evidenceCount: group.evidence.length,
      evidence: group.evidence,
      appliesTo: ['define', 'plan', 'build', 'test', 'review', 'ship', 'bug-analysis', 'component-gen', 'api-integration', 'ui-restore'],
      reusability: 0.95,
      whyStored: 'promoted_agent_behavior_antipattern',
      verification: {
        state: 'pending',
        required: true
      }
    };

    return upsertLearningCandidate(projectRoot, candidate).record;
  });

  const adoptedPreferences = collectAdoptedPreferences(
    preferenceRecords,
    thresholds
  );

  return {
    summary: {
      executionRecords: executionRecords.length,
      preferenceRecords: preferenceRecords.length,
      learningCandidates: learningCandidates.length + behavioralAntipatternCandidates.length,
      skillCandidates: skillCandidates.length,
      behavioralAntipatternCandidates: behavioralAntipatternCandidates.length,
      adoptedPreferences: adoptedPreferences.length
    },
    learningCandidates: [...learningCandidates, ...behavioralAntipatternCandidates],
    skillCandidates,
    behavioralAntipatternCandidates,
    adoptedPreferences
  };
}

module.exports = {
  analyzeEvolution
};

export {};
