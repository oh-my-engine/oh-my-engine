---
workflow: component-gen
version: 1.0.0
description: 生成可复用组件
rules: [code-style, design-tokens, theme]
mcps: []
skills: []
---

# 组件生成工作流

快速生成符合项目规范的可复用组件。

## 输入参数

- `component_name`: 组件名称（必填）
- `component_type`: 组件类型（可选：button/input/card/modal/form）
- `props`: 组件属性（可选）

## 执行步骤

### Step 1: 分析需求
```
1. 解析组件名称
2. 推断组件类型
3. 确定组件属性
4. 检查是否已存在
```

### Step 2: 生成组件代码
```
1. 生成组件文件
2. 生成样式文件
3. 生成类型定义
4. 生成测试文件
```

### Step 3: 应用规则
```
1. 应用 code-style 规则
2. 应用 design-tokens 规则
3. 应用 theme 规则
```

### Step 4: 验证
```
1. 检查语法错误
2. 运行测试
3. 检查样式
```

## 输出结果

```json
{
  "success": true,
  "component_name": "CustomButton",
  "files_created": [
    "components/CustomButton/index.tsx",
    "components/CustomButton/styles.module.css",
    "components/CustomButton/CustomButton.test.tsx"
  ],
  "execution_time": "3.5s"
}
```

## 示例用法

```bash
/oh-my-engine component-gen CustomButton
/oh-my-engine component-gen LoginForm --type form
```
