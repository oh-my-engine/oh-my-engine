const fs = require('node:fs');
const path = require('node:path');
const { analyzeEvolution } = require('./evolution-engine');
const {
  writeLearningCandidateRecord,
  writeSkillCandidateRecord,
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
  const executionsDir = path.join(engineDirectory(projectRoot), 'memory', 'executions');

  if (!fs.existsSync(executionsDir)) {
    return [];
  }

  const executions: MemoryRecord[] = [];
  const workflows = fs.readdirSync(executionsDir);

  for (const workflow of workflows) {
    const workflowDir = path.join(executionsDir, workflow);
    if (!fs.statSync(workflowDir).isDirectory()) continue;

    const files = fs.readdirSync(workflowDir).filter((f: string) => f.endsWith('.jsonl'));

    for (const file of files) {
      const filePath = path.join(workflowDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n').filter((l: string) => l.trim());

      for (const line of lines) {
        try {
          const record = JSON.parse(line);
          if (record.timestamp > timestamp) {
            executions.push(record);
          }
        } catch (error) {
          // Skip invalid lines
        }
      }
    }
  }

  return executions;
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
  const state = loadAnalysisState(projectRoot);

  // 只分析新的执行记录（增量分析）
  const newExecutions = loadExecutionsSince(projectRoot, state.lastAnalyzedTimestamp);

  if (newExecutions.length === 0) {
    return; // 没有新记录，跳过分析
  }

  // 运行分析
  const analysis = analyzeEvolution(projectRoot, {
    learningCandidateMinEvidence: 3,
    skillCandidateMinEvidence: 3,
    adoptedPreferenceMinEvidence: 2
  });

  // 检查是否有新候选
  const newLearningCandidates = analysis.learningCandidates.filter(
    (c: MemoryRecord) => !candidateExists(projectRoot, 'learning', c.slug)
  );

  const newSkillCandidates = analysis.skillCandidates.filter(
    (c: MemoryRecord) => !candidateExists(projectRoot, 'skill', c.slug)
  );

  // 生成新候选
  for (const candidate of newLearningCandidates) {
    writeLearningCandidateRecord(projectRoot, candidate);
  }

  for (const candidate of newSkillCandidates) {
    writeSkillCandidateRecord(projectRoot, candidate);
  }

  // 更新分析状态
  const newState = {
    lastAnalyzedTimestamp: new Date().toISOString(),
    analysisCount: state.analysisCount + 1,
    lastCandidateCount: newLearningCandidates.length + newSkillCandidates.length
  };
  saveAnalysisState(projectRoot, newState);

  // 如果有新候选，触发自主决策
  if (newLearningCandidates.length > 0 || newSkillCandidates.length > 0) {
    const { autoDecideAndApply } = require('./auto-decision');
    autoDecideAndApply(projectRoot, newLearningCandidates, newSkillCandidates);
  }

  // 每 10 次分析运行一次效果跟踪和清理
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
