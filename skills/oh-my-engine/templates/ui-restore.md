---
workflow: ui-restore
version: 1.0.0
description: 从设计稿还原 UI 组件
rules: [i18n, theme, design-tokens, code-style]
mcps: [mastergo-magic-mcp, browser-tools]
skills: []
---

# UI 还原工作流

从 MasterGo/Figma 设计稿自动生成 UI 组件代码。

## 输入参数

- `design_url`: 设计稿 URL（MasterGo/Figma）
- `component_name`: 组件名称（可选，自动推断）
- `output_dir`: 输出目录（可选，默认当前目录）

## 执行步骤

### Step 1: 解析设计稿 URL
```
1. 验证 URL 格式
2. 提取 fileId 和 layerId
3. 检测设计工具类型（MasterGo/Figma）
```

**错误处理**：
- URL 格式错误 → 提示用户正确格式
- 无法提取 ID → 尝试短链接解析
- 不支持的设计工具 → 列出支持的工具

### Step 2: 获取设计数据
```
1. 调用 MCP 获取 DSL 数据
2. 获取组件元数据
3. 下载设计资源（图片、图标）
```

**MCP 调用**：
- MasterGo: `mcp__mastergo-magic-mcp__mcp__getDsl`
- Figma: `mcp__Framelink_Figma_MCP__get_figma_data`

**超时处理**：
- 首次超时：等待 5 秒重试
- 二次超时：降级为基础模式（仅获取基本信息）
- 三次超时：提示用户检查网络或设计稿权限

### Step 3: 分析设计结构
```
1. 识别组件类型（Button, Input, Card, etc.）
2. 提取设计 tokens（颜色、字体、间距）
3. 分析布局结构（Flex, Grid, Absolute）
4. 识别交互状态（hover, active, disabled）
```

**智能推断**：
- 根据节点名称推断组件类型
- 根据样式推断设计 tokens
- 根据层级推断布局方式

### Step 4: 应用规则验证
```
1. 加载项目规则（.ome/rules/ 或全局默认）
2. 验证 i18n 规则（文本是否需要国际化）
3. 验证 theme 规则（颜色是否使用主题变量）
4. 验证 design-tokens 规则（间距是否使用 token）
5. 验证 code-style 规则（命名、格式等）
```

**规则冲突处理**：
- 优先级：项目规则 > 全局规则
- 冲突时：提示用户选择
- 无法满足：记录警告但继续执行

### Step 5: 生成代码
```
1. 生成组件文件（.tsx/.vue/.jsx）
2. 生成样式文件（.css/.scss/.module.css）
3. 生成类型定义（.d.ts）
4. 生成测试文件（.test.tsx）
5. 生成文档（README.md）
```

**代码生成策略**：
- 使用项目现有组件库（如果有）
- 遵循项目代码风格
- 添加必要的注释
- 生成可运行的示例

### Step 6: 写入文件
```
1. 检查输出目录是否存在
2. 检查文件是否已存在（避免覆盖）
3. 写入生成的文件
4. 更新 index 文件（如果需要）
```

**文件冲突处理**：
- 文件已存在：询问用户是否覆盖
- 目录不存在：自动创建
- 权限不足：提示用户检查权限

### Step 7: 验证生成结果
```
1. 检查语法错误（TypeScript/ESLint）
2. 检查样式错误（Stylelint）
3. 运行测试（如果有）
4. 启动开发服务器预览（可选）
```

**验证失败处理**：
- 语法错误：自动修复或提示用户
- 样式错误：自动格式化
- 测试失败：记录但不阻塞

### Step 8: 保存记忆
```
1. 记录执行时间
2. 记录成功/失败状态
3. 记录应用的规则
4. 记录用户反馈（如果有）
```

## 输出结果

```json
{
  "success": true,
  "component_name": "LoginButton",
  "files_created": [
    "components/LoginButton/index.tsx",
    "components/LoginButton/styles.module.css",
    "components/LoginButton/types.d.ts",
    "components/LoginButton/LoginButton.test.tsx"
  ],
  "rules_applied": ["i18n", "theme", "design-tokens"],
  "warnings": [],
  "execution_time": "8.5s"
}
```

## 性能优化

### 并行处理
```
- 同时获取 DSL 和下载资源
- 同时生成多个文件
- 同时运行多个验证
```

### 缓存策略
```
- 缓存设计稿数据（5 分钟）
- 缓存设计 tokens（10 分钟）
- 缓存规则验证结果（1 分钟）
```

### 增量更新
```
- 只更新变化的部分
- 保留用户手动修改
- 智能合并冲突
```

## 错误恢复

### 常见错误及处理

**1. MasterGo 超时**
```
错误：Request timeout after 30s
处理：
  1. 等待 5 秒重试
  2. 降级为基础模式
  3. 提示用户检查网络
记忆：记录超时次数，达到 3 次自动生成 fix-mastergo-timeout skill
```

**2. 设计稿权限不足**
```
错误：403 Forbidden
处理：
  1. 提示用户检查设计稿权限
  2. 提供权限申请指引
  3. 建议使用公开链接
记忆：记录权限错误，提示用户配置访问令牌
```

**3. 组件类型无法识别**
```
错误：Unknown component type
处理：
  1. 使用通用组件模板
  2. 提示用户手动指定类型
  3. 记录未识别的类型
记忆：积累未识别类型，达到 5 个自动生成识别规则
```

**4. 规则冲突**
```
错误：Rule conflict between i18n and theme
处理：
  1. 展示冲突详情
  2. 询问用户选择
  3. 记录用户偏好
记忆：记录冲突解决方案，后续作为偏好或 guidance 复用
```

## 学习和进化

### 成功模式识别
```
- 某个设计稿类型总是成功 → 固化为最佳实践
- 某个规则组合效果好 → 推荐给其他项目
- 某个代码模式复用率高 → 提取为模板
```

### 失败案例分析
```
- 某个错误重复出现 → 生成自动修复 skill
- 某个步骤经常超时 → 优化或并行化
- 某个规则经常冲突 → 调整优先级
```

### Skill 生成触发
```
- MasterGo 超时 ≥ 3 次 → 生成 fix-mastergo-timeout skill
- 组件类型识别失败 ≥ 5 次 → 生成 component-type-recognizer skill
- 规则冲突 ≥ 3 次 → 生成 rule-conflict-resolver skill
```

## 示例用法

### 基础用法
```bash
ome ui https://mastergo.com/goto/abc123
```

### 指定组件名
```bash
ome ui https://mastergo.com/goto/abc123 --name LoginButton
```

### 指定输出目录
```bash
ome ui https://mastergo.com/goto/abc123 --output src/components
```

### 跳过验证
```bash
ome ui https://mastergo.com/goto/abc123 --skip-validation
```

## 配置项

### 项目配置（.ome/config.json）
```json
{
  "workflows": {
    "ui-restore": {
      "output_dir": "src/components",
      "component_library": "antd",
      "style_type": "css-modules",
      "generate_tests": true,
      "generate_docs": true,
      "auto_preview": false
    }
  }
}
```

### 全局默认配置
```json
{
  "workflows": {
    "ui-restore": {
      "output_dir": ".",
      "component_library": null,
      "style_type": "css",
      "generate_tests": false,
      "generate_docs": false,
      "auto_preview": false
    }
  }
}
```

## 依赖

### MCP 服务器
- `mastergo-magic-mcp`: 获取 MasterGo 设计数据
- `Framelink_Figma_MCP`: 获取 Figma 设计数据
- `browser-tools`: 预览生成的组件

### Skills
- 无（可选：如果有 `component-library` skill 会自动使用）

### 规则
- `i18n`: 国际化规则
- `theme`: 主题规则
- `design-tokens`: 设计 token 规则
- `code-style`: 代码风格规则

---

**提示**：这个工作流会随着使用次数增加而变得更智能！
