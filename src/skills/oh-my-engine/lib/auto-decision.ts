const { calculateConfidence } = require('./confidence-scorer');
const { assessRisk } = require('./risk-assessor');
const { verifyLearningCandidate } = require('./learning-candidate-verifier');
const { verifySkillCandidate } = require('./skill-candidate-verifier');
const { generateRuleFromLearning } = require('./rule-generator');
const { generateSkillFromCandidate } = require('./skill-generator');
const { adoptLearningCandidate } = require('../scripts/adopt-learning-candidate');
const { adoptSkillCandidate } = require('../scripts/adopt-skill-candidate');
const {
  updateLearningCandidateRecord,
  updateSkillCandidateRecord
} = require('./memory-store');

type MemoryRecord = Record<string, any>;

interface DecisionResult {
  action: 'auto-apply' | 'request-review' | 'reject';
  confidence: any;
  risk: any;
  reason: string;
}

export function decideAction(
  candidate: MemoryRecord
): DecisionResult {
  const confidence = calculateConfidence(candidate);
  const risk = assessRisk(candidate);

  // 决策矩阵
  // 高信心 + 低风险 = 自动应用
  // 高信心 + 中风险 = 请求审核
  // 高信心 + 高风险 = 请求审核
  // 中信心 + 低风险 = 请求审核
  // 中信心 + 中/高风险 = 请求审核
  // 低信心 = 拒绝

  if (confidence.overall < 0.6) {
    return {
      action: 'reject',
      confidence,
      risk,
      reason: `Low confidence (${(confidence.overall * 100).toFixed(0)}%)`
    };
  }

  if (confidence.overall >= 0.8 && risk.level === 'low') {
    return {
      action: 'auto-apply',
      confidence,
      risk,
      reason: `High confidence (${(confidence.overall * 100).toFixed(0)}%) and low risk`
    };
  }

  return {
    action: 'request-review',
    confidence,
    risk,
    reason: `Confidence: ${(confidence.overall * 100).toFixed(0)}%, Risk: ${risk.level}`
  };
}

export function autoDecideAndApply(
  projectRoot: string,
  learningCandidates: MemoryRecord[],
  skillCandidates: MemoryRecord[]
): void {
  const results = {
    autoApplied: [] as string[],
    requestedReview: [] as string[],
    rejected: [] as string[]
  };

  // 处理学习候选
  for (const candidate of learningCandidates) {
    const decision = decideAction(candidate);

    try {
      if (decision.action === 'auto-apply') {
        // 自动验证并采纳
        verifyLearningCandidate(projectRoot, candidate.slug);
        const rulePath = generateRuleFromLearning(projectRoot, candidate);
        adoptLearningCandidate(projectRoot, candidate.slug);
        results.autoApplied.push(`Rule: ${rulePath}`);
      } else if (decision.action === 'request-review') {
        // 标记为需要审核
        updateLearningCandidateRecord(projectRoot, candidate.slug, (current: MemoryRecord) => ({
          ...current,
          reviewRequested: true,
          reviewReason: decision.reason,
          confidence: decision.confidence,
          risk: decision.risk
        }));
        results.requestedReview.push(`Learning: ${candidate.slug}`);
      } else {
        results.rejected.push(`Learning: ${candidate.slug} (${decision.reason})`);
      }
    } catch (error) {
      process.stderr.write(`Warning: Failed to process learning candidate ${candidate.slug}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // 处理技能候选
  for (const candidate of skillCandidates) {
    const decision = decideAction(candidate);

    try {
      if (decision.action === 'auto-apply') {
        // 自动验证并采纳
        verifySkillCandidate(projectRoot, candidate.slug);
        const skillPath = generateSkillFromCandidate(projectRoot, candidate);
        adoptSkillCandidate(projectRoot, candidate.slug);
        results.autoApplied.push(`Skill: ${skillPath}`);
      } else if (decision.action === 'request-review') {
        // 标记为需要审核
        updateSkillCandidateRecord(projectRoot, candidate.slug, (current: MemoryRecord) => ({
          ...current,
          reviewRequested: true,
          reviewReason: decision.reason,
          confidence: decision.confidence,
          risk: decision.risk
        }));
        results.requestedReview.push(`Skill: ${candidate.slug}`);
      } else {
        results.rejected.push(`Skill: ${candidate.slug} (${decision.reason})`);
      }
    } catch (error) {
      process.stderr.write(`Warning: Failed to process skill candidate ${candidate.slug}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // 输出结果
  if (results.autoApplied.length > 0) {
    process.stdout.write(`\n🤖 Auto-applied ${results.autoApplied.length} learnings:\n`);
    for (const item of results.autoApplied) {
      process.stdout.write(`   ✅ ${item}\n`);
    }
  }

  if (results.requestedReview.length > 0) {
    process.stdout.write(`\n👀 Requesting review for ${results.requestedReview.length} candidates:\n`);
    for (const item of results.requestedReview) {
      process.stdout.write(`   ⏸️  ${item}\n`);
    }
    process.stdout.write(`\n   Run 'ome evolve review' to review pending candidates.\n`);
  }

  if (results.rejected.length > 0) {
    process.stdout.write(`\n❌ Rejected ${results.rejected.length} low-confidence candidates:\n`);
    for (const item of results.rejected) {
      process.stdout.write(`   ${item}\n`);
    }
  }
}

module.exports = {
  decideAction,
  autoDecideAndApply
};

export {};
