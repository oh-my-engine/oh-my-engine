---
name: applier
version: 1.0.0
description: 应用优化方案到工作流
category: evolution
---

# 应用器 (Applier)

将优化方案应用到工作流，并验证效果。

## 核心功能

### 1. 应用优化
```javascript
async function applyOptimization(optimization) {
  // 1. 备份当前版本
  const backup = await backupCurrentVersion(optimization.target);
  
  try {
    // 2. 应用优化
    await applyChanges(optimization);
    
    // 3. 验证优化
    const validation = await validateOptimization(optimization);
    
    if (validation.success) {
      // 4. 保存新版本
      await saveNewVersion(optimization);
      
      // 5. 更新记忆
      await updateMemory(optimization, validation);
      
      return { success: true, validation };
    } else {
      // 回滚
      await rollback(backup);
      return { success: false, reason: validation.error };
    }
  } catch (error) {
    // 出错时回滚
    await rollback(backup);
    throw error;
  }
}
```

### 2. 备份机制
```javascript
function backupCurrentVersion(target) {
  const timestamp = Date.now();
  const backupDir = `${memoryDir}/backups/${timestamp}`;
  
  // 备份相关文件
  const files = identifyAffectedFiles(target);
  files.forEach(file => {
    fs.copyFileSync(file, `${backupDir}/${path.basename(file)}`);
  });
  
  return {
    timestamp,
    dir: backupDir,
    files,
  };
}
```

### 3. 应用变更
```javascript
async function applyChanges(optimization) {
  switch (optimization.type) {
    case 'performance':
      return await applyPerformanceOptimization(optimization);
    
    case 'accuracy':
      return await applyAccuracyOptimization(optimization);
    
    case 'ux':
      return await applyUXOptimization(optimization);
  }
}

async function applyPerformanceOptimization(opt) {
  const file = findTargetFile(opt.target);
  const content = fs.readFileSync(file, 'utf-8');
  
  // 替换代码
  const newContent = content.replace(
    opt.implementation.before,
    opt.implementation.after
  );
  
  fs.writeFileSync(file, newContent);
}
```

### 4. 验证优化
```javascript
async function validateOptimization(optimization) {
  // 1. 语法检查
  const syntaxCheck = await checkSyntax(optimization.target);
  if (!syntaxCheck.valid) {
    return { success: false, error: 'Syntax error', details: syntaxCheck };
  }
  
  // 2. 运行测试
  const testResult = await runTests(optimization.target);
  if (!testResult.passed) {
    return { success: false, error: 'Tests failed', details: testResult };
  }
  
  // 3. 性能测试
  const perfResult = await runPerformanceTest(optimization);
  if (!perfResult.improved) {
    return { success: false, error: 'No improvement', details: perfResult };
  }
  
  // 4. A/B 测试
  const abResult = await runABTest(optimization);
  if (!abResult.significant) {
    return { success: false, error: 'Not significant', details: abResult };
  }
  
  return {
    success: true,
    syntaxCheck,
    testResult,
    perfResult,
    abResult,
  };
}
```

### 5. 回滚机制
```javascript
async function rollback(backup) {
  // 恢复备份文件
  backup.files.forEach(file => {
    const backupFile = `${backup.dir}/${path.basename(file)}`;
    fs.copyFileSync(backupFile, file);
  });
  
  // 记录回滚
  await logRollback(backup);
}
```

## 渐进式应用

### 1. 金丝雀发布
```javascript
async function canaryDeploy(optimization) {
  // 1. 应用到 10% 的执行
  const canaryResult = await applyToPercentage(optimization, 0.1);
  
  if (canaryResult.success) {
    // 2. 扩展到 50%
    const halfResult = await applyToPercentage(optimization, 0.5);
    
    if (halfResult.success) {
      // 3. 全量发布
      return await applyToPercentage(optimization, 1.0);
    } else {
      await rollback(canaryResult.backup);
      return { success: false, stage: 'half' };
    }
  } else {
    await rollback(canaryResult.backup);
    return { success: false, stage: 'canary' };
  }
}
```

### 2. 特性开关
```javascript
function enableFeatureFlag(optimization) {
  const config = loadConfig();
  config.features[optimization.id] = {
    enabled: true,
    rollout: 0.1, // 10% 流量
    startTime: Date.now(),
  };
  saveConfig(config);
}

function increaseRollout(optimizationId, percentage) {
  const config = loadConfig();
  config.features[optimizationId].rollout = percentage;
  saveConfig(config);
}
```

## 监控和告警

### 1. 实时监控
```javascript
async function monitorOptimization(optimization) {
  const metrics = {
    executionTime: [],
    successRate: [],
    errorRate: [],
  };
  
  // 持续监控 24 小时
  const duration = 24 * 60 * 60 * 1000;
  const interval = 5 * 60 * 1000; // 每 5 分钟采样
  
  const startTime = Date.now();
  while (Date.now() - startTime < duration) {
    const sample = await collectMetrics(optimization);
    metrics.executionTime.push(sample.executionTime);
    metrics.successRate.push(sample.successRate);
    metrics.errorRate.push(sample.errorRate);
    
    // 检查异常
    if (detectAnomaly(metrics)) {
      await alert('Optimization anomaly detected', optimization);
      await rollback(optimization.backup);
      break;
    }
    
    await sleep(interval);
  }
  
  return metrics;
}
```

### 2. 告警机制
```javascript
async function alert(message, optimization) {
  // 记录告警
  await logAlert({
    timestamp: Date.now(),
    message,
    optimization: optimization.id,
    severity: 'high',
  });
  
  // 通知用户
  console.log(`⚠️  ${message}`);
  console.log(`Optimization: ${optimization.id}`);
  console.log(`Rolling back...`);
}
```

## 效果评估

### 1. 前后对比
```javascript
function compareBeforeAfter(optimization, validation) {
  const before = optimization.expectedImprovement.current;
  const after = validation.perfResult.actual;
  const expected = optimization.expectedImprovement.expected;
  
  return {
    metric: optimization.expectedImprovement.metric,
    before,
    after,
    expected,
    improvement: calculateImprovement(before, after),
    metExpectation: after >= expected,
  };
}
```

### 2. 长期跟踪
```javascript
async function trackLongTerm(optimization) {
  const trackingPeriod = 30 * 24 * 60 * 60 * 1000; // 30 天
  const samples = [];
  
  const startTime = Date.now();
  while (Date.now() - startTime < trackingPeriod) {
    const sample = await collectMetrics(optimization);
    samples.push(sample);
    
    await sleep(24 * 60 * 60 * 1000); // 每天采样
  }
  
  return {
    optimization: optimization.id,
    period: '30 days',
    samples,
    avgImprovement: calculateAvgImprovement(samples),
    stability: calculateStability(samples),
  };
}
```

## 应用报告

```json
{
  "optimization": "opt-001",
  "appliedAt": "2024-01-15T10:30:00Z",
  "status": "success",
  "validation": {
    "syntaxCheck": { "valid": true },
    "testResult": { "passed": true, "coverage": "95%" },
    "perfResult": {
      "before": "12s",
      "after": "8s",
      "improvement": "33%",
      "metExpectation": true
    },
    "abResult": {
      "significant": true,
      "pValue": 0.001,
      "confidenceLevel": "99%"
    }
  },
  "rollout": {
    "strategy": "canary",
    "stages": [
      { "percentage": 10, "status": "success", "duration": "2h" },
      { "percentage": 50, "status": "success", "duration": "6h" },
      { "percentage": 100, "status": "success", "duration": "16h" }
    ]
  },
  "monitoring": {
    "duration": "24h",
    "samples": 288,
    "anomalies": 0,
    "avgExecutionTime": "8.2s",
    "successRate": "98.5%"
  },
  "longTermTracking": {
    "period": "30 days",
    "avgImprovement": "32%",
    "stability": "high"
  }
}
```

## 自动回滚条件

### 1. 性能退化
```javascript
function shouldRollbackPerformance(metrics) {
  const baseline = getBaseline();
  const current = metrics.avgExecutionTime;
  
  // 性能下降超过 10%
  return current > baseline * 1.1;
}
```

### 2. 错误率上升
```javascript
function shouldRollbackErrors(metrics) {
  const baseline = getBaseline();
  const current = metrics.errorRate;
  
  // 错误率上升超过 5%
  return current > baseline + 0.05;
}
```

### 3. 用户反馈
```javascript
function shouldRollbackFeedback(metrics) {
  const current = metrics.userSatisfaction;
  
  // 用户满意度低于 80%
  return current < 0.8;
}
```

## 使用示例

### 应用单个优化
```javascript
const optimization = generateOptimization(evaluation);
const result = await applyOptimization(optimization);

if (result.success) {
  console.log('✅ Optimization applied successfully');
  console.log(`Improvement: ${result.validation.perfResult.improvement}`);
} else {
  console.log('❌ Optimization failed');
  console.log(`Reason: ${result.reason}`);
}
```

### 金丝雀发布
```javascript
const optimization = generateOptimization(evaluation);
const result = await canaryDeploy(optimization);

if (result.success) {
  console.log('✅ Canary deployment successful');
  await monitorOptimization(optimization);
} else {
  console.log(`❌ Canary deployment failed at ${result.stage} stage`);
}
```

### 批量应用
```javascript
const optimizations = generateOptimizations(evaluation);
const results = [];

for (const opt of optimizations) {
  const result = await applyOptimization(opt);
  results.push(result);
  
  if (!result.success) {
    console.log(`⚠️  Skipping remaining optimizations due to failure`);
    break;
  }
}
```

---

**提示**：应用器会安全地应用优化，并在出现问题时自动回滚！
