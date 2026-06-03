const fs = require('node:fs');
const path = require('node:path');
const { analyzeEvolution } = require('./evolution-engine');
const {
  listExecutionRecords,
  listLearningCandidateRecords,
  listSkillCandidateRecords,
  loadProjectConfig,
  readLearningCandidateRecord,
  readSkillCandidateRecord
} = require('./memory-store');
const { engineDirectory } = require('../../../core/paths');

type MemoryRecord = Record<string, any>;

interface AnalysisState {
  lastAnalyzedTimestamp: string;
  analysisCount: number;
  lastCandidateCount: number;
}

function getAnalysisStatePath(projectRoot: string): string {
  return path.join(engineDirectory(projectRoot), 'memory', '.analysis-state.json');
}

export function loadAnalysisState(projectRoot: string): AnalysisState {
  const statePath = getAnalysisStatePath(projectRoot);

  if (!fs.existsSync(statePath)) {
    return {
      lastAnalyzedTimestamp: new Date(0).toISOString(),
      analysisCount: 0,
      lastCandidateCount: 0
    };
  }

  try {
    const content = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {
      lastAnalyzedTimestamp: new Date(0).toISOString(),
      analysisCount: 0,
      lastCandidateCount: 0
    };
  }
}

export function saveAnalysisState(projectRoot: string, state: AnalysisState): void {
  const statePath = getAnalysisStatePath(projectRoot);
  const dir = path.dirname(statePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function loadExecutionsSince(projectRoot: string, timestamp: string): MemoryRecord[] {
  return listExecutionRecords(projectRoot).filter(
    (record: MemoryRecord) => typeof record.timestamp === 'string' && record.timestamp > timestamp
  );
}

export function candidateExists(
  projectRoot: string,
  type: 'learning' | 'skill',
  slug: string
): boolean {
  try {
    if (type === 'learning') {
      readLearningCandidateRecord(projectRoot, slug);
    } else {
      readSkillCandidateRecord(projectRoot, slug);
    }
    return true;
  } catch (error) {
    return false;
  }
}

export function autoAnalyzeEvolution(projectRoot: string): void {
  const config = loadProjectConfig(projectRoot);
  const evolutionConfig = config.evolution || {};
  if (evolutionConfig.enabled === false) return;

  const state = loadAnalysisState(projectRoot);
  const newExecutions = loadExecutionsSince(projectRoot, state.lastAnalyzedTimestamp);
  if (newExecutions.length === 0) return;

  const existingLearningSlugs = new Set(
    listLearningCandidateRecords(projectRoot).map((candidate: MemoryRecord) => candidate.slug)
  );
  const existingSkillSlugs = new Set(
    listSkillCandidateRecords(projectRoot).map((candidate: MemoryRecord) => candidate.slug)
  );

  const analysis = analyzeEvolution(projectRoot);
  const newLearningCandidates = analysis.learningCandidates.filter(
    (candidate: MemoryRecord) => !existingLearningSlugs.has(candidate.slug)
  );
  const newSkillCandidates = analysis.skillCandidates.filter(
    (candidate: MemoryRecord) => !existingSkillSlugs.has(candidate.slug)
  );

  const newState = {
    lastAnalyzedTimestamp: new Date().toISOString(),
    analysisCount: state.analysisCount + 1,
    lastCandidateCount: newLearningCandidates.length + newSkillCandidates.length
  };
  saveAnalysisState(projectRoot, newState);

  if (
    (newLearningCandidates.length > 0 || newSkillCandidates.length > 0) &&
    evolutionConfig.autoApply !== false &&
    evolutionConfig.candidateOnly !== true
  ) {
    const { autoDecideAndApply } = require('./auto-decision');
    autoDecideAndApply(projectRoot, newLearningCandidates, newSkillCandidates);
  }

  if (newState.analysisCount % 10 === 0) {
    const { autoCleanupIneffective } = require('./auto-cleanup');
    autoCleanupIneffective(projectRoot);
  }
}

module.exports = {
  autoAnalyzeEvolution,
  loadAnalysisState,
  saveAnalysisState,
  loadExecutionsSince,
  candidateExists
};

export {};
