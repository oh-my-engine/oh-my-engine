#!/usr/bin/env node

/**
 * Auto Skill Generator
 * 根据 bug-patterns 自动生成修复 Skill
 */

const fs = require('fs');
const path = require('path');

class SkillGenerator {
  constructor(skillsDir = path.join(process.env.HOME, '.claude/skills')) {
    this.skillsDir = skillsDir;
  }

  /**
   * 生成自动修复 Skill
   * @param {string} patternId - 模式 ID
   * @param {object} pattern - 模式对象
   */
  generateFixSkill(patternId, pattern) {
    const skillName = `fix-${patternId}`;
    const skillDir = path.join(this.skillsDir, skillName);

    // 创建 Skill 目录
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    // 生成 skill.md
    const skillMd = this.generateSkillMarkdown(patternId, pattern);
    fs.writeFileSync(path.join(skillDir, 'skill.md'), skillMd, 'utf8');

    console.log(`✅ Generated skill: ${skillName}`);
    console.log(`   Location: ${skillDir}`);

    return skillName;
  }

  /**
   * 生成 Skill Markdown 文档
   */
  generateSkillMarkdown(patternId, pattern) {
    return `---
name: fix-${patternId}
version: 1.0.0
description: 自动修复 ${pattern.name}
author: oh-my-engine (auto-generated)
tags: [auto-fix, ${pattern.category}, bug-pattern]
generated: true
---

# fix-${patternId}

自动检测并修复：${pattern.description}

**此 Skill 由 oh-my-engine 自动生成**（出现 ${pattern.occurrences} 次后触发）

## 使用方法

\`\`\`bash
# 扫描并修复当前项目
/fix-${patternId}

# 扫描指定目录
/fix-${patternId} src/

# 仅检测不修复
/fix-${patternId} --dry-run
\`\`\`

## 检测规则

**错误模式**：
\`\`\`
${pattern.detection.examples.join('\n')}
\`\`\`

**修复方案**：
${pattern.fix.description}

**示例**：
\`\`\`
修复前: ${pattern.detection.examples[0]}
修复后: ${this.generateFixExample(pattern)}
\`\`\`

## 执行流程

1. **扫描项目文件**
   - 文件类型：${pattern.detection.filePatterns.join(', ')}
   - 使用正则：\`${pattern.detection.regex}\`

2. **检测问题**
   - 匹配错误模式
   - 记录文件位置和行号

3. **生成修复方案**
   - 应用修复模板
   - 验证修复后代码语法

4. **应用修复**（非 dry-run 模式）
   - 备份原文件
   - 应用修复
   - 运行测试验证

5. **生成报告**
   - 修复的文件列表
   - 修复的问题数量
   - 测试结果

## 配置

### 项目配置（.oh-my-engine/config.json）

\`\`\`json
{
  "autoFix": {
    "${patternId}": {
      "enabled": true,
      "autoApply": false,
      "runTests": true,
      "backup": true
    }
  }
}
\`\`\`

## 输出示例

\`\`\`
🔍 扫描项目文件...
   找到 ${pattern.detection.filePatterns.length} 种文件类型

✅ 检测完成
   发现 3 个问题：
   - src/components/LoginButton.tsx:45
   - src/components/SubmitButton.tsx:89
   - src/pages/Login.tsx:120

🔧 应用修复...
   ✅ src/components/LoginButton.tsx
   ✅ src/components/SubmitButton.tsx
   ✅ src/pages/Login.tsx

🧪 运行测试...
   ✅ 所有测试通过

📊 修复统计：
   - 修复文件：3 个
   - 修复问题：3 个
   - 测试通过：✅
   - 执行时间：8.5s
\`\`\`

## 预防措施

### ESLint 规则

${pattern.prevention.eslintRule ? `
建议启用 ESLint 规则：\`${pattern.prevention.eslintRule.name}\`

\`\`\`json
{
  "rules": {
    "${pattern.prevention.eslintRule.name}": ["error", ${JSON.stringify(pattern.prevention.eslintRule.config, null, 2)}]
  }
}
\`\`\`
` : '暂无对应的 ESLint 规则'}

### 测试模板

测试模板位置：\`${pattern.prevention.testTemplate}\`

## 相关命令

- \`/oh-my-engine-bug\` - 分析和修复 Bug
- \`/oh-my-engine-memory\` - 查看 Bug 修复历史

---

**提示**：此 Skill 会持续学习和优化，修复成功率越高，自动化程度越高！
`;
  }

  /**
   * 生成修复示例
   */
  generateFixExample(pattern) {
    const example = pattern.detection.examples[0];
    // 简化实现：基于模板替换
    return example.replace(/\(\)/g, '');
  }

  /**
   * 生成 ESLint 配置
   */
  generateEslintConfig(patternId, pattern) {
    if (!pattern.prevention.eslintRule) {
      return null;
    }

    const configPath = '.oh-my-engine/eslint-rules.json';
    let config = {};

    // 读取现有配置
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // 添加新规则
    if (!config.rules) {
      config.rules = {};
    }

    config.rules[pattern.prevention.eslintRule.name] = [
      'error',
      pattern.prevention.eslintRule.config
    ];

    // 保存配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    console.log(`✅ Generated ESLint rule: ${pattern.prevention.eslintRule.name}`);
    console.log(`   Location: ${configPath}`);

    return configPath;
  }

  /**
   * 生成 Pre-commit Hook
   */
  generatePreCommitHook(patterns) {
    const hookPath = '.oh-my-engine/pre-commit-check.sh';

    const hookScript = `#!/bin/bash
# Auto-generated pre-commit hook by oh-my-engine
# Checks for common bug patterns before commit

echo "🔍 Running oh-my-engine bug pattern checks..."

PATTERNS_FILE=".oh-my-engine/bug-patterns.json"
MATCHER_SCRIPT=".oh-my-engine/pattern-matcher.js"

if [ ! -f "$PATTERNS_FILE" ] || [ ! -f "$MATCHER_SCRIPT" ]; then
  echo "⚠️  oh-my-engine not initialized, skipping checks"
  exit 0
fi

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(ts|tsx|js|jsx)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No code files to check"
  exit 0
fi

ISSUES_FOUND=0

# Check each staged file
for FILE in $STAGED_FILES; do
  RESULT=$(node "$MATCHER_SCRIPT" detect "$FILE" 2>/dev/null)

  if [ ! -z "$RESULT" ] && [ "$RESULT" != "[]" ]; then
    echo "❌ Found issues in $FILE"
    echo "$RESULT" | jq -r '.[] | "   - \\(.pattern.name) at line \\(.matches[0].line)"'
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  fi
done

if [ $ISSUES_FOUND -gt 0 ]; then
  echo ""
  echo "❌ Found $ISSUES_FOUND file(s) with bug patterns"
  echo "   Run '/oh-my-engine-bug' to fix these issues"
  echo "   Or use 'git commit --no-verify' to skip this check"
  exit 1
fi

echo "✅ All checks passed"
exit 0
`;

    fs.writeFileSync(hookPath, hookScript, 'utf8');
    fs.chmodSync(hookPath, '755');

    console.log(`✅ Generated pre-commit hook`);
    console.log(`   Location: ${hookPath}`);
    console.log(`   To enable: ln -s ../../${hookPath} .git/hooks/pre-commit`);

    return hookPath;
  }
}

// CLI 接口
if (require.main === module) {
  const generator = new SkillGenerator();
  const command = process.argv[2];

  switch (command) {
    case 'skill':
      const patternId = process.argv[3];
      if (!patternId) {
        console.error('Usage: node skill-generator.js skill <pattern-id>');
        process.exit(1);
      }

      // 读取 pattern
      const patternsData = JSON.parse(
        fs.readFileSync('.oh-my-engine/bug-patterns.json', 'utf8')
      );
      const pattern = patternsData.patterns[patternId];

      if (!pattern) {
        console.error(`Pattern not found: ${patternId}`);
        process.exit(1);
      }

      generator.generateFixSkill(patternId, pattern);
      break;

    case 'eslint':
      const eslintPatternId = process.argv[3];
      if (!eslintPatternId) {
        console.error('Usage: node skill-generator.js eslint <pattern-id>');
        process.exit(1);
      }

      const eslintPatternsData = JSON.parse(
        fs.readFileSync('.oh-my-engine/bug-patterns.json', 'utf8')
      );
      const eslintPattern = eslintPatternsData.patterns[eslintPatternId];

      if (!eslintPattern) {
        console.error(`Pattern not found: ${eslintPatternId}`);
        process.exit(1);
      }

      generator.generateEslintConfig(eslintPatternId, eslintPattern);
      break;

    case 'hook':
      const hookPatternsData = JSON.parse(
        fs.readFileSync('.oh-my-engine/bug-patterns.json', 'utf8')
      );
      generator.generatePreCommitHook(hookPatternsData.patterns);
      break;

    default:
      console.log('Usage: node skill-generator.js <command> [args]');
      console.log('Commands:');
      console.log('  skill <pattern-id>   - Generate auto-fix skill');
      console.log('  eslint <pattern-id>  - Generate ESLint config');
      console.log('  hook                 - Generate pre-commit hook');
  }
}

module.exports = SkillGenerator;
