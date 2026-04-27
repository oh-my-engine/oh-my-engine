const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const { enginePath } = require('./paths');
const { readJsonFile } = require('./project');

export interface ConfigSource {
  type: 'markdown' | 'json';
  path: string;
  priority: number;
}

/**
 * 加载项目配置
 * 优先级：OME.md > .ome/config.json
 */
export function loadConfig(root: string = process.cwd()): Record<string, any> {
  const sources: ConfigSource[] = [
    { type: 'markdown', path: path.join(root, 'OME.md'), priority: 1 },
    { type: 'json', path: enginePath(root, 'config.json'), priority: 2 },
  ];

  for (const source of sources) {
    if (fs.existsSync(source.path)) {
      try {
        if (source.type === 'markdown') {
          return loadMarkdownConfig(source.path, root);
        } else {
          return loadJsonConfig(source.path);
        }
      } catch (error: any) {
        console.error(`Failed to load config from ${source.path}: ${error.message}`);
        continue;
      }
    }
  }

  throw new Error('No configuration file found (OME.md or .ome/config.json)');
}

/**
 * 从 OME.md 加载配置
 */
function loadMarkdownConfig(filePath: string, root: string): Record<string, any> {
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    throw new Error('OME.md must contain YAML frontmatter (---\\n...\\n---)');
  }

  try {
    const config = yaml.load(frontmatterMatch[1]) as Record<string, any>;

    // 如果 OME.md 中包含 platforms 配置，直接使用
    // 否则尝试从 platforms.json 加载
    if (!config.platforms) {
      const platformsPath = enginePath(root, 'platforms.json');
      if (fs.existsSync(platformsPath)) {
        config.platforms = readJsonFile(platformsPath);
      }
    }

    return config;
  } catch (error: any) {
    throw new Error(`Failed to parse YAML frontmatter in OME.md: ${error.message}`);
  }
}

/**
 * 从 JSON 文件加载配置
 */
function loadJsonConfig(filePath: string): Record<string, any> {
  return readJsonFile(filePath);
}

/**
 * 加载平台配置
 * 优先级：OME.md 中的 platforms > .ome/platforms.json
 */
export function loadPlatformsConfig(root: string = process.cwd()): Record<string, any> {
  // 首先尝试从 OME.md 加载
  const omemdPath = path.join(root, 'OME.md');
  if (fs.existsSync(omemdPath)) {
    try {
      const config = loadMarkdownConfig(omemdPath, root);
      if (config.platforms) {
        return config.platforms;
      }
    } catch (error) {
      // 如果 OME.md 解析失败，继续尝试 platforms.json
    }
  }

  // 回退到 platforms.json
  const platformsPath = enginePath(root, 'platforms.json');
  if (fs.existsSync(platformsPath)) {
    return readJsonFile(platformsPath);
  }

  return { enabled: [], platforms: {} };
}

/**
 * 检查是否使用 OME.md 配置
 */
export function isUsingMarkdownConfig(root: string = process.cwd()): boolean {
  return fs.existsSync(path.join(root, 'OME.md'));
}

/**
 * 检查是否使用 JSON 配置
 */
export function isUsingJsonConfig(root: string = process.cwd()): boolean {
  return fs.existsSync(enginePath(root, 'config.json'));
}
