---
rule: universal-error-handling
version: 1.0.0
category: universal
priority: high
severity: error
tags: [error-handling, best-practices, reliability]
dependencies: [universal-code-style]
conflicts: []
applicableWhen:
  project.language: [typescript, javascript]
autoApply: true
---

# 错误处理规范

## 强制要求

### 1. 所有异步操作必须有错误处理

```typescript
// ❌ 禁止
const data = await api.fetchUser();

// ✅ 必须
try {
  const data = await api.fetchUser();
  // 处理数据
} catch (error) {
  console.error('Failed to fetch user:', error);
  // 错误处理逻辑
}
```

### 2. 使用类型化的错误处理

```typescript
// ✅ 推荐
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

try {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new ApiError(
      'Failed to fetch users',
      response.status,
      'FETCH_ERROR'
    );
  }
} catch (error) {
  if (error instanceof ApiError) {
    // 处理 API 错误
  } else {
    // 处理其他错误
  }
}
```

### 3. React 组件必须使用错误边界

```typescript
// ✅ 必须
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 上报错误到监控系统
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## 错误日志记录

### 1. 记录关键信息

```typescript
// ✅ 推荐
function logError(error: Error, context?: Record<string, any>) {
  console.error({
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

try {
  await processPayment(orderId);
} catch (error) {
  logError(error as Error, {
    orderId,
    userId: currentUser.id,
    action: 'processPayment',
  });
}
```

### 2. 避免敏感信息泄露

```typescript
// ❌ 禁止
console.error('Login failed:', { password: userPassword });

// ✅ 必须
console.error('Login failed:', { userId: user.id });
```

## 用户友好的错误提示

### 1. 提供清晰的错误消息

```typescript
// ❌ 禁止
throw new Error('Error');

// ✅ 必须
throw new Error('无法加载用户数据，请检查网络连接后重试');
```

### 2. 提供错误恢复选项

```typescript
// ✅ 推荐
function ErrorFallback({ error, resetError }: Props) {
  return (
    <View>
      <Text>出错了：{error.message}</Text>
      <Button onPress={resetError}>重试</Button>
    </View>
  );
}
```

## 验证清单

生成代码后必须检查：

- [ ] 所有 async/await 操作都有 try-catch
- [ ] 错误对象包含足够的上下文信息
- [ ] 使用了错误边界保护 React 组件树
- [ ] 错误日志不包含敏感信息
- [ ] 用户看到的错误消息清晰易懂
- [ ] 提供了错误恢复机制（重试、回退等）
