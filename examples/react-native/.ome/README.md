# Oh My Engine 配置

本目录包含 Eatizen 项目的 Oh My Engine 配置。

## 目录结构

```
.oh-my-engine/
├── config.json              # 项目配置
├── workflows/               # 自定义工作流（可选）
├── rules/                   # 项目规则
│   ├── i18n.md             # 多语言规则
│   ├── theme.md            # 主题系统规则
│   ├── design-tokens.md    # 设计令牌规则
│   └── code-style.md       # 代码风格规则
├── memory/                  # 记忆系统（不提交到 Git）
│   ├── executions/         # 执行历史
│   ├── learnings/          # 学习数据
│   └── preferences/        # 用户偏好
└── generated-skills/        # 自动生成的 Skills（未来）
```

## 可用的工作流

### 1. UI 还原（ui-restore）

从 MasterGo 设计稿生成 React Native 组件代码。

```bash
/oh-my-engine-ui <MasterGo-URL>
```

**特性**：
- 自动下载图片资源
- 生成符合项目规范的组件代码
- 自动生成 4 种语言翻译
- 使用 ThemedStyle 主题系统
- 应用设计令牌

### 2. Bug 分析（bug-analysis）

分析和修复 Bug，结合飞书文档和代码记忆。

```bash
/oh-my-engine-bug <issue-description>
```

**特性**：
- 检查飞书需求/设计/变更文档
- 查询 bug-memory 记录
- 生成决策报告
- 提供修复建议

### 3. 组件生成（component-gen）

快速生成符合项目规范的可复用组件。

```bash
/oh-my-engine-comp <component-name>
```

**特性**：
- 自动识别组件类型
- 生成组件、样式、类型定义
- 应用项目规则
- 包含多语言支持

### 4. API 集成（api-integration）

快速集成和测试 API 接口。

```bash
/oh-my-engine-api <api-spec>
```

**特性**：
- 解析 API 规范
- 生成 API 客户端
- 生成类型定义
- 包含错误处理

## 配置说明

### config.json

项目配置文件，定义了：
- 项目信息（名称、类型、框架）
- 工作流配置（启用的工作流、使用的 skills、应用的规则）
- 规则配置（i18n、theme、design-tokens、code-style）
- 记忆系统配置
- 进化机制配置
- Skill 生成配置

### rules/

项目规则文件，定义了代码生成的强制要求：
- **i18n.md**: 多语言规则（4 种语言、翻译质量标准）
- **theme.md**: 主题系统规则（ThemedStyle、禁止行内样式）
- **design-tokens.md**: 设计令牌规则（colors、spacing、typography、borderRadius）
- **code-style.md**: 代码风格规则（TypeScript、React Native、组件架构）

## 记忆系统

Oh My Engine 会自动记录每次工作流的执行历史，用于：
- 学习成功模式
- 避免重复错误
- 持续优化工作流
- 自动生成新的 Skills

记忆数据存储在 `memory/` 目录，不会提交到 Git。

## 进化机制

系统会定期分析执行历史，识别可优化的模式：
- 错误重复 ≥3 次 → 生成修复 Skill
- 代码复用 ≥3 处 → 提取工具 Skill
- 成功率 ≥95% → 固化为最佳实践

触发进化分析：

```bash
/oh-my-engine-evolve
```

查看记忆统计：

```bash
/oh-my-engine-memory
```

## 团队协作

配置文件可以提交到 Git，团队成员共享：

```bash
git add .oh-my-engine/config.json
git add .oh-my-engine/rules/
git commit -m "chore: 添加 Oh My Engine 配置"
```

记忆数据（`memory/`）已添加到 `.gitignore`，不会提交。

## 自定义配置

你可以根据项目需求调整配置：

1. **编辑工作流配置**：修改 `config.json` 中的 `workflows` 部分
2. **自定义规则**：编辑 `rules/` 目录中的规则文件
3. **添加自定义工作流**：在 `workflows/` 目录创建新的工作流定义

## 相关命令

- `/oh-my-engine-ui` - UI 还原
- `/oh-my-engine-bug` - Bug 分析
- `/oh-my-engine-comp` - 组件生成
- `/oh-my-engine-api` - API 集成
- `/oh-my-engine-memory` - 查看记忆统计
- `/oh-my-engine-evolve` - 触发进化分析

---

**提示**：这个系统会随着使用次数增加而变得越来越智能！
