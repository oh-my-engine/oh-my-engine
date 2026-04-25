# 跨平台 Rules 管理

## 核心理念

**单一规则源 + 智能同步 = 所有平台一致**

```
.oh-my-engine/rules/          ← 唯一的规则源（你只需维护这里）
├── code-style.md
├── architecture.md
├── i18n.md
├── theme.md
└── [其他规则]
         ↓
   rules-sync.js              (自动同步)
         ↓
    所有平台自动更新
    ├── CLAUDE.md             (索引文件，引用规则源)
    ├── .cursor/rules/        (完整规则，.mdc 格式)
    ├── .trae/rules/          (完整规则，.mdc 格式)
    ├── .agents/rules/        (完整规则，编号前缀)
    ├── .antigravity/rules.md (索引文件)
    ├── .codex/rules.md       (索引文件)
    ├── .opencode/rules.md    (索引文件)
    ├── .windsurf/rules/      (完整规则)
    └── .qoder/rules/         (完整规则)
```

## 支持的平台

| 平台 | 文件类型 | 格式 | 特性 |
|------|---------|------|------|
| **Claude Code** | 单文件 | 索引 | 引用规则源 |
| **Cursor** | 多文件 | .mdc | 带 frontmatter |
| **Trae** | 多文件 | .mdc | 带 frontmatter |
| **Agents** | 多文件 | .md | 编号前缀 |
| **Antigravity** | 单文件 | 索引 | 引用规则源 |
| **Codex** | 单文件 | 索引 | 引用规则源 |
| **OpenCode** | 单文件 | 索引 | 引用规则源 |
| **Windsurf** | 多文件 | .md | 纯 Markdown |
| **Qoder** | 多文件 | .md | 纯 Markdown |

## 快速开始

### 1. 智能初始化

```bash
# 在你的项目目录运行
/oh-my-engine-init "你的项目描述"

# 例如：
/oh-my-engine-init "React Native + TypeScript 项目，使用 Expo，必须支持 4 种语言"
```

**自动完成**：
- ✅ 扫描代码仓库（检测技术栈、项目类型）
- ✅ AI 生成定制化规则（不是固定模板）
- ✅ 保存到 `.oh-my-engine/rules/`（唯一的规则源）
- ✅ 同步到所有 9+ 平台
- ✅ 开箱即用

### 2. 日常使用

```bash
# 修改规则（唯一需要编辑的地方）
vim .oh-my-engine/rules/theme.md

# 同步到所有平台
node .oh-my-engine/rules-sync.js

# 输出：
# 🔄 开始同步 rules...
# ✅ claude-code: CLAUDE.md
# ✅ cursor: .cursor/rules/ (4 个文件)
# ✅ trae: .trae/rules/ (4 个文件)
# ✅ agents: .agents/rules/ (4 个文件)
# 🎉 同步完成！
```

### 3. 自动化（可选）

#### Git Hooks

创建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash
if git diff --cached --name-only | grep -q ".oh-my-engine/rules/"; then
  echo "🔄 检测到 rules 修改，自动同步..."
  node .oh-my-engine/rules-sync.js
  git add CLAUDE.md .cursor/rules/ .trae/rules/ .agents/rules/
fi
```

**效果**：修改规则后，Git 会自动同步到所有平台。

## 工作原理

### 单文件平台（索引模式）

生成轻量级索引文件，引用规则源：

```markdown
# CLAUDE.md

## ⚠️ 重要说明
本文件是规则索引文件，不包含完整规则内容。

- 📁 规则源：`.oh-my-engine/rules/`
- 📖 使用方式：执行任务前，请先读取对应的规则文件

## 📚 规则索引
- 📄 [code-style.md](.oh-my-engine/rules/code-style.md)
- 📄 [i18n.md](.oh-my-engine/rules/i18n.md)
- 📄 [theme.md](.oh-my-engine/rules/theme.md)
```

**AI Agent 会自动读取 `.oh-my-engine/rules/` 中的源文件。**

### 多文件平台（完整规则）

从规则源生成完整的规则文件：

**Cursor/Trae（.mdc 格式）**：
```markdown
---
glob: "app/**/*.tsx,app/**/*.ts"
alwaysApply: true
description: "主题系统规则"
---

# 主题系统规则

[完整的规则内容]
```

**Agents（编号前缀）**：
```
.agents/rules/
├── 01-code-style.md
├── 02-architecture.md
├── 03-i18n.md
└── 04-theme.md
```

## 核心优势

### 对比传统方式

| 特性 | 传统方式 | Oh My Engine |
|------|---------|-------------|
| **维护位置** | 8+ 个地方 | 1 个地方 ✅ |
| **一致性** | 容易不一致 | 保证一致 ✅ |
| **同步方式** | 手动复制 | 自动同步 ✅ |
| **格式转换** | 手动处理 | 自动转换 ✅ |
| **文件名映射** | 手动重命名 | 自动映射 ✅ |
| **维护成本** | 高 | 低 ✅ |

### 实际案例

**Eatizen 项目（使用前）**：
```
❌ 8+ 个平台，每个独立维护
❌ 文件内容不一致（MD5 不同）
❌ 修改一个规则需要更新 8+ 个地方
❌ 维护成本极高
```

**使用 Oh My Engine 后**：
```
✅ 只维护 .oh-my-engine/rules/
✅ 一键同步到所有平台
✅ 保证所有平台一致
✅ 维护成本降低 90%
```

## 高级功能

### 1. 文件名映射

不同平台可能需要不同的文件名：

```json
// platforms.json
{
  "ruleMapping": {
    "i18n": {
      "cursor": "i18n-localization",
      "trae": "i18n-localization",
      "agents": "i18n",
      "default": "i18n"
    }
  }
}
```

**效果**：
```
源文件: i18n.md
  ↓
Cursor:  i18n-localization.mdc
Trae:    i18n-localization.mdc
Agents:  03-i18n.md
```

### 2. 格式转换

自动添加 frontmatter（Cursor/Trae 需要）：

```markdown
源文件 (i18n.md):
# 多语言规则
[内容]

↓ 自动转换 ↓

生成文件 (i18n-localization.mdc):
---
glob: "app/**/*.tsx,app/**/*.ts,app/i18n/**/*"
alwaysApply: true
description: "多语言规则"
---

# 多语言规则
[内容]
```

### 3. 编号前缀

自动添加编号（Agents 平台）：

```
源文件:
- code-style.md
- i18n.md
- theme.md

↓ 自动转换 ↓

生成文件:
- 01-code-style.md
- 02-i18n.md
- 03-theme.md
```

### 4. 智能 glob 模式

根据规则类型自动设置 glob 模式：

```javascript
if (ruleName === 'i18n') {
  frontmatter.glob = 'app/**/*.tsx,app/**/*.ts,app/i18n/**/*';
} else if (ruleName === 'theme') {
  frontmatter.glob = 'app/**/*.tsx,app/**/*.ts';
} else if (ruleName === 'code-style') {
  frontmatter.glob = '**/*.ts,**/*.tsx,**/*.js,**/*.jsx';
}
```

## 配置

### platforms.json

```json
{
  "enabled": [
    "claude-code",
    "cursor",
    "trae",
    "agents"
  ],
  "platforms": {
    "cursor": {
      "name": "Cursor IDE",
      "type": "multi-file",
      "directory": ".cursor/rules",
      "format": "mdc",
      "extension": ".mdc",
      "frontmatter": {
        "glob": "**/*",
        "alwaysApply": true
      }
    }
  },
  "ruleMapping": {
    "i18n": {
      "cursor": "i18n-localization",
      "default": "i18n"
    }
  }
}
```

### 添加自定义平台

```json
{
  "platforms": {
    "my-agent": {
      "name": "My Custom Agent",
      "type": "single-file",
      "file": ".myagent/rules.md",
      "format": "markdown-index"
    }
  }
}
```

## 故障排除

### 问题 1：同步失败

```bash
# 检查 Node.js 是否安装
node --version

# 检查 rules-sync.js 是否存在
ls -la .oh-my-engine/rules-sync.js

# 手动运行查看错误
node .oh-my-engine/rules-sync.js
```

### 问题 2：生成的文件格式不对

```bash
# 检查 platforms.json 配置
cat .oh-my-engine/platforms.json

# 重新生成
node .oh-my-engine/rules-sync.js
```

### 问题 3：某个平台没有生成

```bash
# 检查平台是否在 enabled 列表中
grep -A 10 '"enabled"' .oh-my-engine/platforms.json

# 指定平台生成
node .oh-my-engine/rules-sync.js cursor trae
```

## 最佳实践

### 1. 只编辑规则源

```bash
# ✅ 正确
vim .oh-my-engine/rules/theme.md
node .oh-my-engine/rules-sync.js

# ❌ 错误（生成的文件会被覆盖）
vim .cursor/rules/theme-system.mdc
```

### 2. 使用 Git Hooks 自动化

```bash
# 设置一次，永久自动化
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -q ".oh-my-engine/rules/"; then
  node .oh-my-engine/rules-sync.js
  git add CLAUDE.md .cursor/rules/ .trae/rules/ .agents/rules/
fi
EOF
chmod +x .git/hooks/pre-commit
```

### 3. 提交规则源和生成文件

```bash
# 推荐：提交所有文件
git add .oh-my-engine/rules/
git add CLAUDE.md .cursor/rules/ .trae/rules/ .agents/rules/
git commit -m "feat: 更新规则"

# 优点：团队成员 clone 后直接可用
```

### 4. 定期检查一致性

```bash
# 检查生成的文件是否最新
node .oh-my-engine/rules-sync.js

# 如果有更新，提交
git status
```

## 相关文档

- [智能初始化](../skills/oh-my-engine-init/SKILL.md)
- [平台配置](../.oh-my-engine/platforms.json)
- [规则同步脚本](../.oh-my-engine/rules-sync.js)

## 总结

**核心优势**：
- ✅ 单一规则源（`.oh-my-engine/rules/`）
- ✅ 自动同步到 9+ 平台
- ✅ 支持多种格式（.mdc, .md, 索引）
- ✅ 智能文件名映射
- ✅ 自动格式转换
- ✅ 维护成本降低 90%

**使用流程**：
1. 运行 `/oh-my-engine-init` 智能初始化
2. 编辑 `.oh-my-engine/rules/*.md`
3. 运行 `node .oh-my-engine/rules-sync.js` 同步
4. 所有平台自动更新
