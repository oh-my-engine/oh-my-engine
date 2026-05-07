const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const yaml = require('js-yaml');

const { OME_BIN, omeArgs } = require('./helpers');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-init-'));
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, omeArgs(args), {
    cwd,
    encoding: 'utf8'
  });
}

function parseOMEConfig(workspace: string): any {
  const omeContent = fs.readFileSync(path.join(workspace, 'OME.md'), 'utf8');
  const match = omeContent.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('OME.md missing YAML frontmatter');
  return yaml.load(match[1]);
}

test('ome init initializes project directories and defaults from TypeScript CLI', () => {
  const workspace = createWorkspace();

  const output = runOme(['init', '--template', 'node'], workspace);

  assert.match(output, /Initialized Oh My Engine project/);
  assert.equal(fs.existsSync(path.join(workspace, 'OME.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'code-style.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'openspec', 'project.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'CLAUDE.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'AGENTS.md')), true);

  const config = parseOMEConfig(workspace);
  assert.equal(config.project.name, path.basename(workspace));
  assert.equal(config.project.template, 'node');
  assert.equal(config.memory.captureMode, 'selective');

  const gitignore = fs.readFileSync(path.join(workspace, '.gitignore'), 'utf8');
  assert.match(gitignore, /\.ome\/memory\//);
});

test('ome init scans TypeScript Node projects and writes agent personalization context', () => {
  const workspace = createWorkspace();
  fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({
    name: 'scan-target',
    scripts: {
      check: 'tsc -p tsconfig.json --noEmit',
      test: 'node --test dist/tests/*.test.js',
      build: 'tsc -p tsconfig.json'
    },
    dependencies: {
      'js-yaml': '^4.1.1'
    },
    devDependencies: {
      typescript: '^6.0.3'
    }
  }, null, 2), 'utf8');
  fs.writeFileSync(path.join(workspace, 'package-lock.json'), '{}\n', 'utf8');
  fs.writeFileSync(path.join(workspace, 'tsconfig.json'), '{"compilerOptions":{"strict":true}}\n', 'utf8');
  fs.mkdirSync(path.join(workspace, 'src', 'tests'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'index.ts'), 'export function hello(): string { return "hi"; }\n', 'utf8');
  fs.writeFileSync(path.join(workspace, 'src', 'tests', 'index.test.ts'), 'import test from "node:test";\n', 'utf8');

  const output = runOme(['init'], workspace);

  assert.match(output, /Project scan: application \/ Node\.js \/ TypeScript/);

  const config = parseOMEConfig(workspace);
  assert.equal(config.project.name, 'scan-target');
  assert.equal(config.project.framework, 'Node.js');
  assert.equal(config.project.language, 'TypeScript');
  assert.equal(config.project.packageManager, 'npm');
  assert.deepEqual(config.project.testFrameworks, ['node:test']);
  assert.equal(config.workflows['ui-restore'].enabled, false);

  const scanPath = path.join(workspace, '.ome', 'context', 'project-scan.json');
  const promptPath = path.join(workspace, '.ome', 'context', 'rules-generation-prompt.md');
  assert.equal(fs.existsSync(scanPath), true);
  assert.equal(fs.existsSync(promptPath), true);

  const scan = JSON.parse(fs.readFileSync(scanPath, 'utf8'));
  assert.equal(scan.framework, 'Node.js');
  assert.equal(scan.language, 'TypeScript');
  assert.equal(scan.sourceExtensions['.ts'], 2);
  assert.equal(scan.hasUi, false);

  const prompt = fs.readFileSync(promptPath, 'utf8');
  assert.match(prompt, /Read `.ome\/context\/project-scan\.json` first/);
  assert.match(prompt, /Codex, Claude Code, or Antigravity/);

  const codeStyle = fs.readFileSync(path.join(workspace, '.ome', 'rules', 'code-style.md'), 'utf8');
  assert.match(codeStyle, /Project Profile/);
  assert.match(codeStyle, /Framework: Node\.js/);
  assert.match(codeStyle, /Language: TypeScript/);

  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'theme.md')), false);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'design-tokens.md')), false);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'i18n.md')), false);
});

test('ome init generates UI rules only when a UI framework is detected', () => {
  const workspace = createWorkspace();
  fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({
    name: 'react-target',
    dependencies: {
      react: '^19.0.0'
    },
    devDependencies: {
      typescript: '^6.0.3'
    }
  }, null, 2), 'utf8');
  fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'App.tsx'), 'export function App() { return null; }\n', 'utf8');

  runOme(['init'], workspace);

  const config = parseOMEConfig(workspace);
  assert.equal(config.project.type, 'frontend');
  assert.equal(config.project.framework, 'React');
  assert.equal(config.workflows['ui-restore'].enabled, true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'theme.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'design-tokens.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'i18n.md')), true);
});

test('ome init-rules refreshes scan context and local rule drafts', () => {
  const workspace = createWorkspace();
  fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({
    name: 'rules-target',
    scripts: {
      test: 'node --test dist/tests/*.test.js'
    },
    devDependencies: {
      typescript: '^6.0.3'
    }
  }, null, 2), 'utf8');
  fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
  fs.writeFileSync(path.join(workspace, 'src', 'index.ts'), 'export const value: number = 1;\n', 'utf8');

  const output = runOme(['init-rules'], workspace);

  assert.match(output, /Initialized personalized rule context/);
  assert.match(output, /Read \.ome\/context\/project-scan\.json/);
  assert.match(output, /Run `ome rules sync` after editing rules/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'context', 'project-scan.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'context', 'rules-generation-prompt.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'code-style.md')), true);

  const rulesInitOutput = runOme(['rules', 'init', '--preserve'], workspace);
  assert.match(rulesInitOutput, /Initialized personalized rule context/);
});

test('ome init preserves existing files unless force is set', () => {
  const workspace = createWorkspace();

  runOme(['init'], workspace);
  const configPath = path.join(workspace, 'OME.md');
  const customConfig = `---
project:
  name: custom
  template: custom
custom: true
---

# Custom Config
`;
  fs.writeFileSync(configPath, customConfig, 'utf8');

  const preservedOutput = runOme(['init'], workspace);
  assert.match(preservedOutput, /Config: preserved/);
  const preservedConfig = parseOMEConfig(workspace);
  assert.equal(preservedConfig.custom, true);

  const forcedOutput = runOme(['init', '--force'], workspace);
  assert.match(forcedOutput, /Config: created/);
  const forcedConfig = parseOMEConfig(workspace);
  assert.equal(forcedConfig.custom, undefined);
});

test('ome init migrates legacy .oh-my-engine projects to .ome', () => {
  const workspace = createWorkspace();
  fs.mkdirSync(path.join(workspace, '.oh-my-engine', 'rules'), { recursive: true });
  fs.writeFileSync(path.join(workspace, '.oh-my-engine', 'config.json'), '{"legacy":true}\n', 'utf8');
  fs.writeFileSync(path.join(workspace, '.oh-my-engine', 'rules', 'custom.md'), '# Custom\n', 'utf8');

  const output = runOme(['init'], workspace);

  assert.match(output, /migrated to .ome/);
  assert.equal(fs.existsSync(path.join(workspace, '.oh-my-engine')), false);
  assert.equal(fs.existsSync(path.join(workspace, 'OME.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'rules', 'custom.md')), true);

  const config = parseOMEConfig(workspace);
  assert.ok(config.project, 'Config should have project section');
});

export {};
