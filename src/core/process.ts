const { execFileSync, execSync } = require('node:child_process');

export interface CommandResult {
  stdout: string;
}

export function runCommand(command: string, args: string[], cwd: string = process.cwd()): CommandResult {
  return {
    stdout: execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  };
}

export function runCommandInherit(command: string, args: string[], cwd: string = process.cwd()): void {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit'
  });
}

export function runShellCommandInherit(command: string, cwd: string = process.cwd()): void {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : '/bin/sh'
  });
}
