const fs = require('node:fs');
const path = require('node:path');

export interface ProjectScanSummary {
  projectName: string;
  projectType: string;
  framework: string;
  language: string;
  packageManager: string;
  sourceDirectories: string[];
  testFrameworks: string[];
  tooling: string[];
  scripts: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  sourceExtensions: Record<string, number>;
  existingRuleFiles: string[];
  detectedPatterns: string[];
  hasUi: boolean;
}

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.ome',
  '.oh-my-engine',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.cache',
  'vendor'
]);

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.kt',
  '.swift',
  '.vue',
  '.svelte'
]);

function readJson(filePath: string): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {};
  }
}

function fileExists(projectRoot: string, fileName: string): boolean {
  return fs.existsSync(path.join(projectRoot, fileName));
}

function directoryExists(projectRoot: string, directoryName: string): boolean {
  const directoryPath = path.join(projectRoot, directoryName);
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

function detectPackageManager(projectRoot: string): string {
  if (fileExists(projectRoot, 'pnpm-lock.yaml')) return 'pnpm';
  if (fileExists(projectRoot, 'yarn.lock')) return 'yarn';
  if (fileExists(projectRoot, 'package-lock.json')) return 'npm';
  if (fileExists(projectRoot, 'bun.lockb') || fileExists(projectRoot, 'bun.lock')) return 'bun';
  if (fileExists(projectRoot, 'package.json')) return 'npm';
  if (fileExists(projectRoot, 'requirements.txt') || fileExists(projectRoot, 'pyproject.toml')) return 'pip';
  if (fileExists(projectRoot, 'go.mod')) return 'go';
  if (fileExists(projectRoot, 'Cargo.toml')) return 'cargo';
  return 'unknown';
}

function sortedKeys(record: Record<string, any>): string[] {
  return Object.keys(record || {}).sort();
}

function collectTopLevelSourceDirectories(projectRoot: string): string[] {
  const common = ['src', 'app', 'pages', 'components', 'lib', 'server', 'client', 'tests', 'test', '__tests__', 'docs', 'schemas', 'skills', 'examples'];
  return common.filter(directory => directoryExists(projectRoot, directory));
}

function walkSourceExtensions(projectRoot: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const queue = [projectRoot];

  while (queue.length > 0) {
    const current = queue.shift()!;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(current);
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry);
      let stat: any;
      try {
        stat = fs.statSync(entryPath);
      } catch (error) {
        continue;
      }

      if (stat.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry)) queue.push(entryPath);
        continue;
      }

      const extension = path.extname(entry).toLowerCase();
      if (SOURCE_EXTENSIONS.has(extension)) {
        counts[extension] = (counts[extension] || 0) + 1;
      }
    }
  }

  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function detectLanguage(sourceExtensions: Record<string, number>, packageJson: Record<string, any>): string {
  if ((sourceExtensions['.ts'] || 0) + (sourceExtensions['.tsx'] || 0) > 0 || packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
    return 'TypeScript';
  }
  if ((sourceExtensions['.js'] || 0) + (sourceExtensions['.jsx'] || 0) + (sourceExtensions['.mjs'] || 0) + (sourceExtensions['.cjs'] || 0) > 0) return 'JavaScript';
  if (sourceExtensions['.py']) return 'Python';
  if (sourceExtensions['.go']) return 'Go';
  if (sourceExtensions['.rs']) return 'Rust';
  if (sourceExtensions['.java']) return 'Java';
  if (sourceExtensions['.kt']) return 'Kotlin';
  if (sourceExtensions['.swift']) return 'Swift';
  return 'unknown';
}

function hasAnyDependency(dependencies: Set<string>, names: string[]): boolean {
  return names.some(name => dependencies.has(name));
}

function detectFramework(projectRoot: string, dependencies: Set<string>): string {
  if (hasAnyDependency(dependencies, ['next'])) return 'Next.js';
  if (hasAnyDependency(dependencies, ['expo'])) return 'Expo';
  if (hasAnyDependency(dependencies, ['react-native'])) return 'React Native';
  if (hasAnyDependency(dependencies, ['react'])) return 'React';
  if (hasAnyDependency(dependencies, ['vue', 'nuxt'])) return dependencies.has('nuxt') ? 'Nuxt' : 'Vue';
  if (hasAnyDependency(dependencies, ['svelte', '@sveltejs/kit'])) return dependencies.has('@sveltejs/kit') ? 'SvelteKit' : 'Svelte';
  if (hasAnyDependency(dependencies, ['express'])) return 'Express';
  if (hasAnyDependency(dependencies, ['fastify'])) return 'Fastify';
  if (hasAnyDependency(dependencies, ['nestjs', '@nestjs/core'])) return 'NestJS';
  if (fileExists(projectRoot, 'go.mod')) return 'Go';
  if (fileExists(projectRoot, 'Cargo.toml')) return 'Rust';
  if (fileExists(projectRoot, 'pyproject.toml') || fileExists(projectRoot, 'requirements.txt')) return 'Python';
  if (fileExists(projectRoot, 'package.json')) return 'Node.js';
  return 'unknown';
}

function detectProjectType(framework: string, dependencies: Set<string>, sourceDirectories: string[]): string {
  if (['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'SvelteKit'].includes(framework)) return 'frontend';
  if (['React Native', 'Expo'].includes(framework)) return 'mobile';
  if (['Express', 'Fastify', 'NestJS', 'Go', 'Rust', 'Python'].includes(framework)) return 'backend';
  if (hasAnyDependency(dependencies, ['commander', 'yargs', 'cac']) || sourceDirectories.includes('bin')) return 'cli';
  return 'application';
}

function detectTestFrameworks(dependencies: Set<string>, scripts: Record<string, string>, sourceExtensions: Record<string, number>): string[] {
  const frameworks: string[] = [];
  if (hasAnyDependency(dependencies, ['node:test']) || Object.values(scripts).some(script => script.includes('node --test'))) frameworks.push('node:test');
  if (hasAnyDependency(dependencies, ['jest', 'ts-jest'])) frameworks.push('jest');
  if (hasAnyDependency(dependencies, ['vitest'])) frameworks.push('vitest');
  if (hasAnyDependency(dependencies, ['mocha'])) frameworks.push('mocha');
  if (hasAnyDependency(dependencies, ['playwright', '@playwright/test'])) frameworks.push('playwright');
  if (sourceExtensions['.go']) frameworks.push('go test');
  if (sourceExtensions['.rs']) frameworks.push('cargo test');
  return Array.from(new Set(frameworks)).sort();
}

function detectTooling(projectRoot: string, dependencies: Set<string>, packageJson: Record<string, any>): string[] {
  const tooling: string[] = [];
  if (fileExists(projectRoot, 'tsconfig.json') || dependencies.has('typescript')) tooling.push('typescript');
  if (fileExists(projectRoot, 'eslint.config.js') || fileExists(projectRoot, '.eslintrc') || dependencies.has('eslint')) tooling.push('eslint');
  if (fileExists(projectRoot, '.prettierrc') || dependencies.has('prettier')) tooling.push('prettier');
  if (fileExists(projectRoot, 'vite.config.ts') || fileExists(projectRoot, 'vite.config.js') || dependencies.has('vite')) tooling.push('vite');
  if (packageJson.scripts?.build) tooling.push('build-script');
  if (packageJson.scripts?.test) tooling.push('test-script');
  if (packageJson.scripts?.check) tooling.push('check-script');
  return Array.from(new Set(tooling)).sort();
}

function detectExistingRuleFiles(projectRoot: string): string[] {
  const candidates = ['AGENTS.md', 'CLAUDE.md', '.cursorrules', '.windsurfrules', 'GEMINI.md'];
  const found = candidates.filter(fileName => fileExists(projectRoot, fileName));
  const ruleDirectories = ['.cursor/rules', '.trae/rules', '.agents/rules', '.qoder/rules'];

  for (const directory of ruleDirectories) {
    const directoryPath = path.join(projectRoot, directory);
    if (fs.existsSync(directoryPath)) found.push(directory);
  }

  return found.sort();
}

function detectPatterns(scanInput: {
  framework: string;
  language: string;
  packageManager: string;
  sourceDirectories: string[];
  testFrameworks: string[];
  tooling: string[];
  dependencies: Set<string>;
}): string[] {
  const patterns: string[] = [];
  if (scanInput.language === 'TypeScript') patterns.push('typed-source');
  if (scanInput.sourceDirectories.includes('src')) patterns.push('src-directory');
  if (scanInput.sourceDirectories.includes('tests') || scanInput.sourceDirectories.includes('test') || scanInput.sourceDirectories.includes('__tests__')) patterns.push('dedicated-test-directory');
  if (scanInput.testFrameworks.length > 0) patterns.push('automated-tests');
  if (scanInput.tooling.includes('check-script')) patterns.push('typecheck-script');
  if (scanInput.tooling.includes('build-script')) patterns.push('build-script');
  if (['React', 'Next.js', 'React Native', 'Expo', 'Vue', 'Nuxt', 'Svelte', 'SvelteKit'].includes(scanInput.framework)) patterns.push('ui-framework');
  if (hasAnyDependency(scanInput.dependencies, ['js-yaml', 'gray-matter'])) patterns.push('structured-content-parsing');
  if (scanInput.packageManager !== 'unknown') patterns.push(`${scanInput.packageManager}-package-manager`);
  return Array.from(new Set(patterns)).sort();
}

export function scanProject(projectRoot: string): ProjectScanSummary {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = fs.existsSync(packageJsonPath) ? readJson(packageJsonPath) : {};
  const dependencies = sortedKeys(packageJson.dependencies);
  const devDependencies = sortedKeys(packageJson.devDependencies);
  const dependencySet = new Set([...dependencies, ...devDependencies]);
  const scripts = packageJson.scripts || {};
  const sourceDirectories = collectTopLevelSourceDirectories(projectRoot);
  const sourceExtensions = walkSourceExtensions(projectRoot);
  const language = detectLanguage(sourceExtensions, packageJson);
  const packageManager = detectPackageManager(projectRoot);
  const framework = detectFramework(projectRoot, dependencySet);
  const projectType = detectProjectType(framework, dependencySet, sourceDirectories);
  const testFrameworks = detectTestFrameworks(dependencySet, scripts, sourceExtensions);
  const tooling = detectTooling(projectRoot, dependencySet, packageJson);
  const hasUi = ['frontend', 'mobile'].includes(projectType);

  const detectedPatterns = detectPatterns({
    framework,
    language,
    packageManager,
    sourceDirectories,
    testFrameworks,
    tooling,
    dependencies: dependencySet
  });

  return {
    projectName: packageJson.name || path.basename(projectRoot),
    projectType,
    framework,
    language,
    packageManager,
    sourceDirectories,
    testFrameworks,
    tooling,
    scripts,
    dependencies,
    devDependencies,
    sourceExtensions,
    existingRuleFiles: detectExistingRuleFiles(projectRoot),
    detectedPatterns,
    hasUi
  };
}

export function renderScanSummary(scan: ProjectScanSummary): string {
  return `${scan.projectType} / ${scan.framework} / ${scan.language}`;
}

