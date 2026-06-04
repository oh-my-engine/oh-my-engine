#!/usr/bin/env node

const path = require('node:path');
const { getErrorMessage } = require('../../../core/errors');

const {
  listExecutionRecords,
  listPreferenceRecords,
  listLearningCandidateRecords,
  listSkillCandidateRecords,
  listAdoptedLearningRecords,
  listGeneratedSkillArtifacts
} = require('../../oh-my-engine/lib/memory-store');
const {
  collectWorkflowGuidance
} = require('../../oh-my-engine/lib/workflow-guidance');

type MemoryRecord = Record<string, any>;
type MemoryReport = {
  summary: MemoryRecord;
  records: MemoryRecord[];
};

function parseArgs(argv: string[]): Record<string, any> {
  const options: Record<string, any> = {
    projectRoot: process.cwd(),
    type: 'recall',
    format: 'text'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--project-root') {
      options.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--type') {
      options.type = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--workflow') {
      options.workflow = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--scope') {
      options.scope = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--format') {
      options.format = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function summarizeByWorkflow(records: MemoryRecord[]): Record<string, number> {
  return records.reduce((summary: Record<string, number>, record: MemoryRecord) => {
    summary[record.workflow] = (summary[record.workflow] || 0) + 1;
    return summary;
  }, {});
}

function buildExecutionReport(projectRoot: string, workflow: string): MemoryReport {
  const records = listExecutionRecords(projectRoot, { workflow });

  return {
    summary: {
      totalRecords: records.length,
      byWorkflow: summarizeByWorkflow(records)
    },
    records
  };
}

function summarizeByScope(records: MemoryRecord[]): Record<string, number> {
  return records.reduce((summary: Record<string, number>, record: MemoryRecord) => {
    summary[record.scope] = (summary[record.scope] || 0) + 1;
    return summary;
  }, {});
}

function buildPreferenceReport(projectRoot: string, scope: string): MemoryReport {
  const records = listPreferenceRecords(projectRoot, { scope });

  return {
    summary: {
      totalRecords: records.length,
      byScope: summarizeByScope(records)
    },
    records
  };
}

function buildLearningReport(projectRoot: string): MemoryReport {
  const records = listLearningCandidateRecords(projectRoot);
  const byStatus = records.reduce((summary: Record<string, number>, record: MemoryRecord) => {
    const status = record.status || 'unknown';
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, {});

  return {
    summary: {
      totalRecords: records.length,
      byStatus
    },
    records
  };
}

function buildAdoptedLearningReport(projectRoot: string): MemoryReport {
  const records = listAdoptedLearningRecords(projectRoot);

  return {
    summary: {
      totalRecords: records.length
    },
    records
  };
}

function buildSkillCandidateReport(projectRoot: string): MemoryReport {
  const records = listSkillCandidateRecords(projectRoot);
  const byStatus = records.reduce((summary: Record<string, number>, record: MemoryRecord) => {
    const status = record.status || 'unknown';
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, {});

  return {
    summary: {
      totalRecords: records.length,
      byStatus
    },
    records
  };
}

function buildGeneratedSkillReport(projectRoot: string): MemoryReport {
  const records = listGeneratedSkillArtifacts(projectRoot);

  return {
    summary: {
      totalRecords: records.length
    },
    records
  };
}

function buildRecallReport(projectRoot: string, workflow: string): MemoryReport {
  const preferences = listPreferenceRecords(projectRoot);
  const guidance = collectWorkflowGuidance(projectRoot, workflow || '');
  const records = [
    ...preferences.map((record: MemoryRecord) => ({
      ...record,
      recallType: 'preference'
    })),
    ...guidance.adoptedLearnings.map((record: MemoryRecord) => ({
      ...record,
      recallType: 'adopted-learning'
    })),
    ...guidance.generatedSkills.map((record: MemoryRecord) => ({
      ...record,
      recallType: 'generated-skill'
    })),
    ...guidance.executionDirectives.map((record: MemoryRecord) => ({
      ...record,
      recallType: 'execution-directive'
    }))
  ];

  return {
    summary: {
      totalRecords: records.length,
      preferences: preferences.length,
      adoptedLearnings: guidance.adoptedLearnings.length,
      generatedSkills: guidance.generatedSkills.length,
      executionDirectives: guidance.executionDirectives.length,
      workflow: workflow || ''
    },
    records
  };
}

function renderExecutionTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Execution history');
  lines.push(`Total records: ${report.summary.totalRecords}`);

  for (const [workflow, count] of Object.entries(report.summary.byWorkflow)) {
    lines.push(`Workflow ${workflow}: ${count}`);
  }

  if (report.records.length > 0) {
    lines.push('');
    lines.push('Recent records:');
  }

  for (const record of report.records) {
    lines.push(
      `- ${record.timestamp} ${record.workflow}/${record.phase} ${record.changeId} ` +
        `[${record.captureLevel}] ${record.whyStored}`
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderRecallTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Engine memory recall');
  lines.push(`Total recall items: ${report.summary.totalRecords}`);
  lines.push(`Preferences: ${report.summary.preferences}`);
  lines.push(`Adopted learnings: ${report.summary.adoptedLearnings}`);
  lines.push(`Generated skills: ${report.summary.generatedSkills}`);
  lines.push(`Execution directives: ${report.summary.executionDirectives}`);

  const preferences = report.records.filter(record => record.recallType === 'preference');
  const learnings = report.records.filter(record => record.recallType === 'adopted-learning');
  const skills = report.records.filter(record => record.recallType === 'generated-skill');
  const directives = report.records.filter(record => record.recallType === 'execution-directive');

  if (preferences.length > 0) {
    lines.push('');
    lines.push('Remembered preferences:');
    for (const record of preferences) {
      lines.push(`- ${record.scope || 'user'}: ${record.statement} [evidence=${record.evidenceCount || 0}]`);
    }
  }

  if (learnings.length > 0) {
    lines.push('');
    lines.push('Adopted learnings:');
    for (const record of learnings) {
      lines.push(`- ${record.slug || record.title} [evidence=${record.evidenceCount || 0}]`);
    }
  }

  if (skills.length > 0) {
    lines.push('');
    lines.push('Generated skills:');
    for (const record of skills) {
      lines.push(`- ${record.slug} [directives=${Array.isArray(record.executionDirectives) ? record.executionDirectives.length : 0}]`);
    }
  }

  if (directives.length > 0) {
    lines.push('');
    lines.push('Execution directives:');
    for (const record of directives) {
      lines.push(`- [${record.slug}] ${record.directive}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

function renderPreferenceTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Preference memory');
  lines.push(`Total records: ${report.summary.totalRecords}`);

  for (const [scope, count] of Object.entries(report.summary.byScope)) {
    lines.push(`Scope ${scope}: ${count}`);
  }

  if (report.records.length > 0) {
    lines.push('');
    lines.push('Remembered preferences:');
  }

  for (const record of report.records) {
    lines.push(
      `- ${record.scope}: ${record.statement} ` +
        `[evidence=${record.evidenceCount}] ${record.whyStored}`
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderLearningTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Learning candidates');
  lines.push(`Total records: ${report.summary.totalRecords}`);

  if (report.records.length > 0) {
    lines.push('');
    lines.push('Candidates:');
  }

  for (const record of report.records) {
    lines.push(
      `- ${record.slug} [status=${record.status || 'unknown'}] ` +
        `[verification=${record.verification && record.verification.state ? record.verification.state : 'unknown'}] ` +
        `[evidence=${record.evidenceCount}]`
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderSkillCandidateTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Skill candidates');
  lines.push(`Total records: ${report.summary.totalRecords}`);

  if (report.records.length > 0) {
    lines.push('');
    lines.push('Candidates:');
  }

  for (const record of report.records) {
    lines.push(
      `- ${record.patternId} [status=${record.status}] [verification=${record.verification && record.verification.state ? record.verification.state : 'unknown'}]`
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderAdoptedLearningTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Adopted learnings');
  lines.push(`Total records: ${report.summary.totalRecords}`);

  if (report.records.length > 0) {
    lines.push('');
    lines.push('Records:');
  }

  for (const record of report.records) {
    lines.push(
      `- ${record.slug} [status=${record.status || 'unknown'}] [evidence=${record.evidenceCount || 0}]`
    );
  }

  return `${lines.join('\n')}\n`;
}

function renderGeneratedSkillTextReport(report: MemoryReport): string {
  const lines: string[] = [];

  lines.push('Generated skills');
  lines.push(`Total records: ${report.summary.totalRecords}`);

  if (report.records.length > 0) {
    lines.push('');
    lines.push('Records:');
  }

  for (const record of report.records) {
    lines.push(
      `- ${record.slug} [status=${record.status || 'unknown'}] ` +
        `[directives=${Array.isArray(record.executionDirectives) ? record.executionDirectives.length : 0}]`
    );
  }

  return `${lines.join('\n')}\n`;
}

export function runViewMemoryCommand(argv: string[] = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  let report: MemoryReport;

  if (options.type === 'recall' || options.type === 'active') {
    report = buildRecallReport(path.resolve(options.projectRoot), options.workflow);
  } else if (options.type === 'executions' || options.type === 'history') {
    report = buildExecutionReport(
      path.resolve(options.projectRoot),
      options.workflow
    );
  } else if (options.type === 'preferences') {
    report = buildPreferenceReport(
      path.resolve(options.projectRoot),
      options.scope
    );
  } else if (options.type === 'learnings') {
    report = buildLearningReport(path.resolve(options.projectRoot));
  } else if (options.type === 'adopted-learnings') {
    report = buildAdoptedLearningReport(path.resolve(options.projectRoot));
  } else if (options.type === 'skill-candidates') {
    report = buildSkillCandidateReport(path.resolve(options.projectRoot));
  } else if (options.type === 'generated-skills') {
    report = buildGeneratedSkillReport(path.resolve(options.projectRoot));
  } else {
    throw new Error(`Unsupported memory type for v1 viewer: ${options.type}`);
  }

  if (options.format === 'json') {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (options.format === 'text') {
    process.stdout.write(
      options.type === 'recall' || options.type === 'active'
        ? renderRecallTextReport(report)
        : options.type === 'executions' || options.type === 'history'
        ? renderExecutionTextReport(report)
        : options.type === 'preferences'
          ? renderPreferenceTextReport(report)
          : options.type === 'learnings'
            ? renderLearningTextReport(report)
            : options.type === 'adopted-learnings'
              ? renderAdoptedLearningTextReport(report)
              : options.type === 'skill-candidates'
                ? renderSkillCandidateTextReport(report)
                : renderGeneratedSkillTextReport(report)
    );
    return;
  }

  throw new Error(`Unsupported output format: ${options.format}`);
}

if (require.main === module) {
  try {
    runViewMemoryCommand();
  } catch (error) {
    process.stderr.write(`${getErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}

export {};
