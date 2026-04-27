const fs = require('node:fs');
const path = require('node:path');

export interface InitOptions {
  force: boolean;
  template: string;
  projectRoot: string;
  repoRoot: string;
}

export interface InitResult {
  projectRoot: string;
  template: string;
  configCreated: boolean;
  projectCreated: boolean;
  rulesUpdated: number;
  directories: string[];
}

const ENGINE_DIRECTORIES = [
  '.oh-my-engine/workflows',
  '.oh-my-engine/rules',
  '.oh-my-engine/generated-skills',
  '.oh-my-engine/memory/executions',
  '.oh-my-engine/memory/learnings/candidates',
  '.oh-my-engine/memory/learnings/adopted',
  '.oh-my-engine/memory/preferences',
  '.oh-my-engine/memory/skill-candidates',
  '.oh-my-engine/memory/specs',
  'openspec/changes',
  'openspec/specs',
  'openspec/archive'
];

const DEFAULT_RULES = ['i18n', 'theme', 'design-tokens', 'code-style'];

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFileIfNeeded(filePath: string, content: string, force: boolean): boolean {
  if (force || !fs.existsSync(filePath)) {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
    return true;
  }

  return false;
}

function copyFileIfNeeded(sourcePath: string, targetPath: string, force: boolean): boolean {
  if (!fs.existsSync(sourcePath) || path.resolve(sourcePath) === path.resolve(targetPath)) {
    return false;
  }

  if (force || !fs.existsSync(targetPath)) {
    ensureDirectory(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
    return true;
  }

  return false;
}

function appendGitignoreOnce(projectRoot: string, pattern: string): void {
  const gitignorePath = path.join(projectRoot, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `${pattern}\n`, 'utf8');
    return;
  }

  const lines = fs.readFileSync(gitignorePath, 'utf8').split('\n');
  if (!lines.includes(pattern)) {
    const prefix = lines.length > 0 && lines[lines.length - 1] !== '' ? '\n' : '';
    fs.appendFileSync(gitignorePath, `${prefix}${pattern}\n`, 'utf8');
  }
}

function buildConfig(projectName: string, template: string): string {
  return `${JSON.stringify({
    project: {
      name: projectName,
      template
    },
    version: '1.0.0',
    workflows: {
      'ui-restore': {
        enabled: true,
        rules: ['i18n', 'theme', 'design-tokens']
      },
      'bug-analysis': {
        enabled: true,
        rules: ['code-style']
      },
      'component-gen': {
        enabled: true,
        rules: ['code-style', 'design-tokens', 'theme']
      },
      'api-integration': {
        enabled: true,
        rules: ['code-style']
      },
      spec: {
        enabled: true,
        format: 'openspec-compatible',
        options: {
          specRoot: 'openspec',
          changesDir: 'openspec/changes',
          specsDir: 'openspec/specs',
          archiveDir: 'openspec/archive',
          memoryDir: '.oh-my-engine/memory/specs',
          defaultFlow: 'import-decompose-plan-apply-verify-archive',
          manualFlow: 'propose-plan-apply-verify-archive',
          contextDirName: 'context',
          assetsDirName: 'assets',
          verifyCommands: []
        }
      }
    },
    memory: {
      enabled: true,
      captureMode: 'selective',
      allowSources: {
        workflow_command: true,
        explicit_remember: true,
        post_run_promotion: true
      },
      thresholds: {
        preferencePromotion: 0.8,
        knowledgePromotion: 0.85,
        skillCandidatePromotion: 0.9
      },
      retention: '90d',
      maxExecutions: 1000
    },
    evolution: {
      enabled: true,
      autoApply: false,
      requireVerification: true,
      candidateOnly: true,
      thresholds: {
        learningCandidateMinEvidence: 3,
        skillCandidateMinEvidence: 3,
        adoptedPreferenceMinEvidence: 2
      },
      evaluationInterval: 'daily',
      optimizationThreshold: 85
    }
  }, null, 2)}\n`;
}

export function parseInitArgs(args: string[], defaults: Partial<InitOptions> = {}): InitOptions {
  const options: InitOptions = {
    force: false,
    template: 'default',
    projectRoot: defaults.projectRoot || process.cwd(),
    repoRoot: defaults.repoRoot || process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..')
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    if (argument === '--template') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --template');
      }
      options.template = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--project-root') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --project-root');
      }
      options.projectRoot = path.resolve(args[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

export function initializeProject(options: InitOptions): InitResult {
  const projectName = path.basename(options.projectRoot);
  const createdDirectories: string[] = [];

  for (const directory of ENGINE_DIRECTORIES) {
    const target = path.join(options.projectRoot, directory);
    ensureDirectory(target);
    createdDirectories.push(directory);
  }

  const configCreated = writeFileIfNeeded(
    path.join(options.projectRoot, '.oh-my-engine', 'config.json'),
    buildConfig(projectName, options.template),
    options.force
  );

  const projectCreated = copyFileIfNeeded(
    path.join(options.repoRoot, 'skills', 'oh-my-engine-spec', 'templates', 'project.md'),
    path.join(options.projectRoot, 'openspec', 'project.md'),
    options.force
  );

  copyFileIfNeeded(
    path.join(options.repoRoot, '.oh-my-engine', 'platforms.json'),
    path.join(options.projectRoot, '.oh-my-engine', 'platforms.json'),
    options.force
  );

  let rulesUpdated = 0;
  for (const rule of DEFAULT_RULES) {
    const updated = copyFileIfNeeded(
      path.join(options.repoRoot, 'skills', 'oh-my-engine', 'rules', `${rule}-template.md`),
      path.join(options.projectRoot, '.oh-my-engine', 'rules', `${rule}.md`),
      options.force
    );
    if (updated) rulesUpdated += 1;
  }

  appendGitignoreOnce(options.projectRoot, '.oh-my-engine/memory/');

  return {
    projectRoot: options.projectRoot,
    template: options.template,
    configCreated,
    projectCreated,
    rulesUpdated,
    directories: createdDirectories
  };
}

export function renderInitResult(result: InitResult): string {
  return [
    `Initialized Oh My Engine project in ${result.projectRoot}`,
    `Template: ${result.template}`,
    `Config: ${result.configCreated ? 'created' : 'preserved'}`,
    `openspec/project.md: ${result.projectCreated ? 'created' : 'preserved'}`,
    `Rule files updated: ${result.rulesUpdated}`,
    'Created directories:',
    '  - .oh-my-engine/',
    '  - openspec/'
  ].join('\n') + '\n';
}
