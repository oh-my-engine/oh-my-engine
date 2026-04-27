---
category: universal
priority: high
tags: [testing, quality-assurance]
applies_to: [all]
---

# 测试规范

## 测试覆盖率

- 关键业务逻辑必须有单元测试
- 公共 API 必须有集成测试
- 目标覆盖率：核心模块 ≥ 80%

## 测试结构

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle edge case', () => {
      // ...
    });
  });
});
```

## 测试原则

- **独立性**：测试之间不应相互依赖
- **可重复性**：测试结果应该稳定可重复
- **快速执行**：单元测试应在毫秒级完成
- **清晰断言**：使用明确的断言消息

## Mock 使用

- 仅 mock 外部依赖（API、数据库、文件系统）
- 避免过度 mock 导致测试失去意义
- 使用 jest.mock() 或 sinon 进行 mock

## 测试数据

- 使用 factory 或 fixture 生成测试数据
- 避免硬编码测试数据
- 测试数据应具有代表性
