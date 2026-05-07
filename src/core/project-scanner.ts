const fs = require('node:fs');
const path = require('node:path');

export interface ProjectScanSummary {
  projectName: string;
  projectType: string;
  framework: string;
  frameworks: string[];
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
  filesScanned: number;
  directories: string[];
  sampleFiles: string[];
  configFiles: string[];
  entrypoints: string[];
  routeFiles: string[];
  middlewareFiles: string[];
  testFiles: string[];
  buildTools: string[];
  serverFrameworks: string[];
  uiFrameworks: string[];
  mobileFrameworks: string[];
  templateEngines: string[];
  styleSystems: string[];
  i18nSignals: string[];
  databaseSignals: string[];
  deploymentSignals: string[];
  sourceSignals: string[];
}

interface FileRecord {
  relativePath: string;
  extension: string;
  basename: string;
}

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.hg',
  '.svn',
  '.ome',
  '.oh-my-engine',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.turbo',
  '.cache',
  '.parcel-cache',
  'vendor'
]);

const COUNTED_EXTENSIONS = new Set([
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
  '.svelte',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.styl',
  '.html',
  '.ejs',
  '.pug',
  '.hbs',
  '.handlebars',
  '.njk',
  '.eta',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.md',
  '.mdx',
  '.graphql',
  '.gql',
  '.sql'
]);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.svelte',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.ejs',
  '.pug',
  '.hbs',
  '.handlebars',
  '.njk',
  '.eta'
]);

const CONFIG_FILE_NAMES = new Set([
  'package.json',
  'tsconfig.json',
  'jsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'next.config.js',
  'next.config.mjs',
  'nuxt.config.ts',
  'svelte.config.js',
  'gulpfile.js',
  'gulpfile.mjs',
  'gulpfile.ts',
  'webpack.config.js',
  'rollup.config.js',
  'eslint.config.js',
  '.eslintrc',
  '.eslintrc.js',
  '.prettierrc',
  'tailwind.config.js',
  'postcss.config.js',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'pm2.config.js',
  'ecosystem.config.js',
  'nginx.conf',
  '.env.example',
  '.env.sample',
  'go.mod',
  'Cargo.toml',
  'pyproject.toml',
  'requirements.txt'
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

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value);
}

function hasAnyDependency(dependencies: Set<string>, names: string[]): boolean {
  return names.some(name => dependencies.has(name));
}

function readSmallText(projectRoot: string, relativePath: string): string {
  const filePath = path.join(projectRoot, relativePath);
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 256 * 1024) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function walkProject(projectRoot: string): { files: FileRecord[]; directories: string[] } {
  const files: FileRecord[] = [];
  const directories = new Set<string>();
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

      const relativePath = normalizePath(path.relative(projectRoot, entryPath));
      if (stat.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry)) {
          directories.add(relativePath);
          queue.push(entryPath);
        }
        continue;
      }

      files.push({
        relativePath,
        extension: path.extname(entry).toLowerCase(),
        basename: path.basename(entry)
      });
    }
  }

  return {
    files: files.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
    directories: Array.from(directories).sort()
  };
}

function collectSourceDirectories(projectRoot: string, directories: string[]): string[] {
  const common = ['src', 'app', 'pages', 'components', 'lib', 'server', 'client', 'routes', 'controllers', 'middleware', 'middlewares', 'services', 'models', 'views', 'public', 'static', 'assets', 'tests', 'test', '__tests__', 'docs', 'schemas', 'skills', 'examples', 'bin', 'scripts'];
  const topLevel = new Set(directories.map(directory => directory.split('/')[0]));
  return common.filter(directory => topLevel.has(directory) || directoryExists(projectRoot, directory));
}

function countExtensions(files: FileRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const file of files) {
    if (COUNTED_EXTENSIONS.has(file.extension)) {
      counts[file.extension] = (counts[file.extension] || 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function detectLanguage(sourceExtensions: Record<string, number>, packageJson: Record<string, any>): string {
  if ((sourceExtensions['.ts'] || 0) + (sourceExtensions['.tsx'] || 0) > 0 || packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) return 'TypeScript';
  if ((sourceExtensions['.js'] || 0) + (sourceExtensions['.jsx'] || 0) + (sourceExtensions['.mjs'] || 0) + (sourceExtensions['.cjs'] || 0) > 0) return 'JavaScript';
  if (sourceExtensions['.py']) return 'Python';
  if (sourceExtensions['.go']) return 'Go';
  if (sourceExtensions['.rs']) return 'Rust';
  if (sourceExtensions['.java']) return 'Java';
  if (sourceExtensions['.kt']) return 'Kotlin';
  if (sourceExtensions['.swift']) return 'Swift';
  return 'unknown';
}

function detectFrameworks(projectRoot: string, dependencies: Set<string>): string[] {
  const frameworks: string[] = [];
  if (dependencies.has('next')) frameworks.push('Next.js');
  if (dependencies.has('nuxt')) frameworks.push('Nuxt');
  if (dependencies.has('@sveltejs/kit')) frameworks.push('SvelteKit');
  if (dependencies.has('expo')) frameworks.push('Expo');
  if (dependencies.has('react-native')) frameworks.push('React Native');
  if (dependencies.has('react')) frameworks.push('React');
  if (dependencies.has('vue')) frameworks.push('Vue');
  if (dependencies.has('svelte')) frameworks.push('Svelte');
  if (dependencies.has('koa') || dependencies.has('@koa/router') || dependencies.has('koa-router')) frameworks.push('Koa');
  if (dependencies.has('express')) frameworks.push('Express');
  if (dependencies.has('fastify')) frameworks.push('Fastify');
  if (dependencies.has('@nestjs/core') || dependencies.has('nestjs')) frameworks.push('NestJS');
  if (fileExists(projectRoot, 'go.mod')) frameworks.push('Go');
  if (fileExists(projectRoot, 'Cargo.toml')) frameworks.push('Rust');
  if (fileExists(projectRoot, 'pyproject.toml') || fileExists(projectRoot, 'requirements.txt')) frameworks.push('Python');
  if (frameworks.length === 0 && fileExists(projectRoot, 'package.json')) frameworks.push('Node.js');
  return Array.from(new Set(frameworks));
}

function primaryFramework(frameworks: string[]): string {
  const priority = ['Next.js', 'Nuxt', 'SvelteKit', 'Expo', 'React Native', 'Koa', 'Express', 'Fastify', 'NestJS', 'React', 'Vue', 'Svelte', 'Go', 'Rust', 'Python', 'Node.js'];
  return priority.find(framework => frameworks.includes(framework)) || frameworks[0] || 'unknown';
}

function detectProjectType(frameworks: string[], dependencies: Set<string>, sourceDirectories: string[]): string {
  if (frameworks.some(framework => ['React Native', 'Expo'].includes(framework))) return 'mobile';
  if (frameworks.some(framework => ['Next.js', 'React', 'Vue', 'Nuxt', 'Svelte', 'SvelteKit'].includes(framework))) {
    if (frameworks.some(framework => ['Koa', 'Express', 'Fastify', 'NestJS'].includes(framework))) return 'fullstack';
    return 'frontend';
  }
  if (frameworks.some(framework => ['Koa', 'Express', 'Fastify', 'NestJS', 'Go', 'Rust', 'Python'].includes(framework))) return 'backend';
  if (hasAnyDependency(dependencies, ['commander', 'yargs', 'cac']) || sourceDirectories.includes('bin')) return 'cli';
  return 'application';
}

function detectTestFrameworks(dependencies: Set<string>, scripts: Record<string, string>, sourceExtensions: Record<string, number>, files: FileRecord[]): string[] {
  const frameworks: string[] = [];
  if (Object.values(scripts).some(script => script.includes('node --test'))) frameworks.push('node:test');
  if (hasAnyDependency(dependencies, ['jest', 'ts-jest'])) frameworks.push('jest');
  if (hasAnyDependency(dependencies, ['vitest'])) frameworks.push('vitest');
  if (hasAnyDependency(dependencies, ['mocha'])) frameworks.push('mocha');
  if (hasAnyDependency(dependencies, ['playwright', '@playwright/test'])) frameworks.push('playwright');
  if (hasAnyDependency(dependencies, ['cypress'])) frameworks.push('cypress');
  if (files.some(file => file.relativePath.includes('__tests__') || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file.basename)) && frameworks.length === 0) frameworks.push('detected-js-tests');
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
  if (fileExists(projectRoot, 'webpack.config.js') || dependencies.has('webpack')) tooling.push('webpack');
  if (fileExists(projectRoot, 'rollup.config.js') || dependencies.has('rollup')) tooling.push('rollup');
  if (fileExists(projectRoot, 'gulpfile.js') || fileExists(projectRoot, 'gulpfile.mjs') || fileExists(projectRoot, 'gulpfile.ts') || dependencies.has('gulp')) tooling.push('gulp');
  if (packageJson.scripts?.build) tooling.push('build-script');
  if (packageJson.scripts?.test) tooling.push('test-script');
  if (packageJson.scripts?.check) tooling.push('check-script');
  if (packageJson.scripts?.lint) tooling.push('lint-script');
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

function detectNamedFiles(files: FileRecord[], names: Set<string>): string[] {
  return files
    .filter(file => names.has(file.basename))
    .map(file => file.relativePath)
    .sort();
}

function detectEntrypoints(files: FileRecord[], packageJson: Record<string, any>): string[] {
  const entrypoints = new Set<string>();
  for (const field of ['main', 'module', 'types']) {
    if (typeof packageJson[field] === 'string') entrypoints.add(packageJson[field]);
  }
  for (const candidate of ['src/index.ts', 'src/index.js', 'src/app.ts', 'src/app.js', 'src/server.ts', 'src/server.js', 'server.js', 'app.js', 'index.js', 'bin/ome.ts', 'bin/ome.js']) {
    if (files.some(file => file.relativePath === candidate)) entrypoints.add(candidate);
  }
  return Array.from(entrypoints).sort();
}

function detectPathFiles(files: FileRecord[], patterns: RegExp[]): string[] {
  return files
    .filter(file => patterns.some(pattern => pattern.test(file.relativePath)))
    .map(file => file.relativePath)
    .slice(0, 40)
    .sort();
}

function detectBuildTools(projectRoot: string, dependencies: Set<string>, scripts: Record<string, string>): string[] {
  const tools: string[] = [];
  const scriptText = Object.values(scripts).join('\n');
  const add = (condition: boolean, value: string) => { if (condition) addUnique(tools, value); };
  add(fileExists(projectRoot, 'gulpfile.js') || fileExists(projectRoot, 'gulpfile.mjs') || fileExists(projectRoot, 'gulpfile.ts') || dependencies.has('gulp') || /\bgulp\b/.test(scriptText), 'gulp');
  add(fileExists(projectRoot, 'webpack.config.js') || dependencies.has('webpack') || /\bwebpack\b/.test(scriptText), 'webpack');
  add(fileExists(projectRoot, 'vite.config.ts') || fileExists(projectRoot, 'vite.config.js') || dependencies.has('vite') || /\bvite\b/.test(scriptText), 'vite');
  add(fileExists(projectRoot, 'rollup.config.js') || dependencies.has('rollup') || /\brollup\b/.test(scriptText), 'rollup');
  add(dependencies.has('esbuild') || /\besbuild\b/.test(scriptText), 'esbuild');
  add(dependencies.has('tsup') || /\btsup\b/.test(scriptText), 'tsup');
  add(dependencies.has('typescript') || /\btsc\b/.test(scriptText), 'typescript');
  return tools.sort();
}

function detectTemplateEngines(dependencies: Set<string>, files: FileRecord[]): string[] {
  const engines: string[] = [];
  const add = (condition: boolean, value: string) => { if (condition) addUnique(engines, value); };
  add(dependencies.has('ejs') || files.some(file => file.extension === '.ejs'), 'ejs');
  add(dependencies.has('pug') || files.some(file => file.extension === '.pug'), 'pug');
  add(dependencies.has('handlebars') || dependencies.has('hbs') || files.some(file => ['.hbs', '.handlebars'].includes(file.extension)), 'handlebars');
  add(dependencies.has('nunjucks') || files.some(file => file.extension === '.njk'), 'nunjucks');
  add(dependencies.has('eta') || files.some(file => file.extension === '.eta'), 'eta');
  return engines.sort();
}

function detectStyleSystems(projectRoot: string, dependencies: Set<string>, files: FileRecord[]): string[] {
  const styles: string[] = [];
  const add = (condition: boolean, value: string) => { if (condition) addUnique(styles, value); };
  add(files.some(file => file.extension === '.css'), 'css');
  add(files.some(file => ['.scss', '.sass'].includes(file.extension)) || dependencies.has('sass'), 'sass');
  add(files.some(file => file.extension === '.less') || dependencies.has('less'), 'less');
  add(dependencies.has('tailwindcss') || fileExists(projectRoot, 'tailwind.config.js') || fileExists(projectRoot, 'tailwind.config.ts'), 'tailwind');
  add(dependencies.has('postcss') || fileExists(projectRoot, 'postcss.config.js'), 'postcss');
  add(dependencies.has('styled-components'), 'styled-components');
  add(dependencies.has('@emotion/react') || dependencies.has('@emotion/styled'), 'emotion');
  return styles.sort();
}

function detectI18nSignals(projectRoot: string, dependencies: Set<string>, files: FileRecord[]): string[] {
  const signals: string[] = [];
  const add = (condition: boolean, value: string) => { if (condition) addUnique(signals, value); };
  add(hasAnyDependency(dependencies, ['i18next', 'react-i18next', 'vue-i18n', 'next-i18next', 'intl-messageformat']), 'i18n-dependency');
  add(files.some(file => /(^|\/)(locales?|i18n|lang|translations?)(\/|$)/i.test(file.relativePath)), 'locale-directory');
  add(files.some(file => /(^|\/)(i18n|locale|locales|messages)\.(ts|js|json|yaml|yml)$/i.test(file.relativePath)), 'i18n-config-file');
  const textFiles = files.filter(file => TEXT_EXTENSIONS.has(file.extension));
  add(textFiles.some(file => /\b(t|i18n\.t)\(['"`]/.test(readSmallText(projectRoot, file.relativePath))), 'translation-function-usage');
  return signals.sort();
}

function detectDatabaseSignals(dependencies: Set<string>, files: FileRecord[]): string[] {
  const signals: string[] = [];
  const add = (condition: boolean, value: string) => { if (condition) addUnique(signals, value); };
  add(hasAnyDependency(dependencies, ['mongoose', 'mongodb']), 'mongodb');
  add(hasAnyDependency(dependencies, ['pg', 'postgres', 'postgresql']), 'postgres');
  add(hasAnyDependency(dependencies, ['mysql', 'mysql2']), 'mysql');
  add(hasAnyDependency(dependencies, ['sqlite3', 'better-sqlite3']), 'sqlite');
  add(hasAnyDependency(dependencies, ['prisma', '@prisma/client']), 'prisma');
  add(hasAnyDependency(dependencies, ['typeorm']), 'typeorm');
  add(hasAnyDependency(dependencies, ['sequelize']), 'sequelize');
  add(files.some(file => /(^|\/)(models?|entities|repositories|dao)(\/|$)/i.test(file.relativePath)), 'data-layer-directory');
  add(files.some(file => file.extension === '.sql' || /(^|\/)(migrations?|schema)(\/|$)/i.test(file.relativePath)), 'migrations-or-sql');
  return signals.sort();
}

function detectDeploymentSignals(projectRoot: string, dependencies: Set<string>, files: FileRecord[]): string[] {
  const signals: string[] = [];
  const add = (condition: boolean, value: string) => { if (condition) addUnique(signals, value); };
  add(fileExists(projectRoot, 'Dockerfile') || fileExists(projectRoot, 'docker-compose.yml') || fileExists(projectRoot, 'docker-compose.yaml'), 'docker');
  add(fileExists(projectRoot, 'nginx.conf') || files.some(file => /(^|\/)nginx(\/|\.|$)/i.test(file.relativePath)), 'nginx');
  add(fileExists(projectRoot, 'pm2.config.js') || fileExists(projectRoot, 'ecosystem.config.js') || dependencies.has('pm2'), 'pm2');
  add(files.some(file => /^\.github\/workflows\//.test(file.relativePath)), 'github-actions');
  add(files.some(file => /^\.gitlab-ci\.yml$/.test(file.relativePath)), 'gitlab-ci');
  add(fileExists(projectRoot, '.env.example') || fileExists(projectRoot, '.env.sample'), 'env-template');
  return signals.sort();
}

function detectSourceSignals(projectRoot: string, dependencies: Set<string>, files: FileRecord[]): string[] {
  const signals: string[] = [];
  const add = (condition: boolean, value: string) => { if (condition) addUnique(signals, value); };
  const sourceFiles = files.filter(file => TEXT_EXTENSIONS.has(file.extension));
  const sourceText = sourceFiles.map(file => readSmallText(projectRoot, file.relativePath)).join('\n');

  add(/\brequire\(['"`]/.test(sourceText), 'commonjs-require');
  add(/\bimport\s.+from\s+['"`]/.test(sourceText), 'esm-imports');
  add(/\bmodule\.exports\b/.test(sourceText), 'commonjs-exports');
  add(/\bexport\s+(function|const|class|default)\b/.test(sourceText), 'esm-exports');
  add(/\bapp\.use\(|\brouter\.(get|post|put|delete|patch)\(/.test(sourceText), 'http-routing');
  add(/\bctx\.(request|response|body|params|query|status)\b/.test(sourceText), 'koa-context');
  add(/\b(req|res|next)\b/.test(sourceText) && dependencies.has('express'), 'express-handlers');
  add(/\bprocess\.env\./.test(sourceText), 'environment-variables');
  add(/\bconsole\.(log|error|warn)\(/.test(sourceText), 'console-logging');
  add(/\btry\s*{[\s\S]*?}\s*catch\b/.test(sourceText), 'try-catch-error-handling');
  add(hasAnyDependency(dependencies, ['joi', 'zod', 'yup', 'class-validator']), 'schema-validation');
  add(hasAnyDependency(dependencies, ['koa-bodyparser', 'body-parser', 'multer', '@koa/bodyparser']), 'request-body-parsing');
  add(hasAnyDependency(dependencies, ['koa-static', 'serve-static', 'express-static-gzip']), 'static-file-serving');
  return signals.sort();
}

function detectPatterns(scanInput: {
  projectType: string;
  framework: string;
  frameworks: string[];
  language: string;
  packageManager: string;
  sourceDirectories: string[];
  testFrameworks: string[];
  tooling: string[];
  dependencies: Set<string>;
  buildTools: string[];
  serverFrameworks: string[];
  uiFrameworks: string[];
  templateEngines: string[];
  styleSystems: string[];
  i18nSignals: string[];
  databaseSignals: string[];
  deploymentSignals: string[];
  sourceSignals: string[];
}): string[] {
  const patterns: string[] = [];
  if (scanInput.language === 'TypeScript') patterns.push('typed-source');
  if (scanInput.sourceDirectories.includes('src')) patterns.push('src-directory');
  if (scanInput.sourceDirectories.includes('routes')) patterns.push('routes-directory');
  if (scanInput.sourceDirectories.includes('middleware') || scanInput.sourceDirectories.includes('middlewares')) patterns.push('middleware-directory');
  if (scanInput.sourceDirectories.includes('tests') || scanInput.sourceDirectories.includes('test') || scanInput.sourceDirectories.includes('__tests__')) patterns.push('dedicated-test-directory');
  if (scanInput.testFrameworks.length > 0) patterns.push('automated-tests');
  if (scanInput.tooling.includes('check-script')) patterns.push('typecheck-script');
  if (scanInput.tooling.includes('build-script')) patterns.push('build-script');
  if (scanInput.tooling.includes('lint-script')) patterns.push('lint-script');
  if (scanInput.uiFrameworks.length > 0) patterns.push('ui-framework');
  if (scanInput.serverFrameworks.length > 0) patterns.push('server-framework');
  if (scanInput.buildTools.length > 0) patterns.push('build-tooling');
  if (scanInput.templateEngines.length > 0) patterns.push('server-rendered-views');
  if (scanInput.styleSystems.length > 0) patterns.push('style-assets');
  if (scanInput.i18nSignals.length > 0) patterns.push('internationalization');
  if (scanInput.databaseSignals.length > 0) patterns.push('data-access');
  if (scanInput.deploymentSignals.length > 0) patterns.push('deployment-config');
  if (hasAnyDependency(scanInput.dependencies, ['js-yaml', 'gray-matter'])) patterns.push('structured-content-parsing');
  if (scanInput.packageManager !== 'unknown') patterns.push(`${scanInput.packageManager}-package-manager`);
  return Array.from(new Set([...patterns, ...scanInput.sourceSignals])).sort();
}

export function scanProject(projectRoot: string): ProjectScanSummary {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = fs.existsSync(packageJsonPath) ? readJson(packageJsonPath) : {};
  const dependencies = sortedKeys(packageJson.dependencies);
  const devDependencies = sortedKeys(packageJson.devDependencies);
  const dependencySet = new Set([...dependencies, ...devDependencies]);
  const scripts = packageJson.scripts || {};
  const walked = walkProject(projectRoot);
  const sourceDirectories = collectSourceDirectories(projectRoot, walked.directories);
  const sourceExtensions = countExtensions(walked.files);
  const language = detectLanguage(sourceExtensions, packageJson);
  const packageManager = detectPackageManager(projectRoot);
  const frameworks = detectFrameworks(projectRoot, dependencySet);
  const framework = primaryFramework(frameworks);
  const projectType = detectProjectType(frameworks, dependencySet, sourceDirectories);
  const testFrameworks = detectTestFrameworks(dependencySet, scripts, sourceExtensions, walked.files);
  const tooling = detectTooling(projectRoot, dependencySet, packageJson);
  const buildTools = detectBuildTools(projectRoot, dependencySet, scripts);
  const serverFrameworks = frameworks.filter(value => ['Koa', 'Express', 'Fastify', 'NestJS'].includes(value));
  const uiFrameworks = frameworks.filter(value => ['Next.js', 'React', 'Vue', 'Nuxt', 'Svelte', 'SvelteKit'].includes(value));
  const mobileFrameworks = frameworks.filter(value => ['React Native', 'Expo'].includes(value));
  const templateEngines = detectTemplateEngines(dependencySet, walked.files);
  const styleSystems = detectStyleSystems(projectRoot, dependencySet, walked.files);
  const i18nSignals = detectI18nSignals(projectRoot, dependencySet, walked.files);
  const databaseSignals = detectDatabaseSignals(dependencySet, walked.files);
  const deploymentSignals = detectDeploymentSignals(projectRoot, dependencySet, walked.files);
  const sourceSignals = detectSourceSignals(projectRoot, dependencySet, walked.files);
  const routeFiles = detectPathFiles(walked.files, [/routes?\//i, /\.(routes?|router)\.[cm]?[jt]s$/i]);
  const middlewareFiles = detectPathFiles(walked.files, [/middlewares?\//i, /\.(middleware|middlewares)\.[cm]?[jt]s$/i]);
  const testFiles = detectPathFiles(walked.files, [/__tests__\//i, /(^|\/)(tests?|spec)\//i, /\.(test|spec)\.[cm]?[jt]sx?$/i]);
  const hasUi = ['frontend', 'mobile', 'fullstack'].includes(projectType) || uiFrameworks.length > 0 || mobileFrameworks.length > 0 || styleSystems.length > 0 || templateEngines.length > 0;

  const detectedPatterns = detectPatterns({
    projectType,
    framework,
    frameworks,
    language,
    packageManager,
    sourceDirectories,
    testFrameworks,
    tooling,
    dependencies: dependencySet,
    buildTools,
    serverFrameworks,
    uiFrameworks,
    templateEngines,
    styleSystems,
    i18nSignals,
    databaseSignals,
    deploymentSignals,
    sourceSignals
  });

  return {
    projectName: packageJson.name || path.basename(projectRoot),
    projectType,
    framework,
    frameworks,
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
    hasUi,
    filesScanned: walked.files.length,
    directories: walked.directories,
    sampleFiles: walked.files
      .filter(file => COUNTED_EXTENSIONS.has(file.extension))
      .map(file => file.relativePath)
      .slice(0, 80),
    configFiles: detectNamedFiles(walked.files, CONFIG_FILE_NAMES),
    entrypoints: detectEntrypoints(walked.files, packageJson),
    routeFiles,
    middlewareFiles,
    testFiles,
    buildTools,
    serverFrameworks,
    uiFrameworks,
    mobileFrameworks,
    templateEngines,
    styleSystems,
    i18nSignals,
    databaseSignals,
    deploymentSignals,
    sourceSignals
  };
}

export function renderScanSummary(scan: ProjectScanSummary): string {
  const frameworks = scan.frameworks.length > 0 ? scan.frameworks.join('+') : scan.framework;
  return `${scan.projectType} / ${frameworks} / ${scan.language} / ${scan.filesScanned} files scanned`;
}
