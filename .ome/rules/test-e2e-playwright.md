---
category: testing
priority: medium
tags: [playwright, e2e-testing, automation]
applies_to: [frontend, fullstack]
---

# Playwright E2E 测试规范

## 测试组织

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── signup.spec.ts
│   └── dashboard/
│       └── overview.spec.ts
└── fixtures/
    └── test-data.ts
```

## Page Object 模式

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('.error-message');
  }
}

// tests/login.spec.ts
test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## 等待策略

```typescript
// 等待元素可见
await page.waitForSelector('.modal', { state: 'visible' });

// 等待网络请求
await page.waitForResponse(resp => 
  resp.url().includes('/api/users') && resp.status() === 200
);

// 等待导航
await Promise.all([
  page.waitForNavigation(),
  page.click('a[href="/about"]')
]);
```

## 测试隔离

```typescript
test.beforeEach(async ({ page }) => {
  // 清理状态
  await page.context().clearCookies();
  await page.goto('/');
});

test.afterEach(async ({ page }) => {
  // 截图（失败时）
  if (test.info().status !== 'passed') {
    await page.screenshot({ path: `screenshots/${test.info().title}.png` });
  }
});
```

## 跨浏览器测试

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } }
  ]
});
```
