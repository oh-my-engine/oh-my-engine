const fs = require('node:fs');
const path = require('node:path');

const { mergeMemoryConfig, decideCapture } = require('./memory-policy');

function loadProjectConfig(projectRoot) {
  const configPath = path.join(projectRoot, '.oh-my-engine', 'config.json');

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse project config at ${configPath}: ${error.message}`);
  }
}

function loadMemoryConfig(projectRoot) {
  const config = loadProjectConfig(projectRoot);
  return mergeMemoryConfig(config.memory || {});
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function executionFilePath(projectRoot, workflow, timestamp) {
  const day = timestamp.slice(0, 10);
  return path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'executions',
    workflow,
    `${day}.jsonl`
  );
}

function preferenceFilePath(projectRoot, scope) {
  return path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'preferences',
    `${scope}.json`
  );
}

function learningCandidateFilePath(projectRoot, slug) {
  return path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'learnings',
    'candidates',
    `${slug}.json`
  );
}

function adoptedLearningFilePath(projectRoot, slug) {
  return path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'learnings',
    'adopted',
    `${slug}.json`
  );
}

function skillCandidateFilePath(projectRoot, slug) {
  return path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'skill-candidates',
    `${slug}.json`
  );
}

function generatedSkillFilePath(projectRoot, slug) {
  return path.join(
    projectRoot,
    '.oh-my-engine',
    'generated-skills',
    `${slug}.json`
  );
}

function slugifyForFile(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(item => typeof item === 'string');
}

function recordExecutionMemory(projectRoot, event) {
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
  const filePath = executionFilePath(projectRoot, workflow, timestamp);

  ensureDirectory(path.dirname(filePath));

  const record = {
    id: event.id || generateId('exec'),
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

  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');

  return {
    persisted: true,
    decision,
    record,
    filePath
  };
}

function readPreferenceScopeFile(filePath, scope) {
  if (!fs.existsSync(filePath)) {
    return {
      scope,
      records: []
    };
  }

  try {
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      scope: payload.scope || scope,
      records: Array.isArray(payload.records) ? payload.records : []
    };
  } catch (error) {
    throw new Error(`Failed to parse preference memory file at ${filePath}: ${error.message}`);
  }
}

function writeJsonFile(filePath, payload) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse JSON record at ${filePath}: ${error.message}`);
  }
}

function readJsonFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readJsonFile(filePath);
}

function recordPreferenceMemory(projectRoot, event) {
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
  const filePath = preferenceFilePath(projectRoot, scope);

  ensureDirectory(path.dirname(filePath));

  const payload = readPreferenceScopeFile(filePath, scope);
  const existingRecord = payload.records.find(
    record => record.statement === event.statement
  );

  if (existingRecord) {
    existingRecord.source = event.source || existingRecord.source || 'explicit_remember';
    existingRecord.explicit = Boolean(existingRecord.explicit || event.source === 'explicit_remember');
    existingRecord.evidenceCount = Number(existingRecord.evidenceCount || 0) + 1;
    existingRecord.lastConfirmedAt = timestamp;
    existingRecord.stability = Math.max(
      Number(existingRecord.stability || 0),
      Number(event.stability || (event.source === 'explicit_remember' ? 1 : 0))
    );
    existingRecord.whyStored = decision.reason;
    existingRecord.status = event.status || existingRecord.status || 'adopted';
  } else {
    payload.records.push({
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
    });
  }

  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return {
    persisted: true,
    decision,
    filePath,
    record:
      existingRecord ||
      payload.records.find(record => record.statement === event.statement)
  };
}

function listExecutionRecords(projectRoot, filters = {}) {
  const baseDirectory = path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'executions'
  );

  if (!fs.existsSync(baseDirectory)) {
    return [];
  }

  const records = [];
  const workflowDirectories = fs
    .readdirSync(baseDirectory, { withFileTypes: true })
    .filter(entry => entry.isDirectory());

  for (const workflowDirectory of workflowDirectories) {
    if (filters.workflow && workflowDirectory.name !== filters.workflow) {
      continue;
    }

    const workflowPath = path.join(baseDirectory, workflowDirectory.name);
    const files = fs
      .readdirSync(workflowPath, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map(entry => path.join(workflowPath, entry.name))
      .sort();

    for (const filePath of files) {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const record = JSON.parse(line);
          records.push(record);
        } catch (error) {
          throw new Error(`Failed to parse execution memory record in ${filePath}: ${error.message}`);
        }
      }
    }
  }

  return records.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

function listPreferenceRecords(projectRoot, filters = {}) {
  const baseDirectory = path.join(
    projectRoot,
    '.oh-my-engine',
    'memory',
    'preferences'
  );

  if (!fs.existsSync(baseDirectory)) {
    return [];
  }

  const records = [];
  const files = fs
    .readdirSync(baseDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => path.join(baseDirectory, entry.name))
    .sort();

  for (const filePath of files) {
    const payload = readPreferenceScopeFile(
      filePath,
      path.basename(filePath, '.json')
    );

    for (const record of payload.records) {
      if (filters.scope && record.scope !== filters.scope) {
        continue;
      }

      records.push(record);
    }
  }

  return records.sort((left, right) =>
    (right.lastConfirmedAt || '').localeCompare(left.lastConfirmedAt || '')
  );
}

function upsertLearningCandidate(projectRoot, candidate) {
  const slug = candidate.slug || slugifyForFile(candidate.title);
  const filePath = learningCandidateFilePath(projectRoot, slug);
  const existingRecord = readJsonFileIfExists(filePath);
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

  writeJsonFile(filePath, payload);

  return {
    filePath,
    record: payload
  };
}

function upsertSkillCandidate(projectRoot, candidate) {
  const slug =
    candidate.slug ||
    slugifyForFile(candidate.patternId || candidate.title || 'skill-candidate');
  const filePath = skillCandidateFilePath(projectRoot, slug);
  const existingRecord = readJsonFileIfExists(filePath);
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

  writeJsonFile(filePath, payload);

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

function preserveCandidateLifecycle(existingRecord, nextRecord) {
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

function readLearningCandidateRecord(projectRoot, slug) {
  const filePath = learningCandidateFilePath(projectRoot, slug);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Learning candidate not found: ${slug}`);
  }

  return {
    filePath,
    record: readJsonFile(filePath)
  };
}

function updateLearningCandidateRecord(projectRoot, slug, mutate) {
  const { filePath, record } = readLearningCandidateRecord(projectRoot, slug);
  const nextRecord =
    typeof mutate === 'function' ? mutate({ ...record }) : { ...record, ...mutate };

  writeJsonFile(filePath, nextRecord);

  return {
    filePath,
    record: nextRecord
  };
}

function readSkillCandidateRecord(projectRoot, slug) {
  const filePath = skillCandidateFilePath(projectRoot, slug);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Skill candidate not found: ${slug}`);
  }

  return {
    filePath,
    record: readJsonFile(filePath)
  };
}

function updateSkillCandidateRecord(projectRoot, slug, mutate) {
  const { filePath, record } = readSkillCandidateRecord(projectRoot, slug);
  const nextRecord =
    typeof mutate === 'function' ? mutate({ ...record }) : { ...record, ...mutate };

  writeJsonFile(filePath, nextRecord);

  return {
    filePath,
    record: nextRecord
  };
}

function writeGeneratedSkillArtifact(projectRoot, slug, payload) {
  const filePath = generatedSkillFilePath(projectRoot, slug);
  writeJsonFile(filePath, payload);

  return {
    filePath,
    record: payload
  };
}

function writeAdoptedLearningArtifact(projectRoot, slug, payload) {
  const filePath = adoptedLearningFilePath(projectRoot, slug);
  writeJsonFile(filePath, payload);

  return {
    filePath,
    record: payload
  };
}

function listJsonRecordsFromDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return [];
  }

  return fs
    .readdirSync(directoryPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => path.join(directoryPath, entry.name))
    .sort()
    .map(filePath => {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        throw new Error(`Failed to parse JSON record at ${filePath}: ${error.message}`);
      }
    });
}

function listLearningCandidateRecords(projectRoot) {
  return listJsonRecordsFromDirectory(
    path.join(projectRoot, '.oh-my-engine', 'memory', 'learnings', 'candidates')
  );
}

function listAdoptedLearningRecords(projectRoot) {
  return listJsonRecordsFromDirectory(
    path.join(projectRoot, '.oh-my-engine', 'memory', 'learnings', 'adopted')
  );
}

function listSkillCandidateRecords(projectRoot) {
  return listJsonRecordsFromDirectory(
    path.join(projectRoot, '.oh-my-engine', 'memory', 'skill-candidates')
  );
}

function listGeneratedSkillArtifacts(projectRoot) {
  return listJsonRecordsFromDirectory(
    path.join(projectRoot, '.oh-my-engine', 'generated-skills')
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
