---
name: oh-my-engine-evolve
version: 1.0.0
description: 触发系统进化分析
author: yunxi
tags: [evolution, optimization, learning]
---

# oh-my-engine-evolve

分析执行历史，识别优化机会，生成改进建议。

## 使用方法

```bash
/oh-my-engine-evolve [options]
```

## 参数

- `--workflow`: 指定工作流（可选，默认分析所有）
- `--period`: 分析周期（可选，默认 30 天）

## 示例

```bash
# 分析所有工作流
/oh-my-engine-evolve

# 分析特定工作流
/oh-my-engine-evolve --workflow ui-restore

# 指定分析周期
/oh-my-engine-evolve --period 7d
```

## 执行流程

1. **加载执行历史**
   - 读取 memory/executions/
   - 过滤时间范围
   - 统计执行数据

2. **评估执行效果**
   - 计算规则通过率（目标 ≥95%）
   - 计算执行效率（目标 ≥100%）
   - 计算用户满意度（目标 ≥90%）
   - 生成综合评分

3. **识别可优化模式**
   - 错误模式（重复 ≥3 次）
   - 复用模式（复用 ≥3 处）
   - 最佳实践（成功率 ≥95%）
   - 操作组合（重复 ≥5 次）

4. **生成优化建议**
   - 性能优化建议
   - 准确性优化建议
   - 用户体验优化建议
   - Skill 生成建议

5. **展示结果**
   - 显示评估报告
   - 显示优化建议
   - 询问是否应用

6. **应用优化（可选）**
   - 生成新的 Skill
   - 应用性能优化
   - 更新规则配置

## 输出示例

```
📊 进化分析报告

执行统计（最近 30 天）：
  - 总执行次数: 45
  - 成功率: 93%
  - 平均执行时间: 8.5s

评估指标：
  ✅ 规则通过率: 96.5% (目标 ≥95%)
  ✅ 执行效率: 108.2% (目标 ≥100%)
  ✅ 用户满意度: 92.0% (目标 ≥90%)

综合评分: 96.1 (A 级)

识别的模式：
  🔧 错误修复模式: 2 个
     - MasterGo 超时错误 (5 次)
     - 飞书搜索失败 (3 次)
  
  🔄 复用模式: 3 个
     - 飞书文档搜索逻辑 (4 处)
     - 主题变量应用 (6 处)
     - i18n 文本提取 (5 处)
  
  ⭐ 最佳实践: 1 个
     - UI 还原流程 (成功率 97%)

优化建议：
  1. [高优先级] 生成 fix-mastergo-timeout Skill
  2. [中优先级] 提取 feishu-search-helper 工具
  3. [低优先级] 固化 ui-restore-best-practice

是否应用这些优化？(y/n)
```

## 配置

### 全局配置（~/.claude/skills/oh-my-engine/config.json）

```json
{
  "evolution": {
    "enabled": true,
    "autoApply": false,
    "evaluationInterval": "daily",
    "optimizationThreshold": 85,
    "skillGenerationThreshold": {
      "errorFrequency": 3,
      "reuseFrequency": 3,
      "successRate": 0.95,
      "combinationFrequency": 5
    }
  }
}
```

## 自动进化

系统会在后台自动触发进化分析：
- 每次工作流执行后
- 每天定时分析
- 达到阈值时触发

## 相关命令

- `/oh-my-engine-memory` - 查看执行历史
- `/oh-my-engine-ui` - UI 还原（会触发进化）
- `/oh-my-engine-bug` - Bug 分析（会触发进化）

---

**提示**：系统会自动学习和进化，你也可以手动触发分析！
