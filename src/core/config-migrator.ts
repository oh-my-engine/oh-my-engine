const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const { enginePath } = require('./paths');
const { readJsonFile } = require('./project');

export interface MigrationOptions {
  dryRun?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

export interface MigrationResult {
  success: boolean;
  omemdPath: string;
  backupPaths?: string[];
  message: string;
}

/**
 * 将 JSON 配置迁移到 OME.md
 */
export function migrateJsonToMarkdown(
  root: string = process.cwd(),
  options: MigrationOptions = {}
): MigrationResult {
  const { dryRun = false, backup = true, verbose = false } = options;

  const configPath = enginePath(root, 'config.json');
  const platformsPath = enginePath(root, 'platforms.json');
  const omemdPath = path.join(root, 'OME.md');

  // 检查源文件
  if (!fs.existsSync(configPath)) {
    return {
      success: false,
      omemdPath,
      message: 'config.json not found. Nothing to migrate.',
    };
  }

  // 检查目标文件
  if (fs.existsSync(omemdPath) && !dryRun) {
    return {
      success: false,
      omemdPath,
      message: 'OME.md already exists. Please remove it first or use --force.',
    };
  }

  try {
    // 读取配置
    const config = readJsonFile(configPath);
    const platforms = fs.existsSync(platformsPath)
      ? readJsonFile(platformsPath)
      : { enabled: [], platforms: {} };

    // 合并配置
    const mergedConfig = {
      ...config,
      platforms,
    };

    // 生成 OME.md 内容
    const markdown = generateOMEMarkdown(mergedConfig);

    if (dryRun) {
      if (verbose) {
        console.log('=== Dry Run: OME.md Preview ===\n');
        console.log(markdown);
        console.log('\n=== End of Preview ===');
      }
      return {
        success: true,
        omemdPath,
        message: 'Dry run completed. No files were modified.',
      };
    }

    // 备份原始文件
    const backupPaths: string[] = [];
    if (backup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const configBackup = `${configPath}.backup-${timestamp}`;
      fs.copyFileSync(configPath, configBackup);
      backupPaths.push(configBackup);

      if (fs.existsSync(platformsPath)) {
        const platformsBackup = `${platformsPath}.backup-${timestamp}`;
        fs.copyFileSync(platformsPath, platformsBackup);
        backupPaths.push(platformsBackup);
      }
    }

    // 写入 OME.md
    fs.writeFileSync(omemdPath, markdown, 'utf8');

    return {
      success: true,
      omemdPath,
      backupPaths,
      message: 'Configuration migrated successfully to OME.md',
    };
  } catch (error: any) {
    return {
      success: false,
      omemdPath,
      message: `Migration failed: ${error.message}`,
    };
  }
}

/**
 * 生成 OME.md 内容
 */
function generateOMEMarkdown(config: any): string {
  // 生成 YAML frontmatter
  const frontmatter = yaml.dump(config, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  // 生成文档内容
  const docs = generateDocumentation(config);

  return `---
${frontmatter}---

${docs}`;
}

/**
 * 生成配置文档
 */
function generateDocumentation(config: any): string {
  const project = config.project || {};
  const workflows = config.workflows || {};
  const memory = config.memory || {};
  const evolution = config.evolution || {};
  const platforms = config.platforms || {};

  let docs = `# Oh My Engine 配置文档

## 项目信息

- **项目名称**: ${project.name || 'N/A'}
- **项目类型**: ${project.type || 'N/A'}
- **框架**: ${project.framework || 'N/A'}
${project.language ? `- **语言**: ${project.language}` : ''}

## Workflows 说明

`;

  // 生成 Workflows 文档
  for (const [workflowName, workflowConfig] of Object.entries(workflows) as Array<[string, any]>) {
    if (!workflowConfig.enabled) continue;

    docs += `### ${workflowName}\n\n`;
    if (workflowConfig.description) {
      docs += `${workflowConfig.description}\n\n`;
    }
    if (workflowConfig.skills && workflowConfig.skills.length > 0) {
      docs += `**Skills**: ${workflowConfig.skills.join(', ')}\n\n`;
    }
    if (workflowConfig.rules && workflowConfig.rules.length > 0) {
      docs += `**应用规则**:\n`;
      for (const rule of workflowConfig.rules) {
        docs += `- ${rule}\n`;
      }
      docs += `\n`;
    }
  }

  // 规则选择器说明
  if (config.rules && config.rules.selector) {
    docs += `## 规则选择器

规则选择器会根据项目类型和框架自动选择适用的规则。

- **模式**: ${config.rules.selector.mode || 'auto'}
- **自动选择**: ${config.rules.selector.autoSelect ? '启用' : '禁用'}
${config.rules.selector.includeCategories ? `- **包含分类**: ${config.rules.selector.includeCategories.join(', ')}` : ''}

`;
  }

  // 记忆系统说明
  docs += `## 记忆系统

记忆系统采用 **${memory.captureMode || 'selective'}** 捕获模式，保留 **${memory.retention_days || 90}** 天。

`;

  if (memory.thresholds) {
    docs += `**阈值配置**:\n`;
    docs += `- 偏好提升: ${memory.thresholds.preferencePromotion || 0.8}\n`;
    docs += `- 知识提升: ${memory.thresholds.knowledgePromotion || 0.85}\n`;
    if (memory.thresholds.skillCandidatePromotion) {
      docs += `- Skill 候选提升: ${memory.thresholds.skillCandidatePromotion}\n`;
    }
    docs += `\n`;
  }

  // 进化系统说明
  docs += `## 进化系统

进化系统${evolution.enabled ? '**已启用**' : '**未启用**'}。

`;

  if (evolution.enabled) {
    docs += `- **自动应用**: ${evolution.autoApply ? '是' : '否'}\n`;
    docs += `- **需要验证**: ${evolution.requireVerification ? '是' : '否'}\n`;
    if (evolution.thresholds) {
      docs += `\n**阈值配置**:\n`;
      if (evolution.thresholds.learningCandidateMinEvidence) {
        docs += `- 学习候选最小证据: ${evolution.thresholds.learningCandidateMinEvidence}\n`;
      }
      if (evolution.thresholds.skillCandidateMinEvidence) {
        docs += `- Skill 候选最小证据: ${evolution.thresholds.skillCandidateMinEvidence}\n`;
      }
    }
    docs += `\n`;
  }

  // 平台集成说明
  if (platforms.enabled && platforms.enabled.length > 0) {
    docs += `## 平台集成

当前启用了 **${platforms.enabled.length}** 个 AI 平台的集成，规则会自动同步到各平台。

**启用的平台**: ${platforms.enabled.join(', ')}

`;

    // 列出主要平台的配置
    const mainPlatforms = ['claude-code', 'cursor', 'windsurf'];
    for (const platformId of mainPlatforms) {
      if (platforms.platforms && platforms.platforms[platformId]) {
        const platform = platforms.platforms[platformId];
        docs += `### ${platform.name || platformId}\n\n`;
        docs += `- **类型**: ${platform.type}\n`;
        if (platform.file) {
          docs += `- **文件**: ${platform.file}\n`;
        }
        if (platform.directory) {
          docs += `- **目录**: ${platform.directory}\n`;
        }
        docs += `- **格式**: ${platform.format}\n`;
        docs += `- **自动同步**: ${platform.autoSync ? '是' : '否'}\n\n`;
      }
    }
  }

  // 自定义配置说明
  docs += `## 自定义配置

你可以在此添加自定义配置说明和项目特定的文档。

### 如何修改配置

1. 直接编辑 OME.md 文件的 YAML frontmatter 部分
2. 运行 \`ome config validate\` 验证配置格式
3. 运行 \`ome rules sync\` 同步规则到各平台

### 如何添加新规则

1. 在 \`.ome/rules/\` 目录下创建新的 \`.md\` 文件
2. 使用命名前缀分类（universal-*, framework-*, domain-*, toolchain-*）
3. 添加 YAML frontmatter 元数据
4. 运行 \`ome rules sync\` 同步到各平台

### 相关命令

\`\`\`bash
ome rules list              # 列出所有规则
ome rules sync              # 同步规则到各平台
ome config validate         # 验证配置文件
ome doctor                  # 检查项目健康状态
\`\`\`
`;

  return docs;
}

/**
 * 验证 OME.md 配置
 */
export function validateMarkdownConfig(root: string = process.cwd()): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const omemdPath = path.join(root, 'OME.md');
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(omemdPath)) {
    errors.push('OME.md not found');
    return { valid: false, errors, warnings };
  }

  try {
    const content = fs.readFileSync(omemdPath, 'utf8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      errors.push('OME.md must contain YAML frontmatter (---\\n...\\n---)');
      return { valid: false, errors, warnings };
    }

    const config = yaml.load(frontmatterMatch[1]) as Record<string, any>;

    // 验证必需字段
    if (!config.version) {
      warnings.push('Missing version field');
    }

    if (!config.project) {
      errors.push('Missing project configuration');
    } else {
      if (!config.project.name) warnings.push('Missing project.name');
      if (!config.project.type) warnings.push('Missing project.type');
      if (!config.project.framework) warnings.push('Missing project.framework');
    }

    if (!config.workflows) {
      warnings.push('No workflows defined');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error: any) {
    errors.push(`Failed to parse OME.md: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}
