---
rule: code-style
version: 1.0.0
description: 代码风格规则模板
category: code-quality
---

# 代码风格规则模板

确保代码风格一致，易于维护。

## 规则说明

### 1. 命名规范
```
✅ 组件：PascalCase
- LoginButton, UserProfile, DataTable

✅ 函数/变量：camelCase
- getUserData, isLoading, handleClick

✅ 常量：UPPER_SNAKE_CASE
- API_BASE_URL, MAX_RETRY_COUNT

✅ 文件名：
- 组件：PascalCase.tsx (LoginButton.tsx)
- 工具：camelCase.ts (formatDate.ts)
- 类型：PascalCase.d.ts (User.d.ts)
```

### 2. 文件结构
```typescript
// 1. 导入（按类型分组）
import React from 'react';
import { View, Text } from 'react-native';

import { Button } from '@/components';
import { useAuth } from '@/hooks';

import { formatDate } from '@/utils';
import type { User } from '@/types';

// 2. 类型定义
interface Props {
  user: User;
  onPress: () => void;
}

// 3. 组件定义
export const UserCard: React.FC<Props> = ({ user, onPress }) => {
  // 4. Hooks
  const { isAuthenticated } = useAuth();
  
  // 5. 事件处理
  const handlePress = () => {
    onPress();
  };
  
  // 6. 渲染
  return (
    <View>
      <Text>{user.name}</Text>
      <Button onPress={handlePress} />
    </View>
  );
};
```

### 3. 注释规范
```typescript
// ✅ 好的注释：解释为什么
// 使用 setTimeout 避免 React 18 的批处理导致状态更新丢失
setTimeout(() => setData(newData), 0);

// ❌ 坏的注释：重复代码
// 设置数据
setData(newData);

// ✅ 复杂逻辑需要注释
// 计算折扣：会员享受 8 折，新用户首单 9 折，两者可叠加
const discount = (isMember ? 0.8 : 1) * (isFirstOrder ? 0.9 : 1);
```

### 4. 函数规范
```typescript
// ✅ 单一职责
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ 提前返回
function getUserName(user?: User): string {
  if (!user) return 'Guest';
  if (!user.name) return 'Anonymous';
  return user.name;
}

// ✅ 避免嵌套
function processData(data: Data[]): Result[] {
  if (!data.length) return [];
  
  const filtered = data.filter(item => item.isValid);
  const mapped = filtered.map(item => transform(item));
  return mapped;
}
```

### 5. 避免的模式
```typescript
// ❌ 魔法数字
if (status === 1) { }

// ✅ 使用常量
const STATUS_ACTIVE = 1;
if (status === STATUS_ACTIVE) { }

// ❌ 过长的函数
function doEverything() {
  // 100+ lines
}

// ✅ 拆分为小函数
function validateInput() { }
function processData() { }
function saveResult() { }

// ❌ 深层嵌套
if (a) {
  if (b) {
    if (c) {
      // ...
    }
  }
}

// ✅ 提前返回
if (!a) return;
if (!b) return;
if (!c) return;
// ...
```

## 验证规则

### 检查项
1. 命名是否符合规范
2. 文件结构是否正确
3. 是否有无用的注释
4. 函数是否过长（> 50 行）
5. 是否有深层嵌套（> 3 层）
6. 是否有魔法数字

### 自动修复
```javascript
// 检测命名不规范
function checkNaming(name, type) {
  const patterns = {
    component: /^[A-Z][a-zA-Z0-9]*$/,
    function: /^[a-z][a-zA-Z0-9]*$/,
    constant: /^[A-Z][A-Z0-9_]*$/,
  };
  return patterns[type].test(name);
}

// 自动格式化
function autoFormat(code) {
  // 使用 Prettier
  return prettier.format(code, {
    parser: 'typescript',
    singleQuote: true,
    trailingComma: 'es5',
  });
}
```

## 项目配置示例

```json
{
  "code_style": {
    "enabled": true,
    "naming": {
      "component": "PascalCase",
      "function": "camelCase",
      "constant": "UPPER_SNAKE_CASE"
    },
    "max_function_length": 50,
    "max_nesting_depth": 3,
    "require_types": true,
    "auto_format": true,
    "formatter": "prettier"
  }
}
```

## 学习和进化

### 模式识别
- 某个命名模式总是被使用 → 固化为标准
- 某个代码模式复用率高 → 提取为模板
- 某个错误总是出现 → 生成自动修复规则

### Skill 生成触发
- 命名不规范 ≥ 5 次 → 生成 auto-fix-naming skill
- 函数过长 ≥ 3 次 → 生成 function-splitter skill

---

**提示**：一致的代码风格让团队协作更高效！
