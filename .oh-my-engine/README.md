# Bug Pattern 自动沉淀系统

## 概述

当使用 `/oh-my-engine-bug` 修复 Bug 时，系统会自动识别错误模式并记录。当同类问题重复出现时，自动生成预防措施。

## 工作流程

```
修复 Bug
  ↓
识别错误模式（TypeScript runtime）
  ↓
记录到 bug-patterns.json
  ↓
检查阈值
  ↓
触发自动沉淀（ome evolve）
  ↓
生成 Skill / ESLint 规则 / Pre-commit Hook
```

## 使用示例

### 1. 第一次修复

```bash
/oh-my-engine-bug "修复 LoginButton.tsx 的 onClick={handleClick()} 问题"
```

输出：
```
🎯 直接修复模式

🔍 错误模式识别：
  - 模式：react-event-handler-invocation
  - 出现次数：1 次

修复完成 ✅
```

### 2. 第三次修复（触发 Skill 生成）

```bash
/oh-my-engine-bug "又是 onClick={handleClick()} 的问题"
```

输出：
```
🎯 直接修复模式

🔍 错误模式识别：
  - 模式：react-event-handler-invocation
  - 出现次数：3 次（触发自动沉淀）

📚 自动沉淀：
  ✅ 生成自动修复 Skill: /fix-react-event-handler-invocation
  
修复完成 ✅

💡 提示：下次可以直接使用 /fix-react-event-handler-invocation 批量修复
```

### 3. 使用自动生成的 Skill

```bash
/fix-react-event-handler-invocation
```

输出：
```
🔍 扫描项目文件...
   找到 15 个 React 组件

✅ 检测完成
   发现 5 个问题：
   - src/components/LoginButton.tsx:45
   - src/components/SubmitButton.tsx:89
   - src/pages/Login.tsx:120
   - src/pages/Register.tsx:67
   - src/components/Form.tsx:234

🔧 应用修复...
   ✅ 全部修复完成

🧪 运行测试...
   ✅ 所有测试通过

执行时间: 8.5s
```

### 4. 第五次修复（触发 ESLint 规则生成）

```bash
/oh-my-engine-bug "还是 onClick 的问题"
```

输出：
```
🎯 直接修复模式

🔍 错误模式识别：
  - 模式：react-event-handler-invocation
  - 出现次数：5 次（触发 ESLint 规则生成）

📚 自动沉淀：
  ✅ 生成 ESLint 规则: react/jsx-no-bind
  📄 配置文件: .oh-my-engine/eslint-rules.json
  
修复完成 ✅

💡 提示：建议将 ESLint 规则集成到项目中，防止此类问题
```

### 5. 第十次修复（触发 Pre-commit Hook 生成）

```bash
/oh-my-engine-bug "又又又是 onClick 的问题"
```

输出：
```
🎯 直接修复模式

🔍 错误模式识别：
  - 模式：react-event-handler-invocation
  - 出现次数：10 次（触发 Pre-commit Hook 生成）

📚 自动沉淀：
  ✅ 生成 Pre-commit Hook
  📄 脚本位置: .oh-my-engine/pre-commit-check.sh
  
修复完成 ✅

💡 提示：运行以下命令启用 Pre-commit Hook：
   ln -s ../../.oh-my-engine/pre-commit-check.sh .git/hooks/pre-commit
```

## 手动触发沉淀

### 生成自动修复 Skill

```bash
ome evolve analyze --format json
```

### 生成 ESLint 配置

```bash
ome evolve verify-skill --slug react-event-handler-invocation
```

### 生成 Pre-commit Hook

```bash
ome rules sync
```

## 查看统计信息

```bash
ome memory view --type generated-skills
```

输出：
```json
{
  "totalPatterns": 6,
  "totalOccurrences": 15,
  "skillsGenerated": 2,
  "eslintRulesGenerated": 1,
  "preCommitHooksGenerated": 1,
  "lastUpdated": "2026-04-24T10:30:00Z",
  "topPatterns": [
    {
      "id": "react-event-handler-invocation",
      "name": "React 事件处理器立即调用",
      "occurrences": 10,
      "severity": "high"
    },
    {
      "id": "async-await-missing",
      "name": "缺少 await 关键字",
      "occurrences": 5,
      "severity": "high"
    }
  ]
}
```

## 内置错误模式

1. **react-event-handler-invocation** - React 事件处理器立即调用
2. **async-await-missing** - 缺少 await 关键字
3. **react-state-mutation** - React State 直接修改
4. **useeffect-missing-deps** - useEffect 缺少依赖项
5. **memory-leak-event-listener** - 事件监听器未清理
6. **race-condition-async** - 异步操作竞态条件

## 自定义错误模式

编辑 `.oh-my-engine/bug-patterns.json` 添加自定义模式：

```json
{
  "patterns": {
    "custom-pattern-id": {
      "name": "自定义错误模式名称",
      "description": "错误描述",
      "category": "分类",
      "severity": "high|medium|low",
      "detection": {
        "regex": "正则表达式",
        "filePatterns": ["**/*.ts", "**/*.tsx"],
        "examples": ["错误示例1", "错误示例2"]
      },
      "fix": {
        "pattern": "错误模式",
        "replacement": "修复模式",
        "description": "修复说明"
      },
      "occurrences": 0,
      "lastSeen": null,
      "files": [],
      "prevention": {
        "eslintRule": {
          "name": "eslint-rule-name",
          "config": {}
        },
        "testTemplate": "tests/templates/custom.test.ts"
      },
      "autoFixAvailable": true,
      "skillGenerated": false,
      "thresholds": {
        "generateSkill": 3,
        "generateEslintRule": 5,
        "generatePreCommitHook": 10
      }
    }
  }
}
```

## 集成到项目

### 1. 启用 ESLint 规则

```bash
# 将生成的规则合并到项目的 .eslintrc.js
cat .oh-my-engine/eslint-rules.json
```

### 2. 启用 Pre-commit Hook

```bash
# 创建软链接
ln -s ../../.oh-my-engine/pre-commit-check.sh .git/hooks/pre-commit

# 或者复制文件
cp .oh-my-engine/pre-commit-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### 3. 在 CI/CD 中使用

```yaml
# .github/workflows/ci.yml
- name: Check Bug Patterns
  run: |
    for file in $(git diff --name-only origin/main...HEAD | grep -E '\.(ts|tsx|js|jsx)$'); do
      ome evolve analyze --format json
    done
```

## 最佳实践

1. **定期查看统计信息**：了解项目中最常见的错误模式
2. **及时集成 ESLint 规则**：防止问题在代码审查前就被发现
3. **使用 Pre-commit Hook**：在提交前自动检查
4. **定期更新错误模式**：根据项目实际情况调整阈值和规则
5. **团队共享**：将 `.oh-my-engine/` 目录提交到版本控制

## 故障排除

### 问题：ome CLI 无法运行

```bash
# 检查 Node.js 版本
node --version

# 重新构建运行时
npm run build
```

### 问题：Pre-commit Hook 不生效

```bash
# 检查 Hook 是否可执行
ls -la .git/hooks/pre-commit

# 重新创建软链接
rm .git/hooks/pre-commit
ln -s ../../.oh-my-engine/pre-commit-check.sh .git/hooks/pre-commit
```

### 问题：生成的 Skill 找不到

```bash
# 检查 Skill 目录
ls -la ~/.claude/skills/fix-*

# 重新生成
ome evolve analyze --format json
```

## 相关命令

- `/oh-my-engine-bug` - 分析和修复 Bug
- `/oh-my-engine-memory` - 查看 Bug 修复历史
- `/oh-my-engine-evolve` - 触发进化分析
