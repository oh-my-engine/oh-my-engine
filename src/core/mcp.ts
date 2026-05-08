const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ENGINE_DIR } = require('./paths');

type McpProviderId = 'figma' | 'figma-framelink' | 'mastergo';
type McpTargetStatus = 'installed' | 'generated' | 'missing-config' | 'missing-token';
type McpTargetKind = 'project' | 'user' | 'manual';

interface McpProviderPreset {
  id: McpProviderId;
  name: string;
  serverName: string;
  tokenEnv?: string;
  transport: 'http' | 'stdio';
  enabled: boolean;
  config: Record<string, any>;
}

interface McpSourceConfig {
  version: number;
  providers: McpProviderId[];
  presets: Record<McpProviderId, McpProviderPreset>;
}

interface McpOptions {
  providers: McpProviderId[];
  all?: boolean;
  home?: string;
  projectRoot?: string;
  sync?: boolean;
}

interface McpTargetResult {
  platform: string;
  target: string;
  kind: McpTargetKind;
  status: McpTargetStatus;
  detail: string;
}

interface McpArtifact {
  sourcePath: string;
  source: McpSourceConfig;
  results: McpTargetResult[];
}

const MANAGED_START = '# OME MCP:START';
const MANAGED_END = '# OME MCP:END';

const SOURCE_FILE = 'source.json';

const PRESETS: Record<McpProviderId, McpProviderPreset> = {
  figma: {
    id: 'figma',
    name: 'Figma remote MCP',
    serverName: 'figma',
    transport: 'http',
    enabled: true,
    config: {
      url: 'https://mcp.figma.com/mcp'
    }
  },
  'figma-framelink': {
    id: 'figma-framelink',
    name: 'Figma Framelink compatibility MCP',
    serverName: 'Framelink_Figma_MCP',
    tokenEnv: 'FIGMA_API_KEY',
    transport: 'stdio',
    enabled: false,
    config: {
      command: 'npx',
      args: ['-y', 'figma-developer-mcp', '--figma-api-key=${FIGMA_API_KEY}', '--stdio']
    }
  },
  mastergo: {
    id: 'mastergo',
    name: 'MasterGo Magic MCP',
    serverName: 'mastergo-magic-mcp',
    tokenEnv: 'MG_MCP_TOKEN',
    transport: 'stdio',
    enabled: true,
    config: {
      command: 'npx',
      args: ['-y', '@mastergo/magic-mcp', '--token=${MG_MCP_TOKEN}', '--url=https://mastergo.com']
    }
  }
};

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeTextFile(filePath: string, content: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function readJson(filePath: string): Record<string, any> {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return {};
  return JSON.parse(stripJsonComments(raw));
}

function stripJsonComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '$1');
}

function normalizeHome(home?: string): string {
  return home ? path.resolve(home) : os.homedir();
}

function normalizeProjectRoot(projectRoot?: string): string {
  return projectRoot ? path.resolve(projectRoot) : process.cwd();
}

function resolveProviders(options: McpOptions): McpProviderId[] {
  if (options.all || options.providers.length === 0) return ['figma', 'mastergo'];
  return options.providers;
}

function buildSourceConfig(options: McpOptions): McpSourceConfig {
  const providers = resolveProviders(options);
  const presets: Record<McpProviderId, McpProviderPreset> = {
    figma: { ...PRESETS.figma, enabled: providers.includes('figma') },
    'figma-framelink': { ...PRESETS['figma-framelink'], enabled: providers.includes('figma-framelink') },
    mastergo: { ...PRESETS.mastergo, enabled: providers.includes('mastergo') }
  };

  return {
    version: 1,
    providers,
    presets
  };
}

function sourceFilePath(projectRoot: string): string {
  return path.join(projectRoot, ENGINE_DIR, 'mcp', SOURCE_FILE);
}

function loadSourceConfig(projectRoot: string): McpSourceConfig {
  const filePath = sourceFilePath(projectRoot);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing MCP source config: ${filePath}. Run \`ome mcp init\` first.`);
  }
  const parsed = readJson(filePath) as Partial<McpSourceConfig>;
  const presets = (parsed.presets || {}) as Partial<Record<McpProviderId, Partial<McpProviderPreset>>>;
  return {
    version: parsed.version || 1,
    providers: Array.isArray(parsed.providers) ? parsed.providers as McpProviderId[] : [],
    presets: {
      figma: { ...PRESETS.figma, ...(presets.figma || {}) },
      'figma-framelink': { ...PRESETS['figma-framelink'], ...(presets['figma-framelink'] || {}) },
      mastergo: { ...PRESETS.mastergo, ...(presets.mastergo || {}) }
    }
  };
}

function writeSourceConfig(projectRoot: string, source: McpSourceConfig): string {
  const filePath = sourceFilePath(projectRoot);
  writeTextFile(filePath, JSON.stringify(source, null, 2));
  return filePath;
}

function enabledPresets(source: McpSourceConfig): McpProviderPreset[] {
  return source.providers
    .map(id => source.presets[id])
    .filter((preset): preset is McpProviderPreset => Boolean(preset) && preset.enabled);
}

function jsonServers(source: McpSourceConfig): Record<string, any> {
  const servers: Record<string, any> = {};
  for (const preset of enabledPresets(source)) {
    servers[preset.serverName] = preset.config;
  }
  return servers;
}

function mergeJsonServerConfig(existing: Record<string, any>, serverKey: string, additions: Record<string, any>): Record<string, any> {
  return {
    ...existing,
    [serverKey]: {
      ...(existing[serverKey] || {}),
      ...additions
    }
  };
}

function parseTomlSectionKeys(content: string): Set<string> {
  const keys = new Set<string>();
  const pattern = /^\[mcp_servers\.([^\]]+)\]$/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

function codexToml(source: McpSourceConfig): string {
  const lines = [MANAGED_START];
  for (const preset of enabledPresets(source)) {
    lines.push(`[mcp_servers.${preset.serverName}]`);
    if (preset.transport === 'http') {
      lines.push(`url = "${preset.config.url}"`);
    } else {
      lines.push(`command = "${preset.config.command}"`);
      const args = (preset.config.args || []).map((value: string) => `"${value}"`).join(', ');
      lines.push(`args = [${args}]`);
    }
    lines.push('');
  }
  lines.push(MANAGED_END);
  return lines.join('\n');
}

function replaceManagedTomlBlock(content: string, block: string): string {
  const pattern = new RegExp(`${escapeRegExp(MANAGED_START)}[\\s\\S]*?${escapeRegExp(MANAGED_END)}\\n?`);
  if (pattern.test(content)) return content.replace(pattern, block);
  return `${content.trimEnd() ? `${content.trimEnd()}\n\n` : ''}${block}\n`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildJsonTarget(filePath: string, source: McpSourceConfig): McpTargetResult {
  const existing = readJson(filePath);
  const merged = mergeJsonServerConfig(existing, 'mcpServers', jsonServers(source));
  writeTextFile(filePath, JSON.stringify(merged, null, 2));
  return { platform: platformNameForPath(filePath), target: filePath, kind: filePath.includes(path.join('.codex', '')) ? 'user' : 'project', status: 'installed', detail: `${enabledPresets(source).length} server(s)` };
}

function buildOpenCodeTarget(projectRoot: string, source: McpSourceConfig): McpTargetResult {
  const jsoncPath = path.join(projectRoot, 'opencode.jsonc');
  const jsonPath = path.join(projectRoot, 'opencode.json');
  const filePath = fs.existsSync(jsoncPath) ? jsoncPath : jsonPath;
  const existing = readJson(filePath);
  const merged = mergeJsonServerConfig(existing, 'mcp', jsonServers(source));
  writeTextFile(filePath, JSON.stringify(merged, null, 2));
  return { platform: 'opencode', target: filePath, kind: 'project', status: 'installed', detail: `${enabledPresets(source).length} server(s)` };
}

function buildCodexTarget(home: string, source: McpSourceConfig): McpTargetResult {
  const filePath = path.join(home, '.codex', 'config.toml');
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const currentServers = parseTomlSectionKeys(existing);
  const block = codexToml(source);
  const next = replaceManagedTomlBlock(existing, block);
  writeTextFile(filePath, next);
  return { platform: 'codex', target: filePath, kind: 'user', status: currentServers.size > 0 ? 'installed' : 'generated', detail: `${enabledPresets(source).length} server(s)` };
}

function buildManualTarget(projectRoot: string, platform: string, source: McpSourceConfig): McpTargetResult {
  const filePath = path.join(projectRoot, ENGINE_DIR, 'mcp', `${platform}.json`);
  writeTextFile(filePath, JSON.stringify({ mcpServers: jsonServers(source) }, null, 2));
  return { platform, target: filePath, kind: 'manual', status: 'generated', detail: 'manual import config' };
}

function buildReadme(projectRoot: string, source: McpSourceConfig): McpTargetResult {
  const filePath = path.join(projectRoot, ENGINE_DIR, 'mcp', 'README.md');
  const envLines = enabledPresets(source)
    .map(preset => preset.tokenEnv ? `- \`${preset.tokenEnv}\`` : '')
    .filter(Boolean);
  const serverLines = enabledPresets(source).map(preset => `- \`${preset.serverName}\` (${preset.name})`);

  const content = [
    '# Oh My Engine MCP',
    '',
    'This directory is the source of truth for MCP setup.',
    '',
    'Default initialization prefers the official Figma remote MCP plus MasterGo.',
    'Enable `figma-framelink` explicitly only when you need the legacy Framelink compatibility path.',
    '',
    '## Providers',
    '',
    ...serverLines,
    '',
    '## Environment',
    '',
    ...(envLines.length > 0 ? envLines : ['- No token variables required']),
    '',
    '## Commands',
    '',
    '- `ome mcp init --all` enables official `figma` plus `mastergo` by default.',
    '- `ome mcp init figma-framelink` adds the legacy Framelink compatibility preset when needed.',
    '- `ome mcp preview` shows the generated target configs.',
    '- `ome mcp sync` writes configs to editor-specific locations.',
    '- `ome mcp doctor` checks file presence and token env vars.'
  ].join('\n');

  writeTextFile(filePath, content);
  return { platform: 'project', target: filePath, kind: 'manual', status: 'generated', detail: 'setup notes' };
}

function buildMcpArtifacts(options: McpOptions): { projectRoot: string; home: string; source: McpSourceConfig } {
  const projectRoot = normalizeProjectRoot(options.projectRoot);
  const home = normalizeHome(options.home);
  const source = buildSourceConfig(options);
  return { projectRoot, home, source };
}

function projectTargets(projectRoot: string, source: McpSourceConfig): McpTargetResult[] {
  return [
    buildJsonTarget(path.join(projectRoot, '.mcp.json'), source),
    buildJsonTarget(path.join(projectRoot, '.cursor', 'mcp.json'), source),
    buildOpenCodeTarget(projectRoot, source),
    buildManualTarget(projectRoot, 'qoder', source),
    buildManualTarget(projectRoot, 'trae', source),
    buildManualTarget(projectRoot, 'antigravity', source),
    buildReadme(projectRoot, source)
  ];
}

function userTargets(home: string, source: McpSourceConfig): McpTargetResult[] {
  return [
    buildCodexTarget(home, source),
    buildJsonTarget(path.join(home, '.codeium', 'windsurf', 'mcp_config.json'), source)
  ];
}

export function parseMcpArgs(args: string[]): McpOptions {
  const providers: McpProviderId[] = [];
  const options: McpOptions = { providers };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--all' || argument === 'all') {
      options.all = true;
      continue;
    }
    if (argument === '--home') {
      if (index + 1 >= args.length) throw new Error('Missing value for --home');
      options.home = args[index + 1];
      index += 1;
      continue;
    }
    if (argument === '--project-root') {
      if (index + 1 >= args.length) throw new Error('Missing value for --project-root');
      options.projectRoot = args[index + 1];
      index += 1;
      continue;
    }
    if (argument === '--sync') {
      options.sync = true;
      continue;
    }
    if (argument === 'figma' || argument === 'figma-framelink' || argument === 'mastergo') {
      providers.push(argument);
      continue;
    }
    throw new Error(`Unknown mcp option: ${argument}`);
  }

  return options;
}

export function initMcp(options: McpOptions): McpArtifact {
  const { projectRoot, source } = buildMcpArtifacts(options);
  const sourcePath = writeSourceConfig(projectRoot, source);
  const results = options.sync
    ? [...projectTargets(projectRoot, source), ...userTargets(normalizeHome(options.home), source)]
    : [buildReadme(projectRoot, source)];
  return { sourcePath, source, results };
}

export function syncMcp(options: McpOptions): McpArtifact {
  const { projectRoot, home, source } = buildMcpArtifacts(options);
  const loaded = loadSourceConfig(projectRoot);
  const results = [...projectTargets(projectRoot, loaded), ...userTargets(home, loaded)];
  return { sourcePath: sourceFilePath(projectRoot), source: loaded, results };
}

export function previewMcp(options: McpOptions): string {
  const { projectRoot, home, source } = buildMcpArtifacts(options);
  const lines = ['Oh My Engine MCP preview', ''];

  lines.push(`Source: ${sourceFilePath(projectRoot)}`);
  lines.push('Providers:');
  for (const preset of enabledPresets(source)) {
    lines.push(`- ${preset.id}: ${preset.serverName}${preset.tokenEnv ? ` (${preset.tokenEnv})` : ''}`);
  }

  lines.push('', 'Project targets:');
  for (const target of projectTargets(projectRoot, source)) {
    lines.push(`- ${target.platform}: ${target.target}`);
  }

  lines.push('', 'User targets:');
  for (const target of userTargets(home, source)) {
    lines.push(`- ${target.platform}: ${target.target}`);
  }

  lines.push('', 'JSON mcpServers:');
  lines.push(JSON.stringify({ mcpServers: jsonServers(source) }, null, 2));
  lines.push('', 'Codex TOML:');
  lines.push(codexToml(source));

  return `${lines.join('\n')}\n`;
}

export function doctorMcp(options: McpOptions): McpTargetResult[] {
  const { projectRoot, home, source } = buildMcpArtifacts(options);
  const loaded = fs.existsSync(sourceFilePath(projectRoot)) ? loadSourceConfig(projectRoot) : source;
  const targets = [...projectTargets(projectRoot, loaded), ...userTargets(home, loaded)];
  const tokenTargets = enabledPresets(loaded).flatMap(preset => preset.tokenEnv ? [{ preset, envName: preset.tokenEnv }] : []);

  const results = targets.map(target => ({
    ...target,
    status: fs.existsSync(target.target) ? 'installed' as McpTargetStatus : 'missing-config' as McpTargetStatus
  }));

  for (const { envName } of tokenTargets) {
    results.push({
      platform: 'env',
      target: envName,
      kind: 'manual',
      status: process.env[envName] ? 'installed' : 'missing-token',
      detail: process.env[envName] ? 'set' : 'not set'
    });
  }

  return results;
}

export function renderMcpResults(title: string, results: McpTargetResult[]): string {
  const lines = [title, ''];
  for (const result of results) {
    lines.push(`${result.platform}: ${result.status} ${result.target} - ${result.detail}`);
  }
  return `${lines.join('\n')}\n`;
}

export function runMcpCommand(args: string[]): void {
  const subcommand = args[0] || 'help';
  const options = parseMcpArgs(args.slice(1));

  if (subcommand === 'init') {
    const artifact = initMcp(options);
    process.stdout.write(renderMcpResults('Oh My Engine MCP init', [
      { platform: 'project', target: artifact.sourcePath, kind: 'manual', status: 'generated', detail: 'source config' },
      ...artifact.results
    ]));
    return;
  }

  if (subcommand === 'sync') {
    const artifact = syncMcp(options);
    process.stdout.write(renderMcpResults('Oh My Engine MCP sync', artifact.results));
    return;
  }

  if (subcommand === 'doctor') {
    const results = doctorMcp(options);
    process.stdout.write(renderMcpResults('Oh My Engine MCP doctor', results));
    if (results.some(result => result.status === 'missing-config' || result.status === 'missing-token')) process.exitCode = 1;
    return;
  }

  if (subcommand === 'preview') {
    process.stdout.write(previewMcp(options));
    return;
  }

  throw new Error(`Unknown mcp command: ${subcommand}`);
}

function platformNameForPath(filePath: string): string {
  if (filePath.endsWith('.cursor/mcp.json') || filePath.endsWith('.cursor\\mcp.json')) return 'cursor';
  if (filePath.includes('.codeium')) return 'windsurf';
  if (filePath.endsWith('.mcp.json')) return 'claude-code';
  return 'mcp';
}

export type {
  McpArtifact,
  McpOptions,
  McpProviderId,
  McpTargetResult,
  McpTargetStatus
};
