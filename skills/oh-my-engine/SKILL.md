---
name: oh-my-engine
version: 1.0.0
description: 通用工作流引擎 - 可复用、自我进化、自动沉淀 Skill
author: yunxi
tags: [workflow, automation, evolution, learning]
---

# Oh My Engine - 通用工作流引擎

一个会学习和进化的工作流系统，能够：
- 🔄 执行可复用的工作流
- 🧠 从执行中学习和优化
- ⚡ 自动识别模式并沉淀成 Skill

## 核心能力

### 1. 配置检测与继承
- 检测项目级配置：`.ome/` 目录
- 全局默认模板：
  - Claude Code: `~/.claude/skills/oh-my-engine/templates/`
  - Codex: `~/.codex/skills/oh-my-engine/templates/`
- 配置继承：项目配置覆盖全局默认

### 2. 工作流调度
- UI 还原：`ome ui`
- Bug 分析：`ome bug`
- 组件生成：`ome comp`
- API 集成：`ome api`
- Spec 驱动开发：`ome spec <change-id>`

### 3. 记忆系统
- 选择性执行记忆：`memory/executions/`
- 学习数据：`memory/learnings/`
- 用户偏好：`memory/preferences/`

### 4. 进化机制
- 自动评估执行效果
- 识别可优化模式
- 生成优化建议
- 应用改进方案

### 5. Skill 生成器
- 自动识别可复用模式
- 生成新的 Skill
- 验证和采纳
- 以 execution directives 或工作流 guidance 形式复用

## 使用方法

```bash
# CLI 主入口
ome init
ome doctor
ome rules sync

# 工作流 guidance
ome guidance ui-restore --input "<mastergo-url>"
ome guidance bug-analysis --input "<issue-description>"
ome guidance component-gen --input "<component-name>"
ome guidance api-integration --input "<api-spec>"

# Spec 流程
ome spec propose <change-id>
ome spec plan <change-id>
ome spec apply <change-id>
ome spec verify <change-id>
ome spec archive <change-id>

# 记忆和进化
ome memory view --format json
ome evolve analyze --format json
```

Claude Code 可使用 `/oh-my-engine-*` skills 作为原生入口。
Codex 请按 skill 名触发，例如 `ome-spec propose <change-id>`。
Trae / Cursor / Windsurf / OpenCode 等工具通过 `ome rules sync` 生成的规则文件使用。

## 执行流程

当用户调用 `ome <command>` 或通过 agent skill 触发时：

### Step 1: 配置检测
```
1. 检查当前目录是否有 .ome/ 配置
2. 如果有，加载项目配置
3. 如果没有，使用全局默认模板
4. 合并配置（项目覆盖全局）
```

### Step 2: 工作流调度
```
1. 根据 command 找到对应的工作流模板
2. 加载工作流定义（templates/<workflow>.md）
3. 如果 command 是 `spec`，委托 `ome-spec`
4. 加载相关规则（rules/<rule>.md）
5. 准备执行上下文（已接受 capability 才加载 `openspec/specs/<capability>/spec.md`）
```

### Step 3: 执行工作流
```
1. 按照工作流步骤执行
2. 应用规则验证
3. 记录执行过程
4. 收集性能数据
```

### Step 4: 保存记忆
```
1. 先经过 selective memory policy 判断是否值得落盘
2. 命中的执行事件写入 memory/executions/
3. 明确偏好和后运行 promotion 才进入 preferences / learnings
4. 记录 whyStored、captureLevel、source 等审计字段
```

### Step 5: 触发进化（后台）
```
1. 分析 execution memory
2. 识别可优化模式
3. 生成 candidate，而不是直接安装
4. 验证后再进入 adopt 流程
```

## 配置结构

### 项目级配置（project/）
```
.ome/
├── config.json           # 项目配置
├── workflows/            # 自定义工作流
│   ├── ui-restore.md
│   └── custom-flow.md
├── rules/                # 项目规则
│   ├── i18n.md
│   └── theme.md
├── generated-skills/     # 已采纳 skill artifact
└── memory/               # 项目记忆
    ├── executions/
    ├── learnings/
    │   ├── candidates/
    │   └── adopted/
    ├── preferences/
    ├── skill-candidates/
    └── specs/

openspec/                 # OpenSpec-compatible 规范工作区
├── project.md
├── changes/
├── specs/
└── archive/
```

### 全局默认模板
**Claude Code**: `~/.claude/skills/oh-my-engine/`  
**Codex**: `~/.codex/skills/oh-my-engine/`

```
oh-my-engine/
├── SKILL.md              # 本文件
├── templates/            # 默认工作流模板
│   ├── ui-restore.md
│   ├── bug-analysis.md
│   ├── component-gen.md
│   └── api-integration.md
├── rules/                # 默认规则模板
│   ├── i18n-template.md
│   ├── theme-template.md
│   ├── design-tokens-template.md
│   └── code-style-template.md
├── evolution/            # 进化机制
│   ├── evaluator.md
│   ├── optimizer.md
│   └── applier.md
└── skill-generator/      # Skill 生成器
    ├── pattern-recognizer.md
    ├── skill-creator.md
    └── skill-validator.md
```

## 实现逻辑

### 配置加载
```typescript
function loadConfig(cwd) {
  // 1. 检测项目配置
  const projectConfig = checkPath(`${cwd}/.ome/config.json`);
  
  // 2. 加载全局默认
  const globalConfig = loadGlobalDefaults();
  
  // 3. 合并配置
  return mergeConfig(globalConfig, projectConfig);
}
```

### 工作流调度
```typescript
function dispatchWorkflow(command, args, config) {
  // 1. 查找工作流定义
  const workflow = findWorkflow(command, config);
  
  // 2. 加载相关规则
  const rules = loadRules(workflow.rules, config);
  
  // 3. 执行工作流
  const result = executeWorkflow(workflow, rules, args);
  
  // 4. 保存记忆
  saveMemory(result);
  
  // 5. 触发进化（异步）
  triggerEvolution(result);
  
  return result;
}
```

### 记忆保存
```typescript
function saveMemory(result) {
  const timestamp = Date.now();
  const executionId = generateId();
  
  const capture = decideCapture(result);

  if (capture.shouldPersist) {
    saveExecution({
      id: executionId,
      timestamp,
      workflow: result.workflow,
      captureLevel: capture.captureLevel,
      whyStored: capture.reason
    });
  }
}
```

### 进化触发
```javascript
function triggerEvolution(result) {
  // 1. 分析执行历史
  const history = loadExecutionHistory();
  const patterns = analyzePatterns(history);
  
  // 2. 检查 Skill 生成条件
  for (const pattern of patterns) {
    if (shouldGenerateSkill(pattern)) {
      // 3. 生成 candidate
      const skillCandidate = generateSkillCandidate(pattern);
      
      // 4. 验证 candidate
      if (validateSkill(skillCandidate)) {
        // 5. 经过审批后再注册
        registerSkill(skillCandidate);
        notifyUser(`新 Skill 已生成: ${skill.name}`);
      }
    }
  }
  
  // 7. 生成优化建议
  const optimizations = generateOptimizations(patterns);
  if (optimizations.length > 0) {
    notifyUser(`发现 ${optimizations.length} 个优化建议`);
  }
}
```

## Skill 生成条件

### 1. 错误修复模式（重复 ≥ 3 次）
```
触发条件：同一类型错误重复出现 3 次以上
生成内容：错误检测 + 自动修复规则
示例：MasterGo URL 解析错误 → 生成 mastergo-url-validator skill
```

### 2. 工具提取模式（复用 ≥ 3 处）
```
触发条件：同一段代码在 3 个以上地方复用
生成内容：提取为独立工具函数
示例：飞书文档搜索逻辑 → 生成 feishu-search skill
```

### 3. 最佳实践模式（成功率 ≥ 95%）
```
触发条件：某个操作序列成功率达到 95% 以上
生成内容：固化为标准流程
示例：UI 还原流程 → 生成 ui-restore-best-practice skill
```

### 4. 操作组合模式（重复 ≥ 5 次）
```
触发条件：同一组操作序列重复 5 次以上
生成内容：打包为快捷命令
示例：读取设计稿 + 生成组件 + 写入文件 → 生成 quick-component skill
```

## 评估维度

### 1. 规则通过率
```
计算公式：通过的规则数 / 总规则数
目标值：≥ 95%
权重：40%
```

### 2. 执行效率
```
计算公式：当前执行时间 / 历史平均时间
目标值：≤ 1.0（不变慢）
权重：30%
```

### 3. 用户满意度
```
计算公式：用户确认次数 / 总执行次数
目标值：≥ 90%
权重：30%
```

## 进化循环

```
执行工作流
    ↓
保存执行历史
    ↓
分析模式（后台）
    ↓
识别可优化点
    ↓
生成 Skill / 优化建议
    ↓
验证和采纳
    ↓
在后续执行中以 directives / guidance 形式生效
    ↓
持续优化...
```

## 实际效果

### 第 1 个月
- 手动修复 MasterGo 解析错误 3 次
- 手动优化飞书搜索逻辑 4 次
- 平均执行时间：12 秒
- 错误率：15%

### 第 2 个月（自动进化后）
- 自动生成 `mastergo-url-validator` skill
- 自动生成 `feishu-search-optimizer` skill
- 自动生成 `ui-restore-best-practice` skill
- 平均执行时间：8 秒（↓ 33%）
- 错误率：2%（↓ 87%）

## 命令实现

### ome ui
```
1. 检测配置（.ome/ 或全局默认）
2. 加载 ui-restore.md 工作流
3. 加载相关规则（i18n, theme, design-tokens）
4. 执行：解析设计稿 → 生成代码 → 应用规则 → 写入文件
5. 保存记忆
6. 触发进化
```

### ome evolve
```
1. 加载执行历史（memory/executions/）
2. 分析模式（evolution/evaluator.md）
3. 生成优化建议（evolution/optimizer.md）
4. 展示给用户确认
5. 应用改进（evolution/applier.md）
```

### ome memory
```
1. 统计执行次数
2. 统计成功率
3. 统计平均执行时间
4. 列出已生成的 Skills
5. 展示学习数据
```

### ome init
```
1. 在当前目录创建 .ome/ 结构
2. 复制默认模板到项目
3. 生成 config.json
4. 初始化 memory/ 目录
```

## 下一步

1. ✅ 创建目录结构
2. ✅ 创建核心 SKILL.md（本文件）
3. ⏳ 创建默认工作流模板
4. ⏳ 创建默认规则模板
5. ⏳ 创建进化机制
6. ⏳ 创建 Skill 生成器
7. ⏳ 创建文档

---

**注意**：这是一个会学习和进化的系统，随着使用次数增加，它会变得越来越智能！
