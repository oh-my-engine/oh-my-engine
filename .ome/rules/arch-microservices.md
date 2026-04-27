---
category: architecture
priority: medium
tags: [microservices, distributed-systems]
applies_to: [backend]
---

# 微服务架构规范

## 服务划分原则

- **单一职责**：每个服务专注一个业务领域
- **高内聚低耦合**：服务内部紧密相关，服务间松散耦合
- **独立部署**：服务可独立开发、测试、部署
- **数据隔离**：每个服务拥有独立的数据库

## 服务通信

### 同步通信（REST/gRPC）

```typescript
// 适用场景：实时查询、命令操作
const response = await fetch('/api/users/123');
```

### 异步通信（消息队列）

```typescript
// 适用场景：事件通知、批量处理
await messageQueue.publish('user.created', { userId: '123' });
```

## API 网关

- 统一入口，路由请求到各服务
- 处理认证、限流、日志
- 聚合多个服务的响应

## 服务发现

- 使用服务注册中心（Consul、Eureka）
- 健康检查和自动故障转移
- 负载均衡

## 分布式事务

- **Saga 模式**：通过补偿事务保证最终一致性
- **事件溯源**：记录所有状态变更事件
- 避免分布式锁，使用乐观锁

## 监控和追踪

- 分布式追踪（Jaeger、Zipkin）
- 集中式日志（ELK Stack）
- 服务健康监控（Prometheus + Grafana）
