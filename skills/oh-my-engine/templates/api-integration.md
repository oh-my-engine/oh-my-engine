---
workflow: api-integration
version: 1.0.0
description: 集成 API 接口
rules: [code-style, error-handling]
mcps: []
skills: []
---

# API 集成工作流

快速集成和测试 API 接口。

## 输入参数

- `api_spec`: API 规范（URL 或文件路径）
- `service_name`: 服务名称（可选）

## 执行步骤

### Step 1: 解析 API 规范
```
1. 读取 API 规范（OpenAPI/Swagger）
2. 提取接口定义
3. 生成类型定义
```

### Step 2: 生成服务代码
```
1. 生成 API 客户端
2. 生成请求/响应类型
3. 生成错误处理
```

### Step 3: 生成测试
```
1. 生成单元测试
2. 生成集成测试
3. 生成 Mock 数据
```

### Step 4: 验证
```
1. 运行测试
2. 检查类型
3. 验证错误处理
```

## 输出结果

```json
{
  "success": true,
  "service_name": "UserService",
  "files_created": [
    "services/UserService.ts",
    "services/__tests__/UserService.test.ts",
    "types/UserService.d.ts"
  ],
  "execution_time": "5.8s"
}
```

## 示例用法

```bash
/oh-my-engine api-integration https://api.example.com/openapi.json
/oh-my-engine api-integration ./specs/user-api.yaml --service UserService
```
