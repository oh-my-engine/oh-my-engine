#!/usr/bin/env node

/**
 * Rules Sync - 跨平台 Rules 同步工具（增强版）
 *
 * 支持特性：
 * - 单文件模式（索引文件）和多文件模式（完整规则）
 * - .mdc 格式（带 frontmatter）和 .md 格式（纯 Markdown）
 * - 文件名映射（i18n.md -> i18n-localization.mdc）
 * - 编号前缀（01-i18n.md, 02-theme.md）
 */

const fs = require('fs');
const path = require('path');

// 读取配置文件
function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ 找不到 config.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

// 读取平台配置
function loadPlatforms() {
  const platformsPath = path.join(__dirname, 'platforms.json');
  if (!fs.existsSync(platformsPath)) {
    console.error('❌ 找不到 platforms.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(platformsPath, 'utf-8'));
}

// 读取所有 rules 文件
function loadRules() {
  const rulesDir = path.join(__dirname, 'rules');
  if (!fs.existsSync(rulesDir)) {
    console.error('❌ 找不到 rules 目录');
    process.exit(1);
  }

  const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
  const rules = {};

  for (const file of ruleFiles) {
    const ruleName = path.basename(file, '.md');
    const content = fs.readFileSync(path.join(rulesDir, file), 'utf-8');
    rules[ruleName] = content;
  }

  return rules;
}

// 获取规则的映射文件名
function getMappedFilename(ruleName, platform, platformsConfig) {
  const mapping = platformsConfig.ruleMapping?.[ruleName];
  if (mapping) {
    return mapping[platform] || mapping.default || ruleName;
  }
  return ruleName;
}

// 生成 frontmatter
function generateFrontmatter(ruleName, platformConfig, config) {
  if (!platformConfig.frontmatter) return '';

  const frontmatter = {
    ...platformConfig.frontmatter,
  };

  // 根据规则类型设置 glob
  if (ruleName === 'i18n') {
    frontmatter.glob = 'app/**/*.tsx,app/**/*.ts,app/i18n/**/*';
  } else if (ruleName === 'theme') {
    frontmatter.glob = 'app/**/*.tsx,app/**/*.ts';
  } else if (ruleName === 'code-style') {
    frontmatter.glob = '**/*.ts,**/*.tsx,**/*.js,**/*.jsx';
  }

  // 设置 description
  frontmatter.description = config.rules?.[ruleName]?.description || ruleName;

  const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
    if (typeof value === 'string') {
      return `${key}: "${value}"`;
    }
    return `${key}: ${value}`;
  });

  return `---\n${yamlLines.join('\n')}\n---\n\n`;
}

// 生成 .mdc 格式内容
function generateMDC(ruleName, ruleContent, platformConfig, config) {
  const frontmatter = generateFrontmatter(ruleName, platformConfig, config);
  return frontmatter + ruleContent;
}

// 生成轻量级索引内容
function generateIndexContent(config, rules, platformsConfig) {
  let content = '';

  // 添加项目信息
  content += `## 项目信息\n\n`;
  content += `- **项目名称**: ${config.project.name}\n`;
  content += `- **项目类型**: ${config.project.type}\n`;
  content += `- **框架**: ${config.project.framework}\n\n`;

  // 添加重要说明
  content += `## ⚠️ 重要说明\n\n`;
  content += `**本文件是规则索引文件，不包含完整规则内容。**\n\n`;
  content += `- 📁 **规则源**：\`.oh-my-engine/rules/\`\n`;
  content += `- 🔄 **维护方式**：只需编辑 \`.oh-my-engine/rules/*.md\`，无需修改本文件\n`;
  content += `- 📖 **使用方式**：执行任务前，请先读取对应的规则文件\n\n`;

  // 添加规则优先级说明
  content += `## 规则优先级\n\n`;
  content += `当遇到规则冲突时，按以下优先级执行：\n\n`;
  content += `1. **\`.oh-my-engine/rules/*.md\`** (最高优先级) - 详细规则，请直接读取\n`;
  content += `2. **本文件** (中等优先级) - 索引和快速参考\n`;
  content += `3. **平台默认规则** (最低优先级) - 平台内置规则\n\n`;

  // 添加规则索引
  content += `## 📚 规则索引\n\n`;
  content += `以下是所有可用的规则文件。**执行任务前，请根据任务类型读取对应的规则文件**：\n\n`;

  // 按类别组织规则
  const rulesByCategory = {
    '通用规则（所有任务适用）': [],
    'UI 相关规则': [],
    '代码规范': [],
  };

  for (const ruleName of Object.keys(rules)) {
    const ruleFile = `.oh-my-engine/rules/${ruleName}.md`;
    const description = config.rules?.[ruleName]?.description || ruleName;

    if (ruleName.includes('style') || ruleName.includes('code')) {
      rulesByCategory['代码规范'].push({ name: ruleName, file: ruleFile, description });
    } else if (ruleName.includes('theme') || ruleName.includes('i18n') || ruleName.includes('design')) {
      rulesByCategory['UI 相关规则'].push({ name: ruleName, file: ruleFile, description });
    } else {
      rulesByCategory['通用规则（所有任务适用）'].push({ name: ruleName, file: ruleFile, description });
    }
  }

  for (const [category, ruleList] of Object.entries(rulesByCategory)) {
    if (ruleList.length === 0) continue;

    content += `### ${category}\n\n`;
    for (const rule of ruleList) {
      content += `- 📄 [\`${rule.name}.md\`](${rule.file}) - ${rule.description}\n`;
    }
    content += `\n`;
  }

  // 添加 workflow 说明
  content += `## 🔧 Workflow 规则映射\n\n`;
  content += `不同的 workflow 需要应用不同的规则组合：\n\n`;

  for (const [workflowName, workflowConfig] of Object.entries(config.workflows || {})) {
    if (!workflowConfig.enabled) continue;

    content += `### ${workflowName}\n\n`;
    if (workflowConfig.description) {
      content += `**说明**: ${workflowConfig.description}\n\n`;
    }
    if (workflowConfig.rules && workflowConfig.rules.length > 0) {
      content += `**应用规则**:\n`;
      for (const ruleName of workflowConfig.rules) {
        content += `- 📄 [\`${ruleName}.md\`](.oh-my-engine/rules/${ruleName}.md)\n`;
      }
      content += `\n`;
    }
    if (workflowConfig.skills && workflowConfig.skills.length > 0) {
      content += `**使用 Skills**: ${workflowConfig.skills.join(', ')}\n\n`;
    }
  }

  // 添加使用说明
  content += `## 📖 使用说明\n\n`;
  content += `### 对于 AI Agent\n\n`;
  content += `1. **开始任务前**：根据任务类型，使用 Read 工具读取对应的规则文件\n`;
  content += `2. **执行任务时**：严格遵循规则文件中的强制要求\n`;
  content += `3. **完成任务后**：对照规则文件中的验证清单检查代码\n\n`;
  content += `### 对于开发者\n\n`;
  content += `1. **修改规则**：编辑 \`.oh-my-engine/rules/*.md\`\n`;
  content += `2. **同步规则**：运行 \`node .oh-my-engine/rules-sync.js\`\n`;
  content += `3. **添加规则**：在 \`.oh-my-engine/rules/\` 中创建新的 \`.md\` 文件\n\n`;

  return content;
}

// 生成平台特定的头部
function generatePlatformHeader(platform, platformConfig) {
  let header = `# ${platformConfig.name} Rules\n\n`;
  header += `> 本文件由 .oh-my-engine/rules/ 自动生成，请勿手动编辑\n`;
  header += `> 运行 \`node .oh-my-engine/rules-sync.js\` 更新\n\n`;
  return header;
}

// 生成平台特定说明
function generatePlatformFooter(platform, platformConfig) {
  let footer = `\n---\n\n`;
  footer += `## 平台特定说明 (${platform})\n\n`;

  switch (platform) {
    case 'claude-code':
      footer += `- 使用 \`/oh-my-engine-*\` 命令时，会自动加载对应 workflow 的特定规则\n`;
      footer += `- 本文件是索引文件，详细规则请读取 \`.oh-my-engine/rules/\` 中的文件\n`;
      footer += `- 使用 Read 工具读取规则文件：\`Read .oh-my-engine/rules/theme.md\`\n`;
      break;
    case 'cursor':
    case 'trae':
      footer += `- 本文件在 ${platformConfig.name} 中自动生效\n`;
      footer += `- 规则源文件：\`.oh-my-engine/rules/\`\n`;
      footer += `- 修改规则请编辑源文件，然后运行同步脚本\n`;
      break;
    default:
      footer += `- 本文件是规则索引，详细规则在 \`.oh-my-engine/rules/\` 目录\n`;
      footer += `- 执行任务前，请根据任务类型读取对应的规则文件\n`;
      break;
  }

  return footer;
}

// 写入文件
function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

// 处理单文件平台
function processSingleFilePlatform(platform, platformConfig, config, rules, platformsConfig, projectRoot) {
  const filePath = path.join(projectRoot, platformConfig.file);

  let content = generatePlatformHeader(platform, platformConfig);

  if (platformConfig.format === 'markdown-index') {
    // 生成索引文件
    content += generateIndexContent(config, rules, platformsConfig);
  } else {
    // 生成完整内容（旧版兼容）
    content += generateIndexContent(config, rules, platformsConfig);
  }

  content += generatePlatformFooter(platform, platformConfig);

  writeFile(filePath, content);
  return filePath;
}

// 处理多文件平台
function processMultiFilePlatform(platform, platformConfig, config, rules, platformsConfig, projectRoot) {
  const directory = path.join(projectRoot, platformConfig.directory);

  // 清空目录（可选）
  if (fs.existsSync(directory)) {
    const existingFiles = fs.readdirSync(directory);
    for (const file of existingFiles) {
      if (file.endsWith(platformConfig.extension)) {
        fs.unlinkSync(path.join(directory, file));
      }
    }
  }

  const generatedFiles = [];
  let index = 1;

  for (const [ruleName, ruleContent] of Object.entries(rules)) {
    // 获取映射后的文件名
    const mappedName = getMappedFilename(ruleName, platform, platformsConfig);

    // 生成文件名
    let filename;
    if (platformConfig.numberedPrefix) {
      const prefix = String(index).padStart(2, '0');
      filename = `${prefix}-${mappedName}${platformConfig.extension}`;
      index++;
    } else {
      filename = `${mappedName}${platformConfig.extension}`;
    }

    // 生成内容
    let content;
    if (platformConfig.format === 'mdc') {
      content = generateMDC(ruleName, ruleContent, platformConfig, config);
    } else {
      content = ruleContent;
    }

    // 写入文件
    const filePath = path.join(directory, filename);
    writeFile(filePath, content);
    generatedFiles.push(filename);
  }

  return { directory, files: generatedFiles };
}

// 主函数
function main() {
  console.log('🔄 开始同步 rules...\n');

  // 加载配置和规则
  const config = loadConfig();
  const platformsConfig = loadPlatforms();
  const rules = loadRules();

  console.log(`📚 找到 ${Object.keys(rules).length} 个规则文件:`);
  for (const ruleName of Object.keys(rules)) {
    console.log(`   - ${ruleName}.md`);
  }
  console.log('');

  // 获取项目根目录
  const projectRoot = path.resolve(__dirname, '..');

  // 获取要同步的平台
  const platforms = process.argv.slice(2);
  const targetPlatforms = platforms.length > 0
    ? platforms
    : platformsConfig.enabled || Object.keys(platformsConfig.platforms);

  // 为每个平台生成规则文件
  for (const platform of targetPlatforms) {
    const platformConfig = platformsConfig.platforms[platform];

    if (!platformConfig) {
      console.warn(`⚠️  未知平台: ${platform}`);
      continue;
    }

    try {
      if (platformConfig.type === 'single-file') {
        const filePath = processSingleFilePlatform(
          platform,
          platformConfig,
          config,
          rules,
          platformsConfig,
          projectRoot
        );
        console.log(`✅ ${platform}: ${path.relative(projectRoot, filePath)}`);
      } else if (platformConfig.type === 'multi-file') {
        const result = processMultiFilePlatform(
          platform,
          platformConfig,
          config,
          rules,
          platformsConfig,
          projectRoot
        );
        console.log(`✅ ${platform}: ${path.relative(projectRoot, result.directory)}/ (${result.files.length} 个文件)`);
      }
    } catch (error) {
      console.error(`❌ ${platform}: ${error.message}`);
    }
  }

  console.log('\n🎉 同步完成！');
  console.log('\n💡 提示:');
  console.log('   - 修改规则请编辑 .oh-my-engine/rules/*.md');
  console.log('   - 运行 `node .oh-my-engine/rules-sync.js` 重新生成');
  console.log('   - 指定平台: `node .oh-my-engine/rules-sync.js claude-code cursor`');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = {
  generateIndexContent,
  generateMDC,
  getMappedFilename,
  processSingleFilePlatform,
  processMultiFilePlatform
};
