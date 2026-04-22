---
name: oh-my-engine-memory
version: 1.0.0
description: 查看系统记忆和学习数据
author: yunxi
tags: [memory, statistics, learning]
---

# oh-my-engine-memory

查看系统执行历史、学习数据和统计信息。

## 使用方法

```bash
/oh-my-engine-memory [options]
```

## 参数

- `--workflow`: 指定工作流（可选）
- `--period`: 时间范围（可选，默认 30 天）
- `--type`: 记忆类型（可选：executions/learnings/preferences）

## 示例

```bash
# 查看所有记忆
/oh-my-engine-memory

# 查看特定工作流
/oh-my-engine-memory --workflow ui-restore

# 查看最近 7 天
/oh-my-engine-memory --period 7d

# 查看学习数据
/oh-my-engine-memory --type learnings
```

## 输出示例

```
📊 Oh My Engine 记忆统计

执行统计（最近 30 天）：
  - 总执行次数: 45
  - 成功次数: 42
  - 失败次数: 3
  - 成功率: 93.3%
  - 平均执行时间: 8.5s

工作流分布：
  - ui-restore: 25 次 (55.6%)
  - bug-analysis: 12 次 (26.7%)
  - component-gen: 5 次 (11.1%)
  - api-integration: 3 次 (6.7%)

性能趋势：
  - 第 1 周: 12.0s
  - 第 2 周: 10.5s
  - 第 3 周: 9.2s
  - 第 4 周: 8.5s
  📈 性能提升: 29.2%

已生成的 Skills：
  1. fix-mastergo-timeout (2024-01-15)
     - 类型: 错误修复
     - 触发次数: 8
     - 成功率: 100%
  
  2. feishu-search-helper (2024-01-18)
     - 类型: 工具提取
     - 触发次数: 12
     - 成功率: 95%
  
  3. ui-restore-best-practice (2024-01-22)
     - 类型: 最佳实践
     - 触发次数: 15
     - 成功率: 97%

学习数据：
  - 识别的模式: 12 个
  - 待优化项: 3 个
  - 固化的最佳实践: 5 个

用户偏好：
  - 自动修复: 开启
  - 自动优化: 开启
  - 自动生成 Skills: 开启
  - 通知级别: 重要
```

## 详细视图

### 执行历史

```bash
/oh-my-engine-memory --type executions --workflow ui-restore
```

输出：
```
📋 UI 还原执行历史

最近 10 次执行：
  1. 2024-01-25 10:30:00 ✅ 成功 (8.2s)
     - 规则通过率: 100%
     - 生成文件: 4 个
  
  2. 2024-01-24 15:45:00 ✅ 成功 (7.8s)
     - 规则通过率: 95%
     - 生成文件: 3 个
  
  3. 2024-01-23 09:20:00 ❌ 失败 (12.5s)
     - 错误: MasterGo 超时
     - 已自动修复
  
  ...
```

### 学习数据

```bash
/oh-my-engine-memory --type learnings
```

输出：
```
🧠 学习数据

错误模式：
  - MasterGo 超时 (5 次) → 已生成修复 Skill
  - 飞书搜索失败 (3 次) → 已生成工具 Skill

复用模式：
  - 飞书文档搜索 (4 处) → 已提取工具
  - 主题变量应用 (6 处) → 待优化
  - i18n 文本提取 (5 处) → 待优化

最佳实践：
  - UI 还原流程 (成功率 97%) → 已固化
  - Bug 分析流程 (成功率 95%) → 已固化
```

### 用户偏好

```bash
/oh-my-engine-memory --type preferences
```

输出：
```
⚙️  用户偏好

自动化设置：
  ✅ 自动修复错误
  ✅ 自动优化性能
  ✅ 自动生成 Skills
  ⏸️  自动应用优化（需手动确认）

通知设置：
  - 通知级别: 重要
  - 通知方式: 控制台

项目配置：
  - 默认语言: en, zh-CN, zh-TW, th
  - 主题系统: ThemedStyle
  - 设计令牌: 开启
```

## 清理记忆

```bash
# 清理 90 天前的记忆
/oh-my-engine-memory --clean --before 90d

# 清理特定工作流的记忆
/oh-my-engine-memory --clean --workflow ui-restore
```

## 导出记忆

```bash
# 导出为 JSON
/oh-my-engine-memory --export memory-backup.json

# 导出特定类型
/oh-my-engine-memory --export learnings.json --type learnings
```

## 相关命令

- `/oh-my-engine-evolve` - 触发进化分析
- `/oh-my-engine-init` - 初始化项目配置

---

**提示**：记忆系统会持续学习，帮助系统变得越来越智能！
