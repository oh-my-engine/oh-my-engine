# 跨平台 Rules 管理

## 核心理念

**单一规则源 + 智能同步 = 所有平台一致**

```
.ome/rules/          ← 唯一的规则源（你只需维护这里）
├── code-style.md
├── architecture.md
├── i18n.md
├── theme.md
└── [其他规则]
         ↓
   ome rules sync             (自动同步)
         ↓
    所有平台自动更新
    ├── CLAUDE.md             (索引文件，引用规则源)
    ├── .cursor/rules/        (完整规则，.mdc 格式)
    ├── .trae/rules/          (完整规则，.md 格式)
    ├── .agent/rules/        (完整规则，编号前缀)
    ├── AGENTS.md             (Codex / OpenCode 索引文件)
    ├── .windsurfrules        (Windsurf 索引文件)
    └── .qoder/rules/         (完整规则)
```

## 支持的平台

| 平台 | 文件类型 | 格式 | 特性 |
|------|---------|------|------|
| **Claude Code** | 单文件 | 索引 | 引用规则源 |
| **Cursor** | 多文件 | .mdc | 带 frontmatter |
| **Trae** | 多文件 | .md | 纯 Markdown |
| **Antigravity / Agents** | 多文件 | .md | 编号前缀 |
| **Codex** | 单文件 | AGENTS.md 索引 | 引用规则源 |
| **OpenCode** | 单文件 | AGENTS.md 索引 | 引用规则源 |
| **Windsurf** | 单文件 | .windsurfrules 索引 | 引用规则源 |
| **Qoder** | 多文件 | .md | 纯 Markdown |

## 快速开始

### 1. 智能初始化

```bash
# 在你的项目目录运行
ome init

# 同步到默认启用平台
ome rules sync
```

**自动完成**：
- ✅ 创建 `.ome/` 和 `openspec/` 工作区
- ✅ 写入默认规则和工作流配置
- ✅ 保存到 `.ome/rules/`（唯一的规则源）
- ✅ 同步到 Claude Code、Codex、Trae、Cursor 等平台规则文件
- ✅ 开箱即用

### 2. 日常使用

```bash
# 修改规则（唯一需要编辑的地方）
vim .ome/rules/theme.md

# 同步到所有平台
ome rules sync

# 输出：
# 🔄 开始同步 rules...
# ✅ claude-code: CLAUDE.md
# ✅ cursor: .cursor/rules/ (4 个文件)
# ✅ trae: .trae/rules/ (4 个文件)
# ✅ codex: AGENTS.md
# 🎉 同步完成！
```

### 3. 自动化（可选）

#### Git Hooks

创建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash
if git diff --cached --name-only | grep -q ".ome/rules/"; then
  echo "🔄 检测到 rules 修改，自动同步..."
  ome rules sync
  git add CLAUDE.md AGENTS.md .cursor/rules/ .trae/rules/ .agent/rules/ .windsurfrules .qoder/rules/
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

- 📁 规则源：`.ome/rules/`
- 📖 使用方式：执行任务前，请先读取对应的规则文件

## 📚 规则索引
- 📄 [code-style.md](.ome/rules/code-style.md)
- 📄 [i18n.md](.ome/rules/i18n.md)
- 📄 [theme.md](.ome/rules/theme.md)
```

**AI Agent 会自动读取 `.ome/rules/` 中的源文件。**

### 多文件平台（完整规则）

从规则源生成完整的规则文件：

**Cursor（.mdc 格式）**：
```markdown
---
glob: "app/**/*.tsx,app/**/*.ts"
alwaysApply: true
description: "主题系统规则"
---

# 主题系统规则

[完整的规则内容]
```

**Trae / Qoder / Antigravity（Markdown 文件）**：
```markdown
# 主题系统规则

[完整的规则内容]
```

**Agents（编号前缀）**：
```
.agent/rules/
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
✅ 只维护 .ome/rules/
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
Trae:    i18n-localization.md
Agents:  03-i18n.md
Qoder:   i18n.md
```

### 2. 格式转换

自动添加 frontmatter（Cursor 需要）：

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

# 检查 ome CLI 是否可用
ome --help

# 手动运行查看错误
ome rules sync
```

### 问题 2：生成的文件格式不对

```bash
# 检查 platforms.json 配置
cat .ome/platforms.json

# 重新生成
ome rules sync
```

### 问题 3：某个平台没有生成

```bash
# 检查平台是否在 enabled 列表中
grep -A 10 '"enabled"' .ome/platforms.json

# 指定平台生成
ome rules sync cursor
ome rules sync trae
```

## 最佳实践

### 1. 只编辑规则源

```bash
# ✅ 正确
vim .ome/rules/theme.md
ome rules sync

# ❌ 错误（生成的文件会被覆盖）
vim .cursor/rules/theme-system.mdc
```

### 2. 使用 Git Hooks 自动化

```bash
# 设置一次，永久自动化
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -q ".ome/rules/"; then
  ome rules sync
  git add CLAUDE.md AGENTS.md .cursor/rules/ .trae/rules/ .agent/rules/ .windsurfrules .qoder/rules/
fi
EOF
chmod +x .git/hooks/pre-commit
```

### 3. 提交规则源和生成文件

```bash
# 推荐：提交所有文件
git add .ome/rules/
git add CLAUDE.md AGENTS.md .cursor/rules/ .trae/rules/ .agent/rules/ .windsurfrules .qoder/rules/
git commit -m "feat: 更新规则"

# 优点：团队成员 clone 后直接可用
```

### 4. 定期检查一致性

```bash
# 检查生成的文件是否最新
ome rules sync

# 如果有更新，提交
git status
```

## 相关文档

- [智能初始化](../skills/ome-init/SKILL.md)
- [平台配置](../.ome/platforms.json)
- [规则同步实现](../src/core/rules.ts)

## 总结

**核心优势**：
- ✅ 单一规则源（`.ome/rules/`）
- ✅ 自动同步到 9+ 平台
- ✅ 支持多种格式（.mdc, .md, 索引）
- ✅ 智能文件名映射
- ✅ 自动格式转换
- ✅ 维护成本降低 90%

**使用流程**：
1. 运行 `ome init` 初始化
2. 编辑 `.ome/rules/*.md`
3. 运行 `ome rules sync` 同步
4. 所有平台自动更新
