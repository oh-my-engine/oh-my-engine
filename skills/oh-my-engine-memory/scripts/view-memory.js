#!/usr/bin/env node

const path = require('node:path');

const {
  listExecutionRecords,
  listPreferenceRecords,
  listLearningCandidateRecords,
  listSkillCandidateRecords,
  listAdoptedLearningRecords,
  listGeneratedSkillArtifacts
} = require('../../oh-my-engine/lib/memory-store');

function parseArgs(argv) {
  const options = {
    projectRoot: process.cwd(),
    type: 'executions',
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

function summarizeByWorkflow(records) {
  return records.reduce((summary, record) => {
    summary[record.workflow] = (summary[record.workflow] || 0) + 1;
    return summary;
  }, {});
}

function buildExecutionReport(projectRoot, workflow) {
  const records = listExecutionRecords(projectRoot, { workflow });

  return {
    summary: {
      totalRecords: records.length,
      byWorkflow: summarizeByWorkflow(records)
    },
    records
  };
}

function summarizeByScope(records) {
  return records.reduce((summary, record) => {
    summary[record.scope] = (summary[record.scope] || 0) + 1;
    return summary;
  }, {});
}

function buildPreferenceReport(projectRoot, scope) {
  const records = listPreferenceRecords(projectRoot, { scope });

  return {
    summary: {
      totalRecords: records.length,
      byScope: summarizeByScope(records)
    },
    records
  };
}

function buildLearningReport(projectRoot) {
  const records = listLearningCandidateRecords(projectRoot);
  const byStatus = records.reduce((summary, record) => {
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

function buildAdoptedLearningReport(projectRoot) {
  const records = listAdoptedLearningRecords(projectRoot);

  return {
    summary: {
      totalRecords: records.length
    },
    records
  };
}

function buildSkillCandidateReport(projectRoot) {
  const records = listSkillCandidateRecords(projectRoot);
  const byStatus = records.reduce((summary, record) => {
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

function buildGeneratedSkillReport(projectRoot) {
  const records = listGeneratedSkillArtifacts(projectRoot);

  return {
    summary: {
      totalRecords: records.length
    },
    records
  };
}

function renderExecutionTextReport(report) {
  const lines = [];

  lines.push('Execution memory');
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

function renderPreferenceTextReport(report) {
  const lines = [];

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

function renderLearningTextReport(report) {
  const lines = [];

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

function renderSkillCandidateTextReport(report) {
  const lines = [];

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

function renderAdoptedLearningTextReport(report) {
  const lines = [];

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

function renderGeneratedSkillTextReport(report) {
  const lines = [];

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

function main() {
  const options = parseArgs(process.argv.slice(2));
  let report;

  if (options.type === 'executions') {
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
      options.type === 'executions'
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

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
