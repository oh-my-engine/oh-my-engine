const fs = require('node:fs');
const path = require('node:path');

export function repoRootFromCompiledFile(currentDir: string): string {
  return path.resolve(currentDir, '..');
}

export function projectPath(...segments: string[]): string {
  return path.join(process.cwd(), ...segments);
}

export function readJsonFile(filePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function directoryExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
}

export function listMarkdownFiles(directoryPath: string): string[] {
  if (!directoryExists(directoryPath)) return [];
  return fs
    .readdirSync(directoryPath)
    .filter((name: string) => name.endsWith('.md'))
    .sort();
}
