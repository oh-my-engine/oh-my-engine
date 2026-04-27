---
category: ui-ux
priority: high
tags: [responsive, mobile-first, css]
applies_to: [frontend]
---

# 响应式设计规范

## Mobile-First 策略

```css
/* ✅ 从移动端开始 */
.container {
  padding: 1rem;
  font-size: 14px;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
    font-size: 16px;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## 断点定义

```css
/* 标准断点 */
:root {
  --breakpoint-sm: 640px;   /* 手机横屏 */
  --breakpoint-md: 768px;   /* 平板竖屏 */
  --breakpoint-lg: 1024px;  /* 平板横屏 */
  --breakpoint-xl: 1280px;  /* 桌面 */
  --breakpoint-2xl: 1536px; /* 大屏 */
}
```

## 流式布局

```css
/* ✅ 使用相对单位 */
.container {
  width: 100%;
  max-width: 1200px;
  padding: clamp(1rem, 5vw, 3rem);
}

.text {
  font-size: clamp(14px, 2vw, 18px);
}

/* ❌ 避免固定像素 */
.container-fixed {
  width: 1200px;  /* 在小屏幕上会溢出 */
}
```

## Flexbox 响应式

```css
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.grid-item {
  flex: 1 1 100%;  /* 移动端全宽 */
}

@media (min-width: 768px) {
  .grid-item {
    flex: 1 1 calc(50% - 0.5rem);  /* 平板两列 */
  }
}

@media (min-width: 1024px) {
  .grid-item {
    flex: 1 1 calc(33.333% - 0.667rem);  /* 桌面三列 */
  }
}
```

## Grid 响应式

```css
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

## 图片响应式

```html
<!-- 响应式图片 -->
<picture>
  <source media="(min-width: 1024px)" srcset="large.webp">
  <source media="(min-width: 768px)" srcset="medium.webp">
  <img src="small.webp" alt="Responsive image">
</picture>

<!-- 或使用 srcset -->
<img 
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Responsive image"
>
```

## 触摸友好

```css
/* 最小触摸目标 44x44px */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}

/* 增加间距 */
.nav-item {
  margin: 8px 0;
}
```

## 测试

- Chrome DevTools Device Mode
- 真机测试（iOS、Android）
- BrowserStack / Sauce Labs
