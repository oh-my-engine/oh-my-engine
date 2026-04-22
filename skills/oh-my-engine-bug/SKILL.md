---
name: oh-my-engine-bug
version: 1.0.0
description: 分析和修复 Bug
author: yunxi
tags: [bug, debug, analysis, fix]
---

# oh-my-engine-bug

系统化分析和修复 Bug，结合飞书文档、代码记忆和调试流程。

## 使用方法

```bash
/oh-my-engine-bug <issue-description>
```

## 参数

- `issue-description`: Bug 描述或 Issue ID

## 示例

```bash
# 描述 Bug
/oh-my-engine-bug "登录按钮点击无响应"

# 使用 Issue ID
/oh-my-engine-bug #123

# 详细描述
/oh-my-engine-bug "用户在 iOS 设备上无法上传图片，Android 正常"
```

## 执行流程

1. **理解问题**
   - 解析 Bug 描述
   - 提取关键信息（复现步骤、预期行为、实际行为）
   - 识别影响范围
   - 评估严重程度

2. **调用 bug-decision-flow**
   - 检查飞书需求/设计/变更文档
   - 查询 bug-memory 记录
   - 生成决策报告

3. **调用 systematic-debugging**
   - 定位问题代码
   - 分析根本原因
   - 设计修复方案
   - 评估影响范围

4. **实施修复**
   - 修改代码
   - 添加/更新测试
   - 验证修复效果
   - 检查回归影响

5. **验证和测试**
   - 运行单元测试
   - 运行集成测试
   - 手动验证（如果需要）
   - 检查代码质量

6. **记录和总结**
   - 更新 bug-memory
   - 记录修复方案
   - 更新文档（如果需要）
   - 关联 Issue

## 配置

### 项目配置（.oh-my-engine/config.json）

```json
{
  "workflows": {
    "bug-analysis": {
      "enabled": true,
      "rules": ["code-style"],
      "options": {
        "searchScope": ["src/", "app/"],
        "logPaths": ["logs/"],
        "autoFix": false
      }
    }
  }
}
```

## 输出示例

```
✅ Bug 分析完成

问题根因：
  Race condition in async data loading

修复方案：
  1. 添加加载状态锁
  2. 使用 useEffect cleanup
  3. 添加错误边界

修改的文件：
  - src/services/DataService.ts
  - src/services/__tests__/DataService.test.ts

新增测试：2 个
回归风险：低

执行时间: 15.2s
```

## 自动学习

系统会自动记录 Bug 修复历史：

- **同类 Bug 修复 ≥3 次** → 生成自动修复 Skill
- **调试步骤重复 ≥5 次** → 生成调试模式 Skill
- **修复方案成功率 ≥95%** → 固化为最佳实践

## 相关命令

- `/oh-my-engine-memory` - 查看 Bug 修复历史
- `/oh-my-engine-evolve` - 触发进化分析

---

**提示**：结合 bug-decision-flow 和 systematic-debugging，这个命令会越来越智能！
