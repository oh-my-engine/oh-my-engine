# Spec 工作区迁移指南

## 概述

从 v0.4.1 开始，spec 工作区已从根目录的 `openspec/` 迁移到 `.ome/spec/`，实现了配置统一管理和目录结构优化。

## 变更内容

### 目录结构变更

**旧路径：**
```
openspec/
├── project.md
├── changes/
├── specs/
└── archive/
```

**新路径：**
```
.ome/spec/
├── project.md
├── changes/
├── specs/
└── archive/
```

### 配置方式变更

**旧方式（.ome/config.json）：**
```json
{
  "workflows": {
    "spec": {
      "options": {
        "specRoot": "openspec",
        "changesDir": "openspec/changes",
        "specsDir": "openspec/specs",
        "archiveDir": "openspec/archive"
      }
    }
  }
}
```

**新方式（OME.md）：**
```yaml
---
workflows:
  spec-driven:
    enabled: true
    description: 基于规范驱动的开发工作流
    skills:
      - ome-spec
    rules:
      - universal-code-style
      - universal-documentation
      - universal-testing
    options:
      specRoot: .ome/spec
      changesDir: .ome/spec/changes
      specsDir: .ome/spec/specs
      archiveDir: .ome/spec/archive
      memoryDir: .ome/memory/specs
---
```

## 迁移步骤

### 自动迁移（推荐）

如果你已经有 `openspec/` 目录，运行以下命令自动迁移：

```bash
# 迁移现有的 spec 文件
mv openspec .ome/spec

# 更新配置
ome config migrate
```

### 手动迁移

1. **移动文件**
   ```bash
   mkdir -p .ome/spec
   mv openspec/* .ome/spec/
   rmdir openspec
   ```

2. **更新 OME.md**
   
   在 `OME.md` 的 frontmatter 中添加 `spec-driven` workflow 配置（参考上面的示例）。

3. **验证配置**
   ```bash
   ome config validate
   ome doctor
   ```

4. **测试 spec 命令**
   ```bash
   ome spec status <change-id>
   ```

## 向后兼容

系统会自动检测配置来源，优先级如下：

1. **OME.md** 中的 `workflows.spec-driven.options`
2. **.ome/config.json** 中的 `workflows.spec.options`
3. **默认值**：`.ome/spec`

这意味着：
- 如果你使用 OME.md，系统会使用新路径
- 如果你仍使用 config.json，可以继续使用旧路径
- 新项目默认使用 `.ome/spec`

## 常见问题

### Q: 我的现有 spec 文件会丢失吗？

A: 不会。如果你已经有 `openspec/` 目录，可以通过迁移命令安全地移动到新位置。

### Q: 我可以继续使用 openspec/ 吗？

A: 可以，但不推荐。你可以在 OME.md 中配置 `specRoot: openspec` 来继续使用旧路径，但建议迁移到新路径以获得更好的组织结构。

### Q: 迁移后需要更新什么？

A: 只需要更新配置文件（OME.md 或 config.json）。所有 `ome spec` 命令会自动使用新路径。

### Q: 如何验证迁移成功？

A: 运行以下命令：
```bash
# 检查项目健康状态
ome doctor

# 查看 spec 工作区状态
ls -la .ome/spec/

# 测试 spec 命令
ome spec status <change-id>
```

## 优势

迁移到 `.ome/spec/` 的优势：

1. **统一管理**：所有项目元数据集中在 `.ome/` 目录
2. **避免混乱**：根目录只保留业务代码和必要配置
3. **语义清晰**：spec 作为工程流程的一部分，属于 `.ome/` 的职责范围
4. **一致性**：与 `.ome/rules/`、`.ome/memory/` 保持一致

## 相关资源

- [Oh My Engine 用户指南](../../docs/user-guide.md)
- [Spec 工作流文档](../../skills/oh-my-engine-spec/SKILL.md)
- [配置文件说明](../../OME.md)

## 获取帮助

如果遇到问题，请：

1. 运行 `ome doctor` 检查项目状态
2. 查看 [GitHub Issues](https://github.com/your-org/oh-my-engine/issues)
3. 参考 [用户指南](../../docs/user-guide.md)
