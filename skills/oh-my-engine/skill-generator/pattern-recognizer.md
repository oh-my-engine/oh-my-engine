---
name: pattern-recognizer
version: 1.0.0
description: 识别可复用模式
category: skill-generator
---

# 模式识别器 (Pattern Recognizer)

从执行历史中识别可复用的模式，为 Skill 生成提供依据。

## 核心功能

### 1. 错误模式识别

#### 1.1 检测重复错误
```javascript
function identifyRepeatingErrors(history) {
  const errors = history
    .filter(exec => !exec.success)
    .map(exec => ({
      type: exec.error.type,
      message: exec.error.message,
      stack: exec.error.stack,
      context: exec.context,
    }));
  
  // 按错误类型分组
  const grouped = groupBy(errors, 'type');
  
  // 识别高频错误（≥ 3 次）
  return Object.entries(grouped)
    .filter(([type, errors]) => errors.length >= 3)
    .map(([type, errors]) => ({
      type,
      frequency: errors.length,
      examples: errors.slice(0, 3),
      pattern: extractErrorPattern(errors),
      suggestedFix: generateFixSuggestion(errors),
    }));
}
```

#### 1.2 提取错误模式
```javascript
function extractErrorPattern(errors) {
  // 找出共同特征
  const commonFeatures = findCommonFeatures(errors);
  
  return {
    trigger: commonFeatures.trigger,      // 触发条件
    symptom: commonFeatures.symptom,      // 错误症状
    rootCause: commonFeatures.rootCause,  // 根本原因
    solution: commonFeatures.solution,    // 解决方案
  };
}
```

### 2. 复用模式识别

#### 2.1 检测代码复用
```javascript
function identifyCodeReuse(history) {
  const codeBlocks = history.flatMap(exec => 
    exec.steps.map(step => ({
      code: step.code,
      context: step.context,
      file: step.file,
    }))
  );
  
  // 查找相似代码块
  const similar = findSimilarCodeBlocks(codeBlocks);
  
  // 过滤高频复用（≥ 3 处）
  return similar
    .filter(group => group.instances.length >= 3)
    .map(group => ({
      code: group.code,
      frequency: group.instances.length,
      locations: group.instances.map(i => i.file),
      abstraction: generateAbstraction(group),
    }));
}
```

#### 2.2 查找相似代码
```javascript
function findSimilarCodeBlocks(codeBlocks) {
  const groups = [];
  
  for (let i = 0; i < codeBlocks.length; i++) {
    const block = codeBlocks[i];
    const similar = codeBlocks
      .slice(i + 1)
      .filter(other => calculateSimilarity(block.code, other.code) > 0.8);
    
    if (similar.length > 0) {
      groups.push({
        code: block.code,
        instances: [block, ...similar],
      });
    }
  }
  
  return groups;
}

function calculateSimilarity(code1, code2) {
  // 使用 Levenshtein 距离计算相似度
  const distance = levenshteinDistance(code1, code2);
  const maxLength = Math.max(code1.length, code2.length);
  return 1 - (distance / maxLength);
}
```

### 3. 最佳实践识别

#### 3.1 检测成功模式
```javascript
function identifyBestPractices(history) {
  const successful = history.filter(exec => 
    exec.success && exec.userConfirmed
  );
  
  // 提取操作序列
  const sequences = successful.map(exec => ({
    steps: exec.steps.map(s => s.operation),
    duration: exec.duration,
    quality: exec.quality,
  }));
  
  // 识别高成功率序列（≥ 95%）
  const patterns = findCommonSequences(sequences);
  
  return patterns
    .filter(pattern => pattern.successRate >= 0.95)
    .map(pattern => ({
      sequence: pattern.sequence,
      successRate: pattern.successRate,
      avgDuration: pattern.avgDuration,
      avgQuality: pattern.avgQuality,
      recommendation: 'Fix as best practice',
    }));
}
```

#### 3.2 查找通用序列
```javascript
function findCommonSequences(sequences, minLength = 3) {
  const patterns = [];
  
  // 使用滑动窗口查找重复序列
  for (let length = minLength; length <= 10; length++) {
    const windows = sequences.flatMap(seq => 
      extractWindows(seq.steps, length)
    );
    
    const grouped = groupBy(windows, w => w.join('->'));
    
    Object.entries(grouped).forEach(([key, instances]) => {
      if (instances.length >= 5) {
        patterns.push({
          sequence: key.split('->'),
          frequency: instances.length,
          successRate: calculateSuccessRate(instances),
        });
      }
    });
  }
  
  return patterns;
}
```

### 4. 操作组合识别

#### 4.1 检测重复操作序列
```javascript
function identifyOperationCombinations(history) {
  const operations = history.flatMap(exec => exec.steps);
  
  // 查找重复的操作序列
  const sequences = findRepeatingSequences(operations);
  
  // 过滤高频序列（≥ 5 次）
  return sequences
    .filter(seq => seq.frequency >= 5)
    .map(seq => ({
      operations: seq.operations,
      frequency: seq.frequency,
      avgDuration: seq.avgDuration,
      suggestion: 'Combine into single skill',
    }));
}
```

#### 4.2 查找重复序列
```javascript
function findRepeatingSequences(operations, minLength = 3) {
  const sequences = [];
  
  for (let i = 0; i < operations.length - minLength; i++) {
    for (let length = minLength; length <= 10; length++) {
      const sequence = operations.slice(i, i + length);
      const matches = findMatches(operations, sequence);
      
      if (matches.length >= 5) {
        sequences.push({
          operations: sequence.map(op => op.type),
          frequency: matches.length,
          avgDuration: calculateAvgDuration(matches),
        });
      }
    }
  }
  
  return deduplicateSequences(sequences);
}
```

## 模式分类

### 1. 错误修复模式
```javascript
const errorFixPattern = {
  type: 'error-fix',
  trigger: {
    condition: 'error.type === "MasterGoTimeout"',
    frequency: '≥ 3 times',
  },
  solution: {
    type: 'retry-with-backoff',
    implementation: 'Add exponential backoff retry logic',
  },
  skillName: 'fix-mastergo-timeout',
  priority: 'high',
};
```

### 2. 工具提取模式
```javascript
const toolExtractionPattern = {
  type: 'tool-extraction',
  trigger: {
    condition: 'code similarity > 80%',
    frequency: '≥ 3 locations',
  },
  solution: {
    type: 'extract-function',
    implementation: 'Extract common code into utility function',
  },
  skillName: 'feishu-search-helper',
  priority: 'medium',
};
```

### 3. 最佳实践模式
```javascript
const bestPracticePattern = {
  type: 'best-practice',
  trigger: {
    condition: 'success rate ≥ 95%',
    frequency: '≥ 10 executions',
  },
  solution: {
    type: 'standardize-workflow',
    implementation: 'Fix successful workflow as standard',
  },
  skillName: 'ui-restore-best-practice',
  priority: 'low',
};
```

### 4. 操作组合模式
```javascript
const operationCombinationPattern = {
  type: 'operation-combination',
  trigger: {
    condition: 'sequence repeats',
    frequency: '≥ 5 times',
  },
  solution: {
    type: 'combine-operations',
    implementation: 'Package operations into single command',
  },
  skillName: 'quick-component',
  priority: 'medium',
};
```

## 模式评分

### 1. 计算模式价值
```javascript
function calculatePatternValue(pattern) {
  const weights = {
    frequency: 0.3,      // 出现频率
    impact: 0.4,         // 影响范围
    complexity: 0.2,     // 复杂度（越高越值得提取）
    stability: 0.1,      // 稳定性
  };
  
  return (
    pattern.frequency * weights.frequency +
    pattern.impact * weights.impact +
    pattern.complexity * weights.complexity +
    pattern.stability * weights.stability
  );
}
```

### 2. 优先级排序
```javascript
function prioritizePatterns(patterns) {
  return patterns
    .map(pattern => ({
      ...pattern,
      value: calculatePatternValue(pattern),
    }))
    .sort((a, b) => b.value - a.value);
}
```

## 模式报告

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31",
    "executions": 100
  },
  "patterns": {
    "errorFix": [
      {
        "type": "MasterGoTimeout",
        "frequency": 5,
        "pattern": {
          "trigger": "MasterGo API call",
          "symptom": "Request timeout after 30s",
          "rootCause": "Network latency or API overload",
          "solution": "Add retry with exponential backoff"
        },
        "suggestedSkill": "fix-mastergo-timeout",
        "priority": "high",
        "value": 8.5
      }
    ],
    "codeReuse": [
      {
        "code": "feishu search logic",
        "frequency": 4,
        "locations": ["workflow-1", "workflow-2", "workflow-3", "workflow-4"],
        "abstraction": "Extract as feishu-search-helper",
        "suggestedSkill": "feishu-search-helper",
        "priority": "medium",
        "value": 7.2
      }
    ],
    "bestPractices": [
      {
        "sequence": ["parse-url", "get-dsl", "apply-rules", "generate-code"],
        "successRate": 0.97,
        "frequency": 15,
        "suggestedSkill": "ui-restore-best-practice",
        "priority": "low",
        "value": 6.8
      }
    ],
    "operationCombinations": [
      {
        "operations": ["read-design", "generate-component", "write-file"],
        "frequency": 8,
        "avgDuration": "5s",
        "suggestedSkill": "quick-component",
        "priority": "medium",
        "value": 7.5
      }
    ]
  },
  "summary": {
    "totalPatterns": 15,
    "highPriority": 3,
    "mediumPriority": 7,
    "lowPriority": 5,
    "readyForSkillGeneration": 10
  }
}
```

## 使用示例

### 识别所有模式
```javascript
const history = loadExecutionHistory('ui-restore', 100);

const patterns = {
  errors: identifyRepeatingErrors(history),
  reuse: identifyCodeReuse(history),
  bestPractices: identifyBestPractices(history),
  combinations: identifyOperationCombinations(history),
};

const prioritized = prioritizePatterns(
  [...patterns.errors, ...patterns.reuse, ...patterns.bestPractices, ...patterns.combinations]
);
```

### 生成模式报告
```javascript
const report = generatePatternReport(patterns);
console.log(`Found ${report.summary.totalPatterns} patterns`);
console.log(`${report.summary.readyForSkillGeneration} ready for skill generation`);
```

---

**提示**：模式识别器会持续学习，发现越来越多的优化机会！
