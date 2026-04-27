---
category: performance
priority: high
tags: [web-vitals, performance, user-experience]
applies_to: [frontend]
---

# Web Vitals 性能优化规范

## Core Web Vitals 指标

### LCP (Largest Contentful Paint)

**目标**: < 2.5s

优化策略：
- 优化服务器响应时间
- 使用 CDN 加速资源加载
- 预加载关键资源：`<link rel="preload">`
- 优化图片：WebP 格式、响应式图片、懒加载

```html
<link rel="preload" as="image" href="hero.webp">
<img src="hero.webp" alt="Hero" loading="lazy">
```

### FID (First Input Delay)

**目标**: < 100ms

优化策略：
- 减少 JavaScript 执行时间
- 代码分割，延迟加载非关键 JS
- 使用 Web Workers 处理计算密集任务
- 避免长任务（> 50ms）

```typescript
// 使用 requestIdleCallback 延迟非关键任务
requestIdleCallback(() => {
  // 非关键初始化
  initAnalytics();
});
```

### CLS (Cumulative Layout Shift)

**目标**: < 0.1

优化策略：
- 为图片和视频设置明确的宽高
- 避免在现有内容上方插入内容
- 使用 CSS `aspect-ratio` 预留空间
- 字体加载使用 `font-display: swap`

```css
img {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2');
  font-display: swap;
}
```

## 监控和测量

```typescript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
```

## 性能预算

```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 300 },
        { "resourceType": "total", "budget": 1000 }
      ]
    }
  ]
}
```
