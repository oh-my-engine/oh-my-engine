---
category: testing
priority: high
tags: [jest, unit-testing, javascript]
applies_to: [javascript, typescript]
---

# Jest 单元测试规范

## 测试文件组织

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx    # 测试文件与源文件同目录
└── utils/
    ├── format.ts
    └── format.test.ts
```

## 基本结构

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Mock 策略

```typescript
// Mock 模块
jest.mock('./api', () => ({
  fetchUser: jest.fn()
}));

// Mock 实现
import { fetchUser } from './api';
(fetchUser as jest.Mock).mockResolvedValue({ id: 1, name: 'John' });

// 清理 mock
afterEach(() => {
  jest.clearAllMocks();
});
```

## 异步测试

```typescript
it('loads data asynchronously', async () => {
  const promise = fetchData();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await promise;
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

## 快照测试

```typescript
it('matches snapshot', () => {
  const { container } = render(<Component />);
  expect(container).toMatchSnapshot();
});
```

## 覆盖率配置

```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.test.{ts,tsx}",
      "!src/**/*.d.ts"
    ],
    "coverageThresholds": {
      "global": {
        "branches": 70,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```
