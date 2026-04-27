const { execFileSync } = require('node:child_process');

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
