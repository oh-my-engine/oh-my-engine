---
category: performance
priority: high
tags: [bundling, webpack, optimization]
applies_to: [frontend]
---

# Bundle 优化规范

## 代码分割

### 路由级分割

```typescript
// React Router
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile" element={<Profile />} />
  </Routes>
</Suspense>
```

### 组件级分割

```typescript
// 按需加载大型组件
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<Spinner />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

## Tree Shaking

```typescript
// ✅ 使用具名导入
import { debounce } from 'lodash-es';

// ❌ 避免默认导入整个库
import _ from 'lodash';
```

## 依赖优化

```json
// package.json
{
  "dependencies": {
    "lodash-es": "^4.17.21",  // ✅ ES 模块版本
    "date-fns": "^2.29.0"     // ✅ 支持 tree shaking
  }
}
```

## Webpack 配置

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    runtimeChunk: 'single'
  }
};
```

## 分析工具

```bash
# Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# 生成分析报告
webpack --profile --json > stats.json
webpack-bundle-analyzer stats.json
```

## 性能目标

- 首屏 JS < 200KB (gzipped)
- 总 bundle 大小 < 1MB
- 单个 chunk < 500KB
