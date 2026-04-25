/**
 * Bug Pattern Matcher
 * 用于识别和匹配代码中的常见错误模式
 */

const fs = require('fs');
const path = require('path');

class PatternMatcher {
  constructor(patternsPath = '.oh-my-engine/bug-patterns.json') {
    this.patternsPath = patternsPath;
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    try {
      const data = fs.readFileSync(this.patternsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load patterns:', error.message);
      return { patterns: {}, statistics: {} };
    }
  }

  savePatterns() {
    try {
      this.patterns.statistics.lastUpdated = new Date().toISOString();
      fs.writeFileSync(
        this.patternsPath,
        JSON.stringify(this.patterns, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save patterns:', error.message);
    }
  }

  /**
   * 检测代码中的错误模式
   * @param {string} code - 要检测的代码
   * @param {string} filePath - 文件路径
   * @returns {Array} 匹配的模式列表
   */
  detectPatterns(code, filePath) {
    const matches = [];

    for (const [patternId, pattern] of Object.entries(this.patterns.patterns)) {
      // 检查文件类型是否匹配
      if (!this.matchesFilePattern(filePath, pattern.detection.filePatterns)) {
        continue;
      }

      // 使用正则表达式检测
      const regex = new RegExp(pattern.detection.regex, 'gm');
      const codeMatches = [...code.matchAll(regex)];

      if (codeMatches.length > 0) {
        matches.push({
          patternId,
          pattern,
          matches: codeMatches.map(m => ({
            text: m[0],
            index: m.index,
            line: this.getLineNumber(code, m.index)
          }))
        });
      }
    }

    return matches;
  }

  /**
   * 记录错误模式出现
   * @param {string} patternId - 模式 ID
   * @param {string} filePath - 文件路径
   */
  recordOccurrence(patternId, filePath) {
    const pattern = this.patterns.patterns[patternId];
    if (!pattern) return;

    pattern.occurrences++;
    pattern.lastSeen = new Date().toISOString();

    if (!pattern.files.includes(filePath)) {
      pattern.files.push(filePath);
    }

    this.patterns.statistics.totalOccurrences++;
    this.savePatterns();

    // 检查是否需要触发沉淀
    return this.checkThresholds(patternId, pattern);
  }

  /**
   * 检查是否达到沉淀阈值
   * @param {string} patternId - 模式 ID
   * @param {object} pattern - 模式对象
   * @returns {object} 需要执行的沉淀操作
   */
  checkThresholds(patternId, pattern) {
    const actions = {
      generateSkill: false,
      generateEslintRule: false,
      generatePreCommitHook: false
    };

    const { occurrences, thresholds, skillGenerated } = pattern;

    // 生成 Skill（3 次）
    if (occurrences >= thresholds.generateSkill && !skillGenerated) {
      actions.generateSkill = true;
      pattern.skillGenerated = true;
      this.patterns.statistics.skillsGenerated++;
    }

    // 生成 ESLint 规则（5 次）
    if (occurrences >= thresholds.generateEslintRule && !pattern.eslintRuleGenerated) {
      actions.generateEslintRule = true;
      pattern.eslintRuleGenerated = true;
      this.patterns.statistics.eslintRulesGenerated++;
    }

    // 生成 Pre-commit Hook（10 次）
    if (occurrences >= thresholds.generatePreCommitHook && !pattern.preCommitHookGenerated) {
      actions.generatePreCommitHook = true;
      pattern.preCommitHookGenerated = true;
      this.patterns.statistics.preCommitHooksGenerated++;
    }

    if (Object.values(actions).some(v => v)) {
      this.savePatterns();
    }

    return actions;
  }

  /**
   * 查找相似问题
   * @param {string} patternId - 模式 ID
   * @param {string} currentFile - 当前文件路径
   * @returns {Array} 相似问题列表
   */
  async findSimilarIssues(patternId, currentFile) {
    const pattern = this.patterns.patterns[patternId];
    if (!pattern) return [];

    const similarIssues = [];
    const { filePatterns } = pattern.detection;

    // 这里应该扫描项目中的所有匹配文件
    // 简化实现：返回已记录的文件
    for (const file of pattern.files) {
      if (file !== currentFile) {
        similarIssues.push({
          file,
          pattern: patternId,
          description: pattern.description
        });
      }
    }

    return similarIssues;
  }

  /**
   * 生成修复建议
   * @param {string} patternId - 模式 ID
   * @param {string} matchedCode - 匹配的代码
   * @returns {object} 修复建议
   */
  generateFixSuggestion(patternId, matchedCode) {
    const pattern = this.patterns.patterns[patternId];
    if (!pattern) return null;

    return {
      original: matchedCode,
      fixed: this.applyFix(matchedCode, pattern.fix),
      description: pattern.fix.description,
      autoFixAvailable: pattern.autoFixAvailable
    };
  }

  /**
   * 应用修复模式
   * @param {string} code - 原始代码
   * @param {object} fix - 修复配置
   * @returns {string} 修复后的代码
   */
  applyFix(code, fix) {
    // 简化实现：基于模式替换
    // 实际应该使用 AST 进行更精确的替换
    const regex = new RegExp(fix.pattern.replace(/\{(\w+)\}/g, '(.+?)'), 'g');
    return code.replace(regex, fix.replacement);
  }

  /**
   * 获取模式统计信息
   * @returns {object} 统计信息
   */
  getStatistics() {
    return {
      ...this.patterns.statistics,
      topPatterns: this.getTopPatterns(5)
    };
  }

  /**
   * 获取出现最多的模式
   * @param {number} limit - 返回数量
   * @returns {Array} 模式列表
   */
  getTopPatterns(limit = 5) {
    return Object.entries(this.patterns.patterns)
      .sort((a, b) => b[1].occurrences - a[1].occurrences)
      .slice(0, limit)
      .map(([id, pattern]) => ({
        id,
        name: pattern.name,
        occurrences: pattern.occurrences,
        severity: pattern.severity
      }));
  }

  // 辅助方法
  matchesFilePattern(filePath, patterns) {
    return patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(filePath);
    });
  }

  getLineNumber(code, index) {
    return code.substring(0, index).split('\n').length;
  }
}

// CLI 接口
if (require.main === module) {
  const matcher = new PatternMatcher();
  const command = process.argv[2];

  switch (command) {
    case 'detect':
      const filePath = process.argv[3];
      if (!filePath) {
        console.error('Usage: node pattern-matcher.js detect <file-path>');
        process.exit(1);
      }
      const code = fs.readFileSync(filePath, 'utf8');
      const matches = matcher.detectPatterns(code, filePath);
      console.log(JSON.stringify(matches, null, 2));
      break;

    case 'stats':
      console.log(JSON.stringify(matcher.getStatistics(), null, 2));
      break;

    case 'record':
      const patternId = process.argv[3];
      const file = process.argv[4];
      if (!patternId || !file) {
        console.error('Usage: node pattern-matcher.js record <pattern-id> <file-path>');
        process.exit(1);
      }
      const actions = matcher.recordOccurrence(patternId, file);
      console.log(JSON.stringify(actions, null, 2));
      break;

    default:
      console.log('Usage: node pattern-matcher.js <command> [args]');
      console.log('Commands:');
      console.log('  detect <file-path>           - Detect patterns in a file');
      console.log('  stats                        - Show statistics');
      console.log('  record <pattern-id> <file>   - Record pattern occurrence');
  }
}

module.exports = PatternMatcher;
