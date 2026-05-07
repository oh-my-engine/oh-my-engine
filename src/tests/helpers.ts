const fs = require('node:fs');
const path = require('node:path');

function findRepoRoot(startDirectory: string): string {
  let directory = path.resolve(startDirectory);

  while (true) {
    if (
      fs.existsSync(path.join(directory, 'package.json')) &&
      fs.existsSync(path.join(directory, 'src'))
    ) {
      return directory;
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      throw new Error(`Unable to locate repo root from ${startDirectory}`);
    }
    directory = parent;
  }
}

const REPO_ROOT = findRepoRoot(__dirname);
const RUNTIME_ROOT = path.join(REPO_ROOT, 'dist');

function omeArgs(args: string[]): string[] {
  if (process.platform === 'win32') return [path.join(RUNTIME_ROOT, 'bin', 'ome.js'), ...args];
  return args;
}

const OME_BIN = process.platform === 'win32' ? process.execPath : path.join(REPO_ROOT, 'bin', 'ome');

function repoPath(...segments: string[]): string {
  return path.join(REPO_ROOT, ...segments);
}

function runtimePath(...segments: string[]): string {
  return path.join(RUNTIME_ROOT, ...segments);
}

module.exports = {
  OME_BIN,
  REPO_ROOT,
  RUNTIME_ROOT,
  omeArgs,
  repoPath,
  runtimePath
};

export {};
