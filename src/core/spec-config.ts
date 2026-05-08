const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

interface SpecConfig {
  specRoot: string;
  changesDir: string;
  specsDir: string;
  archiveDir: string;
  memoryDir: string;
  defaultFlow: string;
  manualFlow: string;
  contextDirName: string;
  assetsDirName: string;
  verifyCommands: string[];
}

const DEFAULT_SPEC_CONFIG: SpecConfig = {
  specRoot: '.ome/spec',
  changesDir: '.ome/spec/changes',
  specsDir: '.ome/spec/specs',
  archiveDir: '.ome/spec/archive',
  memoryDir: '.ome/memory/specs',
  defaultFlow: 'import-decompose-plan-apply-verify-archive',
  manualFlow: 'propose-plan-apply-verify-archive',
  contextDirName: 'context',
  assetsDirName: 'assets',
  verifyCommands: []
};

/**
 * Load spec configuration from OME.md or .ome/config.json
 * Priority: OME.md > .ome/config.json > defaults
 */
export function loadSpecConfig(projectRoot: string): SpecConfig {
  // Try OME.md first
  const omeMdPath = path.join(projectRoot, 'OME.md');
  if (fs.existsSync(omeMdPath)) {
    try {
      const content = fs.readFileSync(omeMdPath, 'utf8');
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const frontmatter = yaml.load(match[1]);
        const specWorkflow = frontmatter?.workflows?.['spec-driven'];
        if (specWorkflow?.options) {
          return mergeConfig(DEFAULT_SPEC_CONFIG, specWorkflow.options);
        }
      }
    } catch (error) {
      // Fall through to config.json
    }
  }

  // Try .ome/config.json
  const configPath = path.join(projectRoot, '.ome', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const specOptions = config?.workflows?.spec?.options;
      if (specOptions) {
        return mergeConfig(DEFAULT_SPEC_CONFIG, specOptions);
      }
    } catch (error) {
      // Fall through to defaults
    }
  }

  // Return defaults
  return { ...DEFAULT_SPEC_CONFIG };
}

function mergeConfig(defaults: SpecConfig, overrides: Partial<SpecConfig>): SpecConfig {
  return {
    specRoot: overrides.specRoot || defaults.specRoot,
    changesDir: overrides.changesDir || defaults.changesDir,
    specsDir: overrides.specsDir || defaults.specsDir,
    archiveDir: overrides.archiveDir || defaults.archiveDir,
    memoryDir: overrides.memoryDir || defaults.memoryDir,
    defaultFlow: overrides.defaultFlow || defaults.defaultFlow,
    manualFlow: overrides.manualFlow || defaults.manualFlow,
    contextDirName: overrides.contextDirName || defaults.contextDirName,
    assetsDirName: overrides.assetsDirName || defaults.assetsDirName,
    verifyCommands: overrides.verifyCommands || defaults.verifyCommands
  };
}

/**
 * Get spec paths helper
 */
export function getSpecPaths(projectRoot: string) {
  const config = loadSpecConfig(projectRoot);

  return {
    config,
    root: path.join(projectRoot, config.specRoot),
    projectMd: () => path.join(projectRoot, config.specRoot, 'project.md'),
    changeDir: (changeSlug: string) => path.join(projectRoot, config.changesDir, changeSlug),
    contextDir: (changeSlug: string) => path.join(projectRoot, config.changesDir, changeSlug, config.contextDirName),
    assetsDir: (changeSlug: string) => path.join(projectRoot, config.changesDir, changeSlug, config.contextDirName, config.assetsDirName),
    changeSpecDir: (changeSlug: string, capability: string) => path.join(projectRoot, config.changesDir, changeSlug, 'specs', capability),
    longTermSpecDir: (capability: string) => path.join(projectRoot, config.specsDir, capability),
    longTermSpecFile: (capability: string) => path.join(projectRoot, config.specsDir, capability, 'spec.md'),
    archiveDir: (changeSlug: string) => path.join(projectRoot, config.archiveDir, changeSlug),
    memoryFile: (changeSlug: string) => path.join(projectRoot, config.memoryDir, `${changeSlug}.json`)
  };
}
