---
name: evaluator
version: 1.0.0
description: 评估工作流执行效果
category: evolution
---

# 评估器 (Evaluator)

分析工作流执行历史，评估执行效果，识别优化机会。

## 核心功能

### 1. 加载执行历史
```javascript
function loadExecutionHistory(workflowName, limit = 100) {
  const historyDir = `${memoryDir}/executions/${workflowName}`;
  const files = fs.readdirSync(historyDir)
    .sort((a, b) => b.localeCompare(a)) // 按时间倒序
    .slice(0, limit);
  
  return files.map(file => {
    const content = fs.readFileSync(`${historyDir}/${file}`, 'utf-8');
    return JSON.parse(content);
  });
}
```

### 2. 计算评估指标

#### 2.1 规则通过率
```javascript
function calculateRulePassRate(history) {
  const total = history.reduce((sum, exec) => sum + exec.rules.total, 0);
  const passed = history.reduce((sum, exec) => sum + exec.rules.passed, 0);
  return (passed / total) * 100;
}

// 目标：≥ 95%
// 权重：40%
```

#### 2.2 执行效率
```javascript
function calculateEfficiency(history) {
  const avgTime = history.reduce((sum, exec) => sum + exec.duration, 0) / history.length;
  const baseline = history[0].duration; // 第一次执行作为基准
  return (baseline / avgTime) * 100;
}

// 目标：≥ 100%（不变慢）
// 权重：30%
```

#### 2.3 用户满意度
```javascript
function calculateSatisfaction(history) {
  const confirmed = history.filter(exec => exec.userConfirmed).length;
  return (confirmed / history.length) * 100;
}

// 目标：≥ 90%
// 权重：30%
```

### 3. 综合评分
```javascript
function calculateOverallScore(metrics) {
  const weights = {
    rulePassRate: 0.4,
    efficiency: 0.3,
    satisfaction: 0.3,
  };
  
  return (
    metrics.rulePassRate * weights.rulePassRate +
    metrics.efficiency * weights.efficiency +
    metrics.satisfaction * weights.satisfaction
  );
}

// 评分等级：
// A: ≥ 95
// B: 85-94
// C: 75-84
// D: 60-74
// F: < 60
```

## 评估报告

### 报告格式
```json
{
  "workflow": "ui-restore",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31",
    "executions": 50
  },
  "metrics": {
    "rulePassRate": {
      "value": 96.5,
      "target": 95,
      "status": "✅ 达标",
      "trend": "↑ +2.3%"
    },
    "efficiency": {
      "value": 108.2,
      "target": 100,
      "status": "✅ 达标",
      "trend": "↑ +8.2%"
    },
    "satisfaction": {
      "value": 92.0,
      "target": 90,
      "status": "✅ 达标",
      "trend": "↑ +4.5%"
    }
  },
  "overallScore": 96.1,
  "grade": "A",
  "improvements": [
    {
      "type": "efficiency",
      "description": "MasterGo 解析速度提升 15%",
      "impact": "high"
    },
    {
      "type": "accuracy",
      "description": "i18n 规则通过率提升 5%",
      "impact": "medium"
    }
  ],
  "issues": [
    {
      "type": "error",
      "description": "MasterGo 超时错误出现 3 次",
      "frequency": 3,
      "suggestion": "生成 fix-mastergo-timeout skill"
    }
  ]
}
```

## 趋势分析

### 1. 时间序列分析
```javascript
function analyzeTrend(history) {
  const timeSeriesData = history.map(exec => ({
    timestamp: exec.timestamp,
    duration: exec.duration,
    success: exec.success,
    rulePassRate: exec.rules.passed / exec.rules.total,
  }));
  
  // 计算移动平均
  const movingAverage = calculateMovingAverage(timeSeriesData, 7);
  
  // 检测趋势
  const trend = detectTrend(movingAverage);
  
  return {
    data: timeSeriesData,
    movingAverage,
    trend, // 'improving', 'stable', 'declining'
  };
}
```

### 2. 异常检测
```javascript
function detectAnomalies(history) {
  const durations = history.map(exec => exec.duration);
  const mean = durations.reduce((a, b) => a + b) / durations.length;
  const stdDev = Math.sqrt(
    durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length
  );
  
  // 3σ 原则：超过 3 个标准差视为异常
  const anomalies = history.filter(exec => {
    const zScore = Math.abs((exec.duration - mean) / stdDev);
    return zScore > 3;
  });
  
  return anomalies;
}
```

## 模式识别

### 1. 错误模式
```javascript
function identifyErrorPatterns(history) {
  const errors = history
    .filter(exec => !exec.success)
    .map(exec => exec.error);
  
  // 按错误类型分组
  const errorGroups = groupBy(errors, 'type');
  
  // 识别高频错误
  const frequentErrors = Object.entries(errorGroups)
    .filter(([type, errors]) => errors.length >= 3)
    .map(([type, errors]) => ({
      type,
      count: errors.length,
      examples: errors.slice(0, 3),
      suggestion: generateFixSuggestion(type),
    }));
  
  return frequentErrors;
}
```

### 2. 成功模式
```javascript
function identifySuccessPatterns(history) {
  const successful = history.filter(exec => exec.success && exec.userConfirmed);
  
  // 提取共同特征
  const patterns = extractCommonFeatures(successful);
  
  // 识别最佳实践
  const bestPractices = patterns
    .filter(pattern => pattern.successRate >= 0.95)
    .map(pattern => ({
      description: pattern.description,
      frequency: pattern.frequency,
      successRate: pattern.successRate,
      recommendation: 'Fix as best practice',
    }));
  
  return bestPractices;
}
```

### 3. 复用模式
```javascript
function identifyReusablePatterns(history) {
  const operations = history.flatMap(exec => exec.steps);
  
  // 识别重复操作序列
  const sequences = findRepeatingSequences(operations, minLength = 3);
  
  // 过滤高频序列
  const reusableSequences = sequences
    .filter(seq => seq.frequency >= 5)
    .map(seq => ({
      operations: seq.operations,
      frequency: seq.frequency,
      suggestion: 'Extract as skill',
    }));
  
  return reusableSequences;
}
```

## 优化建议

### 1. 生成建议
```javascript
function generateOptimizationSuggestions(evaluation) {
  const suggestions = [];
  
  // 规则通过率低
  if (evaluation.metrics.rulePassRate.value < 95) {
    suggestions.push({
      priority: 'high',
      type: 'rule',
      description: '规则通过率低于目标',
      action: '检查规则配置，调整规则优先级',
    });
  }
  
  // 执行效率低
  if (evaluation.metrics.efficiency.value < 100) {
    suggestions.push({
      priority: 'medium',
      type: 'performance',
      description: '执行效率下降',
      action: '分析性能瓶颈，优化慢速步骤',
    });
  }
  
  // 用户满意度低
  if (evaluation.metrics.satisfaction.value < 90) {
    suggestions.push({
      priority: 'high',
      type: 'ux',
      description: '用户满意度低于目标',
      action: '收集用户反馈，改进工作流体验',
    });
  }
  
  return suggestions;
}
```

### 2. Skill 生成建议
```javascript
function suggestSkillGeneration(patterns) {
  const suggestions = [];
  
  // 错误修复 Skill
  patterns.errors.forEach(error => {
    if (error.count >= 3) {
      suggestions.push({
        type: 'error-fix',
        name: `fix-${error.type}`,
        description: `自动修复 ${error.type} 错误`,
        priority: 'high',
      });
    }
  });
  
  // 工具提取 Skill
  patterns.reusable.forEach(seq => {
    if (seq.frequency >= 5) {
      suggestions.push({
        type: 'tool',
        name: `${seq.name}-helper`,
        description: `提取 ${seq.name} 为独立工具`,
        priority: 'medium',
      });
    }
  });
  
  // 最佳实践 Skill
  patterns.bestPractices.forEach(practice => {
    if (practice.successRate >= 0.95) {
      suggestions.push({
        type: 'best-practice',
        name: `${practice.name}-best-practice`,
        description: `固化 ${practice.name} 最佳实践`,
        priority: 'low',
      });
    }
  });
  
  return suggestions;
}
```

## 使用示例

### 评估单个工作流
```javascript
const history = loadExecutionHistory('ui-restore', 50);
const metrics = {
  rulePassRate: calculateRulePassRate(history),
  efficiency: calculateEfficiency(history),
  satisfaction: calculateSatisfaction(history),
};
const score = calculateOverallScore(metrics);
const report = generateReport('ui-restore', metrics, score);
```

### 识别优化机会
```javascript
const patterns = {
  errors: identifyErrorPatterns(history),
  success: identifySuccessPatterns(history),
  reusable: identifyReusablePatterns(history),
};
const suggestions = generateOptimizationSuggestions(evaluation);
const skillSuggestions = suggestSkillGeneration(patterns);
```

---

**提示**：评估器会持续分析执行历史，自动发现优化机会！
