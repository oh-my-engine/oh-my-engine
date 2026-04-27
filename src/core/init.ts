const fs = require('node:fs');
const path = require('node:path');

const { ENGINE_DIR, currentEnginePath, migrateLegacyEngineDirectory, repoEnginePath } = require('./paths');
const { syncRules } = require('./rules');
const { installGitHooks } = require('./git-hooks');

export interface InitOptions {
  force: boolean;
  template: string;
  projectRoot: string;
  repoRoot: string;
  sync?: boolean;
  migrate?: boolean;
  installAgents?: boolean;
  home?: string;
}

export interface InitResult {
  projectRoot: string;
  template: string;
  configCreated: boolean;
  projectCreated: boolean;
  rulesUpdated: number;
  directories: string[];
  migratedLegacy: boolean;
  syncedTargets: string[];
  installedAgentTargets: string[];
}

const ENGINE_DIRECTORIES = [
  `${ENGINE_DIR}/workflows`,
  `${ENGINE_DIR}/rules`,
  `${ENGINE_DIR}/generated-skills`,
  `${ENGINE_DIR}/memory/executions`,
  `${ENGINE_DIR}/memory/learnings/candidates`,
  `${ENGINE_DIR}/memory/learnings/adopted`,
  `${ENGINE_DIR}/memory/preferences`,
  `${ENGINE_DIR}/memory/skill-candidates`,
  `${ENGINE_DIR}/memory/specs`,
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
          memoryDir: `${ENGINE_DIR}/memory/specs`,
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
    repoRoot: defaults.repoRoot || process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..'),
    sync: defaults.sync ?? true,
    migrate: defaults.migrate ?? true,
    installAgents: defaults.installAgents ?? false,
    home: defaults.home
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    if (argument === '--no-sync') {
      options.sync = false;
      continue;
    }

    if (argument === '--no-migrate') {
      options.migrate = false;
      continue;
    }

    if (argument === '--install-agents') {
      options.installAgents = true;
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

    if (argument === '--home') {
      if (index + 1 >= args.length) {
        throw new Error('Missing value for --home');
      }
      options.home = path.resolve(args[index + 1]);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

export function initializeProject(options: InitOptions): InitResult {
  const migration = options.migrate !== false ? migrateLegacyEngineDirectory(options.projectRoot) : { migrated: false };
  const projectName = path.basename(options.projectRoot);
  const createdDirectories: string[] = [];

  for (const directory of ENGINE_DIRECTORIES) {
    const target = path.join(options.projectRoot, directory);
    ensureDirectory(target);
    createdDirectories.push(directory);
  }

  const configCreated = writeFileIfNeeded(
    currentEnginePath(options.projectRoot, 'config.json'),
    buildConfig(projectName, options.template),
    options.force
  );

  const projectCreated = copyFileIfNeeded(
    path.join(options.repoRoot, 'skills', 'oh-my-engine-spec', 'templates', 'project.md'),
    path.join(options.projectRoot, 'openspec', 'project.md'),
    options.force
  );

  copyFileIfNeeded(
    repoEnginePath(options.repoRoot, 'platforms.json'),
    currentEnginePath(options.projectRoot, 'platforms.json'),
    options.force
  );

  let rulesUpdated = 0;
  for (const rule of DEFAULT_RULES) {
    const updated = copyFileIfNeeded(
      path.join(options.repoRoot, 'skills', 'oh-my-engine', 'rules', `${rule}-template.md`),
      currentEnginePath(options.projectRoot, 'rules', `${rule}.md`),
      options.force
    );
    if (updated) rulesUpdated += 1;
  }

  appendGitignoreOnce(options.projectRoot, `${ENGINE_DIR}/memory/`);

  const syncedTargets = options.sync !== false
    ? syncRules([], options.projectRoot).map((result: Record<string, any>) => `${result.platform}: ${result.target}`)
    : [];

  let installedAgentTargets: string[] = [];
  if (options.installAgents === true) {
    const { installAgents } = require('./agents');
    installedAgentTargets = installAgents({ platforms: [], all: true, home: options.home }).map((result: Record<string, any>) => `${result.platform}: ${result.target}`);
  }

  // 安装 git hooks
  try {
    installGitHooks(options.projectRoot);
  } catch (error) {
    process.stderr.write(`Warning: Failed to install git hooks: ${error instanceof Error ? error.message : String(error)}\n`);
  }

  return {
    projectRoot: options.projectRoot,
    template: options.template,
    configCreated,
    projectCreated,
    rulesUpdated,
    directories: createdDirectories,
    migratedLegacy: Boolean(migration.migrated),
    syncedTargets,
    installedAgentTargets
  };
}

export function renderInitResult(result: InitResult): string {
  return [
    `Initialized Oh My Engine project in ${result.projectRoot}`,
    `Template: ${result.template}`,
    `Legacy .oh-my-engine migration: ${result.migratedLegacy ? 'migrated to .ome' : 'not needed'}`,
    `Config: ${result.configCreated ? 'created' : 'preserved'}`,
    `openspec/project.md: ${result.projectCreated ? 'created' : 'preserved'}`,
    `Rule files updated: ${result.rulesUpdated}`,
    `Integration targets synced: ${result.syncedTargets.length}`,
    ...result.syncedTargets.map(target => `  - ${target}`),
    `Agent commands installed: ${result.installedAgentTargets.length}`,
    ...result.installedAgentTargets.map(target => `  - ${target}`),
    'Created directories:',
    `  - ${ENGINE_DIR}/`,
    '  - openspec/'
  ].join('\n') + '\n';
}
