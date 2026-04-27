---
workflow: bug-analysis
version: 1.0.0
description: 分析和修复 Bug
rules: [code-style, test-coverage]
mcps: [gitlab, browser-tools]
skills: [bug-decision-flow, systematic-debugging]
---

# Bug 分析工作流

系统化分析和修复 Bug，结合飞书文档、代码记忆和调试流程。

## 输入参数

- `issue_description`: Bug 描述（必填）
- `issue_id`: Issue ID（可选，用于关联）
- `severity`: 严重程度（可选：critical/high/medium/low）

## 执行步骤

### Step 1: 理解问题
```
1. 解析 Bug 描述
2. 提取关键信息（复现步骤、预期行为、实际行为）
3. 识别影响范围
4. 评估严重程度
```

### Step 2: 调用 bug-decision-flow
```
1. 检查飞书需求/设计/变更文档
2. 查询 bug-memory 记录
3. 生成决策报告
```

**bug-decision-flow 输出**：
- 是否为已知问题
- 相关历史修复记录
- 推荐修复方案
- 风险评估

### Step 3: 调用 systematic-debugging
```
1. 定位问题代码
2. 分析根本原因
3. 设计修复方案
4. 评估影响范围
```

**systematic-debugging 输出**：
- 问题根因分析
- 修复方案建议
- 测试用例建议
- 回归风险评估

### Step 4: 实施修复
```
1. 修改代码
2. 添加/更新测试
3. 验证修复效果
4. 检查回归影响
```

### Step 5: 验证和测试
```
1. 运行单元测试
2. 运行集成测试
3. 手动验证（如果需要）
4. 检查代码质量
```

### Step 6: 记录和总结
```
1. 更新 bug-memory
2. 记录修复方案
3. 更新文档（如果需要）
4. 关联 Issue
```

## 输出结果

```json
{
  "success": true,
  "issue_id": "BUG-123",
  "root_cause": "Race condition in async data loading",
  "fix_applied": true,
  "files_changed": [
    "src/services/DataService.ts",
    "src/services/__tests__/DataService.test.ts"
  ],
  "tests_added": 2,
  "regression_risk": "low",
  "execution_time": "15.2s"
}
```

## 学习和进化

### 成功模式识别
```
- 某类 Bug 总是同样修复 → 生成自动修复 skill
- 某个调试步骤总是有效 → 固化为最佳实践
- 某个测试模式复用率高 → 提取为模板
```

### Skill 生成触发
```
- 同类 Bug 修复 ≥ 3 次 → 生成 auto-fix-<bug-type> skill
- 调试步骤重复 ≥ 5 次 → 生成 debug-<pattern> skill
```

## 示例用法

```bash
ome bug "登录按钮点击无响应"
ome bug "数据加载失败" --severity critical
```

---

**提示**：结合 bug-decision-flow 和 systematic-debugging，这个工作流会越来越智能！
