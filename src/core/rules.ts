const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const { fileExists, listMarkdownFiles, projectPath, readJsonFile } = require('./project');
const { ENGINE_DIR, enginePath } = require('./paths');
const { loadConfig, loadPlatformsConfig } = require('./config-loader');

export interface RulesValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface RulesValidationReport {
  ok: boolean;
  rules: string[];
  issues: RulesValidationIssue[];
}

export interface RulesPreviewTarget {
  platform: string;
  target: string;
  action: 'create' | 'update';
}

export interface RulesSyncResult {
  platform: string;
  target: string;
  files?: string[];
}

export interface RuleMetadata {
  rule: string;
  version?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  severity?: 'warning' | 'error';
  tags?: string[];
  dependencies?: string[];
  conflicts?: string[];
  applicableWhen?: {
    'project.type'?: string | string[];
    'project.framework'?: string | string[];
    'project.language'?: string | string[];
  };
  autoApply?: boolean;
}

function loadProjectConfig(root: string = process.cwd()): Record<string, any> {
  try {
    return loadConfig(root);
  } catch (error) {
    // Fallback to empty config if loading fails
    return {};
  }
}

function loadRules(root: string = process.cwd()): Record<string, string> {
  const rulesDirectory = enginePath(root, 'rules');
  if (!fs.existsSync(rulesDirectory)) return {};

  const rules: Record<string, string> = {};

  // 加载主规则目录
  const mainFiles = fs
    .readdirSync(rulesDirectory)
    .filter((fileName: string) => fileName.endsWith('.md') && fs.statSync(path.join(rulesDirectory, fileName)).isFile());

  for (const fileName of mainFiles) {
    const ruleName = path.basename(fileName, '.md');
    rules[ruleName] = fs.readFileSync(path.join(rulesDirectory, fileName), 'utf8');
  }

  // 加载 learned 子目录
  const learnedDirectory = path.join(rulesDirectory, 'learned');
  if (fs.existsSync(learnedDirectory)) {
    const learnedFiles = fs
      .readdirSync(learnedDirectory)
      .filter((fileName: string) => fileName.endsWith('.md'));

    for (const fileName of learnedFiles) {
      const ruleName = path.basename(fileName, '.md');
      rules[ruleName] = fs.readFileSync(path.join(learnedDirectory, fileName), 'utf8');
    }
  }

  return rules;
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeManagedFileBlock(filePath: string, content: string): void {
  const start = '<!-- OME:START -->';
  const end = '<!-- OME:END -->';
  const block = `${start}\n${content.trimEnd()}\n${end}\n`;

  if (!fs.existsSync(filePath)) {
    writeFile(filePath, block);
    return;
  }

  const current = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.trimEnd()}\n\n${block}`;
  writeFile(filePath, next);
}

export function getMappedFilename(ruleName: string, platform: string, platformsConfig: Record<string, any>): string {
  const mapping = platformsConfig.ruleMapping?.[ruleName];
  if (mapping) return mapping[platform] || mapping.default || ruleName;
  return ruleName;
}

function ruleDescription(config: Record<string, any>, ruleName: string): string {
  return config.rules?.[ruleName]?.description || config.rules?.[ruleName.replace('-', '_')]?.description || ruleName;
}

export function generateFrontmatter(ruleName: string, platformConfig: Record<string, any>, config: Record<string, any>): string {
  if (!platformConfig.frontmatter) return '';
  const frontmatter: Record<string, any> = { ...platformConfig.frontmatter };

  if (ruleName === 'i18n') frontmatter.glob = 'app/**/*.tsx,app/**/*.ts,app/i18n/**/*';
  else if (ruleName === 'theme') frontmatter.glob = 'app/**/*.tsx,app/**/*.ts';
  else if (ruleName === 'code-style') frontmatter.glob = '**/*.ts,**/*.tsx,**/*.js,**/*.jsx';

  frontmatter.description = ruleDescription(config, ruleName);
  const yaml = Object.entries(frontmatter).map(([key, value]) => typeof value === 'string' ? `${key}: "${value}"` : `${key}: ${value}`);
  return `---\n${yaml.join('\n')}\n---\n\n`;
}

export function generateMDC(ruleName: string, ruleContent: string, platformConfig: Record<string, any>, config: Record<string, any>): string {
  return generateFrontmatter(ruleName, platformConfig, config) + ruleContent;
}

function categorizeRules(rules: Record<string, string>, config: Record<string, any>): Record<string, Array<Record<string, string>>> {
  const categories: Record<string, Array<Record<string, string>>> = {
    '通用规则（所有任务适用）': [],
    'UI 相关规则': [],
    '代码规范': []
  };

  for (const ruleName of Object.keys(rules).sort()) {
    const record = {
      name: ruleName,
      file: `${ENGINE_DIR}/rules/${ruleName}.md`,
      description: ruleDescription(config, ruleName)
    };

    if (ruleName.includes('style') || ruleName.includes('code')) categories['代码规范'].push(record);
    else if (ruleName.includes('theme') || ruleName.includes('i18n') || ruleName.includes('design')) categories['UI 相关规则'].push(record);
    else categories['通用规则（所有任务适用）'].push(record);
  }

  return categories;
}

export function generateIndexContent(config: Record<string, any>, rules: Record<string, string>): string {
  const project = config.project || {};
  let content = '';

  content += `## 项目信息\n\n`;
  content += `- **项目名称**: ${project.name || ''}\n`;
  content += `- **项目类型**: ${project.type || ''}\n`;
  content += `- **框架**: ${project.framework || ''}\n\n`;

  content += `## ⚠️ 重要说明\n\n`;
  content += `**本文件是规则索引文件，不包含完整规则内容。**\n\n`;
  content += `- 📁 **规则源**：\`${ENGINE_DIR}/rules/\`\n`;
  content += `- 🔄 **维护方式**：只需编辑 \`${ENGINE_DIR}/rules/*.md\`，无需修改本文件\n`;
  content += `- 📖 **使用方式**：执行任务前，请先读取对应的规则文件\n\n`;

  content += `## 规则优先级\n\n`;
  content += `当遇到规则冲突时，按以下优先级执行：\n\n`;
  content += `1. **\`${ENGINE_DIR}/rules/*.md\`** (最高优先级) - 详细规则，请直接读取\n`;
  content += `2. **本文件** (中等优先级) - 索引和快速参考\n`;
  content += `3. **平台默认规则** (最低优先级) - 平台内置规则\n\n`;

  content += `## 📚 规则索引\n\n`;
  content += `以下是所有可用的规则文件。**执行任务前，请根据任务类型读取对应的规则文件**：\n\n`;

  for (const [category, ruleList] of Object.entries(categorizeRules(rules, config))) {
    if (ruleList.length === 0) continue;
    content += `### ${category}\n\n`;
    for (const rule of ruleList) content += `- 📄 [\`${rule.name}.md\`](${rule.file}) - ${rule.description}\n`;
    content += `\n`;
  }

  content += `## 🔧 Workflow 规则映射\n\n`;
  content += `不同的 workflow 需要应用不同的规则组合：\n\n`;
  for (const [workflowName, workflowConfig] of Object.entries(config.workflows || {}) as Array<[string, any]>) {
    if (!workflowConfig.enabled) continue;
    content += `### ${workflowName}\n\n`;
    if (workflowConfig.description) content += `**说明**: ${workflowConfig.description}\n\n`;
    if (workflowConfig.rules?.length) {
      content += `**应用规则**:\n`;
      for (const ruleName of workflowConfig.rules) content += `- 📄 [\`${ruleName}.md\`](${ENGINE_DIR}/rules/${ruleName}.md)\n`;
      content += `\n`;
    }
    if (workflowConfig.skills?.length) content += `**使用 Skills**: ${workflowConfig.skills.join(', ')}\n\n`;
  }

  content += `## 📖 使用说明\n\n`;
  content += `### 对于 AI Agent\n\n`;
  content += `1. **开始任务前**：根据任务类型，使用 Read 工具读取对应的规则文件\n`;
  content += `2. **执行任务时**：严格遵循规则文件中的强制要求\n`;
  content += `3. **完成任务后**：对照规则文件中的验证清单检查代码\n\n`;
  content += `### 对于开发者\n\n`;
  content += `1. **修改规则**：编辑 \`${ENGINE_DIR}/rules/*.md\`\n`;
  content += `2. **同步规则**：运行 \`ome rules sync\`\n`;
  content += `3. **添加规则**：在 \`${ENGINE_DIR}/rules/\` 中创建新的 \`.md\` 文件\n\n`;

  return content;
}

function generatePlatformHeader(platformConfig: Record<string, any>): string {
  return `# ${platformConfig.name} Rules\n\n> 本文件由 ${ENGINE_DIR}/rules/ 自动生成，请勿手动编辑 OME 标记块\n> 运行 \`ome rules sync\` 更新\n\n`;
}

function generatePlatformFooter(platform: string, platformConfig: Record<string, any>): string {
  let footer = `\n---\n\n## 平台特定说明 (${platform})\n\n`;
  switch (platform) {
    case 'claude-code':
      footer += `- 使用 \`/ome-*\` 命令时，会自动加载对应 workflow 的特定规则\n`;
      footer += `- 本文件是索引文件，详细规则请读取 \`${ENGINE_DIR}/rules/\` 中的文件\n`;
      footer += `- 使用 Read 工具读取规则文件：\`Read ${ENGINE_DIR}/rules/theme.md\`\n`;
      break;
    case 'cursor':
    case 'trae':
      footer += `- 本文件在 ${platformConfig.name} 中自动生效\n`;
      footer += `- 规则源文件：\`${ENGINE_DIR}/rules/\`\n`;
      footer += `- 修改规则请编辑源文件，然后运行同步脚本\n`;
      break;
    default:
      footer += `- 本文件是规则索引，详细规则在 \`${ENGINE_DIR}/rules/\` 目录\n`;
      footer += `- 执行任务前，请根据任务类型读取对应的规则文件\n`;
      break;
  }
  return footer;
}

function generateRulesEntryContent(platform: string, platformConfig: Record<string, any>, config: Record<string, any>, rules: Record<string, string>): string {
  const project = config.project || {};
  const ruleNames = Object.keys(rules).sort();
  const lines: string[] = [];

  if (platformConfig.format === 'mdc') {
    lines.push('---');
    lines.push('glob: "**/*"');
    lines.push('alwaysApply: true');
    lines.push('description: "Oh My Engine project rule entry"');
    lines.push('---');
    lines.push('');
  }

  lines.push(`# ${platformConfig.name} OME Rules Entry`);
  lines.push('');
  lines.push('This file is a generated entry point. It does not contain the full rules.');
  lines.push('');
  lines.push('## Project');
  lines.push('');
  lines.push(`- Project name: ${project.name || ''}`);
  lines.push(`- Project type: ${project.type || ''}`);
  lines.push(`- Framework: ${project.framework || ''}`);
  lines.push('- Config: `OME.md`');
  lines.push('- Rule source: `.ome/rules/`');
  lines.push('');
  lines.push('## Required Behavior');
  lines.push('');
  lines.push('- Before editing, read `OME.md` and the relevant files under `.ome/rules/`.');
  lines.push('- Select rule files by task domain instead of loading unrelated rules.');
  lines.push('- Treat `.ome/rules/` as the canonical source; platform files are generated views only.');
  lines.push('- Run `ome rules sync` after changing rule source files.');
  lines.push('');
  lines.push('## Available Rules');
  lines.push('');
  if (ruleNames.length === 0) {
    lines.push('- No rule files found under `.ome/rules/`.');
  } else {
    for (const ruleName of ruleNames) lines.push(`- \`.ome/rules/${ruleName}.md\``);
  }
  lines.push('');
  lines.push(`## Platform`);
  lines.push('');
  lines.push(`- Platform id: ${platform}`);
  lines.push(`- Platform name: ${platformConfig.name}`);

  return lines.join('\n');
}

function processSingleFilePlatform(platform: string, platformConfig: Record<string, any>, config: Record<string, any>, rules: Record<string, string>, root: string): RulesSyncResult {
  const filePath = path.join(root, platformConfig.file);
  const content = generateRulesEntryContent(platform, platformConfig, config, rules);
  writeManagedFileBlock(filePath, content);
  return { platform, target: path.relative(root, filePath) };
}

function processMultiFilePlatform(platform: string, platformConfig: Record<string, any>, config: Record<string, any>, rules: Record<string, string>, platformsConfig: Record<string, any>, root: string): RulesSyncResult {
  const directory = path.join(root, platformConfig.directory);
  const extension = platformConfig.extension || '.md';
  const fileName = `00-ome-rules${extension}`;
  const content = generateRulesEntryContent(platform, platformConfig, config, rules);
  writeFile(path.join(directory, fileName), content);

  return { platform, target: `${path.relative(root, directory)}/${fileName}`, files: [fileName] };
}

export function validateRules(): RulesValidationReport {
  const config = loadProjectConfig();
  const ruleFiles = listMarkdownFiles(enginePath(process.cwd(), 'rules'));
  const ruleNames = ruleFiles.map((name: string) => path.basename(name, '.md'));
  const ruleSet = new Set(ruleNames);
  const issues: RulesValidationIssue[] = [];

  if (ruleFiles.length === 0) issues.push({ severity: 'error', message: `No rule files found under ${ENGINE_DIR}/rules` });

  for (const [workflowName, workflowConfig] of Object.entries(config.workflows || {}) as Array<[string, any]>) {
    for (const ruleName of workflowConfig.rules || []) {
      if (!ruleSet.has(ruleName)) issues.push({ severity: 'error', message: `Workflow ${workflowName} references missing rule ${ruleName}` });
    }
  }

  return { ok: issues.every(issue => issue.severity !== 'error'), rules: ruleNames, issues };
}

export function previewRulesSync(platformFilter?: string): RulesPreviewTarget[] {
  const root = process.cwd();
  const platformsConfig = loadPlatformsConfig(root);
  const enabled = Array.isArray(platformsConfig.enabled) ? platformsConfig.enabled : [];
  const platformIds = platformFilter && platformFilter !== 'all' ? [platformFilter] : enabled;
  const rules = loadRules(root);

  return platformIds.flatMap((platformId: string) => {
    const platform = platformsConfig.platforms?.[platformId];
    if (!platform) return [];
    if (platform.type === 'single-file') return [{ platform: platformId, target: platform.file, action: fs.existsSync(path.join(root, platform.file)) ? 'update' : 'create' }];
    if (platform.type === 'multi-file') {
      const target = path.join(platform.directory, `00-ome-rules${platform.extension || '.md'}`);
      return [{ platform: platformId, target, action: fs.existsSync(path.join(root, target)) ? 'update' : 'create' }];
    }
    return [];
  });
}

export function syncRules(platforms: string[] = [], root: string = process.cwd()): RulesSyncResult[] {
  const config = loadProjectConfig(root);
  const platformsConfig = loadPlatformsConfig(root);
  const rules = loadRules(root);
  const targetPlatforms = platforms.length > 0 ? platforms : platformsConfig.enabled || Object.keys(platformsConfig.platforms || {});
  const results: RulesSyncResult[] = [];

  for (const platform of targetPlatforms) {
    const platformConfig = platformsConfig.platforms?.[platform];
    if (!platformConfig) continue;
    if (platformConfig.type === 'single-file') results.push(processSingleFilePlatform(platform, platformConfig, config, rules, root));
    else if (platformConfig.type === 'multi-file') results.push(processMultiFilePlatform(platform, platformConfig, config, rules, platformsConfig, root));
  }

  return results;
}

export function syncRulesInherit(platforms: string[] = []): void {
  process.stdout.write('🔄 开始同步 rules...\n\n');
  const rules = loadRules();
  process.stdout.write(`📚 找到 ${Object.keys(rules).length} 个规则文件:\n`);
  for (const ruleName of Object.keys(rules)) process.stdout.write(`   - ${ruleName}.md\n`);
  process.stdout.write('\n');

  for (const result of syncRules(platforms)) {
    const suffix = result.files ? ` (${result.files.length} 个文件)` : '';
    process.stdout.write(`✅ ${result.platform}: ${result.target}${suffix}\n`);
  }

  process.stdout.write('\n🎉 同步完成！\n');
}

/**
 * 解析规则的 YAML frontmatter 元数据
 */
export function parseRuleMetadata(ruleContent: string): RuleMetadata | null {
  const frontmatterMatch = ruleContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  try {
    const metadata = yaml.load(frontmatterMatch[1]) as RuleMetadata;
    return metadata;
  } catch (error) {
    return null;
  }
}

/**
 * 根据条件选择适用的规则
 */
export function selectApplicableRules(
  allRules: Record<string, string>,
  config: Record<string, any>,
  workflow?: string
): string[] {
  const applicable: string[] = [];
  const project = config.project || {};

  for (const [ruleName, ruleContent] of Object.entries(allRules)) {
    const metadata = parseRuleMetadata(ruleContent);

    // 如果没有元数据，默认启用
    if (!metadata) {
      applicable.push(ruleName);
      continue;
    }

    // 检查条件
    if (metadata.applicableWhen) {
      const conditions = metadata.applicableWhen;

      // 检查 project.framework
      if (conditions['project.framework']) {
        const frameworks = Array.isArray(conditions['project.framework'])
          ? conditions['project.framework']
          : [conditions['project.framework']];
        if (!frameworks.includes(project.framework)) {
          continue;
        }
      }

      // 检查 project.type
      if (conditions['project.type']) {
        const types = Array.isArray(conditions['project.type'])
          ? conditions['project.type']
          : [conditions['project.type']];
        if (!types.includes(project.type)) {
          continue;
        }
      }

      // 检查 project.language
      if (conditions['project.language']) {
        const languages = Array.isArray(conditions['project.language'])
          ? conditions['project.language']
          : [conditions['project.language']];
        if (!languages.includes(project.language)) {
          continue;
        }
      }
    }

    applicable.push(ruleName);
  }

  return applicable;
}

/**
 * 解析规则依赖
 */
export function resolveDependencies(
  selectedRules: string[],
  allRules: Record<string, string>
): string[] {
  const resolved = new Set<string>(selectedRules);
  const queue = [...selectedRules];

  while (queue.length > 0) {
    const ruleName = queue.shift()!;
    const ruleContent = allRules[ruleName];
    if (!ruleContent) continue;

    const metadata = parseRuleMetadata(ruleContent);
    if (metadata?.dependencies) {
      for (const dep of metadata.dependencies) {
        if (!resolved.has(dep) && allRules[dep]) {
          resolved.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  return Array.from(resolved);
}

/**
 * 检测规则冲突
 */
export function detectConflicts(
  selectedRules: string[],
  allRules: Record<string, string>
): Array<{ rule1: string; rule2: string; reason?: string }> {
  const conflicts: Array<{ rule1: string; rule2: string; reason?: string }> = [];

  for (const ruleName of selectedRules) {
    const ruleContent = allRules[ruleName];
    if (!ruleContent) continue;

    const metadata = parseRuleMetadata(ruleContent);
    if (metadata?.conflicts) {
      for (const conflictRule of metadata.conflicts) {
        if (selectedRules.includes(conflictRule)) {
          conflicts.push({
            rule1: ruleName,
            rule2: conflictRule,
            reason: `${ruleName} conflicts with ${conflictRule}`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * 列出所有规则
 */
export function listRules(root: string = process.cwd()): Record<string, string> {
  return loadRules(root);
}

/**
 * 按分类列出规则
 */
export function listRulesByCategory(root: string = process.cwd()): Record<string, string[]> {
  const rules = loadRules(root);
  const categories: Record<string, string[]> = {
    universal: [],
    framework: [],
    domain: [],
    toolchain: [],
    other: [],
  };

  for (const ruleName of Object.keys(rules)) {
    if (ruleName.startsWith('universal-')) {
      categories.universal.push(ruleName);
    } else if (ruleName.startsWith('framework-')) {
      categories.framework.push(ruleName);
    } else if (ruleName.startsWith('domain-')) {
      categories.domain.push(ruleName);
    } else if (ruleName.startsWith('toolchain-')) {
      categories.toolchain.push(ruleName);
    } else {
      categories.other.push(ruleName);
    }
  }

  return categories;
}

/**
 * 获取规则的详细信息
 */
export function getRuleInfo(ruleName: string, root: string = process.cwd()): {
  name: string;
  metadata: RuleMetadata | null;
  content: string;
  category: string;
} | null {
  const rules = loadRules(root);
  const ruleContent = rules[ruleName];

  if (!ruleContent) return null;

  const metadata = parseRuleMetadata(ruleContent);

  let category = 'other';
  if (ruleName.startsWith('universal-')) category = 'universal';
  else if (ruleName.startsWith('framework-')) category = 'framework';
  else if (ruleName.startsWith('domain-')) category = 'domain';
  else if (ruleName.startsWith('toolchain-')) category = 'toolchain';

  return {
    name: ruleName,
    metadata,
    content: ruleContent,
    category,
  };
}
