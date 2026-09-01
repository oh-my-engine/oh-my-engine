const {
  listAdoptedLearningRecords,
  listExecutionRecords
} = require('./memory-store');

type MemoryRecord = Record<string, any>;

export interface EffectivenessMetrics {
  ruleSlug: string;
  appliedAt: string;
  executionsBefore: number;
  executionsAfter: number;
  errorRateBefore: number;
  errorRateAfter: number;
  improvement: number; // -1 to 1, 正数表示改进
  status: 'effective' | 'neutral' | 'harmful';
}

function loadAllExecutions(projectRoot: string): MemoryRecord[] {
  return listExecutionRecords(projectRoot);
}

function readAdoptedLearningRecord(projectRoot: string, slug: string): MemoryRecord {
  const record = listAdoptedLearningRecords(projectRoot)
    .find((item: MemoryRecord) => item.slug === slug);
  if (!record) throw new Error(`Adopted learning ${slug} not found`);
  return record;
}

function appliesToLearning(execution: MemoryRecord, learning: MemoryRecord): boolean {
  const appliesTo = Array.isArray(learning.appliesTo) ? learning.appliesTo : [];
  if (appliesTo.length > 0) return appliesTo.includes(execution.workflow);
  if (learning.workflow) return execution.workflow === learning.workflow;
  return true;
}

function calculateErrorRate(executions: MemoryRecord[]): number {
  if (executions.length === 0) return 0;
  const errorCount = executions.filter((e: MemoryRecord) => e.status === 'failed').length;
  return errorCount / executions.length;
}

export function trackEffectiveness(
  projectRoot: string,
  ruleSlug: string
): EffectivenessMetrics {
  const adoptedRule = readAdoptedLearningRecord(projectRoot, ruleSlug);
  const appliedAt = adoptedRule.adoptedAt || new Date().toISOString();

  // 获取应用前后的执行记录
  const allExecutions = loadAllExecutions(projectRoot)
    .filter((execution: MemoryRecord) => appliesToLearning(execution, adoptedRule));
  const executionsBefore = allExecutions.filter((e: MemoryRecord) => e.timestamp < appliedAt);
  const executionsAfter = allExecutions.filter((e: MemoryRecord) => e.timestamp >= appliedAt);

  // 计算错误率
  const errorRateBefore = calculateErrorRate(executionsBefore);
  const errorRateAfter = calculateErrorRate(executionsAfter);

  // 计算改进程度
  const improvement = errorRateBefore - errorRateAfter;

  // 判断状态
  let status: 'effective' | 'neutral' | 'harmful';
  if (improvement > 0.1) {
    status = 'effective';
  } else if (improvement < -0.1) {
    status = 'harmful';
  } else {
    status = 'neutral';
  }

  return {
    ruleSlug,
    appliedAt,
    executionsBefore: executionsBefore.length,
    executionsAfter: executionsAfter.length,
    errorRateBefore,
    errorRateAfter,
    improvement,
    status
  };
}

module.exports = {
  trackEffectiveness
};

export {};
