---
category: universal
priority: medium
tags: [documentation, comments, readme]
applies_to: [all]
---

# 文档规范

## README.md 结构

```markdown
# 项目名称

简短描述项目的目的和功能

## 功能特性

- 功能 1
- 功能 2
- 功能 3

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

\`\`\`bash
npm install
\`\`\`

### 运行

\`\`\`bash
npm run dev
\`\`\`

## 使用示例

\`\`\`typescript
import { example } from 'package';

example();
\`\`\`

## API 文档

详见 [API.md](./docs/API.md)

## 贡献指南

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 许可证

MIT
```

## 代码注释

### 何时写注释

```typescript
// ✅ 解释"为什么"，而非"是什么"
// 使用 debounce 避免频繁的 API 调用导致服务器压力
const debouncedSearch = debounce(search, 300);

// ❌ 不要重复代码
// 创建一个用户对象
const user = { name: 'John' };
```

### JSDoc 注释

```typescript
/**
 * 计算两个数的和
 * 
 * @param a - 第一个数字
 * @param b - 第二个数字
 * @returns 两数之和
 * 
 * @example
 * ```typescript
 * add(1, 2); // 3
 * ```
 */
function add(a: number, b: number): number {
  return a + b;
}
```

### 复杂逻辑注释

```typescript
/**
 * 计算用户的信用评分
 * 
 * 算法说明：
 * 1. 基础分 600
 * 2. 按时还款记录 +10/次（最多 +200）
 * 3. 逾期记录 -50/次
 * 4. 账户年龄 +5/年（最多 +100）
 */
function calculateCreditScore(user: User): number {
  // 实现...
}
```

## API 文档

### OpenAPI/Swagger

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /users:
    get:
      summary: 获取用户列表
      parameters:
        - name: page
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

## 变更日志 (CHANGELOG.md)

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- 新增用户认证功能
- 支持 OAuth 登录

### Changed
- 优化数据库查询性能

### Fixed
- 修复登录页面样式问题

### Deprecated
- `oldMethod()` 将在 v2.0 移除

## [1.1.0] - 2024-01-01
...
```

## 架构文档

```markdown
# 架构设计

## 系统架构图

\`\`\`
┌─────────┐     ┌─────────┐     ┌──────────┐
│ Client  │────▶│   API   │────▶│ Database │
└─────────┘     └─────────┘     └──────────┘
\`\`\`

## 技术栈

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL

## 设计决策

### 为什么选择 PostgreSQL？

- 需要复杂查询和事务支持
- 数据结构相对固定
- 团队熟悉 SQL
```
