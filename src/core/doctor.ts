const fs = require('node:fs');
const path = require('node:path');

const { directoryExists, fileExists, projectPath } = require('./project');
const { ENGINE_DIR, enginePath } = require('./paths');
const { validateRules } = require('./rules');
const { schemaPath, validateJsonFile } = require('./schema/validator');
const { isUsingMarkdownConfig, isUsingJsonConfig } = require('./config-loader');
const { validateMarkdownConfig } = require('./config-migrator');
const { getSpecPaths } = require('./spec-config');

export interface DoctorLine {
  name: string;
  value: string;
}

export interface DoctorReport {
  checks: DoctorLine[];
  issues: string[];
}

function validateSchemaFile(label: string, filePath: string, schemaFile: string, issues: string[]): string {
  if (!fs.existsSync(filePath)) return 'missing';
  const result = validateJsonFile(filePath, schemaPath(schemaFile));
  if (!result.ok) {
    for (const issue of result.issues) issues.push(`${label}: ${issue.path} ${issue.message}`);
    return 'invalid';
  }
  return 'valid';
}

export function runDoctorReport(projectRoot: string = process.cwd()): DoctorReport {
  const issues: string[] = [];
  const usingMarkdown = isUsingMarkdownConfig(projectRoot);
  const usingJson = isUsingJsonConfig(projectRoot);
  const specPaths = getSpecPaths(projectRoot);

  const checks: DoctorLine[] = [
    { name: 'Node', value: process.version },
    { name: 'Config format', value: usingMarkdown ? 'OME.md' : (usingJson ? 'config.json (legacy)' : 'missing') },
    { name: 'Rules directory', value: directoryExists(enginePath(projectRoot, 'rules')) ? 'found' : 'missing' },
    { name: 'Memory directory', value: directoryExists(enginePath(projectRoot, 'memory')) ? 'found' : 'missing' },
    { name: 'Spec workspace', value: directoryExists(specPaths.root) ? 'found' : 'missing' }
  ];

  checks.push({ name: 'Engine directory', value: ENGINE_DIR });

  // 验证配置文件
  if (usingMarkdown) {
    const validation = validateMarkdownConfig(projectRoot);
    checks.push({ name: 'OME.md validation', value: validation.valid ? 'valid' : 'invalid' });
    for (const error of validation.errors) issues.push(`OME.md: ${error}`);
    for (const warning of validation.warnings) issues.push(`OME.md warning: ${warning}`);
  } else if (usingJson) {
    checks.push({ name: 'Config schema', value: validateSchemaFile('Config schema', enginePath(projectRoot, 'config.json'), 'config.schema.json', issues) });
    checks.push({ name: 'Platforms schema', value: validateSchemaFile('Platforms schema', enginePath(projectRoot, 'platforms.json'), 'platforms.schema.json', issues) });
    issues.push('Consider migrating to OME.md format using: ome config migrate');
  } else {
    issues.push('No configuration file found. Run: ome init');
  }

  const specStateDirectory = enginePath(projectRoot, 'memory', 'specs');
  if (fs.existsSync(specStateDirectory)) {
    for (const fileName of fs.readdirSync(specStateDirectory).filter((name: string) => name.endsWith('.json'))) {
      validateSchemaFile(`Spec state ${fileName}`, path.join(specStateDirectory, fileName), 'spec-state.schema.json', issues);
    }
  }

  const rules = validateRules();
  checks.push({ name: 'Rules', value: `${rules.ok ? 'valid' : 'invalid'} (${rules.rules.length})` });
  for (const issue of rules.issues) issues.push(`Rules: ${issue.message}`);

  return { checks, issues };
}

export function renderDoctorReport(report: DoctorReport): string {
  const lines = ['Oh My Engine Doctor'];
  for (const check of report.checks) lines.push(`${check.name}: ${check.value}`);
  for (const issue of report.issues) lines.push(`- ${issue}`);
  return `${lines.join('\n')}\n`;
}
