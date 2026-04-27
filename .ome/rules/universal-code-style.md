---
rule: universal-code-style
version: 1.0.0
category: universal
priority: high
severity: error
tags: [code-style, typescript, best-practices]
dependencies: []
conflicts: []
applicableWhen:
  project.language: [typescript, javascript]
autoApply: true
---

# 通用代码风格规则

## TypeScript 规范

### 1. 严格模式

```typescript
// ✅ 必须启用 strict 模式
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. 禁止使用 any

```typescript
// ❌ 禁止
function process(data: any) { }

// ✅ 必须
function process(data: unknown) { }
function process<T>(data: T) { }
```

## 函数规范

### 1. 函数长度限制

- 单个函数最多 50 行
- 超过 50 行需要拆分

### 2. 函数命名

- 使用动词开头：`getUserData`, `handleClick`, `validateForm`
- 布尔值返回：`isValid`, `hasPermission`, `canEdit`

## 组件规范

### 1. 组件文件结构

```
Component/
├── index.ts          # 导出
├── Component.tsx     # 组件逻辑
├── Component.styles.ts  # 样式（如适用）
└── Component.test.ts    # 测试（如适用）
```

### 2. 组件命名

- 使用 PascalCase：`UserProfile`, `LoginButton`
- 文件名与组件名一致

## 错误处理

### 1. 所有 API 调用必须有错误处理

```typescript
// ❌ 禁止
const data = await api.fetchUser()

// ✅ 必须
try {
  const data = await api.fetchUser()
} catch (error) {
  handleError(error)
}
```

## 安全规范

### 1. 禁止硬编码敏感信息

```typescript
// ❌ 禁止
const API_KEY = "sk-1234567890"

// ✅ 必须
const API_KEY = process.env.API_KEY
```
