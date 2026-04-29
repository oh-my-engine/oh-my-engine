const fs = require('node:fs');
const path = require('node:path');

import type { PlatformAdapter, PlatformAdapterManifest, PlatformAdapterStatus, PlatformAdapterSyncPlan, PlatformConfig } from '../types';

function statusFor(
  id: string,
  defaultName: string,
  capabilities: string[],
  target: string,
  detected: boolean,
  config: PlatformConfig,
  fallbackType: string
): PlatformAdapterStatus {
  return {
    id,
    name: config.name || defaultName,
    type: config.type || fallbackType,
    target,
    detected,
    capabilities
  };
}

function manifestFor(status: PlatformAdapterStatus, config: PlatformConfig): PlatformAdapterManifest {
  return {
    ...status,
    config: { ...config }
  };
}

function planFor(projectRoot: string, id: string, target: string, files?: string[]): PlatformAdapterSyncPlan {
  return {
    platform: id,
    target,
    action: fs.existsSync(path.join(projectRoot, target)) ? 'update' : 'create',
    ...(files && files.length > 0 ? { files } : {})
  };
}

export function createFilePlatformAdapter(id: string, defaultName: string, capabilities: string[] = ['rules:index']): PlatformAdapter {
  return {
    id,
    defaultName,
    capabilities,
    getTarget(config: PlatformConfig): string {
      return config.file || '';
    },
    detect(projectRoot: string, config: PlatformConfig): boolean {
      const target = this.getTarget(config);
      return Boolean(target) && fs.existsSync(path.join(projectRoot, target));
    },
    status(projectRoot: string, config: PlatformConfig): PlatformAdapterStatus {
      const target = this.getTarget(config);
      return statusFor(id, defaultName, capabilities, target, this.detect(projectRoot, config), config, 'single-file');
    },
    manifest(projectRoot: string, config: PlatformConfig): PlatformAdapterManifest {
      return manifestFor(this.status(projectRoot, config), config);
    },
    planSync(projectRoot: string, config: PlatformConfig): PlatformAdapterSyncPlan {
      return planFor(projectRoot, id, this.getTarget(config));
    }
  };
}

export function createDirectoryPlatformAdapter(id: string, defaultName: string, capabilities: string[] = ['rules:multi-file']): PlatformAdapter {
  return {
    id,
    defaultName,
    capabilities,
    getTarget(config: PlatformConfig): string {
      return config.directory || '';
    },
    detect(projectRoot: string, config: PlatformConfig): boolean {
      const target = this.getTarget(config);
      return Boolean(target) && fs.existsSync(path.join(projectRoot, target));
    },
    status(projectRoot: string, config: PlatformConfig): PlatformAdapterStatus {
      const target = this.getTarget(config);
      return statusFor(id, defaultName, capabilities, target, this.detect(projectRoot, config), config, 'multi-file');
    },
    manifest(projectRoot: string, config: PlatformConfig): PlatformAdapterManifest {
      return manifestFor(this.status(projectRoot, config), config);
    },
    planSync(projectRoot: string, config: PlatformConfig, files: string[] = []): PlatformAdapterSyncPlan {
      return planFor(projectRoot, id, this.getTarget(config), files);
    }
  };
}
