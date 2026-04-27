---
rule: universal-performance
version: 1.0.0
category: universal
priority: medium
severity: warning
tags: [performance, optimization, best-practices]
dependencies: []
conflicts: []
applicableWhen:
  project.type: [web-app, mobile-app]
autoApply: true
---

# 性能优化规范

## 强制要求

### 1. 避免不必要的重渲染

```typescript
// ❌ 禁止 - 每次都创建新对象
function Component() {
  return <Child config={{ theme: 'dark' }} />;
}

// ✅ 必须 - 使用 useMemo
function Component() {
  const config = useMemo(() => ({ theme: 'dark' }), []);
  return <Child config={config} />;
}
```

### 2. 使用懒加载

```typescript
// ✅ 推荐 - 代码分割
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 3. 图片优化

```typescript
// ✅ 推荐
<Image
  source={{ uri: imageUrl }}
  style={{ width: 200, height: 200 }}
  resizeMode="cover"
  // React Native
  defaultSource={require('./placeholder.png')}
/>
```

## 验证清单

- [ ] 避免不必要的重渲染
- [ ] 使用懒加载和代码分割
- [ ] 图片已优化
- [ ] 实现了适当的缓存策略
