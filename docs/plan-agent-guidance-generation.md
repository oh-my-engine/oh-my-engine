# Implementation Plan: Agent Guidance File Generation

## Purpose

当前问题：虽然 `ome init` 会安装 OME 命令到各个 Agent 编辑器的命令目录，但缺少项目规则文件来告诉 AI Agent 何时自动使用这些命令。导致所有 Agent 编辑器（Claude Code、Codex、Cursor、Trae、Windsurf、Qoder、OpenCode、Antigravity）都不知道在遇到 bug 分析、UI 还原等任务时应该自动调用对应的 OME 命令。

解决方案：在 `ome init` 时为**所有 8 个平台**自动生成包含自动检测规则的项目规则文件：

**单文件平台**:
- `CLAUDE.md` (Claude Code)
- `AGENTS.md` (Codex, OpenCode)
- `.windsurfrules` (Windsurf)
- `GEMINI.md` (Antigravity)

**多文件平台**:
- `.cursor/rules/00-ome-auto-detection.mdc` (Cursor)
- `.trae/rules/00-ome-auto-detection.md` (Trae)
- `.qoder/rules/00-ome-auto-detection.md` (Qoder)
- `.agent/rules/00-ome-auto-detection.md` (Antigravity)

每个文件包含：
- 何时自动使用每个 OME 命令的触发规则
- AI 自动阶段检测机制
- 项目上下文引用（OME.md、.ome/rules/）
- 与现有规则索引的集成（单文件平台使用标记块）

## Current State Analysis

### 现有代码结构

**src/core/init.ts**:
- `initializeProject()` 在第824-875行调用 `installAgents()` 安装命令文件
- 在第835-839行生成 OME.md 配置文件
- 在第860-862行调用 `syncRules()` 生成规则索引到 CLAUDE.md
- **问题**: 规则索引不包含命令使用指导

**src/core/agents.ts**:
- `AGENTS` 数组定义了各平台的配置：
  - `claude-code`: `projectRules: 'CLAUDE.md'`, `commandStyle: 'slash'`
  - `codex`: `projectRules: 'AGENTS.md'`, `commandStyle: 'skill'`
  - `cursor`: `projectRules: '.cursor/rules/*.mdc'`, `commandStyle: 'slash'`
  - `trae`: `projectRules: '.trae/rules/*.md'`, `commandStyle: 'slash'`
  - `windsurf`: `projectRules: '.windsurf/rules/*.md / .windsurfrules'`, `commandStyle: 'workflow'`
  - `qoder`: `projectRules: '.qoder/rules/*.md'`, `commandStyle: 'slash'`
  - `opencode`: `projectRules: 'AGENTS.md'`, `commandStyle: 'slash'`
  - `antigravity`: `projectRules: 'AGENTS.md / GEMINI.md / .agent/rules/*.md'`, `commandStyle: 'workflow'`
- `installAgents()` 只创建命令文件，不生成项目规则文件
- **问题**: 没有函数为所有 8 个平台生成包含使用指导的规则文件

**src/core/rules.ts** (推测):
- `syncRules()` 生成规则索引到 CLAUDE.md
- 当前生成的内容只包含规则列表和 workflow 映射
- **问题**: 缺少命令自动使用的触发规则

### 当前 CLAUDE.md 内容

```markdown
# Claude Code Rules

> 本文件由 .ome/rules/ 自动生成，请勿手动编辑 OME 标记块

## 规则索引
- 📄 [project-overview.md](.ome/rules/project-overview.md)
- 📄 [code-style.md](.ome/rules/code-style.md)
...

## Workflow 规则映射
### bug-analysis
**应用规则**: project-overview.md, code-style.md, ...
```

**缺少的内容**:
- 何时自动使用 `/ome-bug`、`/ome-ui` 等命令
- AI 自动阶段检测规则
- 命令触发条件和使用场景

## Implementation Approach

### 1. 新增函数：生成 Agent 使用指导

在 `src/core/agents.ts` 中新增函数：

```typescript
/**
 * 判断平台是单文件还是多文件类型
 */
function isSingleFilePlatform(platform: AgentDefinition): boolean {
  // 单文件: CLAUDE.md, AGENTS.md, .windsurfrules, GEMINI.md
  // 多文件: .cursor/rules/*.mdc, .trae/rules/*.md, etc.
}

/**
 * 获取平台的自动检测规则文件路径
 */
function getAutoDetectionFilePath(
  projectRoot: string,
  platform: AgentDefinition
): string {
  // 单文件平台: 返回根目录文件路径
  // 多文件平台: 返回 00-ome-auto-detection.{ext} 路径
}

/**
 * 构建自动检测规则内容
 */
function buildAgentGuidanceContent(
  platform: AgentDefinition,
  scan: ProjectScanSummary
): string {
  // 生成包含以下内容的 Markdown：
  // 1. 项目信息和上下文引用
  // 2. 何时自动使用 OME 命令的触发规则（根据 commandStyle 调整语法）
  // 3. AI 自动阶段检测机制
  // 4. 命令使用优先级
  // 5. 单文件平台：添加 <!-- OME:START --> 标记
  // 6. 多文件平台：纯自动检测规则内容
  // 7. 根据 scan 动态调整（无 UI 则跳过 ome-ui）
}

/**
 * 为单个平台生成自动检测规则文件
 */
export function generateAgentGuidanceFile(
  projectRoot: string,
  platform: AgentDefinition,
  scan: ProjectScanSummary
): { created: boolean; path: string; action: 'created' | 'updated' | 'skipped' } {
  // 1. 获取目标文件路径
  // 2. 检查文件是否存在
  // 3. 单文件平台：检查是否有 OME 标记块，保留用户内容
  // 4. 多文件平台：直接创建或覆盖
  // 5. 构建指导内容
  // 6. 写入文件
  // 7. 返回创建状态和路径
}

/**
 * 为所有平台生成自动检测规则文件
 */
export function generateAllAgentGuidanceFiles(
  projectRoot: string,
  scan: ProjectScanSummary
): Array<{ platform: string; path: string; action: string }> {
  // 遍历所有 AGENTS，为每个平台生成指导文件
}
```

### 2. 修改 initializeProject()

在 `src/core/init.ts` 的 `initializeProject()` 函数中：

```typescript
export function initializeProject(options: InitOptions): InitResult {
  // ... 现有代码 ...
  
  // 在 syncRules() 之前为所有平台生成 Agent 指导文件
  const { generateAllAgentGuidanceFiles } = require('./agents');
  const agentGuidanceResults = generateAllAgentGuidanceFiles(options.projectRoot, scan);
  
  // agentGuidanceResults 示例:
  // [
  //   { platform: 'claude-code', path: 'CLAUDE.md', action: 'created' },
  //   { platform: 'codex', path: 'AGENTS.md', action: 'created' },
  //   { platform: 'cursor', path: '.cursor/rules/00-ome-auto-detection.mdc', action: 'created' },
  //   { platform: 'trae', path: '.trae/rules/00-ome-auto-detection.md', action: 'created' },
  //   { platform: 'windsurf', path: '.windsurfrules', action: 'created' },
  //   { platform: 'qoder', path: '.qoder/rules/00-ome-auto-detection.md', action: 'created' },
  //   { platform: 'opencode', path: 'AGENTS.md', action: 'skipped' }, // 与 codex 共享
  //   { platform: 'antigravity', path: 'GEMINI.md', action: 'created' }
  // ]
  
  // syncRules() 会追加规则索引到单文件平台的标记块
  const syncedTargets = options.sync !== false
    ? syncRules([], options.projectRoot).map(...)
    : [];
  
  // ... 返回结果，包含 agentGuidanceResults ...
}
```

### 3. 修改 syncRules() 集成

在 `src/core/rules.ts` 中修改 `syncRules()` 函数，支持所有平台：

```typescript
/**
 * 为单文件平台同步规则索引（使用标记块）
 */
function syncToSingleFilePlatform(
  projectRoot: string,
  platform: AgentDefinition,
  rules: RuleFile[]
): SyncResult {
  const targetPath = getAutoDetectionFilePath(projectRoot, platform);
  
  // 1. 检查文件是否存在
  if (fs.existsSync(targetPath)) {
    // 2. 读取现有内容
    const existing = fs.readFileSync(targetPath, 'utf8');
    
    // 3. 查找 OME 标记块
    const omeStartMarker = '<!-- OME:START -->';
    const omeEndMarker = '<!-- OME:END -->';
    
    if (existing.includes(omeStartMarker)) {
      // 4. 替换 OME 标记块之间的内容（保留自动检测规则）
      const before = existing.substring(0, existing.indexOf(omeStartMarker));
      const after = existing.substring(existing.indexOf(omeEndMarker) + omeEndMarker.length);
      const ruleIndex = buildRuleIndexContent(rules, platform);
      const updated = `${before}${omeStartMarker}\n${ruleIndex}\n${omeEndMarker}${after}`;
      fs.writeFileSync(targetPath, updated, 'utf8');
      return { platform: platform.id, target: targetPath, status: 'updated' };
    }
  }
  
  // 5. 如果文件不存在或没有标记块，警告用户
  console.warn(`Warning: ${targetPath} missing OME markers. Run 'ome init' to regenerate.`);
  return { platform: platform.id, target: targetPath, status: 'skipped' };
}

/**
 * 为多文件平台同步规则索引（创建独立的规则索引文件）
 */
function syncToMultiFilePlatform(
  projectRoot: string,
  platform: AgentDefinition,
  rules: RuleFile[]
): SyncResult {
  // 多文件平台：创建 01-ome-rules-index.{ext} 文件
  const rulesDir = path.dirname(getAutoDetectionFilePath(projectRoot, platform));
  const indexPath = path.join(rulesDir, `01-ome-rules-index${getFileExtension(platform)}`);
  
  const ruleIndex = buildRuleIndexContent(rules, platform);
  fs.writeFileSync(indexPath, ruleIndex, 'utf8');
  
  return { platform: platform.id, target: indexPath, status: 'updated' };
}

/**
 * 主同步函数
 */
export function syncRules(platforms: string[], projectRoot: string): SyncResult[] {
  const rules = loadProjectRules(projectRoot);
  const results: SyncResult[] = [];
  
  for (const platform of AGENTS) {
    if (platforms.length > 0 && !platforms.includes(platform.id)) continue;
    
    if (isSingleFilePlatform(platform)) {
      results.push(syncToSingleFilePlatform(projectRoot, platform, rules));
    } else {
      results.push(syncToMultiFilePlatform(projectRoot, platform, rules));
    }
  }
  
  return results;
}
```

### 4. Agent 指导内容结构

#### 单文件平台（CLAUDE.md, AGENTS.md, .windsurfrules, GEMINI.md）

**结构特点**:
- 自动检测规则在前
- 使用 `<!-- OME:START -->` 和 `<!-- OME:END -->` 标记包裹规则索引
- `ome rules sync` 只更新标记块内容，保留自动检测规则

**CLAUDE.md 示例内容**:

```markdown
# Oh My Engine - Claude Code Integration

## 项目信息

- **项目名称**: {projectName}
- **项目类型**: {projectType}
- **框架**: {framework}
- **配置文件**: OME.md
- **规则目录**: .ome/rules/

## 🤖 自动命令检测

当用户提出以下类型的任务时，**自动使用对应的 OME 命令**，无需用户明确指定：

### Bug 分析和修复
**触发条件**:
- 用户描述 bug 或错误现象
- 用户说"这个功能不工作"、"报错了"、"有问题"
- 用户提供错误日志或堆栈跟踪

**自动使用**: `/ome-bug "<issue description>"`

**示例**:
- "登录按钮点击没反应" → `/ome-bug "登录按钮点击没反应"`
- "API 返回 500 错误" → `/ome-bug "API 返回 500 错误"`

### UI 还原
**触发条件**:
- 用户提供设计稿 URL 或截图
- 用户说"还原这个界面"、"实现这个 UI"
- 用户描述 UI 组件的视觉需求

**自动使用**: `/ome-ui <design-url-or-description>`

**示例**:
- "还原这个登录页面 [URL]" → `/ome-ui [URL]`
- "实现一个卡片组件，圆角、阴影" → `/ome-ui "卡片组件，圆角、阴影"`

### API 集成
**触发条件**:
- 用户说"集成 XX API"、"调用 XX 接口"
- 用户提供 API 文档或 OpenAPI spec
- 用户描述需要对接的后端服务

**自动使用**: `/ome-api <api-spec-or-description>`

**示例**:
- "集成用户登录 API" → `/ome-api "用户登录 API"`
- "对接支付接口" → `/ome-api "支付接口"`

### 组件生成
**触发条件**:
- 用户说"生成一个 XX 组件"
- 用户描述可复用组件的需求
- 用户要求创建通用 UI 元素

**自动使用**: `/ome-comp <component-name>`

**示例**:
- "生成一个按钮组件" → `/ome-comp "Button"`
- "创建一个表单输入组件" → `/ome-comp "FormInput"`

### 生命周期阶段检测

当用户的任务不明确属于哪个阶段时，**自动判断并使用对应的生命周期命令**：

- **需求不清晰** → `/ome-define "<task>"`
- **需要设计方案** → `/ome-plan "<task>"`
- **开始编码实现** → `/ome-build "<task>"`
- **测试或调试** → `/ome-test "<target>"`
- **代码审查** → `/ome-review "<target>"`
- **准备提交** → `/ome-ship "<change>"`

## 📋 命令使用优先级

1. **优先使用任务特定命令**: 如果任务明确是 bug、UI、API、组件，使用对应的 `/ome-bug`、`/ome-ui`、`/ome-api`、`/ome-comp`
2. **其次使用生命周期命令**: 如果任务不属于特定类型，根据阶段使用 `/ome-define`、`/ome-plan`、`/ome-build` 等
3. **最后直接实现**: 只有在任务非常简单（单行修改、明显的小改动）时才直接实现，不使用 OME 命令

## 📖 项目上下文

在执行任何 OME 命令前，确保：
1. 读取 `OME.md` 了解项目配置
2. 根据任务类型读取 `.ome/rules/` 中的相关规则
3. 遵循项目特定的代码风格和架构约定

## 🔄 工作流程

```
用户任务 → 判断任务类型 → 选择对应 OME 命令 → 读取项目规则 → 执行工作流 → 验证结果
```

---

<!-- OME:START -->
# Claude Code Rules

> 本文件由 .ome/rules/ 自动生成，请勿手动编辑 OME 标记块
> 运行 `ome rules sync` 更新

## 规则索引
...
<!-- OME:END -->
```

#### 多文件平台（Cursor, Trae, Qoder, Antigravity）

**结构特点**:
- 创建独立的自动检测规则文件：`00-ome-auto-detection.{ext}`
- 创建独立的规则索引文件：`01-ome-rules-index.{ext}`
- 使用 `00-` 前缀确保自动检测规则优先加载

**Cursor 示例** (`.cursor/rules/00-ome-auto-detection.mdc`):

```markdown
---
glob: "**/*"
alwaysApply: true
---

# Oh My Engine - Cursor Integration

## 🤖 自动命令检测

当用户提出以下类型的任务时，**自动使用对应的 OME 命令**：

### Bug 分析和修复
**触发条件**: 用户描述 bug、错误现象、"不工作"、"报错了"
**自动使用**: `/ome-bug "<issue description>"`

### UI 还原
**触发条件**: 设计稿 URL、截图、"还原界面"
**自动使用**: `/ome-ui <design-url-or-description>`

[... 其他触发规则 ...]

## 📖 项目上下文

在执行任何 OME 命令前：
1. 读取 `OME.md` 了解项目配置
2. 读取 `.ome/rules/` 中的相关规则
3. 遵循项目特定的代码风格和架构约定
```

**Trae/Qoder/Antigravity 示例** (`.trae/rules/00-ome-auto-detection.md`):

```markdown
# Oh My Engine - Auto Detection

## 🤖 自动命令检测

[... 与 Cursor 类似的内容，但使用对应平台的命令风格 ...]
```

**规则索引文件** (`.cursor/rules/01-ome-rules-index.mdc`):

```markdown
---
glob: "**/*"
alwaysApply: true
---

# Oh My Engine - Rules Index

## 规则索引

以下是所有可用的规则文件：

- 📄 [project-overview.md](../../.ome/rules/project-overview.md)
- 📄 [code-style.md](../../.ome/rules/code-style.md)
[...]
```

## Interfaces

### 新增函数签名

```typescript
// src/core/agents.ts

/**
 * 构建 Agent 使用指导内容
 * @param platform - Agent 平台定义
 * @param scan - 项目扫描结果
 * @returns Markdown 格式的指导内容
 */
function buildAgentGuidanceContent(
  platform: AgentDefinition,
  scan: ProjectScanSummary
): string;

/**
 * 生成 Agent 指导文件（CLAUDE.md 或 AGENTS.md）
 * @param projectRoot - 项目根目录
 * @param platform - Agent 平台定义
 * @param scan - 项目扫描结果
 * @returns 创建结果和文件路径
 */
export function generateAgentGuidanceFile(
  projectRoot: string,
  platform: AgentDefinition,
  scan: ProjectScanSummary
): { created: boolean; path: string };
```

### 修改现有接口

```typescript
// src/core/init.ts

export interface InitResult {
  projectRoot: string;
  template: string;
  configCreated: boolean;
  projectCreated: boolean;
  rulesUpdated: number;
  directories: string[];
  migratedLegacy: boolean;
  syncedTargets: string[];
  projectAgentTargets: string[];
  installedAgentTargets: string[];
  agentGuidanceFiles: string[];  // 新增：生成的指导文件列表
  scanSummary: string;
  contextFilesUpdated: number;
}
```

## Edge Cases

### 1. 文件已存在的情况

**场景**: 用户已经手动创建了 CLAUDE.md 或 AGENTS.md

**处理**:
- 检查文件是否包含 `<!-- OME:START -->` 和 `<!-- OME:END -->` 标记
- 如果有标记，只更新标记块之间的内容，保留用户自定义部分
- 如果没有标记，在文件末尾追加 OME 内容，并添加标记
- 如果使用 `--force` 选项，完全覆盖文件

### 2. 多平台共享同一文件

**场景**: codex 和 opencode 都使用 AGENTS.md；antigravity 可能使用 GEMINI.md 或 .agent/rules/

**处理**:
- 第一次生成时创建文件
- 第二次检测到文件已存在，跳过创建
- 在 InitResult 中记录哪些平台共享了同一文件
- Antigravity 优先使用 GEMINI.md（单文件），如果需要多文件则使用 .agent/rules/

### 3. 项目类型不支持某些 workflow

**场景**: 纯后端项目不需要 UI 还原命令

**处理**:
- 根据 `scan.hasUi`、`scan.uiFrameworks` 等信息动态生成触发规则
- 如果项目没有 UI 框架，不生成 `/ome-ui` 的触发规则
- 如果项目没有 API 路由，不生成 `/ome-api` 的触发规则

### 4. 规则索引与指导内容的集成

**场景**: syncRules() 需要追加内容到已有的指导文件

**处理**:
- 使用 HTML 注释标记 `<!-- OME:START -->` 和 `<!-- OME:END -->` 包裹规则索引
- syncRules() 检测标记，只替换标记块内容
- 保留标记块外的用户指导内容

### 5. 不同平台的内容差异

**场景**: 8 个平台的命令风格和文件格式不同

**处理**:
- **Slash 命令平台** (Claude Code, Cursor, Trae, Qoder, OpenCode): 使用 `/ome-bug` 语法
- **Skill 平台** (Codex): 使用 `ome-bug` 语法
- **Workflow 平台** (Windsurf, Antigravity): 使用 `/ome-bug` 或 workflow 调用语法
- **文件格式**:
  - Cursor: `.mdc` 格式，需要 YAML frontmatter (`glob`, `alwaysApply`)
  - 其他多文件平台: `.md` 格式
  - 单文件平台: 纯 Markdown
- 根据 `platform.commandStyle` 和文件扩展名动态生成内容

## Test Strategy

### 单元测试

**测试文件**: `src/tests/agent-guidance-generation.test.ts`

```typescript
describe('Agent Guidance Generation', () => {
  describe('buildAgentGuidanceContent', () => {
    it('should generate guidance for claude-code platform', () => {
      const platform = AGENTS.find(a => a.id === 'claude-code');
      const scan = mockProjectScan({ hasUi: true });
      const content = buildAgentGuidanceContent(platform, scan);
      
      expect(content).toContain('自动命令检测');
      expect(content).toContain('/ome-bug');
      expect(content).toContain('/ome-ui');
      expect(content).toContain('<!-- OME:START -->');
    });
    
    it('should generate guidance for cursor platform with mdc frontmatter', () => {
      const platform = AGENTS.find(a => a.id === 'cursor');
      const scan = mockProjectScan({ hasUi: true });
      const content = buildAgentGuidanceContent(platform, scan);
      
      expect(content).toContain('---');
      expect(content).toContain('glob: "**/*"');
      expect(content).toContain('alwaysApply: true');
      expect(content).toContain('/ome-bug');
      expect(content).not.toContain('<!-- OME:START -->'); // 多文件平台不需要标记
    });
    
    it('should skip UI commands for backend-only projects', () => {
      const platform = AGENTS.find(a => a.id === 'claude-code');
      const scan = mockProjectScan({ hasUi: false, uiFrameworks: [] });
      const content = buildAgentGuidanceContent(platform, scan);
      
      expect(content).not.toContain('/ome-ui');
      expect(content).toContain('/ome-bug');
    });
    
    it('should use skill syntax for codex platform', () => {
      const platform = AGENTS.find(a => a.id === 'codex');
      const scan = mockProjectScan();
      const content = buildAgentGuidanceContent(platform, scan);
      
      expect(content).toContain('ome-bug');
      expect(content).not.toContain('/ome-bug');
    });
    
    it('should generate guidance for all 8 platforms', () => {
      const scan = mockProjectScan({ hasUi: true });
      
      for (const platform of AGENTS) {
        const content = buildAgentGuidanceContent(platform, scan);
        expect(content).toContain('自动命令检测');
        expect(content.length).toBeGreaterThan(100);
      }
    });
  });
  
  describe('generateAgentGuidanceFile', () => {
    it('should create CLAUDE.md for claude-code', () => {
      const platform = AGENTS.find(a => a.id === 'claude-code');
      const result = generateAgentGuidanceFile(testProjectRoot, platform, mockScan);
      
      expect(result.created).toBe(true);
      expect(result.path).toContain('CLAUDE.md');
      expect(result.action).toBe('created');
      expect(fs.existsSync(result.path)).toBe(true);
    });
    
    it('should create 00-ome-auto-detection.mdc for cursor', () => {
      const platform = AGENTS.find(a => a.id === 'cursor');
      const result = generateAgentGuidanceFile(testProjectRoot, platform, mockScan);
      
      expect(result.created).toBe(true);
      expect(result.path).toContain('.cursor/rules/00-ome-auto-detection.mdc');
      expect(fs.existsSync(result.path)).toBe(true);
      
      const content = fs.readFileSync(result.path, 'utf8');
      expect(content).toContain('glob: "**/*"');
    });
    
    it('should preserve existing content outside OME markers for single-file platforms', () => {
      const platform = AGENTS.find(a => a.id === 'claude-code');
      const existingContent = '# My Custom Rules\n\nCustom content\n\n<!-- OME:START -->\nOld content\n<!-- OME:END -->';
      fs.writeFileSync(path.join(testProjectRoot, 'CLAUDE.md'), existingContent);
      
      const result = generateAgentGuidanceFile(testProjectRoot, platform, mockScan);
      const newContent = fs.readFileSync(result.path, 'utf8');
      
      expect(newContent).toContain('# My Custom Rules');
      expect(newContent).toContain('Custom content');
      expect(newContent).not.toContain('Old content');
      expect(newContent).toContain('自动命令检测');
    });
    
    it('should skip duplicate files for shared platforms', () => {
      const codex = AGENTS.find(a => a.id === 'codex');
      const opencode = AGENTS.find(a => a.id === 'opencode');
      
      const result1 = generateAgentGuidanceFile(testProjectRoot, codex, mockScan);
      expect(result1.action).toBe('created');
      
      const result2 = generateAgentGuidanceFile(testProjectRoot, opencode, mockScan);
      expect(result2.action).toBe('skipped'); // AGENTS.md 已存在
    });
  });
  
  describe('generateAllAgentGuidanceFiles', () => {
    it('should generate guidance files for all 8 platforms', () => {
      const results = generateAllAgentGuidanceFiles(testProjectRoot, mockScan);
      
      expect(results.length).toBeGreaterThanOrEqual(8);
      
      // 验证单文件平台
      expect(results.some(r => r.path.includes('CLAUDE.md'))).toBe(true);
      expect(results.some(r => r.path.includes('AGENTS.md'))).toBe(true);
      expect(results.some(r => r.path.includes('.windsurfrules'))).toBe(true);
      expect(results.some(r => r.path.includes('GEMINI.md'))).toBe(true);
      
      // 验证多文件平台
      expect(results.some(r => r.path.includes('.cursor/rules/00-ome-auto-detection.mdc'))).toBe(true);
      expect(results.some(r => r.path.includes('.trae/rules/00-ome-auto-detection.md'))).toBe(true);
      expect(results.some(r => r.path.includes('.qoder/rules/00-ome-auto-detection.md'))).toBe(true);
    });
  });
});
```

### 集成测试

**测试文件**: `src/tests/ome-init.test.ts`

```typescript
describe('ome init with agent guidance', () => {
  it('should generate guidance files for all platforms during initialization', () => {
    const result = initializeProject({
      force: true,
      template: 'default',
      projectRoot: testProjectRoot,
      repoRoot: repoRoot,
      sync: true
    });
    
    // 验证返回结果包含所有平台
    expect(result.agentGuidanceFiles.length).toBeGreaterThanOrEqual(8);
    
    // 验证单文件平台
    expect(fs.existsSync(path.join(testProjectRoot, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectRoot, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectRoot, '.windsurfrules'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectRoot, 'GEMINI.md'))).toBe(true);
    
    // 验证多文件平台
    expect(fs.existsSync(path.join(testProjectRoot, '.cursor/rules/00-ome-auto-detection.mdc'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectRoot, '.trae/rules/00-ome-auto-detection.md'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectRoot, '.qoder/rules/00-ome-auto-detection.md'))).toBe(true);
    
    // 验证 CLAUDE.md 内容
    const claudeContent = fs.readFileSync(path.join(testProjectRoot, 'CLAUDE.md'), 'utf8');
    expect(claudeContent).toContain('自动命令检测');
    expect(claudeContent).toContain('<!-- OME:START -->');
    expect(claudeContent).toContain('规则索引');
    
    // 验证 Cursor 内容
    const cursorContent = fs.readFileSync(path.join(testProjectRoot, '.cursor/rules/00-ome-auto-detection.mdc'), 'utf8');
    expect(cursorContent).toContain('glob: "**/*"');
    expect(cursorContent).toContain('自动命令检测');
  });
  
  it('should generate platform-specific command syntax', () => {
    const result = initializeProject({
      force: true,
      template: 'default',
      projectRoot: testProjectRoot,
      repoRoot: repoRoot,
      sync: true
    });
    
    // Claude Code: slash 命令
    const claudeContent = fs.readFileSync(path.join(testProjectRoot, 'CLAUDE.md'), 'utf8');
    expect(claudeContent).toContain('/ome-bug');
    
    // Codex: skill 名称
    const agentsContent = fs.readFileSync(path.join(testProjectRoot, 'AGENTS.md'), 'utf8');
    expect(agentsContent).toContain('ome-bug');
    expect(agentsContent).not.toContain('/ome-bug');
  });
});
```

### 手动测试场景

1. **全新项目初始化**:
   ```bash
   cd test-project
   ome init
   # 验证: CLAUDE.md 和 AGENTS.md 已创建
   # 验证: 文件包含自动检测规则
   ```

2. **已有 CLAUDE.md 的项目**:
   ```bash
   # 手动创建 CLAUDE.md 并添加自定义内容
   echo "# My Rules\n\nCustom content" > CLAUDE.md
   ome init --force
   # 验证: 自定义内容保留
   # 验证: OME 内容已追加
   ```

3. **规则同步更新**:
   ```bash
   ome init
   # 修改 .ome/rules/code-style.md
   ome rules sync
   # 验证: CLAUDE.md 中的规则索引已更新
   # 验证: 自动检测规则部分未被修改
   ```

4. **Claude 自动使用命令**:
   - 在 Claude Code 中打开项目
   - 输入: "登录按钮点击没反应"
   - 验证: Claude 自动使用 `/ome-bug` 命令
   - 输入: "还原这个设计稿 [URL]"
   - 验证: Claude 自动使用 `/ome-ui` 命令

## Verification

### 实现完成的验证清单

- [ ] `buildAgentGuidanceContent()` 函数已实现并通过单元测试
- [ ] `generateAgentGuidanceFile()` 函数已实现并通过单元测试
- [ ] `initializeProject()` 已修改，调用指导文件生成
- [ ] `syncRules()` 已修改，支持 OME 标记块更新
- [ ] `InitResult` 接口已更新，包含 `agentGuidanceFiles` 字段
- [ ] 所有单元测试通过（54/54 或更多）
- [ ] 集成测试通过
- [ ] 手动测试：全新项目初始化生成 CLAUDE.md
- [ ] 手动测试：已有 CLAUDE.md 的项目保留自定义内容
- [ ] 手动测试：规则同步只更新标记块内容
- [ ] 手动测试：Claude 能够自动识别并使用 OME 命令
- [ ] 文档已更新：docs/architecture.md
- [ ] 文档已更新：docs/installation-and-usage.md
- [ ] 文档已更新：README.md

### 验证命令

```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- agent-guidance-generation.test.ts
npm test -- ome-init.test.ts

# 手动验证
cd ../test-project
rm -rf .ome OME.md CLAUDE.md AGENTS.md
ome init
cat CLAUDE.md  # 检查内容
cat AGENTS.md  # 检查内容

# 验证规则同步
echo "test" >> .ome/rules/code-style.md
ome rules sync
cat CLAUDE.md  # 检查规则索引已更新，指导内容未变
```

## Implementation Order

建议按以下顺序实现：

1. **Phase 1: 核心函数实现**
   - 实现 `buildAgentGuidanceContent()`
   - 实现 `generateAgentGuidanceFile()`
   - 编写单元测试

2. **Phase 2: 集成到 init 流程**
   - 修改 `initializeProject()` 调用指导文件生成
   - 修改 `InitResult` 接口
   - 更新 `renderInitResult()` 输出

3. **Phase 3: 规则同步集成**
   - 修改 `syncRules()` 支持标记块更新
   - 确保不覆盖用户自定义内容
   - 编写集成测试

4. **Phase 4: 测试和验证**
   - 运行所有测试
   - 手动测试各种场景
   - 修复发现的问题

5. **Phase 5: 文档更新**
   - 更新架构文档
   - 更新用户指南
   - 更新 README

## Risk Assessment

### 高风险

- **覆盖用户自定义内容**: 如果标记块处理不当，可能覆盖用户手动添加的规则
  - **缓解**: 使用明确的 HTML 注释标记，只更新标记块内容
  - **缓解**: 添加充分的测试覆盖

### 中风险

- **不同平台的内容差异**: Claude Code 和 Codex 的命令风格不同
  - **缓解**: 根据 `platform.commandStyle` 动态生成内容
  - **缓解**: 为每个平台编写独立测试

- **项目类型判断不准确**: 可能为后端项目生成 UI 命令
  - **缓解**: 基于 `scan.hasUi`、`scan.uiFrameworks` 等准确判断
  - **缓解**: 提供配置选项让用户手动调整

### 低风险

- **文件权限问题**: 在某些环境下可能无法写入文件
  - **缓解**: 使用现有的 `writeFileIfNeeded()` 函数，已处理权限问题

## Success Criteria

实现成功的标准：

1. **功能完整性**:
   - `ome init` 自动生成 CLAUDE.md 和 AGENTS.md
   - 文件包含完整的自动检测规则
   - 规则索引正确集成到指导文件中

2. **兼容性**:
   - 不破坏现有的 `ome init` 和 `ome rules sync` 功能
   - 保留用户自定义的 CLAUDE.md 内容
   - 支持多平台（Claude Code、Codex、OpenCode）

3. **可验证性**:
   - 所有测试通过
   - Claude 能够自动识别任务类型并使用对应命令
   - 用户反馈：Claude 不再需要手动指定 `/ome-bug` 等命令

4. **文档完整性**:
   - 架构文档更新
   - 用户指南包含新功能说明
   - README 包含使用示例

## Output Contract

本计划文档提供：

- ✅ **Purpose**: 明确了要解决的问题和价值
- ✅ **Current State**: 分析了现有代码结构和问题
- ✅ **Implementation Approach**: 提供了详细的实现方案
- ✅ **Interfaces**: 定义了新增和修改的函数签名
- ✅ **Edge Cases**: 列举了需要处理的边界情况
- ✅ **Test Strategy**: 提供了完整的测试策略
- ✅ **Verification**: 定义了验证清单和命令
- ✅ **Implementation Order**: 建议了实现顺序
- ✅ **Risk Assessment**: 评估了风险和缓解措施
- ✅ **Success Criteria**: 定义了成功标准

下一步：执行 `/ome-build` 开始实现此计划。
