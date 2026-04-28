const fs = require('node:fs');
const path = require('node:path');
const { engineDirectory } = require('../../../core/paths');

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
          executions.push(record);
        } catch (error) {
          // Skip invalid lines
        }
      }
    }
  }

  return executions;
}

function readAdoptedLearningRecord(projectRoot: string, slug: string): MemoryRecord {
  const filePath = path.join(
    engineDirectory(projectRoot),
    'memory',
    'learnings',
    'adopted',
    `${slug}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Adopted learning ${slug} not found`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
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
  const allExecutions = loadAllExecutions(projectRoot);
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
