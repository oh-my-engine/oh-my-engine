const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const {
  AGENTS
} = require('./agents');

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

const NATIVE_SUPPORT_MAP: Record<string, SuperpowersPlatform['nativeSupport']> = {
  'claude-code': 'plugin',
  'codex': 'codex-link',
  'antigravity': 'gemini-extension'
};

const SUPERPOWERS_REPO = 'https://github.com/obra/superpowers';

const PLATFORMS: SuperpowersPlatform[] = AGENTS.map((agent: any) => ({
  id: agent.id,
  name: agent.name,
  kind: agent.commandStyle,
  directory: agent.globalCommandDirectory || '',
  nativeSupport: NATIVE_SUPPORT_MAP[agent.id] || 'wrapper'
})).filter((p: SuperpowersPlatform) => p.directory);

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


function installSuperpowers(options: SuperpowersOptions): string {
  const home = normalizeHome(options.home);
  const lines = ['Official Superpowers installation'];

  for (const platform of selectedPlatforms(options)) {
    if (platform.id === 'codex') {
      try {
        const repoPath = path.join(home, '.codex', 'superpowers');
        const skillPath = path.join(home, '.agents', 'skills', 'superpowers');

        if (!fs.existsSync(repoPath)) {
          lines.push(`cloning official superpowers to ${repoPath}...`);
          execSync(`git clone https://github.com/obra/superpowers.git "${repoPath}"`, { stdio: 'inherit' });
        } else {
          lines.push(`official superpowers already exists at ${repoPath}, skipping clone.`);
        }

        ensureDirectory(path.dirname(skillPath));
        if (!fs.existsSync(skillPath)) {
          lines.push(`creating symlink to ${skillPath}...`);
          // Windows junction logic
          const target = path.join(repoPath, 'skills');
          const isWindows = process.platform === 'win32';
          if (isWindows) {
            execSync(`mklink /J "${skillPath}" "${target}"`, { stdio: 'inherit' });
          } else {
            fs.symlinkSync(target, skillPath, 'dir');
          }
        }
        lines.push('✅ codex: official superpowers installed via symlink.');
      } catch (error: any) {
        lines.push(`❌ codex install failed: ${error.message}`);
      }
      continue;
    }

    if (platform.id === 'claude-code') {
      const target = targetPath(home, platform);
      const content = [
        '---',
        'description: Official Superpowers Installation',
        '---',
        '',
        'To install official Superpowers, run the following command in your Claude Code terminal:',
        '',
        '```bash',
        '/plugin install superpowers@claude-plugins-official',
        '```',
        '',
        'Source: https://github.com/obra/superpowers'
      ].join('\n');
      writeFile(target, content);
      lines.push(`✅ claude-code: instructions generated at ${target}`);
      continue;
    }

    // 其他平台如果官方没有原生支持，则跳过或提供简单链接
    if (platform.nativeSupport === 'wrapper' || platform.nativeSupport === 'gemini-extension') {
      const target = targetPath(home, platform);
      const content = [
        '---',
        'description: Official Superpowers Repository',
        '---',
        '',
        'This editor does not have a native Superpowers plugin yet.',
        'Please follow the official manual installation instructions at:',
        'https://github.com/obra/superpowers'
      ].join('\n');
      writeFile(target, content);
      lines.push(`✅ ${platform.id}: repo link generated at ${target}`);
    }
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
