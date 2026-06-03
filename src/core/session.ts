const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { enginePath } = require('./paths');

export interface WorkflowSession {
  id: string;
  workflow: string;
  startTime: string;
  input: string;
  initialGitState: {
    branch: string;
    commit: string;
    status: string;
    diff: string;
  };
  metadata: Record<string, any>;
}

export interface ExecutionInfo {
  filesTouched: string[];
  noiseFilesIgnored: string[];
  linesChanged: number;
  durationMs: number;
  gitDiff: string;
  gitStatus: string;
  hasErrors: boolean;
  errorMessages: string[];
}

function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `session-${timestamp}-${random}`;
}

function getSessionPath(projectRoot: string = process.cwd()): string {
  return enginePath(projectRoot, '.session');
}

function collectGitState(projectRoot: string = process.cwd()): { branch: string; commit: string; status: string; diff: string } {
  try {
    const options = { encoding: 'utf8' as BufferEncoding, cwd: projectRoot };
    const branch = execSync('git rev-parse --abbrev-ref HEAD', options).trim();
    const commit = execSync('git rev-parse HEAD', options).trim();
    const status = execSync('git status --short', options);
    const diff = execSync('git diff HEAD', options);

    return { branch, commit, status, diff };
  } catch (error) {
    return { branch: 'unknown', commit: 'unknown', status: '', diff: '' };
  }
}

export function createSession(workflow: string, input: string, projectRoot: string = process.cwd()): WorkflowSession {
  const session: WorkflowSession = {
    id: generateSessionId(),
    workflow,
    startTime: new Date().toISOString(),
    input,
    initialGitState: collectGitState(projectRoot),
    metadata: {}
  };

  const sessionPath = getSessionPath(projectRoot);
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf8');

  return session;
}

export function getCurrentSession(projectRoot: string = process.cwd()): WorkflowSession | null {
  const sessionPath = getSessionPath(projectRoot);

  if (!fs.existsSync(sessionPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(sessionPath, 'utf8');
    return JSON.parse(content) as WorkflowSession;
  } catch (error) {
    // 会话文件损坏，删除它
    fs.unlinkSync(sessionPath);
    return null;
  }
}

export function cleanupSession(projectRoot: string = process.cwd()): void {
  const sessionPath = getSessionPath(projectRoot);

  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
}

function parseFilesFromGitStatus(gitStatus: string): string[] {
  const lines = gitStatus.split('\n').filter(line => line.trim());
  const files: string[] = [];

  for (const line of lines) {
    // git status --short 格式: "XY filename"
    const match = line.match(/^..\s+(.+)$/);
    if (match) {
      files.push(match[1]);
    }
  }

  return files;
}

interface GitStatusEntry {
  status: string;
  file: string;
}

function normalizeStatusPath(filePath: string): string {
  return filePath
    .replace(/^"|"$/g, '')
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '');
}

function parseGitStatusEntries(gitStatus: string): GitStatusEntry[] {
  return gitStatus
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const match = line.match(/^..\s+(.+)$/);
      if (!match) return null;
      const file = match[1].includes(' -> ')
        ? match[1].split(' -> ').pop() || match[1]
        : match[1];
      return {
        status: line.slice(0, 2),
        file: normalizeStatusPath(file)
      };
    })
    .filter(Boolean) as GitStatusEntry[];
}

function changedFilesSinceSessionStart(currentStatus: string, initialStatus: string): string[] {
  const initialEntries = new Map(
    parseGitStatusEntries(initialStatus).map(entry => [entry.file, entry.status])
  );

  return parseGitStatusEntries(currentStatus)
    .filter(entry => initialEntries.get(entry.file) !== entry.status)
    .map(entry => entry.file);
}

function isTemporaryNoiseFile(filePath: string): boolean {
  const normalized = normalizeStatusPath(filePath).toLowerCase();
  const baseName = path.basename(normalized);

  return normalized === '.ome/.session' ||
    normalized.endsWith('/.phpunit.result.cache') ||
    normalized.endsWith('.phpunit.result.cache') ||
    baseName.startsWith('~$') ||
    baseName.endsWith('.tmp');
}

function isGeneratedPlatformSyncFile(filePath: string): boolean {
  const normalized = normalizeStatusPath(filePath).toLowerCase();
  const generatedExactPaths = new Set([
    'ome.md',
    'agents.md',
    'claude.md',
    'gemini.md',
    '.gitignore',
    '.windsurfrules',
    '.ome/platforms.json'
  ]);
  const generatedDirectoryPrefixes = [
    '.agent/',
    '.agents/',
    '.claude/commands/',
    '.claude/skills/',
    '.codex/skills/',
    '.cursor/commands/',
    '.cursor/rules/',
    '.cursor/skills/',
    '.kiro/prompts/',
    '.kiro/skills/',
    '.opencode/command/',
    '.qoder/commands/',
    '.qoder/rules/',
    '.qoder/skills/',
    '.trae/commands/',
    '.trae/rules/',
    '.trae/skills/',
    '.windsurf/rules/',
    '.windsurf/workflows/',
    '.ome/context/',
    '.ome/rules/',
    '.ome/skills/'
  ];
  const generatedDirectoryRoots = [
    '.claude/',
    '.codex/',
    '.cursor/',
    '.kiro/',
    '.opencode/',
    '.qoder/',
    '.trae/',
    '.windsurf/'
  ];

  return generatedExactPaths.has(normalized) ||
    generatedDirectoryPrefixes.some(prefix => normalized.startsWith(prefix)) ||
    generatedDirectoryRoots.includes(normalized);
}

function filterExecutionFiles(files: string[], workflow: string): { filesTouched: string[]; noiseFilesIgnored: string[] } {
  const filesTouched: string[] = [];
  const noiseFilesIgnored: string[] = [];

  for (const file of files) {
    if (isTemporaryNoiseFile(file) || (workflow === 'bug' && isGeneratedPlatformSyncFile(file))) {
      noiseFilesIgnored.push(file);
    } else {
      filesTouched.push(file);
    }
  }

  return { filesTouched, noiseFilesIgnored };
}

function countLinesChanged(gitDiff: string): number {
  const lines = gitDiff.split('\n');
  let added = 0;
  let removed = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed++;
    }
  }

  return added + removed;
}

export function collectExecutionInfo(session: WorkflowSession, projectRoot: string = process.cwd()): ExecutionInfo {
  const endTime = Date.now();
  const startTime = new Date(session.startTime).getTime();
  const durationMs = endTime - startTime;

  let gitDiff = '';
  let gitStatus = '';

  try {
    const options = { encoding: 'utf8' as BufferEncoding, cwd: projectRoot };
    gitDiff = execSync('git diff HEAD', options);
    gitStatus = execSync('git status --short', options);
  } catch (error) {
    // Git 命令失败，可能不在 git 仓库中
  }

  const changedFiles = changedFilesSinceSessionStart(
    gitStatus,
    session.initialGitState?.status || ''
  );
  const fallbackFiles = parseFilesFromGitStatus(gitStatus).map(normalizeStatusPath);
  const { filesTouched, noiseFilesIgnored } = filterExecutionFiles(
    changedFiles.length > 0 ? changedFiles : fallbackFiles,
    session.workflow
  );
  const linesChanged = countLinesChanged(gitDiff);

  return {
    filesTouched,
    noiseFilesIgnored,
    linesChanged,
    durationMs,
    gitDiff,
    gitStatus,
    hasErrors: false,
    errorMessages: []
  };
}

export function inferExecutionStatus(info: ExecutionInfo): 'success' | 'failed' {
  if (info.hasErrors) return 'failed';
  if (info.filesTouched.length > 0) return 'success';
  return 'success';
}

export function calculateComplexity(info: ExecutionInfo): number {
  const fileScore = Math.min(info.filesTouched.length / 10, 1.0);
  const lineScore = Math.min(info.linesChanged / 100, 1.0);
  const timeScore = Math.min(info.durationMs / (10 * 60 * 1000), 1.0);

  return (fileScore + lineScore + timeScore) / 3;
}

export function calculateReusePotential(info: ExecutionInfo): number {
  const hasTestFiles = info.filesTouched.some(f => f.includes('.test.') || f.includes('.spec.'));
  const hasConfigFiles = info.filesTouched.some(f => f.includes('config') || f.includes('.json'));
  const hasCoreFiles = info.filesTouched.some(f => f.includes('src/core') || f.includes('src/lib'));

  let score = 0.5;

  if (hasTestFiles) score += 0.2;
  if (hasConfigFiles) score += 0.1;
  if (hasCoreFiles) score += 0.2;

  return Math.min(score, 1.0);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function cleanupStaleSessions(projectRoot: string = process.cwd()): void {
  const session = getCurrentSession(projectRoot);

  if (!session) return;

  const startTime = new Date(session.startTime).getTime();
  const now = Date.now();
  const ageMs = now - startTime;
  const maxAgeMs = 15 * 60 * 1000; // 15 分钟兜底：忘记 `ome finish` 时由这里清理

  if (ageMs > maxAgeMs) {
    process.stdout.write(`⚠️  Found stale session (${formatDuration(ageMs)} old)\n`);
    process.stdout.write(`   Workflow: ${session.workflow}\n`);
    process.stdout.write(`   Input: ${session.input}\n`);

    try {
      const executionInfo = collectExecutionInfo(session);

      // 只有在有实际变更时才记录
      if (executionInfo.filesTouched.length > 0) {
        const { recordExecutionMemory } = require('../skills/oh-my-engine/lib/memory-store');

        const event = {
          id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          timestamp: new Date().toISOString(),
          source: 'workflow_command',
          workflow: session.workflow,
          phase: 'execution',
          changeId: session.id,
          changeSlug: session.workflow,
          capability: session.workflow,
          captureLevel: 'summary',
          whyStored: 'Stale session auto-recorded',
          summary: session.input,
          status: inferExecutionStatus(executionInfo),
          filesTouched: executionInfo.filesTouched,
          testsRun: [],
          durationMs: executionInfo.durationMs,
          errors: executionInfo.errorMessages,
          metadata: {}
        };

        recordExecutionMemory(projectRoot, event);
        process.stdout.write(`✅ Stale session recorded automatically\n`);
      } else {
        process.stdout.write(`ℹ️  No changes detected, session discarded\n`);
      }
    } catch (error) {
      process.stderr.write(`❌ Failed to record stale session: ${error instanceof Error ? error.message : String(error)}\n`);
    }

    cleanupSession(projectRoot);
  }
}
