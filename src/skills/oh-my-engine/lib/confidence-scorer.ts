type MemoryRecord = Record<string, any>;

export interface ConfidenceScore {
  overall: number;        // 0-1, 总体信心
  evidenceScore: number;  // 基于证据数量
  consistencyScore: number; // 基于证据一致性
  successRateScore: number; // 基于成功率
  breakdown: string[];    // 评分细节
}

export function calculateConfidence(
  candidate: MemoryRecord
): ConfidenceScore {
  const evidenceCount = Number(candidate.evidenceCount) || 0;
  const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];

  // 证据数量评分 (3-5: 0.6, 6-10: 0.8, 10+: 1.0)
  const evidenceScore = Math.min(evidenceCount / 10, 1.0);

  // 一致性评分 (所有证据都成功: 1.0, 有失败: 降低)
  const successCount = evidence.filter((e: MemoryRecord) => e.status === 'success').length;
  const consistencyScore = evidenceCount > 0 ? successCount / evidenceCount : 0;

  // 成功率评分
  const successRateScore = consistencyScore;

  // 总体评分 (加权平均)
  const overall = (
    evidenceScore * 0.3 +
    consistencyScore * 0.4 +
    successRateScore * 0.3
  );

  const breakdown = [
    `Evidence: ${evidenceCount} executions (${(evidenceScore * 100).toFixed(0)}%)`,
    `Consistency: ${successCount}/${evidenceCount} successful (${(consistencyScore * 100).toFixed(0)}%)`,
    `Success rate: ${(successRateScore * 100).toFixed(0)}%`
  ];

  return {
    overall,
    evidenceScore,
    consistencyScore,
    successRateScore,
    breakdown
  };
}

module.exports = {
  calculateConfidence
};

export {};
