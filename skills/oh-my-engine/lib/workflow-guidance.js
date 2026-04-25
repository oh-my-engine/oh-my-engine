const {
  listAdoptedLearningRecords,
  listGeneratedSkillArtifacts
} = require('./memory-store');

function sortByEvidenceDescending(records) {
  return [...records].sort((left, right) => {
    const evidenceDelta =
      Number(right.evidenceCount || 0) - Number(left.evidenceCount || 0);

    if (evidenceDelta !== 0) {
      return evidenceDelta;
    }

    return String(left.title || left.slug || '').localeCompare(
      String(right.title || right.slug || '')
    );
  });
}

function filterAdoptedLearnings(records, workflow) {
  return sortByEvidenceDescending(
    records.filter(record => {
      if (!workflow) {
        return true;
      }

      const appliesTo = Array.isArray(record.appliesTo) ? record.appliesTo : [];
      return (
        appliesTo.length === 0 ||
        appliesTo.includes(workflow) ||
        record.workflow === workflow
      );
    })
  );
}

function buildExecutionDirectives(skills) {
  return sortByEvidenceDescending(skills).flatMap(record =>
    Array.isArray(record.executionDirectives)
      ? record.executionDirectives.map(directive => ({
          directive,
          slug: record.slug
        }))
      : []
  );
}

function collectWorkflowGuidance(projectRoot, workflow) {
  const adoptedLearnings = filterAdoptedLearnings(
    listAdoptedLearningRecords(projectRoot),
    workflow
  );
  const generatedSkills = listGeneratedSkillArtifacts(projectRoot);
  const executionDirectives = buildExecutionDirectives(generatedSkills);

  return {
    workflow,
    adoptedLearnings,
    generatedSkills,
    executionDirectives
  };
}

function renderWorkflowGuidanceText(report, inputText = '') {
  const lines = [];

  lines.push(`Workflow: ${report.workflow}`);

  if (inputText) {
    lines.push(`Input: ${inputText}`);
  }

  lines.push('');
  lines.push('Applicable adopted learnings:');

  if (report.adoptedLearnings.length === 0) {
    lines.push('- None');
  } else {
    for (const record of report.adoptedLearnings) {
      lines.push(`- ${record.title}`);
      if (record.summary) {
        lines.push(`  Summary: ${record.summary}`);
      }
      if (record.workflow || record.phase) {
        lines.push(`  Source: ${record.workflow || 'unknown'}/${record.phase || 'unknown'}`);
      }
      lines.push(`  Evidence: ${record.evidenceCount || 0}`);
    }
  }

  lines.push('');
  lines.push('Generated skills:');

  if (report.generatedSkills.length === 0) {
    lines.push('- None');
  } else {
    for (const record of sortByEvidenceDescending(report.generatedSkills)) {
      lines.push(`- ${record.slug}`);
      if (record.summary) {
        lines.push(`  Summary: ${record.summary}`);
      }
      lines.push(`  Evidence: ${record.evidenceCount || 0}`);
    }
  }

  lines.push('');
  lines.push('Execution directives from adopted skills:');

  if (report.executionDirectives.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.executionDirectives) {
      lines.push(`- [${item.slug}] ${item.directive}`);
    }
  }

  lines.push('');

  return `${lines.join('\n')}\n`;
}

module.exports = {
  collectWorkflowGuidance,
  renderWorkflowGuidanceText,
  sortByEvidenceDescending
};
