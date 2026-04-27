const fs = require('node:fs');
const path = require('node:path');

import type { PlatformAdapter, PlatformAdapterStatus, PlatformConfig } from '../types';

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
      return {
        id,
        name: config.name || defaultName,
        type: config.type || 'single-file',
        target,
        detected: this.detect(projectRoot, config),
        capabilities
      };
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
      return {
        id,
        name: config.name || defaultName,
        type: config.type || 'multi-file',
        target,
        detected: this.detect(projectRoot, config),
        capabilities
      };
    }
  };
}
