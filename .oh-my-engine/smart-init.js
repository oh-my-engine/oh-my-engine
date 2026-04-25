#!/usr/bin/env node

/**
 * 智能初始化 - 扫描代码仓库并生成定制化 rules
 *
 * 工作流程：
 * 1. 扫描代码仓库（文件结构、技术栈、代码模式）
 * 2. 接收用户提示词（项目特点、团队规范）
 * 3. AI 分析并生成定制化 rules
 * 4. 生成到 .oh-my-engine/rules/（唯一的规则源）
 * 5. 生成轻量级索引文件到各平台（引用规则源）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 扫描代码仓库
function scanRepository(projectRoot) {
  console.log('🔍 扫描代码仓库...\n');

  const analysis = {
    projectType: null,      // frontend/backend/fullstack/mobile/library
    techStack: [],          // React, Vue, Node.js, Python, Go, etc.
    frameworks: [],         // Next.js, Express, FastAPI, etc.
    languages: [],          // TypeScript, JavaScript, Python, Go, etc.
    structure: {},          // 目录结构
    patterns: [],           // 代码模式
    existingRules: [],      // 现有的规则文件
    packageManager: null,   // npm, yarn, pnpm, pip, go mod, etc.
  };

  // 1. 检测 package.json（前端/Node.js 项目）
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // 检测依赖
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps['react']) analysis.techStack.push('React');
    if (deps['vue']) analysis.techStack.push('Vue');
    if (deps['@angular/core']) analysis.techStack.push('Angular');
    if (deps['next']) analysis.frameworks.push('Next.js');
    if (deps['express']) analysis.frameworks.push('Express');
    if (deps['react-native']) {
      analysis.techStack.push('React Native');
      analysis.projectType = 'mobile';
    }
    if (deps['expo']) analysis.frameworks.push('Expo');

    // 检测语言
    if (deps['typescript']) analysis.languages.push('TypeScript');
    else analysis.languages.push('JavaScript');

    // 检测包管理器
    if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
      analysis.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
      analysis.packageManager = 'pnpm';
    } else {
      analysis.packageManager = 'npm';
    }
  }

  // 2. 检测 Python 项目
  if (fs.existsSync(path.join(projectRoot, 'requirements.txt')) ||
      fs.existsSync(path.join(projectRoot, 'pyproject.toml'))) {
    analysis.languages.push('Python');
    analysis.projectType = 'backend';

    // 检测 Python 框架
    try {
      const requirements = fs.readFileSync(path.join(projectRoot, 'requirements.txt'), 'utf-8');
      if (requirements.includes('django')) analysis.frameworks.push('Django');
      if (requirements.includes('fastapi')) analysis.frameworks.push('FastAPI');
      if (requirements.includes('flask')) analysis.frameworks.push('Flask');
    } catch (e) {}
  }

  // 3. 检测 Go 项目
  if (fs.existsSync(path.join(projectRoot, 'go.mod'))) {
    analysis.languages.push('Go');
    analysis.projectType = 'backend';
    analysis.packageManager = 'go mod';
  }

  // 4. 检测 Rust 项目
  if (fs.existsSync(path.join(projectRoot, 'Cargo.toml'))) {
    analysis.languages.push('Rust');
    analysis.projectType = 'backend';
    analysis.packageManager = 'cargo';
  }

  // 5. 检测项目结构
  const commonDirs = ['src', 'app', 'lib', 'components', 'pages', 'api', 'server', 'client'];
  for (const dir of commonDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      analysis.structure[dir] = true;
    }
  }

  // 6. 推断项目类型
  if (!analysis.projectType) {
    if (analysis.structure.components || analysis.structure.pages) {
      analysis.projectType = 'frontend';
    } else if (analysis.structure.api || analysis.structure.server) {
      analysis.projectType = 'backend';
    } else if (analysis.structure.client && analysis.structure.server) {
      analysis.projectType = 'fullstack';
    } else {
      analysis.projectType = 'library';
    }
  }

  // 7. 检测现有的规则文件
  const ruleLocations = [
    'CLAUDE.md',
    '.cursorrules',
    '.cursor/rules',
    '.trae/rules',
    '.agents/rules',
    'doc/project_coding_rules.md',
  ];

  for (const loc of ruleLocations) {
    const fullPath = path.join(projectRoot, loc);
    if (fs.existsSync(fullPath)) {
      analysis.existingRules.push(loc);
    }
  }

  return analysis;
}

// 生成分析报告
function generateAnalysisReport(analysis) {
  console.log('📊 代码仓库分析结果：\n');
  console.log(`项目类型: ${analysis.projectType || '未知'}`);
  console.log(`编程语言: ${analysis.languages.join(', ') || '未检测到'}`);
  console.log(`技术栈: ${analysis.techStack.join(', ') || '未检测到'}`);
  console.log(`框架: ${analysis.frameworks.join(', ') || '未检测到'}`);
  console.log(`包管理器: ${analysis.packageManager || '未检测到'}`);
  console.log(`目录结构: ${Object.keys(analysis.structure).join(', ') || '未检测到'}`);

  if (analysis.existingRules.length > 0) {
    console.log(`\n⚠️  发现现有规则文件: ${analysis.existingRules.join(', ')}`);
  }

  console.log('');
}

// 构建 AI 提示词
function buildAIPrompt(analysis, userPrompt) {
  return `
# 任务：为项目生成定制化的开发规则

## 项目分析结果

- **项目类型**: ${analysis.projectType}
- **编程语言**: ${analysis.languages.join(', ')}
- **技术栈**: ${analysis.techStack.join(', ')}
- **框架**: ${analysis.frameworks.join(', ')}
- **包管理器**: ${analysis.packageManager}
- **目录结构**: ${JSON.stringify(analysis.structure, null, 2)}

## 用户需求

${userPrompt}

## 要求

请根据以上信息，生成适合这个项目的开发规则。规则应该：

1. **针对性强**：基于实际的技术栈和项目类型
2. **实用性高**：包含具体的代码示例和检查清单
3. **可执行性**：规则清晰明确，易于遵循
4. **完整性**：覆盖代码风格、架构模式、最佳实践等方面

## 输出格式

请生成以下规则文件（Markdown 格式）：

### 1. code-style.md
- 代码风格规范
- 命名规范
- 文件组织
- 注释规范

### 2. architecture.md
- 架构模式
- 目录结构
- 模块划分
- 依赖管理

### 3. best-practices.md
- 最佳实践
- 常见陷阱
- 性能优化
- 安全规范

### 4. testing.md（如适用）
- 测试规范
- 测试覆盖率
- 测试工具

### 5. 其他特定规则（根据项目需要）
- 如果是前端项目：UI 组件规范、状态管理、样式规范
- 如果是后端项目：API 设计、数据库规范、错误处理
- 如果是移动端项目：性能优化、平台适配、用户体验

每个规则文件应包含：
- 强制要求（必须遵循）
- 推荐做法（建议遵循）
- 代码示例（正确 ✅ 和错误 ❌）
- 验证清单（完成后检查）

请开始生成规则文件。
`;
}

// 主函数
async function main() {
  const projectRoot = process.cwd();

  console.log('🚀 Oh My Engine - 智能初始化\n');
  console.log(`项目目录: ${projectRoot}\n`);

  // 1. 扫描代码仓库
  const analysis = scanRepository(projectRoot);
  generateAnalysisReport(analysis);

  // 2. 获取用户提示词
  console.log('💬 请描述你的项目特点和团队规范：');
  console.log('   （例如：这是一个 React Native 项目，使用 TypeScript，');
  console.log('    团队要求所有组件必须使用函数式组件和 Hooks，');
  console.log('    禁止使用 any 类型，必须支持多语言）\n');

  // 这里应该从命令行参数或交互式输入获取
  const userPrompt = process.argv[2] || '请根据项目实际情况生成合适的规则';

  console.log(`用户输入: ${userPrompt}\n`);

  // 3. 构建 AI 提示词
  const aiPrompt = buildAIPrompt(analysis, userPrompt);

  console.log('🤖 AI 提示词已生成\n');
  console.log('---');
  console.log(aiPrompt);
  console.log('---\n');

  console.log('💡 下一步：');
  console.log('   1. 将上述提示词发送给 AI（Claude/GPT）');
  console.log('   2. AI 会生成定制化的规则文件');
  console.log('   3. 将生成的规则保存到 .oh-my-engine/rules/');
  console.log('   4. 运行 node .oh-my-engine/rules-sync.js 生成索引文件');
  console.log('');
  console.log('📝 或者，你可以直接在 Claude Code 中运行：');
  console.log('   /oh-my-engine-init "你的项目描述"');
  console.log('   AI 会自动完成所有步骤');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  scanRepository,
  buildAIPrompt,
  generateAnalysisReport
};
