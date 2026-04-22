---
name: optimizer
version: 1.0.0
description: 生成工作流优化方案
category: evolution
---

# 优化器 (Optimizer)

基于评估结果，生成具体的优化方案。

## 核心功能

### 1. 分析优化机会
```javascript
function analyzeOptimizationOpportunities(evaluation) {
  const opportunities = [];
  
  // 性能优化
  if (evaluation.metrics.efficiency.value < 100) {
    opportunities.push(...identifyPerformanceBottlenecks(evaluation));
  }
  
  // 准确性优化
  if (evaluation.metrics.rulePassRate.value < 95) {
    opportunities.push(...identifyAccuracyIssues(evaluation));
  }
  
  // 用户体验优化
  if (evaluation.metrics.satisfaction.value < 90) {
    opportunities.push(...identifyUXIssues(evaluation));
  }
  
  return opportunities;
}
```

### 2. 生成优化方案

#### 2.1 性能优化
```javascript
function generatePerformanceOptimizations(bottlenecks) {
  return bottlenecks.map(bottleneck => {
    switch (bottleneck.type) {
      case 'slow-step':
        return {
          type: 'performance',
          target: bottleneck.step,
          strategy: 'parallel-execution',
          description: `并行执行 ${bottleneck.step}`,
          expectedImprovement: '30-50%',
          implementation: {
            before: bottleneck.currentCode,
            after: parallelizeCode(bottleneck.currentCode),
          },
        };
      
      case 'repeated-operation':
        return {
          type: 'performance',
          target: bottleneck.operation,
          strategy: 'caching',
          description: `缓存 ${bottleneck.operation} 结果`,
          expectedImprovement: '50-70%',
          implementation: {
            before: bottleneck.currentCode,
            after: addCaching(bottleneck.currentCode),
          },
        };
      
      case 'network-timeout':
        return {
          type: 'performance',
          target: bottleneck.request,
          strategy: 'retry-with-backoff',
          description: `添加重试机制到 ${bottleneck.request}`,
          expectedImprovement: '80-90% 成功率',
          implementation: {
            before: bottleneck.currentCode,
            after: addRetryLogic(bottleneck.currentCode),
          },
        };
    }
  });
}
```

#### 2.2 准确性优化
```javascript
function generateAccuracyOptimizations(issues) {
  return issues.map(issue => {
    switch (issue.type) {
      case 'rule-conflict':
        return {
          type: 'accuracy',
          target: issue.rules,
          strategy: 'priority-adjustment',
          description: `调整规则优先级：${issue.rules.join(', ')}`,
          expectedImprovement: '10-15% 通过率',
          implementation: {
            before: issue.currentPriority,
            after: suggestNewPriority(issue),
          },
        };
      
      case 'validation-failure':
        return {
          type: 'accuracy',
          target: issue.validator,
          strategy: 'improve-validation',
          description: `改进验证逻辑：${issue.validator}`,
          expectedImprovement: '20-30% 通过率',
          implementation: {
            before: issue.currentLogic,
            after: improveValidationLogic(issue),
          },
        };
    }
  });
}
```

#### 2.3 用户体验优化
```javascript
function generateUXOptimizations(issues) {
  return issues.map(issue => {
    switch (issue.type) {
      case 'unclear-error':
        return {
          type: 'ux',
          target: issue.error,
          strategy: 'improve-error-message',
          description: `改进错误提示：${issue.error}`,
          expectedImprovement: '提升用户理解度',
          implementation: {
            before: issue.currentMessage,
            after: generateBetterErrorMessage(issue),
          },
        };
      
      case 'missing-feedback':
        return {
          type: 'ux',
          target: issue.step,
          strategy: 'add-progress-indicator',
          description: `添加进度提示到 ${issue.step}`,
          expectedImprovement: '提升用户满意度',
          implementation: {
            before: issue.currentCode,
            after: addProgressIndicator(issue),
          },
        };
    }
  });
}
```

### 3. 优先级排序
```javascript
function prioritizeOptimizations(optimizations) {
  // 计算优先级分数
  const scored = optimizations.map(opt => ({
    ...opt,
    score: calculatePriorityScore(opt),
  }));
  
  // 按分数排序
  return scored.sort((a, b) => b.score - a.score);
}

function calculatePriorityScore(optimization) {
  const weights = {
    impact: 0.4,      // 影响范围
    effort: 0.3,      // 实施难度（越低越好）
    urgency: 0.3,     // 紧急程度
  };
  
  return (
    optimization.impact * weights.impact +
    (1 - optimization.effort) * weights.effort +
    optimization.urgency * weights.urgency
  );
}
```

## 优化策略

### 1. 并行化
```javascript
function parallelizeCode(code) {
  // 识别可并行的操作
  const operations = parseOperations(code);
  const independent = findIndependentOperations(operations);
  
  // 生成并行代码
  return `
    // 并行执行独立操作
    const results = await Promise.all([
      ${independent.map(op => op.code).join(',\n      ')}
    ]);
  `;
}
```

### 2. 缓存
```javascript
function addCaching(code) {
  return `
    // 添加缓存层
    const cacheKey = generateCacheKey(params);
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    ${code}
    
    cache.set(cacheKey, result, { ttl: 300 }); // 5 分钟
    return result;
  `;
}
```

### 3. 重试机制
```javascript
function addRetryLogic(code) {
  return `
    // 添加指数退避重试
    async function withRetry(fn, maxRetries = 3) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
        }
      }
    }
    
    ${code}
  `;
}
```

### 4. 规则优先级调整
```javascript
function suggestNewPriority(issue) {
  // 分析规则冲突
  const conflicts = analyzeRuleConflicts(issue.rules);
  
  // 基于历史数据推荐优先级
  const recommendations = conflicts.map(conflict => {
    const history = getRuleHistory(conflict.rules);
    const successRate = calculateSuccessRate(history);
    
    return {
      rule: conflict.rule,
      currentPriority: conflict.currentPriority,
      suggestedPriority: optimizePriority(successRate),
      reason: explainPriorityChange(successRate),
    };
  });
  
  return recommendations;
}
```

## 优化方案格式

```json
{
  "workflow": "ui-restore",
  "optimizations": [
    {
      "id": "opt-001",
      "type": "performance",
      "priority": "high",
      "target": "Step 2: 获取设计数据",
      "strategy": "parallel-execution",
      "description": "并行获取 DSL 和下载资源",
      "expectedImprovement": {
        "metric": "execution_time",
        "current": "12s",
        "expected": "8s",
        "improvement": "33%"
      },
      "implementation": {
        "before": "await getDSL(); await downloadAssets();",
        "after": "await Promise.all([getDSL(), downloadAssets()]);"
      },
      "effort": "low",
      "risk": "low",
      "score": 8.5
    },
    {
      "id": "opt-002",
      "type": "accuracy",
      "priority": "medium",
      "target": "i18n 规则验证",
      "strategy": "improve-validation",
      "description": "改进 i18n 文本检测逻辑",
      "expectedImprovement": {
        "metric": "rule_pass_rate",
        "current": "92%",
        "expected": "97%",
        "improvement": "5%"
      },
      "implementation": {
        "before": "检测所有中文字符",
        "after": "排除注释和日志中的中文"
      },
      "effort": "medium",
      "risk": "low",
      "score": 7.2
    }
  ],
  "summary": {
    "total": 5,
    "high_priority": 2,
    "medium_priority": 2,
    "low_priority": 1,
    "estimated_improvement": {
      "execution_time": "40%",
      "rule_pass_rate": "8%",
      "user_satisfaction": "15%"
    }
  }
}
```

## A/B 测试

### 1. 设计实验
```javascript
function designABTest(optimization) {
  return {
    name: `test-${optimization.id}`,
    hypothesis: optimization.description,
    variants: {
      control: {
        name: 'Current',
        implementation: optimization.implementation.before,
      },
      treatment: {
        name: 'Optimized',
        implementation: optimization.implementation.after,
      },
    },
    metrics: [
      'execution_time',
      'rule_pass_rate',
      'user_satisfaction',
    ],
    sampleSize: 20, // 每个变体 20 次执行
    successCriteria: {
      metric: optimization.expectedImprovement.metric,
      threshold: optimization.expectedImprovement.improvement,
    },
  };
}
```

### 2. 运行实验
```javascript
function runABTest(test) {
  const results = {
    control: [],
    treatment: [],
  };
  
  // 随机分配执行到不同变体
  for (let i = 0; i < test.sampleSize * 2; i++) {
    const variant = Math.random() < 0.5 ? 'control' : 'treatment';
    const result = executeWorkflow(test.variants[variant].implementation);
    results[variant].push(result);
  }
  
  // 分析结果
  return analyzeABTestResults(results, test.successCriteria);
}
```

## 使用示例

### 生成优化方案
```javascript
const evaluation = evaluateWorkflow('ui-restore');
const opportunities = analyzeOptimizationOpportunities(evaluation);
const optimizations = generateOptimizations(opportunities);
const prioritized = prioritizeOptimizations(optimizations);
```

### 应用优化
```javascript
const topOptimizations = prioritized.slice(0, 3);
for (const opt of topOptimizations) {
  const test = designABTest(opt);
  const result = runABTest(test);
  if (result.success) {
    applyOptimization(opt);
  }
}
```

---

**提示**：优化器会基于数据生成可验证的优化方案！
