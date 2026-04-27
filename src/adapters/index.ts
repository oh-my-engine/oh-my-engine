const { fileExists, projectPath, readJsonFile } = require('../core/project');
const { enginePath } = require('../core/paths');
const { getAdapter } = require('./registry');

import type { PlatformAdapterStatus } from './types';

export type PlatformAdapter = PlatformAdapterStatus;

export function listAdapters(projectRoot: string = process.cwd()): PlatformAdapterStatus[] {
  const platformsPath = enginePath(projectRoot, 'platforms.json');
  if (!fileExists(platformsPath)) return [];

  const config = readJsonFile(platformsPath);
  const enabled = Array.isArray(config.enabled) ? config.enabled : Object.keys(config.platforms || {});

  return enabled
    .map((id: string) => {
      const platformConfig = config.platforms?.[id];
      if (!platformConfig) return null;
      const adapter = getAdapter(id);
      if (adapter) return adapter.status(projectRoot, platformConfig);

      const target = platformConfig.file || platformConfig.directory || '';
      return {
        id,
        name: platformConfig.name || id,
        type: platformConfig.type || 'unknown',
        target,
        detected: target ? fileExists(projectPath(target)) : false,
        capabilities: []
      };
    })
    .filter(Boolean);
}
