const {
  listAdoptedLearningRecords,
  listGeneratedSkillArtifacts
} = require('./memory-store');

type MemoryRecord = Record<string, any>;
type WorkflowGuidanceReport = {
  workflow: string;
  adoptedLearnings: MemoryRecord[];
  generatedSkills: MemoryRecord[];
  executionDirectives: MemoryRecord[];
};
type GuidanceContext = {
  input?: string;
};
type ScoredRecord = {
  record: MemoryRecord;
  score: number;
};

const MIN_CONTEXTUAL_RELEVANCE = 2;
const MIN_TOKEN_LENGTH = 3;

function tokenize(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9_.\/\\:-]+/i)
    .map(token => token.trim())
    .filter(token => token.length >= MIN_TOKEN_LENGTH);

  return Array.from(new Set(tokens));
}

function flattenSearchableValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(flattenSearchableValues);
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(flattenSearchableValues);
  }
  return [];
}

function recordSearchText(record: MemoryRecord): string {
  const values = [
    record.title,
    record.summary,
    record.workflow,
    record.phase,
    record.slug,
    record.patternId,
    record.rootCause,
    record.fixSummary,
    record.reusableLearning,
    record._content,
    record.appliesTo,
    record.evidence,
    record.executionDirectives,
    record.filesTouched,
    record.errors,
    record.metadata
  ];

  return values.flatMap(flattenSearchableValues).join('\n').toLowerCase();
}

function scoreRecord(record: MemoryRecord, context: GuidanceContext = {}): number {
  const tokens = tokenize(context.input || '');
  if (tokens.length === 0) return 0;

  const searchText = recordSearchText(record);
  let score = 0;

  for (const token of tokens) {
    if (!searchText.includes(token)) continue;

    if (token.includes('/') || token.includes('\\') || token.includes('.')) {
      score += 4;
    } else if (token.includes(':')) {
      score += 3;
    } else {
      score += 1;
    }
  }

  return score;
}

function sortByEvidenceDescending(records: MemoryRecord[]): MemoryRecord[] {
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

function sortByRelevance(records: MemoryRecord[], context: GuidanceContext = {}): MemoryRecord[] {
  const scoredRecords: ScoredRecord[] = records.map(record => ({
    record,
    score: scoreRecord(record, context)
  }));

  return scoredRecords
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) return scoreDelta;

      const evidenceDelta =
        Number(right.record.evidenceCount || 0) - Number(left.record.evidenceCount || 0);
      if (evidenceDelta !== 0) return evidenceDelta;

      return String(left.record.title || left.record.slug || '').localeCompare(
        String(right.record.title || right.record.slug || '')
      );
    })
    .map(item => item.record);
}

function filterContextualMatches(records: MemoryRecord[], context: GuidanceContext = {}): MemoryRecord[] {
  if (tokenize(context.input || '').length === 0) return records;

  const matches = records.filter(record => scoreRecord(record, context) >= MIN_CONTEXTUAL_RELEVANCE);
  return matches.length > 0 ? matches : records;
}

function filterAdoptedLearnings(records: MemoryRecord[], workflow: string, context: GuidanceContext = {}): MemoryRecord[] {
  const workflowMatches = records.filter((record: MemoryRecord) => {
    if (!workflow) {
      return true;
    }

    const appliesTo = Array.isArray(record.appliesTo) ? record.appliesTo : [];
    return (
      appliesTo.length === 0 ||
      appliesTo.includes(workflow) ||
      record.workflow === workflow
    );
  });

  return sortByRelevance(filterContextualMatches(workflowMatches, context), context);
}

function buildExecutionDirectives(skills: MemoryRecord[]): MemoryRecord[] {
  return skills.flatMap(record =>
    Array.isArray(record.executionDirectives)
      ? record.executionDirectives.map((directive: string) => ({
          directive,
          slug: record.slug
        }))
      : []
  );
}

function collectWorkflowGuidance(projectRoot: string, workflow: string, context: GuidanceContext = {}): WorkflowGuidanceReport {
  const adoptedLearnings = filterAdoptedLearnings(
    listAdoptedLearningRecords(projectRoot),
    workflow,
    context
  );
  const generatedSkills = sortByRelevance(
    filterContextualMatches(listGeneratedSkillArtifacts(projectRoot), context),
    context
  );
  const executionDirectives = buildExecutionDirectives(generatedSkills);

  return {
    workflow,
    adoptedLearnings,
    generatedSkills,
    executionDirectives
  };
}

function renderWorkflowGuidanceText(report: WorkflowGuidanceReport, inputText = ''): string {
  const lines = [];

  lines.push(`Workflow: ${report.workflow}`);

  if (inputText) {
    lines.push(`Input: ${inputText}`);
  }

  lines.push('');
  lines.push('## Adopted Learnings');

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
  lines.push('## Generated Skills');

  if (report.generatedSkills.length === 0) {
    lines.push('- None');
  } else {
    for (const record of report.generatedSkills) {
      lines.push(`- ${record.slug}`);
      if (record.summary) {
        lines.push(`  Summary: ${record.summary}`);
      }
      lines.push(`  Evidence: ${record.evidenceCount || 0}`);
    }
  }

  lines.push('');
  lines.push('## Execution Directives');
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
  sortByEvidenceDescending,
  scoreRecord
};

export {};
