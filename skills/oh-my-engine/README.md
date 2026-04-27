# Oh My Engine

通用工作流引擎 - 可复用、自我进化、自动沉淀 Skill

## 核心特性

### 1. 可复用框架
- **全局框架**: oh-my-engine skill 提供通用引擎
- **项目配置**: 每个项目可自定义 `.ome/` 配置
- **配置继承**: 项目配置覆盖默认模板
- **易于分享**: 配置文件可跨项目复用

### 2. 自我进化
- **自动评估**: 持续分析工作流执行效果
- **模式识别**: 识别优化机会和最佳实践
- **生成优化**: 自动生成优化方案
- **应用改进**: 安全应用优化并验证效果

### 3. 自动沉淀 Skill
- **错误学习**: 重复错误 ≥3 次自动生成修复 Skill
- **代码复用**: 代码复用 ≥3 处自动提取工具 Skill
- **最佳实践**: 成功率 ≥95% 自动固化为标准 Skill
- **操作组合**: 操作序列重复 ≥5 次自动组合为快捷 Skill

## 目录结构

```
oh-my-engine/
├── SKILL.md                    # Skill 定义
├── README.md                   # 本文档
├── templates/                  # 工作流模板
│   ├── ui-restore.md          # UI 还原工作流
│   ├── bug-analysis.md        # Bug 分析工作流
│   ├── component-gen.md       # 组件生成工作流
│   └── api-integration.md     # API 集成工作流
├── rules/                      # 规则模板
│   ├── i18n-template.md       # 国际化规则
│   ├── theme-template.md      # 主题系统规则
│   ├── design-tokens-template.md  # 设计令牌规则
│   └── code-style-template.md # 代码风格规则
├── evolution/                  # 进化机制
│   ├── evaluator.md           # 评估器
│   ├── optimizer.md           # 优化器
│   └── applier.md             # 应用器
└── skill-generator/            # Skill 生成器
    ├── pattern-recognizer.md  # 模式识别器
    ├── skill-creator.md       # Skill 创建器
    └── skill-validator.md     # Skill 验证器
```

## 快速开始

### 1. 使用 Skill

```bash
# 调用 oh-my-engine skill
ome ui <mastergo-url>
```

### 2. 项目配置

在项目根目录创建 `.ome/` 目录：

```bash
mkdir -p .ome/{workflows,rules,memory}
```

### 3. 自定义工作流

创建 `.ome/workflows/my-workflow.md`：

```markdown
---
name: my-workflow
version: 1.0.0
description: 我的自定义工作流
---

# 我的工作流

## 步骤

1. 步骤 1
2. 步骤 2
3. 步骤 3
```

### 4. 自定义规则

创建 `.ome/rules/my-rules.md`：

```markdown
---
name: my-rules
priority: high
---

# 我的规则

- 规则 1
- 规则 2
```

## 工作流模板

### UI 还原工作流

从 MasterGo 设计稿生成 React Native 代码。

**触发**: `ome ui <url>`

**步骤**:
1. 解析 MasterGo URL
2. 获取设计数据（DSL + 资源）
3. 应用规则（i18n + theme + design-tokens）
4. 生成代码
5. 验证输出

### Bug 分析工作流

分析 Bug 并生成修复方案。

**触发**: `ome bug <issue-id>`

**步骤**:
1. 获取 Bug 信息
2. 查询相关文档
3. 分析根本原因
4. 生成修复方案
5. 创建任务列表

### 组件生成工作流

生成符合项目规范的组件。

**触发**: `ome comp <type> <name>`

**步骤**:
1. 选择组件模板
2. 应用设计规范
3. 生成组件代码
4. 生成样式代码
5. 生成测试代码

### API 集成工作流

集成后端 API。

**触发**: `ome api <api-spec>`

**步骤**:
1. 解析 API 规范
2. 生成 API 服务
3. 生成类型定义
4. 生成测试用例
5. 更新文档

## 进化机制

### 评估器 (Evaluator)

分析工作流执行历史，评估执行效果。

**评估指标**:
- 规则通过率（目标 ≥95%，权重 40%）
- 执行效率（目标 ≥100%，权重 30%）
- 用户满意度（目标 ≥90%，权重 30%）

**评分等级**:
- A: ≥95
- B: 85-94
- C: 75-84
- D: 60-74
- F: <60

### 优化器 (Optimizer)

基于评估结果，生成优化方案。

**优化策略**:
- 并行化：并行执行独立操作
- 缓存：缓存重复计算结果
- 重试：添加重试机制
- 规则调整：优化规则优先级

### 应用器 (Applier)

安全应用优化方案。

**应用流程**:
1. 备份当前版本
2. 应用优化
3. 验证优化
4. 保存新版本或回滚

**发布策略**:
- 金丝雀发布：10% → 50% → 100%
- 特性开关：动态控制流量
- 自动回滚：检测到问题立即回滚

## Skill 生成器

### 模式识别器 (Pattern Recognizer)

识别可复用模式。

**识别类型**:
1. **错误模式**: 重复错误 ≥3 次
2. **复用模式**: 代码复用 ≥3 处
3. **最佳实践**: 成功率 ≥95%
4. **操作组合**: 操作序列重复 ≥5 次

### Skill 创建器 (Skill Creator)

自动生成新的 Skill。

**生成内容**:
- Skill 定义（SKILL.md）
- 实现代码
- 单元测试
- 集成测试
- 使用文档

### Skill 验证器 (Skill Validator)

验证生成的 Skill。

**验证项**:
- 语法验证（Markdown + 代码）
- 结构验证（文件 + 内容）
- 功能验证（单元测试 + 集成测试）
- 质量验证（代码质量 + 文档质量）
- 性能验证（执行时间 + 资源使用）

**验证等级**:
- A (90-100): 立即投入使用
- B (80-89): 修复警告后使用
- C (70-79): 改进后使用
- D (60-69): 重新生成
- F (<60): 废弃

## 记忆系统

### 执行历史

保存每次工作流执行的详细记录。

**位置**: `memory/executions/<workflow-name>/<timestamp>.json`

**内容**:
```json
{
  "workflow": "ui-restore",
  "timestamp": "2024-01-15T10:30:00Z",
  "duration": 12000,
  "success": true,
  "steps": [...],
  "rules": {
    "total": 20,
    "passed": 19,
    "failed": 1
  }
}
```

### 学习数据

保存识别的模式和生成的 Skill。

**位置**: `memory/learnings/<type>/<name>.json`

**类型**:
- `errors/`: 错误模式
- `reuse/`: 复用模式
- `best-practices/`: 最佳实践
- `combinations/`: 操作组合

### 用户偏好

保存用户的配置和偏好。

**位置**: `memory/preferences/user-config.json`

**内容**:
```json
{
  "autoFix": true,
  "autoOptimize": true,
  "autoGenerateSkills": true,
  "notificationLevel": "important"
}
```

## 使用示例

### 示例 1: UI 还原

```bash
# 从 MasterGo 生成 React Native 代码
ome ui https://mastergo.com/goto/xxxx
```

**执行流程**:
1. 解析 URL，提取 fileId 和 layerId
2. 调用 MasterGo MCP 获取 DSL 和资源
3. 应用 i18n、theme、design-tokens 规则
4. 生成屏幕、组件、样式代码
5. 验证代码质量
6. 保存执行历史

**自动学习**:
- 如果 MasterGo 超时 ≥3 次 → 生成 `fix-mastergo-timeout` skill
- 如果 i18n 规则通过率 <95% → 优化 i18n 规则
- 如果用户满意度 ≥95% → 固化为最佳实践

### 示例 2: Bug 分析

```bash
# 分析 Bug 并生成修复方案
ome bug #123
```

**执行流程**:
1. 从 GitHub/GitLab 获取 issue 信息
2. 查询飞书文档（需求/设计/变更）
3. 查询 bug-memory 历史记录
4. 分析根本原因
5. 生成修复方案和任务列表

**自动学习**:
- 如果相似 Bug 出现 ≥3 次 → 生成修复 skill
- 如果修复方案成功率 ≥95% → 固化为最佳实践

### 示例 3: 组件生成

```bash
# 生成表单组件
ome comp form UserProfileForm
```

**执行流程**:
1. 选择表单组件模板
2. 应用设计规范（theme + design-tokens）
3. 生成组件代码（TextField + Picker + Button）
4. 生成样式代码（ThemedStyle）
5. 生成测试代码

**自动学习**:
- 如果表单组件生成 ≥5 次 → 生成 `quick-form` skill
- 如果验证逻辑重复 ≥3 处 → 提取 `form-validator` 工具

## 进化示例

### 第 1 个月（手动阶段）

**执行情况**:
- UI 还原执行 50 次
- 手动修复 MasterGo 超时 15 次
- 手动调整 i18n 规则 8 次
- 平均执行时间 12s
- 错误率 15%
- 用户满意度 3.5/5

### 第 2 个月（自动进化）

**自动生成的 Skills**:
1. `fix-mastergo-timeout`: 自动重试 MasterGo 请求
2. `feishu-search-helper`: 提取飞书搜索逻辑
3. `i18n-validator`: 改进 i18n 验证
4. `quick-component`: 快速生成常用组件
5. `ui-restore-best-practice`: 固化最佳实践

**改进效果**:
- 平均执行时间降至 8s（↓33%）
- 错误率降至 2%（↓87%）
- 用户满意度提升至 4.8/5（↑37%）
- 自动修复率 95%

### 第 3 个月（持续优化）

**新增 Skills**:
6. `theme-optimizer`: 优化主题应用
7. `code-formatter`: 统一代码格式
8. `test-generator`: 自动生成测试

**改进效果**:
- 平均执行时间降至 5s（↓58%）
- 错误率降至 0.5%（↓97%）
- 用户满意度稳定在 4.9/5
- 自动修复率 98%

## 配置选项

### 全局配置

编辑 `~/.claude/skills/oh-my-engine/config.json`：

```json
{
  "autoEvaluate": true,
  "autoOptimize": true,
  "autoGenerateSkills": true,
  "evaluationInterval": "daily",
  "optimizationThreshold": 85,
  "skillGenerationThreshold": {
    "errorFrequency": 3,
    "reuseFrequency": 3,
    "successRate": 0.95,
    "combinationFrequency": 5
  }
}
```

### 项目配置

创建 `.ome/config.json`：

```json
{
  "workflows": {
    "ui-restore": {
      "enabled": true,
      "rules": ["i18n", "theme", "design-tokens"]
    },
    "bug-analysis": {
      "enabled": true,
      "rules": ["code-style"]
    }
  },
  "memory": {
    "retentionDays": 90,
    "maxExecutions": 1000
  }
}
```

## 最佳实践

### 1. 工作流设计
- 保持工作流简单，每个工作流专注一个任务
- 使用清晰的步骤划分
- 提供详细的错误信息
- 支持部分执行和恢复

### 2. 规则配置
- 规则应该是可验证的
- 提供清晰的优先级
- 支持规则组合
- 定期审查和更新规则

### 3. 记忆管理
- 定期清理过期记忆
- 保持记忆结构清晰
- 使用有意义的命名
- 记录重要的上下文信息

### 4. Skill 生成
- 验证生成的 Skill
- 编写完整的测试
- 提供清晰的文档
- 定期审查和优化

## 故障排除

### 问题 1: 工作流执行失败

**症状**: 工作流执行中断

**解决方案**:
1. 检查执行历史：`memory/executions/<workflow>/`
2. 查看错误日志
3. 验证配置文件
4. 重试执行

### 问题 2: 规则冲突

**症状**: 规则验证失败

**解决方案**:
1. 检查规则优先级
2. 查看规则定义
3. 调整规则顺序
4. 禁用冲突规则

### 问题 3: Skill 生成失败

**症状**: 自动生成的 Skill 无法使用

**解决方案**:
1. 运行 Skill 验证器
2. 检查语法错误
3. 运行测试
4. 手动修复问题

### 问题 4: 性能下降

**症状**: 执行时间增加

**解决方案**:
1. 运行评估器分析
2. 查看性能指标
3. 应用优化建议
4. 清理缓存

## 贡献指南

### 添加新工作流

1. 创建模板文件：`templates/my-workflow.md`
2. 定义工作流步骤
3. 添加规则引用
4. 编写测试
5. 更新文档

### 添加新规则

1. 创建规则文件：`rules/my-rule.md`
2. 定义规则内容
3. 设置优先级
4. 编写验证逻辑
5. 更新文档

### 改进进化机制

1. 修改评估器/优化器/应用器
2. 添加新的评估指标
3. 实现新的优化策略
4. 编写测试
5. 更新文档

## 许可

MIT

## 联系方式

- Issues: https://github.com/your-repo/oh-my-engine/issues
- Discussions: https://github.com/your-repo/oh-my-engine/discussions
