# Evolution System

Oh My Engine 的自主进化系统能够自动学习项目模式、生成规则和技能，并智能决策是否应用这些改进。

## 核心功能

### 1. 自动记忆记录

每次完成工作流任务后，系统会自动记录执行信息：

```bash
# 工作流完成后，Agent 会自动执行
ome finish
```

记录内容包括：
- 工作流类型和输入
- 执行时间和持续时间
- 成功/失败状态
- 错误信息（如果失败）
- 应用的规则和技能

### 2. 自动后台分析

系统在以下时机自动运行分析：
- 每次 `ome finish` 后
- 定期后台检查（如果配置）

分析过程：
1. 扫描执行记录，识别重复模式
2. 检测错误模式（同一错误多次出现）
3. 识别成功模式（高成功率的方法）
4. 生成学习候选和技能候选

### 3. 自动生成规则

从错误记录中自动生成预防性规则：

**错误模式检测**：
- 同一错误出现 ≥3 次
- 自动生成规则到 `.ome/rules/learned/`
- 规则包含错误描述、预防措施、示例

**生成的规则示例**：
```markdown
---
slug: prevent-react-handler-invocation
category: react
severity: error
confidence: 85
appliedCount: 0
successRate: 0
---

# Prevent React Event Handler Immediate Invocation

## Problem
Calling event handlers immediately in JSX (e.g., `onClick={handler()}`) causes the handler to execute during render instead of on click.

## Solution
Pass function references without parentheses: `onClick={handler}`

If arguments are needed, use an arrow function:
```jsx
onClick={() => handler(arg)}
```

## Evidence
- Occurred 3 times in bug fixes
- Pattern: `onClick={handleClick()}` → `onClick={handleClick}`
```

### 4. 自动生成技能

从成功的 bug 修复中生成可复用技能：

**技能模式检测**：
- 同一修复模式出现 ≥3 次
- 自动生成技能到 `.agent/workflows/learned/`
- 技能包含执行指令、示例、最佳实践

**生成的技能示例**：
```markdown
---
slug: react-event-handler-fix
category: react
confidence: 90
appliedCount: 0
successRate: 0
---

# React Event Handler Fix

## Execution Directives
- Avoid immediate invocation in React JSX event handlers
- Pass function references instead of calling handlers during render
- If a handler needs arguments, wrap it in an explicit closure

## Pattern
**Before**:
```jsx
<button onClick={handleClick()}>Click</button>
```

**After**:
```jsx
<button onClick={handleClick}>Click</button>
// or with arguments:
<button onClick={() => handleClick(arg)}>Click</button>
```

## Evidence
- Successfully fixed 3 similar bugs
- Pattern consistently resolved the issue
```

### 5. 智能自主决策

系统使用信心评分和风险评估来决定如何处理候选：

**决策矩阵**：

| 信心分数 | 风险等级 | 决策 |
|---------|---------|------|
| ≥80% | 低 (<30%) | 🟢 自动应用 |
| ≥80% | 中 (30-60%) | 🟡 请求审核 |
| 60-80% | 低 | 🟡 请求审核 |
| 60-80% | 中高 | 🟡 请求审核 |
| <60% | 任何 | 🔴 自动拒绝 |

**信心评分因素**：
- 证据数量（出现次数）
- 成功率
- 模式一致性
- 上下文相关性

**风险评估因素**：
- 影响范围（文件数量）
- 修改类型（配置 vs 代码）
- 复杂度
- 可逆性

### 6. 效果跟踪

系统持续跟踪已应用规则和技能的效果：

**跟踪指标**：
- 应用次数
- 成功率
- 失败案例
- 最后应用时间

**自动调整**：
- 成功率高：提升信心分数
- 成功率低：降低信心分数
- 长期无效：标记为待清理

### 7. 自动清理

定期清理无效或过时的内容：

**清理条件**：
- 应用次数 ≥10 且成功率 <40%
- 90天未使用
- 被标记为过时

**清理操作**：
- 移动到 `.ome/archive/`
- 记录清理原因
- 保留历史数据供分析

## 工作流程

```
┌─────────────────┐
│  执行工作流      │
│  (ome bug)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  完成任务        │
│  (ome finish)   │ ← Agent 自动执行
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  自动记录        │
│  记录执行信息    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  自动分析        │
│  识别模式        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  生成候选        │
│  规则 + 技能     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  智能决策        │
│  评分 + 风险     │
└────┬───┬───┬────┘
     │   │   │
     ▼   ▼   ▼
   自动 审核 拒绝
   应用  │   │
     │   │   │
     ▼   ▼   ▼
┌─────────────────┐
│  效果跟踪        │
│  持续监控        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  自动清理        │
│  淘汰无效内容    │
└─────────────────┘
```

## 命令

### 查看待审核候选

```bash
ome evolve review
```

显示所有需要人工审核的候选，包括：
- 候选类型（规则/技能）
- 信心分数
- 风险等级
- 证据数量
- 建议操作

### 手动触发分析

```bash
ome evolve analyze
```

立即运行分析，无需等待自动触发。

### 查看效果统计

```bash
ome evolve stats
```

显示已应用规则和技能的效果统计。

## 配置

在 `.ome/config.json` 中配置进化系统：

```json
{
  "evolution": {
    "enabled": true,
    "autoAnalyze": true,
    "autoApply": {
      "enabled": true,
      "minConfidence": 80,
      "maxRisk": 30
    },
    "thresholds": {
      "learningCandidateMinEvidence": 3,
      "skillCandidateMinEvidence": 3
    },
    "cleanup": {
      "enabled": true,
      "minApplications": 10,
      "minSuccessRate": 40,
      "unusedDays": 90
    }
  }
}
```

### 配置选项

- `enabled`: 启用/禁用进化系统
- `autoAnalyze`: 自动运行分析
- `autoApply.enabled`: 启用自动应用
- `autoApply.minConfidence`: 自动应用的最低信心分数
- `autoApply.maxRisk`: 自动应用的最高风险等级
- `thresholds.learningCandidateMinEvidence`: 生成学习候选的最少证据数
- `thresholds.skillCandidateMinEvidence`: 生成技能候选的最少证据数
- `cleanup.enabled`: 启用自动清理
- `cleanup.minApplications`: 清理前的最少应用次数
- `cleanup.minSuccessRate`: 保留的最低成功率
- `cleanup.unusedDays`: 未使用多少天后清理

## 目录结构

```
.ome/
├── memory/
│   ├── executions/          # 执行记录
│   │   ├── bug/
│   │   ├── ui/
│   │   └── ...
│   └── learnings/
│       ├── candidates/      # 学习候选
│       └── adopted/         # 已采纳学习
├── rules/
│   └── learned/            # 自动生成的规则
├── skill-candidates/       # 技能候选
├── generated-skills/       # 已生成的技能
└── archive/               # 已清理的内容

.agent/
└── workflows/
    └── learned/           # 自动生成的技能工作流
```

## 最佳实践

### 1. 定期审核

即使系统能自动应用，也应定期审核：

```bash
ome evolve review
```

确保自动生成的规则和技能符合项目需求。

### 2. 调整阈值

根据项目特点调整阈值：
- 小型项目：降低证据要求（2次即可）
- 大型项目：提高证据要求（5次以上）
- 关键项目：提高信心要求（90%以上）

### 3. 监控效果

定期查看效果统计：

```bash
ome evolve stats
```

识别哪些规则和技能最有效，哪些需要改进。

### 4. 手动干预

对于特殊情况，可以手动：
- 批准低信心但确实有效的候选
- 拒绝高信心但不适合项目的候选
- 修改自动生成的规则和技能

### 5. 保持清洁

让自动清理系统运行，避免积累无效内容：
- 定期检查 `.ome/archive/`
- 分析为什么某些规则/技能无效
- 调整生成策略

## 工作原理

### 模式识别

系统通过以下方式识别模式：

1. **错误模式**：
   - 扫描失败的执行记录
   - 提取错误消息和堆栈跟踪
   - 识别相似的错误（使用文本相似度）
   - 分组相同的错误

2. **成功模式**：
   - 扫描成功的执行记录
   - 识别重复的操作序列
   - 检测高成功率的方法
   - 提取可复用的模式

### 候选生成

从识别的模式生成候选：

1. **规则候选**：
   - 从错误模式生成
   - 包含问题描述、解决方案、示例
   - 附带证据（错误记录链接）

2. **技能候选**：
   - 从成功模式生成
   - 包含执行指令、最佳实践、示例
   - 附带证据（成功记录链接）

### 决策过程

系统使用多因素决策：

1. **信心评分**（0-100）：
   - 证据数量：+20 per evidence
   - 成功率：+30 if >80%
   - 一致性：+20 if consistent
   - 相关性：+30 if highly relevant

2. **风险评估**（0-100）：
   - 影响范围：+30 if >5 files
   - 修改类型：+20 if code change
   - 复杂度：+30 if complex
   - 可逆性：+20 if hard to reverse

3. **决策规则**：
   ```
   if confidence >= 80 and risk < 30:
     auto_apply()
   elif confidence >= 60 and risk < 60:
     request_review()
   else:
     auto_reject()
   ```

### 效果跟踪

系统持续跟踪应用效果：

1. **记录应用**：
   - 每次应用规则/技能时记录
   - 记录应用上下文

2. **跟踪结果**：
   - 监控后续执行
   - 判断是否成功
   - 更新成功率

3. **调整策略**：
   - 成功率高：提升信心
   - 成功率低：降低信心
   - 持续失败：标记清理

## 故障排除

### 问题：候选未自动生成

**可能原因**：
- 证据不足（<3次）
- 自动分析未启用
- 模式不够明显

**解决方案**：
```bash
# 检查配置
cat .ome/config.json | grep evolution

# 手动触发分析
ome evolve analyze

# 降低阈值
# 编辑 .ome/config.json，设置 minEvidence: 2
```

### 问题：候选未自动应用

**可能原因**：
- 信心分数不足
- 风险等级过高
- 自动应用未启用

**解决方案**：
```bash
# 查看待审核候选
ome evolve review

# 检查决策原因
# 候选文件中有 decisionReason 字段

# 调整自动应用阈值
# 编辑 .ome/config.json
```

### 问题：生成的规则/技能不准确

**可能原因**：
- 证据质量低
- 模式识别错误
- 上下文不足

**解决方案**：
```bash
# 手动审核候选
ome evolve review

# 拒绝不准确的候选
# 删除对应的候选文件

# 提高证据要求
# 编辑 .ome/config.json，增加 minEvidence
```

### 问题：效果跟踪不准确

**可能原因**：
- 执行记录不完整
- 成功判断逻辑错误
- 上下文变化

**解决方案**：
```bash
# 查看效果统计
ome evolve stats

# 检查执行记录
ls -la .ome/memory/executions/

# 手动调整统计
# 编辑对应的规则/技能文件
```

## 高级用法

### 自定义决策逻辑

创建 `.ome/evolution-config.js`：

```javascript
module.exports = {
  // 自定义信心评分
  scoreConfidence: (candidate) => {
    let score = 0;
    score += candidate.evidence.length * 25; // 每个证据25分
    if (candidate.successRate > 0.9) score += 40;
    return Math.min(score, 100);
  },
  
  // 自定义风险评估
  assessRisk: (candidate) => {
    let risk = 0;
    if (candidate.affectedFiles > 10) risk += 40;
    if (candidate.category === 'security') risk += 30;
    return Math.min(risk, 100);
  },
  
  // 自定义决策
  decide: (confidence, risk) => {
    if (confidence >= 90 && risk < 20) return 'auto-apply';
    if (confidence >= 70 && risk < 40) return 'review';
    return 'reject';
  }
};
```

### 集成外部工具

在 `.ome/hooks/` 中创建钩子：

```bash
# .ome/hooks/post-analyze.sh
#!/bin/bash
# 分析完成后发送通知
curl -X POST https://slack.com/api/chat.postMessage \
  -d "text=New evolution candidates generated"
```

### 导出学习数据

```bash
# 导出所有学习数据
ome evolve export --format json > learnings.json

# 导入到其他项目
cd /path/to/other/project
ome evolve import learnings.json
```

## 安全考虑

### 1. 代码审查

即使系统自动应用，也应：
- 定期审查生成的规则和技能
- 检查是否引入安全问题
- 验证是否符合团队标准

### 2. 权限控制

配置谁可以：
- 批准候选
- 修改配置
- 删除规则/技能

### 3. 审计日志

系统记录所有操作：
- 候选生成
- 决策过程
- 应用操作
- 效果跟踪

查看审计日志：
```bash
cat .ome/memory/audit.log
```

## 性能优化

### 1. 批量分析

避免频繁分析：
```json
{
  "evolution": {
    "autoAnalyze": false,
    "scheduledAnalyze": "0 2 * * *"  // 每天凌晨2点
  }
}
```

### 2. 增量分析

只分析新记录：
```json
{
  "evolution": {
    "incrementalAnalyze": true,
    "lastAnalyzedTimestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 并行处理

启用并行分析：
```json
{
  "evolution": {
    "parallelAnalyze": true,
    "maxWorkers": 4
  }
}
```

## 总结

Oh My Engine 的自主进化系统提供了完整的自动化学习循环：

1. ✅ **自动记忆记录**：无需手动操作
2. ✅ **自动后台分析**：持续识别模式
3. ✅ **自动生成规则**：预防重复错误
4. ✅ **自动生成技能**：复用成功模式
5. ✅ **智能自主决策**：平衡自动化和控制
6. ✅ **效果跟踪**：持续优化
7. ✅ **自动清理**：保持系统健康

系统设计原则：
- **自主但可控**：自动化常规操作，人工审核关键决策
- **学习但不盲目**：基于证据，持续验证
- **进化但不混乱**：自动清理，保持整洁

通过这个系统，Oh My Engine 能够真正"自己沉淀经验的 skill、踩坑自己写 rules、自己沉淀记忆"，成为一个持续进化的智能工作流系统。
