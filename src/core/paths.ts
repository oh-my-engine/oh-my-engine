const fs = require('node:fs');
const path = require('node:path');

export const ENGINE_DIR = '.ome';
export const LEGACY_ENGINE_DIR = '.oh-my-engine';

export interface EngineMigrationResult {
  migrated: boolean;
  legacyFound: boolean;
  targetExists: boolean;
  source: string;
  target: string;
}

export function engineDirectory(projectRoot: string = process.cwd()): string {
  const current = path.join(projectRoot, ENGINE_DIR);
  if (fs.existsSync(current)) return current;

  const legacy = path.join(projectRoot, LEGACY_ENGINE_DIR);
  if (fs.existsSync(legacy)) return legacy;

  return current;
}

export function enginePath(projectRoot: string, ...segments: string[]): string {
  return path.join(engineDirectory(projectRoot), ...segments);
}

export function currentEnginePath(projectRoot: string, ...segments: string[]): string {
  return path.join(projectRoot, ENGINE_DIR, ...segments);
}

export function repoEnginePath(repoRoot: string, ...segments: string[]): string {
  const current = path.join(repoRoot, ENGINE_DIR);
  if (fs.existsSync(current)) return path.join(current, ...segments);
  return path.join(repoRoot, LEGACY_ENGINE_DIR, ...segments);
}

export function migrateLegacyEngineDirectory(projectRoot: string = process.cwd()): EngineMigrationResult {
  const source = path.join(projectRoot, LEGACY_ENGINE_DIR);
  const target = path.join(projectRoot, ENGINE_DIR);
  const legacyFound = fs.existsSync(source);
  const targetExists = fs.existsSync(target);

  if (legacyFound && !targetExists) {
    fs.renameSync(source, target);
    return { migrated: true, legacyFound, targetExists: true, source, target };
  }

  return { migrated: false, legacyFound, targetExists, source, target };
}

export function displayEnginePath(...segments: string[]): string {
  return path.join(ENGINE_DIR, ...segments);
}

export function replaceLegacyEngineReferences(content: string): string {
  return content
    .split(LEGACY_ENGINE_DIR)
    .join(ENGINE_DIR)
    .split('/oh-my-engine-')
    .join('/ome-')
    .split('oh-my-engine-')
    .join('ome-');
}
