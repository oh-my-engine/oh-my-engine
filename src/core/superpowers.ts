const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

interface SuperpowersPlatform {
  id: string;
  name: string;
  kind: 'slash' | 'skill' | 'workflow';
  directory: string;
  nativeSupport: 'plugin' | 'codex-link' | 'gemini-extension' | 'wrapper';
}

interface SuperpowersOptions {
  platforms: string[];
  home?: string;
}

const SUPERPOWERS_REPO = 'https://github.com/obra/superpowers';

const PLATFORMS: SuperpowersPlatform[] = [
  { id: 'claude-code', name: 'Claude Code', kind: 'slash', directory: '.claude/commands', nativeSupport: 'plugin' },
  { id: 'codex', name: 'Codex', kind: 'skill', directory: '.codex/skills', nativeSupport: 'codex-link' },
  { id: 'cursor', name: 'Cursor', kind: 'slash', directory: '.cursor/commands', nativeSupport: 'wrapper' },
  { id: 'trae', name: 'Trae', kind: 'slash', directory: '.trae/commands', nativeSupport: 'wrapper' },
  { id: 'windsurf', name: 'Windsurf', kind: 'workflow', directory: '.codeium/windsurf/global_workflows', nativeSupport: 'wrapper' },
  { id: 'qoder', name: 'Qoder', kind: 'slash', directory: '.qoder/commands', nativeSupport: 'wrapper' },
  { id: 'opencode', name: 'OpenCode', kind: 'slash', directory: '.config/opencode/command', nativeSupport: 'wrapper' },
  { id: 'antigravity', name: 'Antigravity', kind: 'workflow', directory: '.gemini/antigravity/global_workflows', nativeSupport: 'gemini-extension' }
];

function normalizeHome(home?: string): string {
  return home ? path.resolve(home) : os.homedir();
}

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeFile(filePath: string, content: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function parseOptions(args: string[]): SuperpowersOptions {
  const options: SuperpowersOptions = { platforms: [] };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--home') {
      if (index + 1 >= args.length) throw new Error('Missing value for --home');
      options.home = args[index + 1];
      index += 1;
      continue;
    }
    if (argument === 'all' || argument === '--all') {
      options.platforms = [];
      continue;
    }
    options.platforms.push(argument);
  }

  return options;
}

function selectedPlatforms(options: SuperpowersOptions): SuperpowersPlatform[] {
  if (options.platforms.length === 0) return PLATFORMS;
  const wanted = new Set(options.platforms);
  return PLATFORMS.filter(platform => wanted.has(platform.id));
}

function targetPath(home: string, platform: SuperpowersPlatform): string {
  const base = path.join(home, platform.directory);
  if (platform.kind === 'skill') return path.join(base, 'ome-superpowers', 'SKILL.md');
  return path.join(base, 'ome-superpowers.md');
}

function nativeInstallInstructions(platform: SuperpowersPlatform): string[] {
  switch (platform.nativeSupport) {
    case 'plugin':
      return [
        'Native Superpowers install:',
        '- In Claude Code, run `/plugin install superpowers@claude-plugins-official`.',
        '- Restart or reload Claude Code if the plugin does not appear immediately.'
      ];
    case 'codex-link':
      return [
        'Native Superpowers install:',
        `- Clone or update ${SUPERPOWERS_REPO} into ` + '`~/.codex/superpowers`.',
        '- Link its Codex skills directory to `~/.agents/skills/superpowers`.',
        '- On Windows, use a directory junction if symlinks require elevated permissions.'
      ];
    case 'gemini-extension':
      return [
        'Native Superpowers install:',
        `- Run \`gemini extensions install ${SUPERPOWERS_REPO}\` when Gemini CLI extensions are available.`,
        '- Reload Antigravity/Gemini after installing the extension.'
      ];
    default:
      return [
        'Native Superpowers install:',
        '- This editor does not have a known native Superpowers installer.',
        '- Use this Oh My Engine wrapper workflow to apply Superpowers-style discipline.'
      ];
  }
}

function renderWrapper(platform: SuperpowersPlatform): string {
  const trigger = platform.kind === 'skill' ? 'ome-superpowers' : '/ome-superpowers';
  const body = [
    '# ome-superpowers',
    '',
    'Use Superpowers from Oh My Engine across Agent editors.',
    '',
    `Trigger: \`${trigger}\``,
    'Terminal equivalent: `ome superpowers doctor`',
    '',
    'Before using Superpowers:',
    '- Read `OME.md` if present.',
    '- Read project rules under `.ome/rules/` if present.',
    '- Prefer official Superpowers native installation when this editor supports it.',
    '',
    ...nativeInstallInstructions(platform),
    '',
    'Workflow:',
    '- Run or review `ome superpowers doctor` first.',
    '- If native Superpowers is installed, follow its skill/workflow instructions.',
    '- If native Superpowers is not installed, use this wrapper to enforce planning, TDD, debugging, and focused verification discipline.',
    '- Keep project-specific rules in `.ome/rules/`; do not copy Superpowers source into project rules.',
    '',
    `Source: ${SUPERPOWERS_REPO}`
  ];

  if (platform.kind === 'skill') {
    return [
      '---',
      'name: ome-superpowers',
      'version: 1.0.0',
      'description: Install, update, or inspect Superpowers bridge entries for Agent editors.',
      'author: oh-my-engine',
      'tags: [ome, superpowers, workflow]',
      '---',
      '',
      ...body
    ].join('\n');
  }

  if (platform.kind === 'workflow') {
    return [
      '---',
      'description: Install, update, or inspect Superpowers bridge entries for Agent editors.',
      '---',
      '',
      ...body
    ].join('\n');
  }

  return body.join('\n');
}

function installSuperpowers(options: SuperpowersOptions): string {
  const home = normalizeHome(options.home);
  const lines = ['Superpowers bridge install'];

  for (const platform of selectedPlatforms(options)) {
    const target = targetPath(home, platform);
    writeFile(target, renderWrapper(platform));
    lines.push(`installed ${platform.id}: ${target}`);
  }

  return `${lines.join('\n')}\n`;
}

function doctorSuperpowers(options: SuperpowersOptions): string {
  const home = normalizeHome(options.home);
  const lines = ['Superpowers bridge doctor'];

  for (const platform of selectedPlatforms(options)) {
    const target = targetPath(home, platform);
    const wrapper = fs.existsSync(target) ? 'installed' : 'missing';
    const nativeStatus = detectNativeStatus(home, platform);
    lines.push(`${platform.id}: wrapper=${wrapper} native=${nativeStatus} support=${platform.nativeSupport}`);
  }

  return `${lines.join('\n')}\n`;
}

function detectNativeStatus(home: string, platform: SuperpowersPlatform): string {
  if (platform.nativeSupport === 'codex-link') {
    const clone = path.join(home, '.codex', 'superpowers');
    const agentSkills = path.join(home, '.agents', 'skills', 'superpowers');
    if (fs.existsSync(clone) && fs.existsSync(agentSkills)) return 'installed';
    if (fs.existsSync(clone)) return 'clone-present-link-missing';
    return 'missing';
  }

  if (platform.nativeSupport === 'gemini-extension') {
    const extensionPath = path.join(home, '.gemini', 'extensions', 'superpowers');
    return fs.existsSync(extensionPath) ? 'installed' : 'unknown';
  }

  if (platform.nativeSupport === 'plugin') return 'manual-plugin';
  return 'wrapper-only';
}

function updateSuperpowers(options: SuperpowersOptions): string {
  const installOutput = installSuperpowers(options).trimEnd();
  return `${installOutput}\n\nNative update instructions:\n- Update native Superpowers installations with their official toolchain.\n- Codex native install: update ~/.codex/superpowers from ${SUPERPOWERS_REPO} and refresh ~/.agents/skills/superpowers.\n- Gemini/Antigravity native install: rerun gemini extension update/install for ${SUPERPOWERS_REPO}.\n`;
}

export function runSuperpowersCommand(args: string[]): void {
  const subcommand = args[0] || 'doctor';
  const options = parseOptions(args.slice(1));

  if (subcommand === 'install') {
    process.stdout.write(installSuperpowers(options));
    return;
  }

  if (subcommand === 'update') {
    process.stdout.write(updateSuperpowers(options));
    return;
  }

  if (subcommand === 'doctor') {
    process.stdout.write(doctorSuperpowers(options));
    return;
  }

  throw new Error(`Unknown superpowers command: ${subcommand}`);
}

export const SUPERPOWERS_PLATFORMS = PLATFORMS.map(platform => platform.id);

