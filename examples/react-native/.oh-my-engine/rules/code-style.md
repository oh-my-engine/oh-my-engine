# 代码风格规则（Code Style）

## TypeScript 规范

### 1. 严格模式

```typescript
// tsconfig.json 已启用严格模式
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 2. 禁止使用 any 类型

```typescript
// ❌ 禁止
function handleData(data: any) {
  return data.value
}

// ✅ 必须
interface DataType {
  value: string
}

function handleData(data: DataType) {
  return data.value
}
```

### 3. 函数不超过 50 行

```typescript
// ❌ 禁止：函数过长
function processUserData(user: User) {
  // ... 100 行代码
}

// ✅ 必须：拆分为多个小函数
function validateUser(user: User): boolean { /* ... */ }
function transformUser(user: User): TransformedUser { /* ... */ }
function saveUser(user: TransformedUser): Promise<void> { /* ... */ }

function processUserData(user: User) {
  if (!validateUser(user)) return
  const transformed = transformUser(user)
  await saveUser(transformed)
}
```

### 4. 路径别名

```typescript
// ✅ 使用路径别名
import { Button } from "app/components/Button"
import { useAuth } from "app/hooks/useAuth"
import { colors } from "app/theme"

// ❌ 禁止相对路径（跨多层目录时）
import { Button } from "../../../components/Button"
```

## React Native 规范

### 1. 禁止嵌套滚动组件

```typescript
// ❌ 禁止
<ScrollView>
  <FlatList data={items} />
</ScrollView>

<FlatList
  data={items}
  ListHeaderComponent={
    <ScrollView>
      <Text>Header</Text>
    </ScrollView>
  }
/>

// ✅ 必须
<Screen preset="scroll">
  <FlatList
    data={items}
    ListHeaderComponent={<Text>Header</Text>}
  />
</Screen>
```

### 2. Screen 组件使用规范

```typescript
// ✅ 默认可滚动
<Screen preset="scroll">
  <Content />
</Screen>

// ✅ 固定布局（必须加 contentContainerStyle）
<Screen 
  preset="fixed"
  contentContainerStyle={{ flex: 1 }}
>
  <Content />
</Screen>
```

### 3. 防止 ReferenceError

```typescript
// ❌ 禁止：变量未定义
function MyComponent() {
  return <Text>{userName}</Text>  // userName 未定义
}

// ✅ 必须：确保变量已定义
function MyComponent({ userName }: { userName: string }) {
  return <Text>{userName}</Text>
}
```

## 组件架构规范

### 1. 文件组织

```
ComponentName/
├── index.ts              # 导出
├── ComponentName.tsx     # 组件逻辑
└── ComponentName.styles.ts  # 样式定义
```

### 2. 组件导出

```typescript
// index.ts
export { ComponentName } from "./ComponentName"
export type { ComponentNameProps } from "./ComponentName"
```

### 3. Props 类型定义

```typescript
// ✅ 必须定义 Props 接口
export interface ComponentNameProps {
  title: string
  onPress?: () => void
  disabled?: boolean
}

export function ComponentName({ title, onPress, disabled }: ComponentNameProps) {
  // ...
}
```

## 注释规范

### 1. 公共函数必须有 JSDoc

```typescript
/**
 * 验证用户输入的手机号
 * @param phoneNumber - 手机号字符串
 * @returns 是否有效
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  return /^1[3-9]\d{9}$/.test(phoneNumber)
}
```

### 2. 复杂逻辑添加注释

```typescript
// ✅ 解释为什么这样做
// iOS Modal 关闭后需要等待动画结束（350ms）再清理 payload
setTimeout(() => {
  navigation.goBack()
}, 350)
```

## 命名规范

### 1. 组件命名

```typescript
// ✅ PascalCase
export function UserProfile() { }
export function LoginButton() { }
```

### 2. 函数命名

```typescript
// ✅ camelCase，动词开头
function handlePress() { }
function validateInput() { }
function fetchUserData() { }
```

### 3. 常量命名

```typescript
// ✅ UPPER_SNAKE_CASE（全局常量）
const MAX_RETRY_COUNT = 3
const API_BASE_URL = "https://api.example.com"

// ✅ camelCase（局部常量）
const defaultTimeout = 5000
```

### 4. 样式命名

```typescript
// ✅ $ 前缀 + camelCase
const $container: ThemedStyle<ViewStyle> = () => ({ })
const $submitButton: ThemedStyle<ViewStyle> = () => ({ })
```

## 错误处理

### 1. API 错误处理

```typescript
// ✅ 区分 HTTP 错误和业务错误
try {
  const response = await api.auth.login(data)
  if (isApiSuccess(response)) {
    // 业务成功
  } else {
    // 业务失败
    handleBusinessError(response.resultMsg)
  }
} catch (err: any) {
  // HTTP 错误
  Alert.alert("网络错误", err.message || "请检查网络连接")
}
```

### 2. 输入验证

```typescript
// ✅ 所有外部输入需校验
function processUserInput(input: string) {
  if (!input || input.trim().length === 0) {
    throw new Error("输入不能为空")
  }
  // 处理输入
}
```

## 性能优化

### 1. 避免不必要的重渲染

```typescript
// ✅ 使用 React.memo
export const ExpensiveComponent = React.memo(function ExpensiveComponent(props) {
  // ...
})

// ✅ 使用 useCallback
const handlePress = useCallback(() => {
  // ...
}, [dependencies])
```

### 2. 列表优化

```typescript
// ✅ 使用 keyExtractor
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
/>
```

## 验证清单

提交代码前必须检查：

- [ ] TypeScript 类型完整，无 `any`
- [ ] 函数不超过 50 行
- [ ] 使用路径别名（`app/*`）
- [ ] 无嵌套滚动组件
- [ ] Screen 组件使用正确
- [ ] 公共函数有 JSDoc 注释
- [ ] 命名符合规范
- [ ] 错误处理完整
- [ ] `yarn lint` 通过
- [ ] `yarn compile` 通过

## 相关命令

```bash
# 类型检查
yarn compile

# 代码检查
yarn lint

# 自动修复
yarn lint --fix
```

## 相关文件

- TypeScript 配置：`tsconfig.json`
- ESLint 配置：`.eslintrc.js`
- 路径别名配置：`tsconfig.json` 中的 `paths`
