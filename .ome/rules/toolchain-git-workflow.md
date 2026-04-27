---
category: toolchain
priority: high
tags: [git, version-control, workflow]
applies_to: [all]
---

# Git 工作流规范

## 分支策略

```
main (production)
  ├── develop (integration)
  │   ├── feature/user-auth
  │   ├── feature/payment
  │   └── bugfix/login-error
  └── hotfix/critical-bug
```

## 分支命名

```bash
# 功能分支
feature/user-authentication
feature/payment-integration

# 修复分支
bugfix/login-validation
hotfix/security-patch

# 发布分支
release/v1.2.0
```

## Commit 规范

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- **feat**: 新功能
- **fix**: Bug 修复
- **docs**: 文档更新
- **style**: 代码格式（不影响功能）
- **refactor**: 重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建/工具配置

### 示例

```bash
feat(auth): add JWT authentication

Implement JWT-based authentication system with refresh tokens.

Closes #123
```

```bash
fix(api): handle null response in user endpoint

Previously, the endpoint would crash when user data was null.
Now returns 404 with proper error message.

Fixes #456
```

## 工作流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature develop

# 2. 开发并提交
git add .
git commit -m "feat: add new feature"

# 3. 保持同步
git fetch origin
git rebase origin/develop

# 4. 推送分支
git push origin feature/new-feature

# 5. 创建 Pull Request
# 在 GitHub/GitLab 上创建 PR

# 6. 合并后删除分支
git branch -d feature/new-feature
```

## Pull Request 规范

### PR 标题

```
feat: Add user authentication system
fix: Resolve login validation bug
docs: Update API documentation
```

### PR 描述模板

```markdown
## 变更说明
简要描述本次变更的内容和目的

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

## 相关 Issue
Closes #123

## 截图（如适用）
```

## 最佳实践

- **小而频繁的提交**：每个 commit 只做一件事
- **有意义的提交信息**：清晰描述变更内容
- **及时同步**：定期 rebase 主分支
- **代码审查**：所有代码必须经过 PR 审查
- **保持历史清晰**：使用 rebase 而非 merge（功能分支）
