---
name: oh-my-engine-api
version: 1.0.0
description: 集成 API 接口
author: yunxi
tags: [api, integration, openapi, swagger]
---

# oh-my-engine-api

快速集成和测试 API 接口。

## 使用方法

```bash
/oh-my-engine-api <api-spec> [options]
```

## 参数

- `api-spec`: API 规范（URL 或文件路径）
- `--service`: 服务名称（可选）

## 示例

```bash
# OpenAPI 规范
/oh-my-engine-api https://api.example.com/openapi.json

# 本地文件
/oh-my-engine-api ./specs/user-api.yaml

# 指定服务名
/oh-my-engine-api ./specs/user-api.yaml --service UserService
```

## 执行流程

1. **解析 API 规范**
   - 读取 API 规范（OpenAPI/Swagger）
   - 提取接口定义
   - 生成类型定义

2. **生成服务代码**
   - 生成 API 客户端
   - 生成请求/响应类型
   - 生成错误处理

3. **生成测试**
   - 生成单元测试
   - 生成集成测试
   - 生成 Mock 数据

4. **验证**
   - 运行测试
   - 检查类型
   - 验证错误处理

## 配置

### 项目配置（.oh-my-engine/config.json）

```json
{
  "workflows": {
    "api-integration": {
      "enabled": true,
      "rules": ["code-style", "error-handling"],
      "options": {
        "outputDir": "src/services",
        "baseURL": "https://api.example.com",
        "generateMocks": true,
        "generateTests": true
      }
    }
  }
}
```

## 输出示例

```
✅ API 集成完成

生成的文件：
  - src/services/UserService.ts
  - src/services/__tests__/UserService.test.ts
  - src/types/UserService.d.ts
  - src/mocks/UserService.mock.ts

接口数量：12 个
测试覆盖率：95%

执行时间: 5.8s
```

## 自动学习

系统会自动记录 API 集成历史：

- **错误处理模式重复 ≥3 次** → 生成错误处理 Skill
- **请求模式复用 ≥3 处** → 提取为工具函数
- **成功率 ≥95%** → 固化为最佳实践

## 相关命令

- `/oh-my-engine-memory` - 查看集成历史
- `/oh-my-engine-evolve` - 触发进化分析

---

**提示**：这个命令会学习你的 API 模式，自动优化！
