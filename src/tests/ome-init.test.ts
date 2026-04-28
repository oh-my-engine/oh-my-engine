const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const yaml = require('js-yaml');

const { OME_BIN } = require('./helpers');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-init-'));
}

function runOme(args: string[], cwd: string): string {
  return execFileSync(OME_BIN, args, {
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
