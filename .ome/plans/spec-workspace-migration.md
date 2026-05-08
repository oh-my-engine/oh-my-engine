---
plan: spec-workspace-migration
version: 1.0.0
created: 2026-05-08
status: draft
type: refactoring
---

# Spec 工作区迁移方案

## 目标

将 spec 工作区从根目录的 `openspec/` 迁移到 `.ome/spec/`，实现配置统一管理和目录结构优化。

## 背景

### 当前状态
- ome-spec 技能文档中定义的默认路径是 `openspec/`
- 实际项目中 `openspec/` 目录尚未创建
- 项目已从 `.ome/config.json` 迁移到 `OME.md` 驱动
- `OME.md` 中尚未配置 spec workflow

### 问题
1. **目录混乱**：`openspec/` 在根目录会与业务代码混在一起
2. **配置不统一**：`.ome/` 已经是项目元数据集中位置，spec 应该统一管理
3. **文档过时**：ome-spec 文档中的配置方式还是旧的 config.json 方式

### 机会
- 项目刚开始使用 spec 功能，没有历史数据需要迁移
- 可以从一开始就建立正确的目录结构
- 避免后续的迁移成本

## 设计方案

### 目录结构

```
.ome/
├── config.json              # 保留用于向后兼容
├── rules/                   # 项目规则
├── memory/                  # 项目记忆
│   └── specs/              # spec 执行记忆
└── spec/                    # 新增：spec 工作区
    ├── project.md          # 项目级 spec 配置
    ├── changes/            # 活跃变更
    │   └── <change-id>/
    │       ├── context/
    │       │   ├── source.md
    │       │   ├── prompt.md
    │       │   ├── analysis.md
    │       │   ├── references.json
    │       │   └── assets/
    │       ├── proposal.md
    │       ├── design.md
    │       ├── tasks.md
    │       └── specs/
    │           └── <capability>/
    │               └── spec.md
    ├── specs/              # 长期规范
    │   └── <capability>/
    │       └── spec.md
    └── archive/            # 已归档变更
```

### 配置更新

#### 1. OME.md 添加 spec workflow

在 `OME.md` 的 frontmatter 中添加：

```yaml
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
      defaultFlow: import-decompose-plan-apply-verify-archive
      manualFlow: propose-plan-apply-verify-archive
      contextDirName: context
      assetsDirName: assets
      verifyCommands:
        - npm test
```

#### 2. 更新 ome-spec 技能文档

需要更新 `skills/oh-my-engine-spec/SKILL.md` 中的：
- 默认路径配置示例
- 目录约定说明
- 配置方式从 config.json 改为 OME.md

### 实现接口

#### 配置读取接口

```typescript
interface SpecConfig {
  specRoot: string;           // .ome/spec
  changesDir: string;         // .ome/spec/changes
  specsDir: string;           // .ome/spec/specs
  archiveDir: string;         // .ome/spec/archive
  memoryDir: string;          // .ome/memory/specs
  defaultFlow: string;
  manualFlow: string;
  contextDirName: string;
  assetsDirName: string;
  verifyCommands: string[];
}

function loadSpecConfig(): SpecConfig {
  // 1. 优先读取 OME.md 中的 workflows.spec-driven.options
  // 2. 如果不存在，回退到 .ome/config.json 中的 workflows.spec.options
  // 3. 如果都不存在，使用默认值（.ome/spec）
}
```

#### 路径解析接口

```typescript
interface SpecPaths {
  getChangeDir(changeId: string): string;
  getContextDir(changeId: string): string;
  getAssetsDir(changeId: string): string;
  getSpecDir(changeId: string, capability: string): string;
  getLongTermSpecDir(capability: string): string;
  getArchiveDir(changeId: string): string;
}

function createSpecPaths(config: SpecConfig): SpecPaths {
  return {
    getChangeDir: (id) => `${config.changesDir}/${id}`,
    getContextDir: (id) => `${config.changesDir}/${id}/${config.contextDirName}`,
    getAssetsDir: (id) => `${config.changesDir}/${id}/${config.contextDirName}/${config.assetsDirName}`,
    getSpecDir: (id, cap) => `${config.changesDir}/${id}/specs/${cap}`,
    getLongTermSpecDir: (cap) => `${config.specsDir}/${cap}`,
    getArchiveDir: (id) => `${config.archiveDir}/${id}`
  };
}
```

## 实施任务

### Phase 1: 配置更新（优先级：高）

- [ ] **Task 1.1**: 更新 OME.md
  - 在 frontmatter 的 workflows 部分添加 spec-driven 配置
  - 设置 specRoot 为 `.ome/spec`
  - 配置相关规则和验证命令
  - 验证：运行 `ome config validate` 确认配置格式正确

- [ ] **Task 1.2**: 更新 .ome/config.json（向后兼容）
  - 添加 workflows.spec 配置
  - 使用与 OME.md 相同的路径配置
  - 验证：JSON 格式正确

### Phase 2: 文档更新（优先级：高）

- [ ] **Task 2.1**: 更新 ome-spec 技能文档
  - 修改 `skills/oh-my-engine-spec/SKILL.md`
  - 将配置示例从 config.json 改为 OME.md
  - 更新目录约定部分，将 `openspec/` 改为 `.ome/spec/`
  - 更新所有示例输出中的路径
  - 验证：文档中不再出现 `openspec/` 路径

- [ ] **Task 2.2**: 更新架构文档
  - 修改 `docs/spec-intake-architecture.md`
  - 更新目录布局示例
  - 更新配置示例
  - 验证：文档一致性

### Phase 3: 代码实现（优先级：中）

- [ ] **Task 3.1**: 实现配置读取逻辑
  - 创建配置读取函数，优先读取 OME.md
  - 实现回退机制（OME.md → config.json → 默认值）
  - 添加配置验证
  - 验证：单元测试覆盖所有配置来源

- [ ] **Task 3.2**: 更新路径解析逻辑
  - 修改所有硬编码的 `openspec/` 路径
  - 使用配置中的路径
  - 确保相对路径和绝对路径都正确处理
  - 验证：集成测试覆盖所有路径操作

- [ ] **Task 3.3**: 更新 CLI 命令
  - 修改 `ome spec init` 命令，使用新路径
  - 更新所有 spec 子命令的路径引用
  - 验证：运行 `ome spec init` 创建正确的目录结构

### Phase 4: 测试验证（优先级：高）

- [ ] **Task 4.1**: 单元测试
  - 测试配置读取逻辑
  - 测试路径解析逻辑
  - 测试向后兼容性
  - 验证：所有测试通过

- [ ] **Task 4.2**: 集成测试
  - 测试完整的 spec 生命周期（init → propose → plan → apply → verify → archive）
  - 测试 import-decompose 流程
  - 测试多个 change 并行工作
  - 验证：所有文件创建在正确的位置

- [ ] **Task 4.3**: 手工验证
  - 在测试项目中运行完整流程
  - 检查生成的目录结构
  - 验证文件内容正确
  - 验证：目录结构符合设计

### Phase 5: 文档和示例（优先级：中）

- [ ] **Task 5.1**: 更新用户文档
  - 更新 `docs/user-guide.md`
  - 更新 `docs/installation-and-usage.md`
  - 添加迁移指南（如果有用户已经使用了 openspec/）
  - 验证：文档清晰易懂

- [ ] **Task 5.2**: 创建示例
  - 在 `examples/` 目录创建 spec 工作流示例
  - 展示完整的目录结构
  - 提供示例配置
  - 验证：示例可以直接运行

## 边界情况

### 1. 已有 openspec/ 目录的项目
**场景**：用户已经在使用旧的 `openspec/` 目录

**处理方案**：
- 提供迁移脚本 `ome spec migrate`
- 自动检测 `openspec/` 目录
- 询问用户是否迁移
- 复制文件到 `.ome/spec/`
- 保留原目录，添加 `.deprecated` 标记

### 2. 配置冲突
**场景**：OME.md 和 config.json 中的配置不一致

**处理方案**：
- 优先使用 OME.md 配置
- 输出警告信息
- 建议用户统一配置

### 3. 路径不存在
**场景**：配置的路径不存在

**处理方案**：
- 自动创建目录
- 记录日志
- 继续执行

### 4. 权限问题
**场景**：无法创建 `.ome/spec/` 目录

**处理方案**：
- 捕获错误
- 输出清晰的错误信息
- 提供解决建议

## 测试策略

### 单元测试
```typescript
describe('SpecConfig', () => {
  it('should load config from OME.md', () => {
    // 测试从 OME.md 读取配置
  });

  it('should fallback to config.json', () => {
    // 测试回退到 config.json
  });

  it('should use default values', () => {
    // 测试使用默认值
  });

  it('should validate config format', () => {
    // 测试配置验证
  });
});

describe('SpecPaths', () => {
  it('should resolve change directory', () => {
    // 测试变更目录解析
  });

  it('should resolve context directory', () => {
    // 测试上下文目录解析
  });

  it('should resolve spec directory', () => {
    // 测试 spec 目录解析
  });
});
```

### 集成测试
```typescript
describe('Spec Workflow', () => {
  it('should create correct directory structure on init', () => {
    // 测试 init 命令创建正确的目录
  });

  it('should handle full lifecycle', () => {
    // 测试完整生命周期
  });

  it('should support multiple changes', () => {
    // 测试多个变更并行
  });
});
```

### 手工测试清单
- [ ] 运行 `ome spec init`，检查目录结构
- [ ] 运行 `ome spec propose test-change`，检查文件位置
- [ ] 运行 `ome spec plan test-change`，检查文件更新
- [ ] 运行 `ome spec apply test-change`，检查实现流程
- [ ] 运行 `ome spec verify test-change`，检查验证逻辑
- [ ] 运行 `ome spec archive test-change`，检查归档位置
- [ ] 检查 `.ome/memory/specs/` 中的执行记忆
- [ ] 验证 OME.md 配置生效
- [ ] 验证 config.json 回退机制

## 风险和缓解

### 风险 1: 破坏现有用户的工作流
**影响**: 高  
**概率**: 低（因为功能刚推出）  
**缓解**:
- 提供向后兼容支持
- 提供迁移脚本
- 在文档中明确说明变更

### 风险 2: 配置复杂度增加
**影响**: 中  
**概率**: 中  
**缓解**:
- 提供合理的默认值
- 简化配置项
- 提供配置验证工具

### 风险 3: 文档不同步
**影响**: 中  
**概率**: 中  
**缓解**:
- 统一更新所有文档
- 添加文档审查流程
- 使用自动化检查

## 验收标准

### 功能验收
- [ ] OME.md 中可以配置 spec 工作区路径
- [ ] 所有 spec 命令使用配置的路径
- [ ] 向后兼容 config.json 配置
- [ ] 提供合理的默认值

### 质量验收
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试覆盖所有主要流程
- [ ] 所有测试通过
- [ ] 代码审查通过

### 文档验收
- [ ] 所有文档更新完成
- [ ] 文档中路径一致
- [ ] 提供迁移指南
- [ ] 示例可以运行

### 用户体验验收
- [ ] 配置简单直观
- [ ] 错误信息清晰
- [ ] 提供有用的日志
- [ ] 性能无明显下降

## 实施时间估算

- Phase 1: 配置更新 - 2 小时
- Phase 2: 文档更新 - 3 小时
- Phase 3: 代码实现 - 8 小时
- Phase 4: 测试验证 - 6 小时
- Phase 5: 文档和示例 - 3 小时

**总计**: 约 22 小时（3 个工作日）

## 后续优化

### 短期（1-2 周）
- 收集用户反馈
- 优化配置体验
- 完善错误处理

### 中期（1-2 月）
- 添加配置迁移向导
- 优化目录结构
- 增强验证逻辑

### 长期（3-6 月）
- 支持自定义目录结构
- 支持多工作区
- 集成到 CI/CD

## 相关资源

### 文档
- `skills/oh-my-engine-spec/SKILL.md` - ome-spec 技能定义
- `docs/spec-intake-architecture.md` - spec 架构文档
- `OME.md` - 项目配置文件

### 代码
- `skills/oh-my-engine-spec/workflows/` - spec 工作流实现
- `skills/oh-my-engine-spec/templates/` - spec 模板

### 工具
- `ome config validate` - 配置验证
- `ome rules sync` - 规则同步
- `ome doctor` - 健康检查

## 决策记录

### 为什么选择 .ome/spec/ 而不是 openspec/?
1. **统一管理**：`.ome/` 已经是项目元数据的集中位置
2. **避免混乱**：根目录应该只放业务代码和必要的配置文件
3. **语义清晰**：spec 是工程流程的一部分，属于 `.ome/` 的职责范围
4. **一致性**：与 `.ome/rules/`、`.ome/memory/` 保持一致

### 为什么保留 config.json 支持?
1. **向后兼容**：避免破坏现有用户的配置
2. **渐进迁移**：给用户时间适应新的配置方式
3. **灵活性**：某些场景下 JSON 配置更方便程序化生成

### 为什么使用 OME.md 作为主配置?
1. **可读性**：Markdown 格式更易读易写
2. **文档化**：配置即文档，减少维护成本
3. **趋势**：符合现代项目配置的趋势（如 CLAUDE.md）

---

**状态**: 待审批  
**创建时间**: 2026-05-08  
**预计完成**: 2026-05-11
