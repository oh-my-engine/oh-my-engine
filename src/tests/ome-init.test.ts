const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

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

test('ome init initializes project directories and defaults from TypeScript CLI', () => {
  const workspace = createWorkspace();

  const output = runOme(['init', '--template', 'node'], workspace);

  assert.match(output, /Initialized Oh My Engine project/);
  assert.equal(fs.existsSync(path.join(workspace, '.oh-my-engine', 'config.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.oh-my-engine', 'rules', 'code-style.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, 'openspec', 'project.md')), true);

  const config = JSON.parse(fs.readFileSync(path.join(workspace, '.oh-my-engine', 'config.json'), 'utf8'));
  assert.equal(config.project.name, path.basename(workspace));
  assert.equal(config.project.template, 'node');
  assert.equal(config.memory.captureMode, 'selective');

  const gitignore = fs.readFileSync(path.join(workspace, '.gitignore'), 'utf8');
  assert.match(gitignore, /\.oh-my-engine\/memory\//);
});

test('ome init preserves existing files unless force is set', () => {
  const workspace = createWorkspace();

  runOme(['init'], workspace);
  const configPath = path.join(workspace, '.oh-my-engine', 'config.json');
  fs.writeFileSync(configPath, '{"custom":true}\n', 'utf8');

  const preservedOutput = runOme(['init'], workspace);
  assert.match(preservedOutput, /Config: preserved/);
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath, 'utf8')), { custom: true });

  const forcedOutput = runOme(['init', '--force'], workspace);
  assert.match(forcedOutput, /Config: created/);
  assert.equal(JSON.parse(fs.readFileSync(configPath, 'utf8')).custom, undefined);
});

export {};
