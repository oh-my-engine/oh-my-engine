---
name: ome-comp
version: 1.0.0
description: 生成可复用组件
author: yunxi
tags: [component, generator, react, react-native]
---

# ome-comp

快速生成符合项目规范的可复用组件。

## 使用方法

```bash
/ome-comp <component-name> [options]
ome guidance component-gen --input "<component-name>"
```

Claude Code 可直接使用上面的 slash command。
Codex 请按技能名 `ome-comp` 触发，并沿用相同参数。

## 参数

- `component-name`: 组件名称（必填）
- `--type`: 组件类型（可选：button/input/card/modal/form）
- `--props`: 组件属性（可选）

## 示例

```bash
# 基础用法
/ome-comp CustomButton

# 指定类型
/ome-comp LoginForm --type form

# 带属性
/ome-comp UserCard --props "name:string,avatar:string,onPress:function"
```

## 执行流程

1. **分析需求**
   - 先运行/读取 `ome guidance component-gen --input "<component-name>"` 加载 adopted learnings / generated skill directives
   - 解析组件名称
   - 推断组件类型
   - 确定组件属性
   - 检查是否已存在

2. **生成组件代码**
   - 生成组件文件
   - 生成样式文件
   - 生成类型定义
   - 生成测试文件

3. **应用规则**
   - 应用 code-style 规则
   - 应用 design-tokens 规则
   - 应用 theme 规则

4. **验证**
   - 检查语法错误
   - 运行测试
   - 检查样式

## 配置

### 项目配置（.ome/config.json）

```json
{
  "workflows": {
    "component-gen": {
      "enabled": true,
      "rules": ["code-style", "design-tokens", "theme"],
      "options": {
        "outputDir": "src/components",
        "componentLibrary": "react-native",
        "styleType": "styled-components",
        "generateTests": true
      }
    }
  }
}
```

## 输出示例

```
✅ 组件生成完成

生成的文件：
  - src/components/CustomButton/index.tsx
  - src/components/CustomButton/styles.ts
  - src/components/CustomButton/CustomButton.test.tsx

应用的规则：
  ✅ code-style: 命名规范、代码格式
  ✅ design-tokens: 使用设计令牌
  ✅ theme: 使用主题变量

执行时间: 3.5s
```

## 自动学习

系统会自动记录组件生成历史：

- **组件模式重复 ≥5 次** → 生成快捷模板
- **代码复用 ≥3 处** → 提取为工具函数
- **成功率 ≥95%** → 固化为最佳实践

## 相关命令

- `/ome-ui` - 从设计稿生成组件
- `/ome-memory` - 查看生成历史

---

**提示**：这个命令会学习你的组件模式，越用越智能！
