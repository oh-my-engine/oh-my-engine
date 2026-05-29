const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

export type OpenSpecCommandStatus = 'present' | 'missing';
export type OpenSpecInstallStatus = 'present' | 'installed' | 'failed' | 'skipped';

export interface OpenSpecCommand {
  command: string;
  args: string[];
  display: string;
}

export interface OpenSpecInstallResult {
  tool: 'openspec';
  target: string;
  status: OpenSpecInstallStatus;
  message: string;
}

export interface OpenSpecBootstrapResult {
  specRoot: string;
  projectCreated: boolean;
  initializedBy: 'openspec' | 'scaffold' | 'skipped';
  message: string;
}

const OPEN_SPEC_PACKAGE = '@fission-ai/openspec@latest';

function commandCandidates(): OpenSpecCommand[] {
  if (process.platform === 'win32') {
    return [
      { command: 'openspec.cmd', args: [], display: 'openspec.cmd' },
      { command: 'cmd.exe', args: ['/c', 'openspec.cmd'], display: 'cmd.exe /c openspec.cmd' },
      { command: 'openspec', args: [], display: 'openspec' }
    ];
  }

  return [{ command: 'openspec', args: [], display: 'openspec' }];
}

function canRun(command: OpenSpecCommand): boolean {
  const result = spawnSync(command.command, [...command.args, '--help'], {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  return result.status === 0;
}

export function resolveOpenSpecCommand(): OpenSpecCommand | undefined {
  return commandCandidates().find(canRun);
}

export function openSpecCommandStatus(): OpenSpecCommandStatus {
  return resolveOpenSpecCommand() ? 'present' : 'missing';
}

export function installOpenSpecCli(enabled: boolean = true): OpenSpecInstallResult {
  const existing = resolveOpenSpecCommand();
  if (existing) {
    return {
      tool: 'openspec',
      target: existing.display,
      status: 'present',
      message: `OpenSpec CLI present: ${existing.display}`
    };
  }

  if (!enabled) {
    return {
      tool: 'openspec',
      target: OPEN_SPEC_PACKAGE,
      status: 'skipped',
      message: 'OpenSpec CLI install skipped.'
    };
  }

  try {
    execFileSync('npm', ['install', '-g', OPEN_SPEC_PACKAGE], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const installed = resolveOpenSpecCommand();
    return {
      tool: 'openspec',
      target: installed?.display || OPEN_SPEC_PACKAGE,
      status: installed ? 'installed' : 'failed',
      message: installed
        ? `OpenSpec CLI installed: ${installed.display}`
        : 'OpenSpec CLI install completed, but the command was not found on PATH.'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      tool: 'openspec',
      target: OPEN_SPEC_PACKAGE,
      status: 'failed',
      message: `OpenSpec CLI install failed: ${message}`
    };
  }
}

export function runOpenSpec(args: string[], cwd: string = process.cwd()): boolean {
  const command = resolveOpenSpecCommand();
  if (!command) return false;

  const result = spawnSync(command.command, [...command.args, ...args], {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  if (typeof result.status === 'number') process.exitCode = result.status;
  return result.status === 0;
}

function writeFileIfNeeded(filePath: string, content: string, force: boolean): boolean {
  if (!force && fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
  return true;
}

export function initializeOpenSpecWorkspace(projectRoot: string, specRoot: string, force: boolean = false, enabled: boolean = true): OpenSpecBootstrapResult {
  if (!enabled) {
    return {
      specRoot,
      projectCreated: false,
      initializedBy: 'skipped',
      message: 'OpenSpec initialization skipped.'
    };
  }

  const command = resolveOpenSpecCommand();
  if (command) {
    const result = spawnSync(command.command, [...command.args, 'init'], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    if (result.status === 0) {
      return {
        specRoot,
        projectCreated: fs.existsSync(path.join(projectRoot, specRoot, 'project.md')),
        initializedBy: 'openspec',
        message: `OpenSpec initialized by ${command.display}.`
      };
    }
  }

  const root = path.join(projectRoot, specRoot);
  fs.mkdirSync(path.join(root, 'changes'), { recursive: true });
  fs.mkdirSync(path.join(root, 'specs'), { recursive: true });
  fs.mkdirSync(path.join(root, 'archive'), { recursive: true });
  const projectCreated = writeFileIfNeeded(
    path.join(root, 'project.md'),
    [
      '# OpenSpec Project',
      '',
      'This workspace is managed by OpenSpec.',
      'Oh My Engine provides project rules, memory, and Agent workflow context around this spec root.'
    ].join('\n'),
    force
  );

  return {
    specRoot,
    projectCreated,
    initializedBy: 'scaffold',
    message: command
      ? 'OpenSpec CLI init failed; created minimal OpenSpec scaffold.'
      : 'OpenSpec CLI not found; created minimal OpenSpec scaffold.'
  };
}
