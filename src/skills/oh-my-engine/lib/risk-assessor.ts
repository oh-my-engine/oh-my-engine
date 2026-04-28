type MemoryRecord = Record<string, any>;

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  score: number; // 0-1, 越高越危险
  factors: string[];
}

export function assessRisk(
  candidate: MemoryRecord
): RiskAssessment {
  const factors: string[] = [];
  let score = 0;

  const evidenceCount = Number(candidate.evidenceCount) || 0;
  const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];

  // 影响范围评估
  if (Array.isArray(candidate.appliesTo)) {
    const scopeCount = candidate.appliesTo.length;
    if (scopeCount > 3) {
      score += 0.3;
      factors.push(`Wide scope: applies to ${scopeCount} workflows`);
    }
  }

  // 复杂度评估
  if (typeof candidate.reusability === 'number' && candidate.reusability < 0.5) {
    score += 0.2;
    factors.push('Low reusability indicates high specificity');
  }

  // 证据数量评估
  if (evidenceCount < 5) {
    score += 0.3;
    factors.push(`Limited evidence: only ${evidenceCount} executions`);
  }

  // 一致性评估
  const successCount = evidence.filter((e: MemoryRecord) => e.status === 'success').length;
  const consistency = evidenceCount > 0 ? successCount / evidenceCount : 0;
  if (consistency < 0.9) {
    score += 0.2;
    factors.push(`Inconsistent results: ${(consistency * 100).toFixed(0)}% success rate`);
  }

  // 确定风险等级
  let level: 'low' | 'medium' | 'high';
  if (score < 0.3) {
    level = 'low';
  } else if (score < 0.6) {
    level = 'medium';
  } else {
    level = 'high';
  }

  return { level, score, factors };
}

module.exports = {
  assessRisk
};

export {};
