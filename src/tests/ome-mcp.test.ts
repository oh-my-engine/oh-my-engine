const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { OME_BIN, omeArgs } = require('./helpers');

function createWorkspace(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runOme(args: string[], cwd: string, env: Record<string, string | undefined> = {}): string {
  return execFileSync(OME_BIN, omeArgs(args), {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
}

function runOmeAllowFailure(args: string[], cwd: string, env: Record<string, string | undefined> = {}): string {
  try {
    return runOme(args, cwd, env);
  } catch (error) {
    const failure = error as { stdout?: Buffer | string };
    return String(failure.stdout || '');
  }
}

test('ome mcp preview all renders figma and mastergo without real tokens', () => {
  const workspace = createWorkspace('ome-mcp-preview-');
  const output = runOme(['mcp', 'preview', 'all', '--project-root', workspace, '--home', workspace], workspace);

  assert.match(output, /\.ome\\mcp\\source\.json|\/\.ome\/mcp\/source\.json/);
  assert.match(output, /figma/);
  assert.match(output, /figma-framelink/);
  assert.match(output, /mastergo/);
  assert.match(output, /https:\/\/mcp\.figma\.com\/mcp/);
  assert.match(output, /FIGMA_API_KEY/);
  assert.match(output, /MG_MCP_TOKEN/);
  assert.doesNotMatch(output, /figd_[A-Za-z0-9]+/);
});

test('ome mcp init creates source config and ome mcp sync writes supported agent configs', () => {
  const workspace = createWorkspace('ome-mcp-workspace-');
  const home = createWorkspace('ome-mcp-home-');
  fs.writeFileSync(path.join(workspace, '.mcp.json'), JSON.stringify({
    mcpServers: {
      existing: {
        command: 'node',
        args: ['server.js']
      }
    }
  }, null, 2), 'utf8');

  const initOutput = runOme(['mcp', 'init', '--all', '--project-root', workspace, '--home', home], workspace);
  assert.match(initOutput, /source config/);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'mcp', 'source.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.cursor', 'mcp.json')), false);
  assert.equal(fs.existsSync(path.join(home, '.codex', 'config.toml')), false);

  const source = JSON.parse(fs.readFileSync(path.join(workspace, '.ome', 'mcp', 'source.json'), 'utf8'));
  assert.deepEqual(source.providers, ['figma', 'figma-framelink', 'mastergo']);

  const output = runOme(['mcp', 'sync', '--project-root', workspace, '--home', home], workspace);

  assert.match(output, /Oh My Engine MCP sync/);
  const claudeConfig = JSON.parse(fs.readFileSync(path.join(workspace, '.mcp.json'), 'utf8'));
  assert.equal(claudeConfig.mcpServers.existing.command, 'node');
  assert.equal(claudeConfig.mcpServers.figma.url, 'https://mcp.figma.com/mcp');
  assert.equal(claudeConfig.mcpServers['mastergo-magic-mcp'].command, 'npx');

  const cursorConfig = JSON.parse(fs.readFileSync(path.join(workspace, '.cursor', 'mcp.json'), 'utf8'));
  assert.equal(cursorConfig.mcpServers.Framelink_Figma_MCP.command, 'npx');

  const windsurfConfig = JSON.parse(fs.readFileSync(path.join(home, '.codeium', 'windsurf', 'mcp_config.json'), 'utf8'));
  assert.equal(windsurfConfig.mcpServers['mastergo-magic-mcp'].args.some((arg: string) => arg.includes('${MG_MCP_TOKEN}')), true);

  const codexConfig = fs.readFileSync(path.join(home, '.codex', 'config.toml'), 'utf8');
  assert.match(codexConfig, /\[mcp_servers\.figma\]/);
  assert.match(codexConfig, /\[mcp_servers\.mastergo-magic-mcp\]/);
  assert.match(codexConfig, /\$\{FIGMA_API_KEY\}/);

  assert.equal(fs.existsSync(path.join(workspace, 'opencode.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'mcp', 'README.md')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'mcp', 'qoder.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'mcp', 'trae.json')), true);
  assert.equal(fs.existsSync(path.join(workspace, '.ome', 'mcp', 'antigravity.json')), true);
});

test('ome mcp doctor reports config and token status', () => {
  const workspace = createWorkspace('ome-mcp-doctor-');
  const home = createWorkspace('ome-mcp-doctor-home-');

  runOme(['mcp', 'init', '--all', '--project-root', workspace, '--home', home], workspace);
  runOme(['mcp', 'sync', '--project-root', workspace, '--home', home], workspace);
  const missingOutput = runOmeAllowFailure(['mcp', 'doctor', '--all', '--project-root', workspace, '--home', home], workspace, {
    FIGMA_API_KEY: undefined,
    MG_MCP_TOKEN: undefined
  });
  assert.match(missingOutput, /env: missing-token FIGMA_API_KEY/);
  assert.match(missingOutput, /env: missing-token MG_MCP_TOKEN/);

  const okOutput = runOme(['mcp', 'doctor', '--all', '--project-root', workspace, '--home', home], workspace, {
    FIGMA_API_KEY: 'placeholder',
    MG_MCP_TOKEN: 'placeholder'
  });
  assert.match(okOutput, /env: installed FIGMA_API_KEY/);
  assert.match(okOutput, /env: installed MG_MCP_TOKEN/);
});

export {};
