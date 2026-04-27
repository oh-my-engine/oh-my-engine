---
category: architecture
priority: medium
tags: [architecture, clean-code, separation-of-concerns]
applies_to: [backend, fullstack]
---

# Clean Architecture 规范

## 分层原则

```
┌─────────────────────────────────┐
│   Presentation Layer (UI/API)  │
├─────────────────────────────────┤
│   Application Layer (Use Cases)│
├─────────────────────────────────┤
│   Domain Layer (Business Logic)│
├─────────────────────────────────┤
│   Infrastructure Layer (DB/IO) │
└─────────────────────────────────┘
```

## 依赖规则

- **依赖方向**：外层依赖内层，内层不依赖外层
- **Domain Layer**：纯业务逻辑，无外部依赖
- **Application Layer**：协调业务逻辑，定义用例
- **Infrastructure Layer**：实现技术细节

## 目录结构

```
src/
├── domain/           # 领域模型和业务规则
│   ├── entities/
│   ├── value-objects/
│   └── repositories/  # 接口定义
├── application/      # 用例和应用服务
│   ├── use-cases/
│   └── services/
├── infrastructure/   # 技术实现
│   ├── database/
│   ├── http/
│   └── repositories/ # 接口实现
└── presentation/     # UI/API 层
    ├── controllers/
    └── views/
```

## 实体设计

```typescript
// domain/entities/User.ts
export class User {
  constructor(
    private readonly id: string,
    private email: Email, // Value Object
    private name: string
  ) {}

  changeEmail(newEmail: Email): void {
    // 业务规则验证
    this.email = newEmail;
  }
}
```

## 用例设计

```typescript
// application/use-cases/CreateUser.ts
export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = new User(/* ... */);
    return await this.userRepository.save(user);
  }
}
```
