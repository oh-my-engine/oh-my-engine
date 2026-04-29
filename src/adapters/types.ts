export interface PlatformConfig {
  name?: string;
  description?: string;
  type?: string;
  file?: string;
  directory?: string;
  format?: string;
  extension?: string;
  autoSync?: boolean;
  frontmatter?: Record<string, any>;
  numberedPrefix?: boolean;
}

export interface PlatformAdapterStatus {
  id: string;
  name: string;
  type: string;
  target: string;
  detected: boolean;
  capabilities: string[];
}

export interface PlatformAdapterManifest extends PlatformAdapterStatus {
  config: PlatformConfig;
}

export interface PlatformAdapterSyncPlan {
  platform: string;
  target: string;
  action: 'create' | 'update';
  files?: string[];
}

export interface PlatformAdapter {
  id: string;
  defaultName: string;
  capabilities: string[];
  getTarget(config: PlatformConfig): string;
  detect(projectRoot: string, config: PlatformConfig): boolean;
  status(projectRoot: string, config: PlatformConfig): PlatformAdapterStatus;
  manifest(projectRoot: string, config: PlatformConfig): PlatformAdapterManifest;
  planSync(projectRoot: string, config: PlatformConfig, files?: string[]): PlatformAdapterSyncPlan;
}
