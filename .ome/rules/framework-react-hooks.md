---
rule: framework-react-hooks
version: 1.0.0
category: framework/react
priority: high
severity: error
tags: [react, hooks, best-practices]
dependencies: [universal-code-style]
conflicts: []
applicableWhen:
  project.framework: [react, react-native, nextjs]
autoApply: true
---

# React Hooks 规范

## 强制要求

### 1. Hooks 只能在函数顶层调用

```typescript
// ❌ 禁止 - 在条件语句中调用
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // 错误
  }
}

// ✅ 必须 - 在函数顶层调用
function Component() {
  const [state, setState] = useState(0);
  
  if (condition) {
    // 使用 state
  }
}
```

### 2. useEffect 依赖数组必须完整

```typescript
// ❌ 禁止 - 缺少依赖
useEffect(() => {
  fetchData(userId);
}, []); // userId 应该在依赖数组中

// ✅ 必须 - 包含所有依赖
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### 3. 自定义 Hooks 必须以 use 开头

```typescript
// ❌ 禁止
function fetchUser() {
  const [user, setUser] = useState(null);
  // ...
  return user;
}

// ✅ 必须
function useUser() {
  const [user, setUser] = useState(null);
  // ...
  return user;
}
```

## 性能优化

### 1. 使用 useCallback 缓存函数

```typescript
// ✅ 推荐
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### 2. 使用 useMemo 缓存计算结果

```typescript
// ✅ 推荐
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

## 验证清单

- [ ] 所有 Hooks 在函数顶层调用
- [ ] useEffect 依赖数组完整
- [ ] 自定义 Hooks 以 use 开头
- [ ] 使用 useCallback 和 useMemo 优化性能
