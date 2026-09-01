const { trackEffectiveness } = require('./effectiveness-tracker');
const {
  listAdoptedLearningRecords,
  listGeneratedSkillArtifacts,
  updateAdoptedLearningRecord
} = require('./memory-store');

type MemoryRecord = Record<string, any>;

function loadAdoptedLearnings(projectRoot: string): MemoryRecord[] {
  return listAdoptedLearningRecords(projectRoot);
}

function loadAdoptedSkills(projectRoot: string): MemoryRecord[] {
  return listGeneratedSkillArtifacts(projectRoot);
}

export function autoCleanupIneffective(projectRoot: string): void {
  const adoptedLearnings = loadAdoptedLearnings(projectRoot);
  const adoptedSkills = loadAdoptedSkills(projectRoot);

  const toRemove = {
    rules: [] as string[],
    skills: [] as string[]
  };

  // 检查每个已采纳的学习
  for (const learning of adoptedLearnings) {
    // 跳过已废弃的
    if (learning.status === 'deprecated') continue;

    try {
      const metrics = trackEffectiveness(projectRoot, learning.slug);

      // 如果有足够的数据（至少 10 次执行）且效果不佳
      if (metrics.executionsAfter >= 10 && metrics.status === 'harmful') {
        toRemove.rules.push(learning.slug);
        updateAdoptedLearningRecord(projectRoot, learning.slug, (current: MemoryRecord) => ({
          ...current,
          status: 'deprecated',
          deprecatedAt: new Date().toISOString(),
          deprecationReason: `Harmful: error rate increased by ${(metrics.improvement * -100).toFixed(1)}%`
        }));
      }
    } catch (error) {
      // Skip if tracking fails
    }
  }

  // 检查每个已采纳的技能
  for (const skill of adoptedSkills) {
    // 跳过已废弃的
    if (skill.status === 'deprecated') continue;

    // 技能的效果跟踪逻辑类似，但这里简化处理
    // 实际应用中可以根据技能的使用频率和成功率来判断
  }

  // 输出结果
  if (toRemove.rules.length > 0 || toRemove.skills.length > 0) {
    process.stdout.write(`\n🧹 Auto-cleanup removed ${toRemove.rules.length + toRemove.skills.length} ineffective learnings:\n`);
    for (const rule of toRemove.rules) {
      process.stdout.write(`   ❌ Rule: ${rule}\n`);
    }
    for (const skill of toRemove.skills) {
      process.stdout.write(`   ❌ Skill: ${skill}\n`);
    }
  }
}

module.exports = {
  autoCleanupIneffective
};

export {};
