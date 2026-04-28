const fs = require('node:fs');
const path = require('node:path');
const { engineDirectory } = require('../../../core/paths');
const { trackEffectiveness } = require('./effectiveness-tracker');

type MemoryRecord = Record<string, any>;

function loadAdoptedLearnings(projectRoot: string): MemoryRecord[] {
  const adoptedDir = path.join(engineDirectory(projectRoot), 'memory', 'learnings', 'adopted');

  if (!fs.existsSync(adoptedDir)) {
    return [];
  }

  const files = fs.readdirSync(adoptedDir).filter((f: string) => f.endsWith('.json'));
  const learnings: MemoryRecord[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(adoptedDir, file), 'utf8');
      const learning = JSON.parse(content);
      learnings.push(learning);
    } catch (error) {
      // Skip invalid files
    }
  }

  return learnings;
}

function loadAdoptedSkills(projectRoot: string): MemoryRecord[] {
  const generatedDir = path.join(engineDirectory(projectRoot), 'generated-skills');

  if (!fs.existsSync(generatedDir)) {
    return [];
  }

  const files = fs.readdirSync(generatedDir).filter((f: string) => f.endsWith('.json'));
  const skills: MemoryRecord[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(generatedDir, file), 'utf8');
      const skill = JSON.parse(content);
      skills.push(skill);
    } catch (error) {
      // Skip invalid files
    }
  }

  return skills;
}

function updateAdoptedLearningRecord(
  projectRoot: string,
  slug: string,
  updater: (current: MemoryRecord) => MemoryRecord
): void {
  const filePath = path.join(
    engineDirectory(projectRoot),
    'memory',
    'learnings',
    'adopted',
    `${slug}.json`
  );

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const current = JSON.parse(content);
  const updated = updater(current);

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
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
        // 移除规则文件
        const rulePath = path.join(
          engineDirectory(projectRoot),
          'rules',
          'learned',
          `learned-${learning.slug}.md`
        );

        if (fs.existsSync(rulePath)) {
          fs.unlinkSync(rulePath);
          toRemove.rules.push(learning.slug);
        }

        // 更新学习记录状态
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
