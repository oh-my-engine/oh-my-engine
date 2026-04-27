---
category: api
priority: high
tags: [rest, api-design, http]
applies_to: [backend, fullstack]
---

# RESTful API 设计规范

## URL 设计

```
✅ 使用名词复数表示资源
GET    /api/users
GET    /api/users/123
POST   /api/users
PUT    /api/users/123
DELETE /api/users/123

✅ 嵌套资源
GET    /api/users/123/posts
POST   /api/users/123/posts

❌ 避免动词
GET    /api/getUsers
POST   /api/createUser
```

## HTTP 方法

- **GET**: 获取资源（幂等、安全）
- **POST**: 创建资源
- **PUT**: 完整更新资源（幂等）
- **PATCH**: 部分更新资源
- **DELETE**: 删除资源（幂等）

## 状态码

```typescript
// 成功
200 OK              // 通用成功
201 Created         // 创建成功
204 No Content      // 删除成功

// 客户端错误
400 Bad Request     // 请求参数错误
401 Unauthorized    // 未认证
403 Forbidden       // 无权限
404 Not Found       // 资源不存在
422 Unprocessable   // 验证失败

// 服务器错误
500 Internal Error  // 服务器错误
503 Service Unavailable
```

## 请求/响应格式

```typescript
// 请求
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe"
}

// 成功响应
HTTP/1.1 201 Created
Content-Type: application/json

{
  "data": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}

// 错误响应
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

## 分页

```typescript
GET /api/users?page=2&limit=20

{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 过滤和排序

```
GET /api/users?status=active&sort=-createdAt&fields=id,name,email
```

## 版本控制

```
# URL 版本
GET /api/v1/users

# Header 版本
GET /api/users
Accept: application/vnd.api+json; version=1
```

## 认证

```typescript
// Bearer Token
Authorization: Bearer <token>

// API Key
X-API-Key: <key>
```
