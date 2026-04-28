const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const { mergeMemoryConfig, decideCapture } = require('./memory-policy');
const { getErrorMessage } = require('../../../core/errors');
const { enginePath } = require('../../../core/paths');

type Dirent = import('node:fs').Dirent;
type MemoryRecord = Record<string, any>;
type MemoryMutator = MemoryRecord | ((record: MemoryRecord) => MemoryRecord);

function loadProjectConfig(projectRoot: string): MemoryRecord {
  const configPath = enginePath(projectRoot, 'config.json');

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse project config at ${configPath}: ${getErrorMessage(error)}`);
  }
}

function loadMemoryConfig(projectRoot: string): MemoryRecord {
  const config = loadProjectConfig(projectRoot);
  return mergeMemoryConfig(config.memory || {});
}

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function slugifyForFile(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '')
    .slice(0, 50); // Limit length for filename
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(item => typeof item === 'string');
}

// File path functions for Markdown format
function executionFilePath(projectRoot: string, workflow: string, timestamp: string, summary: string, id?: string): string {
  const day = timestamp.slice(0, 10);
  const slug = slugifyForFile(summary);
  // Include timestamp milliseconds or ID to ensure uniqueness
  const uniqueSuffix = id ? id.slice(-8) : timestamp.replace(/[-:T.Z]/g, '').slice(8, 17);
  return enginePath(projectRoot, 'memory', 'executions', workflow, `${day}-${slug}-${uniqueSuffix}.md`);
}

function preferenceFilePath(projectRoot: string, scope: string, statement: string): string {
  const slug = slugifyForFile(statement);
  return enginePath(projectRoot, 'memory', 'preferences', `${scope}-${slug}.md`);
}

function learningCandidateFilePath(projectRoot: string, slug: string): string {
  return enginePath(projectRoot, 'memory', 'learnings', 'candidates', `${slug}.md`);
}

function adoptedLearningFilePath(projectRoot: string, slug: string): string {
  return enginePath(projectRoot, 'memory', 'learnings', 'adopted', `${slug}.md`);
}

function skillCandidateFilePath(projectRoot: string, slug: string): string {
  return enginePath(projectRoot, 'memory', 'skill-candidates', `${slug}.md`);
}

function generatedSkillFilePath(projectRoot: string, slug: string): string {
  return enginePath(projectRoot, 'generated-skills', `${slug}.md`);
}

// Markdown generation functions
function buildExecutionMarkdown(record: MemoryRecord): string {
  const frontmatter: MemoryRecord = {
    id: record.id,
    type: 'execution',
    workflow: record.workflow,
    phase: record.phase,
    timestamp: record.timestamp,
    status: record.status,
    duration: record.durationMs,
    captureLevel: record.captureLevel,
    source: record.source || undefined,
    whyStored: record.whyStored || undefined,
    errors: record.errors || [],
    filesTouched: record.filesTouched || [],
    testsRun: record.testsRun || [],
    metadata: record.metadata || undefined,
    changeId: record.changeId || undefined,
    changeSlug: record.changeSlug || undefined,
    capability: record.capability || undefined
  };

  // Remove undefined values
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  let content = `# ${record.summary || 'Execution Record'}\n\n`;

  content += `## Details\n\n`;
  content += `- **Workflow**: ${record.workflow}\n`;
  if (record.phase) content += `- **Phase**: ${record.phase}\n`;
  content += `- **Status**: ${record.status}\n`;
  content += `- **Duration**: ${record.durationMs}ms\n`;
  content += `- **Timestamp**: ${record.timestamp}\n\n`;

  if (record.whyStored) {
    content += `## Why Stored\n\n${record.whyStored}\n\n`;
  }

  if (record.errors && record.errors.length > 0) {
    content += `## Errors\n\n`;
    record.errors.forEach((error: string) => {
      content += `- ${error}\n`;
    });
    content += `\n`;
  }

  if (record.filesTouched && record.filesTouched.length > 0) {
    content += `## Files Touched\n\n`;
    record.filesTouched.forEach((file: string) => {
      content += `- ${file}\n`;
    });
    content += `\n`;
  }

  if (record.testsRun && record.testsRun.length > 0) {
    content += `## Tests Run\n\n`;
    record.testsRun.forEach((test: string) => {
      content += `- ${test}\n`;
    });
    content += `\n`;
  }

  if (record.metadata && Object.keys(record.metadata).length > 0) {
    content += `## Metadata\n\n`;
    content += '```json\n';
    content += JSON.stringify(record.metadata, null, 2);
    content += '\n```\n';
  }

  // Remove undefined values to avoid YAML serialization errors
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  return matter.stringify(content, frontmatter);
}

function buildPreferenceMarkdown(record: MemoryRecord): string {
  const frontmatter: MemoryRecord = {
    id: record.id,
    type: 'preference',
    scope: record.scope,
    statement: record.statement,
    source: record.source,
    explicit: record.explicit,
    evidenceCount: record.evidenceCount,
    lastConfirmedAt: record.lastConfirmedAt,
    stability: record.stability,
    status: record.status,
    whyStored: record.whyStored || undefined
  };

  // Remove undefined values to avoid YAML serialization errors
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  let content = `# ${record.statement}\n\n`;

  content += `## Details\n\n`;
  content += `- **Scope**: ${record.scope}\n`;
  content += `- **Source**: ${record.source}\n`;
  content += `- **Evidence Count**: ${record.evidenceCount}\n`;
  content += `- **Stability**: ${record.stability}\n`;
  content += `- **Status**: ${record.status}\n\n`;

  if (record.whyStored) {
    content += `## Why Stored\n\n${record.whyStored}\n\n`;
  }

  return matter.stringify(content, frontmatter);
}

function buildLearningCandidateMarkdown(record: MemoryRecord): string {
  const frontmatter: MemoryRecord = {
    id: record.id,
    type: 'learning',
    slug: record.slug,
    title: record.title,
    category: record.category,
    workflow: record.workflow,
    phase: record.phase,
    status: record.status,
    evidenceCount: record.evidenceCount,
    evidence: record.evidence || [],
    appliesTo: record.appliesTo || [],
    reusability: record.reusability,
    verification: record.verification
  };

  // Remove undefined values to avoid YAML serialization errors
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  let content = `# ${record.title}\n\n`;

  if (record.summary) {
    content += `## Summary\n\n${record.summary}\n\n`;
  }

  if (record.appliesTo && record.appliesTo.length > 0) {
    content += `## Applies To\n\n`;
    record.appliesTo.forEach((item: string) => {
      content += `- ${item}\n`;
    });
    content += `\n`;
  }

  if (record.evidence && record.evidence.length > 0) {
    content += `## Evidence\n\n`;
    record.evidence.forEach((ev: any) => {
      content += `### ${ev.timestamp || 'Evidence'}\n\n`;
      content += `- **Change ID**: ${ev.changeId || 'N/A'}\n`;
      content += `- **Workflow**: ${ev.workflow || 'N/A'}\n`;
      content += `- **Phase**: ${ev.phase || 'N/A'}\n`;
      content += `- **Status**: ${ev.status || 'N/A'}\n\n`;
    });
  }

  if (record.whyStored) {
    content += `## Why Stored\n\n${record.whyStored}\n\n`;
  }

  // Remove undefined values to avoid YAML serialization errors
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  return matter.stringify(content, frontmatter);
}

function buildSkillCandidateMarkdown(record: MemoryRecord): string {
  const frontmatter: MemoryRecord = {
    id: record.id,
    type: 'skill',
    slug: record.slug,
    title: record.title,
    patternCategory: record.patternCategory,
    patternId: record.patternId,
    status: record.status,
    evidenceCount: record.evidenceCount,
    evidence: record.evidence || [],
    verification: record.verification
  };

  // Remove undefined values to avoid YAML serialization errors
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  let content = `# ${record.title}\n\n`;

  if (record.summary) {
    content += `## Summary\n\n${record.summary}\n\n`;
  }

  if (record.evidence && record.evidence.length > 0) {
    content += `## Evidence\n\n`;
    record.evidence.forEach((ev: any) => {
      content += `### ${ev.timestamp || 'Evidence'}\n\n`;
      content += `- **Change ID**: ${ev.changeId || 'N/A'}\n`;
      content += `- **Workflow**: ${ev.workflow || 'N/A'}\n`;
      content += `- **Status**: ${ev.status || 'N/A'}\n\n`;
    });
  }

  if (record.whyStored) {
    content += `## Why Stored\n\n${record.whyStored}\n\n`;
  }

  return matter.stringify(content, frontmatter);
}

function buildGeneratedSkillMarkdown(record: MemoryRecord): string {
  const frontmatter: MemoryRecord = {
    slug: record.slug,
    title: record.title,
    patternId: record.patternId,
    summary: record.summary,
    evidenceCount: record.evidenceCount,
    adoptedAt: record.adoptedAt,
    adoptedFrom: record.adoptedFrom,
    source: record.source,
    status: record.status,
    executionDirectives: record.executionDirectives || []
  };

  // Remove undefined values to avoid YAML serialization errors
  Object.keys(frontmatter).forEach(key => {
    if (frontmatter[key] === undefined) {
      delete frontmatter[key];
    }
  });

  let content = `# ${record.title || record.slug}\n\n`;

  if (record.summary) {
    content += `## Summary\n\n${record.summary}\n\n`;
  }

  content += `## Execution Directives\n\n`;
  if (record.executionDirectives && record.executionDirectives.length > 0) {
    record.executionDirectives.forEach((directive: string) => {
      content += `- ${directive}\n`;
    });
  } else {
    content += `- None\n`;
  }
  content += `\n`;

  content += `## Metadata\n\n`;
  content += `- **Pattern ID**: ${record.patternId || 'N/A'}\n`;
  content += `- **Evidence Count**: ${record.evidenceCount || 0}\n`;
  content += `- **Adopted At**: ${record.adoptedAt || 'N/A'}\n`;
  content += `- **Source**: ${record.source || 'N/A'}\n\n`;

  return matter.stringify(content, frontmatter);
}

// Parse Markdown file
function parseMarkdownFile(filePath: string): MemoryRecord {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);

  // Extract summary from first heading
  const summaryMatch = parsed.content.match(/^#\s+(.+)$/m);
  const summary = summaryMatch ? summaryMatch[1] : undefined;

  return {
    ...parsed.data,
    summary,
    _content: parsed.content,
    _filePath: filePath
  };
}

// Record functions
function recordExecutionMemory(projectRoot: string, event: MemoryRecord): MemoryRecord {
  const memoryConfig = loadMemoryConfig(projectRoot);
  const decision = decideCapture(
    {
      kind: 'execution',
      ...event
    },
    memoryConfig
  );

  if (!decision.shouldPersist) {
    return {
      persisted: false,
      decision
    };
  }

  const timestamp = event.timestamp || new Date().toISOString();
  const workflow = event.workflow || 'unknown';
  const summary = event.summary || 'execution';
  const id = event.id || generateId('exec');
  const filePath = executionFilePath(projectRoot, workflow, timestamp, summary, id);

  ensureDirectory(path.dirname(filePath));

  const record = {
    id,
    timestamp,
    source: event.source || 'workflow_command',
    workflow,
    phase: event.phase || '',
    changeId: event.changeId || '',
    changeSlug: event.changeSlug || '',
    capability: event.capability || '',
    captureLevel: decision.captureLevel,
    whyStored: decision.reason,
    summary: event.summary || '',
    status: event.status || '',
    filesTouched: normalizeStringArray(event.filesTouched),
    testsRun: normalizeStringArray(event.testsRun),
    durationMs: Number.isFinite(event.durationMs) ? event.durationMs : 0,
    errors: normalizeStringArray(event.errors),
    metadata: event.metadata && typeof event.metadata === 'object' ? event.metadata : {}
  };

  const markdown = buildExecutionMarkdown(record);
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    persisted: true,
    decision,
    record,
    filePath
  };
}

function recordPreferenceMemory(projectRoot: string, event: MemoryRecord): MemoryRecord {
  const memoryConfig = loadMemoryConfig(projectRoot);
  const decision = decideCapture(
    {
      kind: 'preference',
      ...event
    },
    memoryConfig
  );

  if (!decision.shouldPersist) {
    return {
      persisted: false,
      decision
    };
  }

  if (!event.statement || typeof event.statement !== 'string') {
    throw new Error('Preference memory requires a non-empty statement');
  }

  const timestamp = event.timestamp || new Date().toISOString();
  const scope = event.scope || 'user';
  const filePath = preferenceFilePath(projectRoot, scope, event.statement);

  ensureDirectory(path.dirname(filePath));

  // Check if file exists and update it
  let record: MemoryRecord;
  if (fs.existsSync(filePath)) {
    const existing = parseMarkdownFile(filePath);
    record = {
      ...existing,
      source: event.source || existing.source || 'explicit_remember',
      explicit: Boolean(existing.explicit || event.source === 'explicit_remember'),
      evidenceCount: Number(existing.evidenceCount || 0) + 1,
      lastConfirmedAt: timestamp,
      stability: Math.max(
        Number(existing.stability || 0),
        Number(event.stability || (event.source === 'explicit_remember' ? 1 : 0))
      ),
      whyStored: decision.reason,
      status: event.status || existing.status || 'adopted'
    };
  } else {
    record = {
      id: event.id || generateId('pref'),
      statement: event.statement,
      scope,
      source: event.source || 'explicit_remember',
      explicit: Boolean(event.source === 'explicit_remember'),
      evidenceCount: Number(event.evidenceCount || 1),
      lastConfirmedAt: timestamp,
      stability: Number(event.stability || (event.source === 'explicit_remember' ? 1 : 0)),
      whyStored: decision.reason,
      status: event.status || 'adopted'
    };
  }

  const markdown = buildPreferenceMarkdown(record);
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    persisted: true,
    decision,
    filePath,
    record
  };
}

// List functions
function listExecutionRecords(projectRoot: string, filters: MemoryRecord = {}): MemoryRecord[] {
  const baseDirectory = enginePath(projectRoot, 'memory', 'executions');

  if (!fs.existsSync(baseDirectory)) {
    return [];
  }

  const records: MemoryRecord[] = [];
  const workflowDirectories = fs
    .readdirSync(baseDirectory, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isDirectory());

  for (const workflowDirectory of workflowDirectories) {
    if (filters.workflow && workflowDirectory.name !== filters.workflow) {
      continue;
    }

    const workflowPath = path.join(baseDirectory, workflowDirectory.name);
    const files = fs
      .readdirSync(workflowPath, { withFileTypes: true })
      .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry: Dirent) => path.join(workflowPath, entry.name))
      .sort();

    for (const filePath of files) {
      try {
        const record = parseMarkdownFile(filePath);
        records.push(record);
      } catch (error) {
        console.warn(`Failed to parse execution memory at ${filePath}: ${getErrorMessage(error)}`);
      }
    }
  }

  return records.sort((left, right) =>
    (right.timestamp || '').localeCompare(left.timestamp || '')
  );
}

function listPreferenceRecords(projectRoot: string, filters: MemoryRecord = {}): MemoryRecord[] {
  const baseDirectory = enginePath(projectRoot, 'memory', 'preferences');

  if (!fs.existsSync(baseDirectory)) {
    return [];
  }

  const records: MemoryRecord[] = [];
  const files = fs
    .readdirSync(baseDirectory, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry: Dirent) => path.join(baseDirectory, entry.name))
    .sort();

  for (const filePath of files) {
    try {
      const record = parseMarkdownFile(filePath);

      if (filters.scope && record.scope !== filters.scope) {
        continue;
      }

      records.push(record);
    } catch (error) {
      console.warn(`Failed to parse preference memory at ${filePath}: ${getErrorMessage(error)}`);
    }
  }

  return records.sort((left, right) =>
    (right.lastConfirmedAt || '').localeCompare(left.lastConfirmedAt || '')
  );
}

// Candidate functions
function upsertLearningCandidate(projectRoot: string, candidate: MemoryRecord): MemoryRecord {
  const slug = candidate.slug || slugifyForFile(candidate.title);
  const filePath = learningCandidateFilePath(projectRoot, slug);

  let existingRecord: MemoryRecord | null = null;
  if (fs.existsSync(filePath)) {
    existingRecord = parseMarkdownFile(filePath);
  }

  const payload = preserveCandidateLifecycle(existingRecord, {
    id: candidate.id || generateId('learn'),
    slug,
    title: candidate.title,
    category: candidate.category || 'best_practice',
    source: candidate.source || 'post_run_promotion',
    status: candidate.status || 'candidate',
    workflow: candidate.workflow || '',
    phase: candidate.phase || '',
    summary: candidate.summary || '',
    evidenceCount: Number(candidate.evidenceCount || 0),
    evidence: Array.isArray(candidate.evidence) ? candidate.evidence : [],
    appliesTo: normalizeStringArray(candidate.appliesTo),
    reusability: Number(candidate.reusability || 0),
    whyStored: candidate.whyStored || 'promoted_knowledge',
    verification:
      candidate.verification && typeof candidate.verification === 'object'
        ? candidate.verification
        : {
            state: 'pending',
            required: true
          }
  });

  const markdown = buildLearningCandidateMarkdown(payload);
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    filePath,
    record: payload
  };
}

function upsertSkillCandidate(projectRoot: string, candidate: MemoryRecord): MemoryRecord {
  const slug =
    candidate.slug ||
    slugifyForFile(candidate.patternId || candidate.title || 'skill-candidate');
  const filePath = skillCandidateFilePath(projectRoot, slug);

  let existingRecord: MemoryRecord | null = null;
  if (fs.existsSync(filePath)) {
    existingRecord = parseMarkdownFile(filePath);
  }

  const payload = preserveCandidateLifecycle(existingRecord, {
    id: candidate.id || generateId('skill'),
    slug,
    title: candidate.title,
    source: candidate.source || 'post_run_promotion',
    status: candidate.status || 'candidate',
    patternCategory: candidate.patternCategory || '',
    patternId: candidate.patternId || '',
    summary: candidate.summary || '',
    evidenceCount: Number(candidate.evidenceCount || 0),
    evidence: Array.isArray(candidate.evidence) ? candidate.evidence : [],
    whyStored: candidate.whyStored || 'promoted_skill_candidate',
    verification:
      candidate.verification && typeof candidate.verification === 'object'
        ? candidate.verification
        : {
            state: 'pending',
            required: true
          }
  });

  const markdown = buildSkillCandidateMarkdown(payload);
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    filePath,
    record: payload
  };
}

const FINAL_CANDIDATE_STATUSES = new Set([
  'verified',
  'adopted',
  'rejected'
]);

function preserveCandidateLifecycle(existingRecord: MemoryRecord | null, nextRecord: MemoryRecord): MemoryRecord {
  if (!existingRecord) {
    return nextRecord;
  }

  const shouldPreserveFinalStatus =
    FINAL_CANDIDATE_STATUSES.has(existingRecord.status) &&
    nextRecord.status === 'candidate';
  const shouldPreserveVerification =
    existingRecord.verification &&
    existingRecord.verification.state &&
    existingRecord.verification.state !== 'pending' &&
    (!nextRecord.verification || nextRecord.verification.state === 'pending');

  return {
    ...nextRecord,
    id: existingRecord.id || nextRecord.id,
    status: shouldPreserveFinalStatus
      ? existingRecord.status
      : nextRecord.status,
    verification: shouldPreserveVerification
      ? existingRecord.verification
      : nextRecord.verification,
    adoptedAt: existingRecord.adoptedAt || nextRecord.adoptedAt,
    adoptedFrom: existingRecord.adoptedFrom || nextRecord.adoptedFrom
  };
}

function readLearningCandidateRecord(projectRoot: string, slug: string): MemoryRecord {
  const filePath = learningCandidateFilePath(projectRoot, slug);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Learning candidate not found: ${slug}`);
  }

  return {
    filePath,
    record: parseMarkdownFile(filePath)
  };
}

function updateLearningCandidateRecord(projectRoot: string, slug: string, mutate: MemoryMutator): MemoryRecord {
  const { filePath, record } = readLearningCandidateRecord(projectRoot, slug);
  const nextRecord =
    typeof mutate === 'function' ? mutate({ ...record }) : { ...record, ...mutate };

  const markdown = buildLearningCandidateMarkdown(nextRecord);
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    filePath,
    record: nextRecord
  };
}

function readSkillCandidateRecord(projectRoot: string, slug: string): MemoryRecord {
  const filePath = skillCandidateFilePath(projectRoot, slug);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Skill candidate not found: ${slug}`);
  }

  return {
    filePath,
    record: parseMarkdownFile(filePath)
  };
}

function updateSkillCandidateRecord(projectRoot: string, slug: string, mutate: MemoryMutator): MemoryRecord {
  const { filePath, record } = readSkillCandidateRecord(projectRoot, slug);
  const nextRecord =
    typeof mutate === 'function' ? mutate({ ...record }) : { ...record, ...mutate };

  const markdown = buildSkillCandidateMarkdown(nextRecord);
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    filePath,
    record: nextRecord
  };
}

function writeGeneratedSkillArtifact(projectRoot: string, slug: string, payload: MemoryRecord): MemoryRecord {
  const filePath = generatedSkillFilePath(projectRoot, slug);
  const markdown = buildGeneratedSkillMarkdown(payload);
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    filePath,
    record: payload
  };
}

function writeAdoptedLearningArtifact(projectRoot: string, slug: string, payload: MemoryRecord): MemoryRecord {
  const filePath = adoptedLearningFilePath(projectRoot, slug);
  const markdown = buildLearningCandidateMarkdown(payload);
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, markdown, 'utf8');

  return {
    filePath,
    record: payload
  };
}

function listMarkdownRecordsFromDirectory(directoryPath: string): MemoryRecord[] {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry: Dirent) => path.join(directoryPath, entry.name))
    .sort()
    .map((filePath: string) => {
      try {
        return parseMarkdownFile(filePath);
      } catch (error) {
        console.warn(`Failed to parse markdown record at ${filePath}: ${getErrorMessage(error)}`);
        return null;
      }
    })
    .filter(Boolean);
}

function listLearningCandidateRecords(projectRoot: string): MemoryRecord[] {
  return listMarkdownRecordsFromDirectory(
    enginePath(projectRoot, 'memory', 'learnings', 'candidates')
  );
}

function listAdoptedLearningRecords(projectRoot: string): MemoryRecord[] {
  return listMarkdownRecordsFromDirectory(
    enginePath(projectRoot, 'memory', 'learnings', 'adopted')
  );
}

function listSkillCandidateRecords(projectRoot: string): MemoryRecord[] {
  return listMarkdownRecordsFromDirectory(
    enginePath(projectRoot, 'memory', 'skill-candidates')
  );
}

function listGeneratedSkillArtifacts(projectRoot: string): MemoryRecord[] {
  return listMarkdownRecordsFromDirectory(
    enginePath(projectRoot, 'generated-skills')
  );
}

module.exports = {
  loadProjectConfig,
  loadMemoryConfig,
  recordExecutionMemory,
  recordPreferenceMemory,
  listExecutionRecords,
  listPreferenceRecords,
  upsertLearningCandidate,
  upsertSkillCandidate,
  readLearningCandidateRecord,
  updateLearningCandidateRecord,
  readSkillCandidateRecord,
  updateSkillCandidateRecord,
  writeAdoptedLearningArtifact,
  writeGeneratedSkillArtifact,
  listLearningCandidateRecords,
  listAdoptedLearningRecords,
  listSkillCandidateRecords,
  listGeneratedSkillArtifacts,
  adoptedLearningFilePath,
  generatedSkillFilePath,
  slugifyForFile
};

export {};
