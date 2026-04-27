---
category: ui-ux
priority: critical
tags: [accessibility, a11y, wcag]
applies_to: [frontend]
---

# 无障碍访问规范

## WCAG 2.1 AA 标准

### 语义化 HTML

```html
<!-- ✅ 使用语义化标签 -->
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>

<!-- ❌ 避免过度使用 div -->
<div class="nav">
  <div class="link">Home</div>
</div>
```

### ARIA 属性

```html
<!-- 按钮状态 -->
<button aria-pressed="false" aria-label="Toggle menu">
  Menu
</button>

<!-- 表单标签 -->
<label for="email">Email</label>
<input 
  id="email" 
  type="email" 
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error"
>
<span id="email-error" role="alert"></span>

<!-- 模态框 -->
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Action</h2>
</div>
```

### 键盘导航

```typescript
function Dropdown() {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        toggleDropdown();
        break;
      case 'Escape':
        closeDropdown();
        break;
      case 'ArrowDown':
        focusNextItem();
        break;
      case 'ArrowUp':
        focusPreviousItem();
        break;
    }
  };

  return (
    <div role="menu" onKeyDown={handleKeyDown}>
      {/* menu items */}
    </div>
  );
}
```

### 颜色对比度

- **正常文本**: 对比度 ≥ 4.5:1
- **大文本** (18pt+): 对比度 ≥ 3:1
- **图标和图形**: 对比度 ≥ 3:1

```css
/* ✅ 足够的对比度 */
.text {
  color: #333;           /* 深灰 */
  background: #fff;      /* 白色 */
  /* 对比度: 12.6:1 */
}

/* ❌ 对比度不足 */
.text-low-contrast {
  color: #999;           /* 浅灰 */
  background: #fff;      /* 白色 */
  /* 对比度: 2.8:1 */
}
```

### 焦点指示器

```css
/* ✅ 清晰的焦点样式 */
button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ❌ 不要移除焦点样式 */
button:focus {
  outline: none; /* 禁止 */
}
```

## 测试工具

- **axe DevTools**: 浏览器扩展
- **WAVE**: 在线检测工具
- **Lighthouse**: Chrome DevTools
- **Screen Reader**: NVDA (Windows), VoiceOver (Mac)

```typescript
// 自动化测试
import { axe } from 'jest-axe';

test('should have no accessibility violations', async () => {
  const { container } = render(<App />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
