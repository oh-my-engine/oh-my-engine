const path = require('node:path');

const { fileExists, readJsonFile } = require('../core/project');
const { enginePath } = require('../core/paths');
const { getAdapter } = require('./registry');

import type { PlatformAdapterManifest, PlatformAdapterStatus, PlatformAdapterSyncPlan } from './types';

export type PlatformAdapter = PlatformAdapterStatus;

function loadPlatforms(projectRoot: string): Record<string, any> {
  const platformsPath = enginePath(projectRoot, 'platforms.json');
  if (!fileExists(platformsPath)) return { enabled: [], platforms: {} };
  return readJsonFile(platformsPath);
}

function enabledPlatformIds(config: Record<string, any>): string[] {
  return Array.isArray(config.enabled) ? config.enabled : Object.keys(config.platforms || {});
}

function fallbackStatus(projectRoot: string, id: string, platformConfig: Record<string, any>): PlatformAdapterStatus {
  const target = platformConfig.file || platformConfig.directory || '';
  return {
    id,
    name: platformConfig.name || id,
    type: platformConfig.type || 'unknown',
    target,
    detected: target ? fileExists(path.join(projectRoot, target)) : false,
    capabilities: []
  };
}

export function listAdapters(projectRoot: string = process.cwd()): PlatformAdapterStatus[] {
  const config = loadPlatforms(projectRoot);

  return enabledPlatformIds(config)
    .map((id: string) => {
      const platformConfig = config.platforms?.[id];
      if (!platformConfig) return null;
      const adapter = getAdapter(id);
      if (adapter) return adapter.status(projectRoot, platformConfig);
      return fallbackStatus(projectRoot, id, platformConfig);
    })
    .filter(Boolean);
}

export function listAdapterManifests(projectRoot: string = process.cwd()): PlatformAdapterManifest[] {
  const config = loadPlatforms(projectRoot);

  return enabledPlatformIds(config)
    .map((id: string) => {
      const platformConfig = config.platforms?.[id];
      if (!platformConfig) return null;
      const adapter = getAdapter(id);
      if (adapter) return adapter.manifest(projectRoot, platformConfig);
      return { ...fallbackStatus(projectRoot, id, platformConfig), config: { ...platformConfig } };
    })
    .filter(Boolean);
}

export function previewAdapterSync(projectRoot: string, platformId: string, files: string[] = []): PlatformAdapterSyncPlan | null {
  const config = loadPlatforms(projectRoot);
  const platformConfig = config.platforms?.[platformId];
  if (!platformConfig) return null;

  const adapter = getAdapter(platformId);
  if (adapter) return adapter.planSync(projectRoot, platformConfig, files);

  const target = platformConfig.file || platformConfig.directory || '';
  if (!target) return null;
  return {
    platform: platformId,
    target,
    action: fileExists(path.join(projectRoot, target)) ? 'update' : 'create',
    ...(files.length > 0 ? { files } : {})
  };
}
