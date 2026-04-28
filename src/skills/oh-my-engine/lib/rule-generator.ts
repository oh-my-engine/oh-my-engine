const fs = require('node:fs');
const path = require('node:path');
const { engineDirectory } = require('../../../core/paths');

type MemoryRecord = Record<string, any>;

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildBestPractices(candidate: MemoryRecord): string {
  const practices: string[] = [];
  const category = candidate.category || '';

  if (category === 'code-pattern') {
    practices.push('- 遵循已验证的代码模式');
    practices.push('- 保持代码一致性');
    practices.push('- 参考证据中的成功案例');
  } else if (category === 'workflow-optimization') {
    practices.push('- 优化工作流程');
    practices.push('- 减少重复操作');
    practices.push('- 提高开发效率');
  } else if (category === 'error-prevention') {
    practices.push('- 预防常见错误');
    practices.push('- 添加必要的验证');
    practices.push('- 提供清晰的错误信息');
  } else {
    practices.push('- 遵循项目规范');
    practices.push('- 保持代码质量');
    practices.push('- 参考历史成功案例');
  }

  return practices.join('\n');
}

function buildVerificationChecklist(candidate: MemoryRecord): string {
  const checklist: string[] = [
    '- [ ] 代码符合规则描述',
    '- [ ] 通过所有测试',
    '- [ ] 代码审查通过'
  ];

  const workflow = candidate.workflow || '';
  if (workflow === 'bug') {
    checklist.push('- [ ] Bug 已修复且不会复现');
  } else if (workflow === 'ui') {
    checklist.push('- [ ] UI 符合设计规范');
  } else if (workflow === 'api') {
    checklist.push('- [ ] API 接口正常工作');
  }

  return checklist.join('\n');
}

export function generateRuleFromLearning(
  projectRoot: string,
  candidate: MemoryRecord
): string {
  const ruleSlug = `learned-${candidate.slug}`;
  const rulesLearnedDir = path.join(engineDirectory(projectRoot), 'rules', 'learned');
  const rulePath = path.join(rulesLearnedDir, `${ruleSlug}.md`);

  const appliesTo = Array.isArray(candidate.appliesTo) ? candidate.appliesTo : [];
  const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];

  const ruleContent = `---
name: ${ruleSlug}
category: ${candidate.category || 'general'}
workflow: ${candidate.workflow || 'all'}
phase: ${candidate.phase || 'all'}
reusability: ${candidate.reusability || 0.5}
evidenceCount: ${candidate.evidenceCount || 0}
generatedAt: ${new Date().toISOString()}
source: auto-evolution
---

# ${candidate.title || ruleSlug}

## 适用场景

${appliesTo.length > 0 ? appliesTo.map((w: string) => `- ${w} workflow`).join('\n') : '- 所有 workflows'}

## 规则描述

${candidate.summary || '基于多次成功执行提取的最佳实践'}

## 最佳实践

${buildBestPractices(candidate)}

## 验证清单

${buildVerificationChecklist(candidate)}

## 证据

本规则基于 ${candidate.evidenceCount || 0} 次成功执行提取：

${evidence.map((e: MemoryRecord, i: number) => `${i + 1}. ${e.timestamp || 'unknown'} - ${e.workflow || 'unknown'}/${e.phase || 'unknown'}`).join('\n')}

## 自动生成

此规则由 Oh My Engine 自主进化系统自动生成。如果发现问题，请运行 \`ome evolve deprecate ${ruleSlug}\` 来废弃此规则。
`;

  ensureDirectory(rulesLearnedDir);
  fs.writeFileSync(rulePath, ruleContent, 'utf8');

  return rulePath;
}

module.exports = {
  generateRuleFromLearning
};

export {};
