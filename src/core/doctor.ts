const fs = require('node:fs');
const path = require('node:path');

const { directoryExists, fileExists, projectPath } = require('./project');
const { validateRules } = require('./rules');
const { schemaPath, validateJsonFile } = require('./schema/validator');

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
  const checks: DoctorLine[] = [
    { name: 'Node', value: process.version },
    { name: 'Project config', value: fileExists(projectPath('.oh-my-engine', 'config.json')) ? 'found' : 'missing' },
    { name: 'Rules directory', value: directoryExists(projectPath('.oh-my-engine', 'rules')) ? 'found' : 'missing' },
    { name: 'Memory directory', value: directoryExists(projectPath('.oh-my-engine', 'memory')) ? 'found' : 'missing' },
    { name: 'OpenSpec workspace', value: directoryExists(projectPath('openspec')) ? 'found' : 'missing' }
  ];

  checks.push({ name: 'Config schema', value: validateSchemaFile('Config schema', path.join(projectRoot, '.oh-my-engine', 'config.json'), 'config.schema.json', issues) });
  checks.push({ name: 'Platforms schema', value: validateSchemaFile('Platforms schema', path.join(projectRoot, '.oh-my-engine', 'platforms.json'), 'platforms.schema.json', issues) });

  const specStateDirectory = path.join(projectRoot, '.oh-my-engine', 'memory', 'specs');
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
