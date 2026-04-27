---
rule: universal-security
version: 1.0.0
category: universal
priority: critical
severity: error
tags: [security, best-practices, owasp]
dependencies: [universal-code-style]
conflicts: []
applicableWhen:
  project.type: [web-app, mobile-app, api]
autoApply: true
---

# 安全规范

## 强制要求

### 1. 禁止硬编码敏感信息

```typescript
// ❌ 禁止
const API_KEY = 'sk-1234567890abcdef';
const DB_PASSWORD = 'mypassword123';

// ✅ 必须
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
```

### 2. 输入验证和清理

```typescript
// ❌ 禁止 - 直接使用用户输入
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 必须 - 使用参数化查询
const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [userId]);

// ✅ 必须 - 验证输入
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

if (!validateEmail(userEmail)) {
  throw new Error('Invalid email format');
}
```

### 3. XSS 防护

```typescript
// ❌ 禁止 - 直接插入 HTML
element.innerHTML = userInput;

// ✅ 必须 - 使用文本内容
element.textContent = userInput;

// ✅ 必须 - 使用框架的安全方法
<Text>{userInput}</Text>  // React Native 自动转义

// ✅ 必须 - 清理 HTML
import DOMPurify from 'dompurify';
const cleanHTML = DOMPurify.sanitize(userInput);
```

### 4. CSRF 防护

```typescript
// ✅ 必须 - 使用 CSRF Token
const response = await fetch('/api/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(),
  },
  body: JSON.stringify(data),
});
```

## 认证和授权

### 1. 安全存储令牌

```typescript
// ❌ 禁止 - localStorage 存储敏感令牌
localStorage.setItem('authToken', token);

// ✅ 必须 - 使用 HttpOnly Cookie 或安全存储
// React Native
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('authToken', token);

// Web
// 使用 HttpOnly Cookie（后端设置）
```

### 2. 验证用户权限

```typescript
// ✅ 必须
function checkPermission(user: User, action: string): boolean {
  return user.permissions.includes(action);
}

if (!checkPermission(currentUser, 'delete:post')) {
  throw new Error('Unauthorized');
}
```

## API 安全

### 1. 使用 HTTPS

```typescript
// ❌ 禁止
const API_URL = 'http://api.example.com';

// ✅ 必须
const API_URL = 'https://api.example.com';
```

### 2. 实现速率限制

```typescript
// ✅ 推荐 - 客户端防抖
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  await api.search(query);
}, 300);
```

### 3. 验证响应数据

```typescript
// ✅ 必须
const response = await api.fetchUser(userId);

if (!response || typeof response.id !== 'number') {
  throw new Error('Invalid response format');
}
```

## 密码安全

### 1. 密码强度要求

```typescript
// ✅ 必须
function validatePassword(password: string): boolean {
  // 至少 8 个字符，包含大小写字母、数字和特殊字符
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}
```

### 2. 不在客户端验证密码

```typescript
// ❌ 禁止 - 客户端密码验证
if (password === storedPassword) { /* ... */ }

// ✅ 必须 - 发送到服务器验证
const response = await api.login(username, password);
```

## 数据加密

### 1. 加密敏感数据

```typescript
// ✅ 推荐
import CryptoJS from 'crypto-js';

function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

function decryptData(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

## 验证清单

生成代码后必须检查：

- [ ] 没有硬编码的 API 密钥、密码或令牌
- [ ] 所有用户输入都经过验证和清理
- [ ] 使用了 XSS 和 CSRF 防护
- [ ] 敏感数据使用安全存储
- [ ] API 调用使用 HTTPS
- [ ] 实现了适当的认证和授权检查
- [ ] 密码符合强度要求
- [ ] 敏感数据在传输和存储时加密
