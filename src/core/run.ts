const fs = require('node:fs');
const path = require('node:path');

const { ENGINE_DIR } = require('./paths');
const { writeJsonFile } = require('./file-system');
const { runShellCommandInherit } = require('./process');
const {
  LEGACY_RUN_POLICY,
  RUN_EVIDENCE_TYPES,
  RUN_STAGES,
  createRunState,
  missingRunEvidence,
  requiredEvidenceForStage,
  runNextAction,
  transitionRun
} = require('./run-engine');

import type {
  RunEvidence,
  RunEvidenceType,
  RunStage,
  RunState,
  RunStatus
} from './run-engine';

interface RunResponse {
  runId?: string;
  request?: string;
  status: RunStatus | 'blocked' | 'error';
  stage?: RunStage;
  nextAction: string;
  requiredEvidence: RunEvidenceType[];
  blockingIssues: string[];
  exitCodeMeaning: string;
  statePath?: string;
  evidence?: RunEvidence[];
}

interface RunCommandResult {
  response: RunResponse;
  exitCode: number;
}

export interface CompletionResult {
  persisted: boolean;
  analyzed: boolean;
  error?: string;
}

type RunOutputFormat = 'json' | 'text';

const EXIT_CODE_MEANING = '0 means stage is actionable or advanced; non-zero means blocked or invalid.';

function nowIso(): string {
  return new Date().toISOString();
}

function runsDirectory(projectRoot: string): string {
  return path.join(projectRoot, ENGINE_DIR, 'runs');
}

function runStatePath(projectRoot: string, runId: string): string {
  return path.join(runsDirectory(projectRoot), runId, 'state.json');
}

function isEvidenceType(value: string): value is RunEvidenceType {
  return RUN_EVIDENCE_TYPES.includes(value as RunEvidenceType);
}

function loadRunState(filePath: string): RunState {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as RunState;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Run state is invalid: ${filePath}: ${message}`);
  }
}

function writeRunState(projectRoot: string, state: RunState): void {
  state.updatedAt = nowIso();
  writeJsonFile(runStatePath(projectRoot, state.runId), state);
}

function findActiveRun(projectRoot: string): { state: RunState; statePath: string } | undefined {
  const directory = runsDirectory(projectRoot);
  if (!fs.existsSync(directory)) return undefined;

  const entries = fs.readdirSync(directory).sort();
  for (const entry of entries) {
    const statePath = path.join(directory, entry, 'state.json');
    if (!fs.existsSync(statePath)) continue;
    const state = loadRunState(statePath);
    if (state.status === 'active') return { state, statePath };
  }

  return undefined;
}

function requiredEvidenceFor(stage: RunStage): RunEvidenceType[] {
  return requiredEvidenceForStage(stage);
}

function missingEvidence(state: RunState): RunEvidenceType[] {
  return missingRunEvidence(state, LEGACY_RUN_POLICY);
}

function responseFromState(state: RunState, statePath?: string, blockingIssues: string[] = []): RunResponse {
  return {
    runId: state.runId,
    request: state.request,
    status: state.status,
    stage: state.stage,
    nextAction: runNextAction(state.stage),
    requiredEvidence: requiredEvidenceFor(state.stage),
    blockingIssues,
    exitCodeMeaning: EXIT_CODE_MEANING,
    statePath,
    evidence: state.evidence
  };
}

function errorResponse(message: string): RunResponse {
  return {
    status: 'error',
    nextAction: 'Resolve the blocking issue and retry the command.',
    requiredEvidence: [],
    blockingIssues: [message],
    exitCodeMeaning: EXIT_CODE_MEANING
  };
}

function noActiveRunResult(): RunCommandResult {
  return {
    response: errorResponse('No active run found. Start one with `ome run start "<request>"`.'),
    exitCode: 1
  };
}

function getActiveRunOrError(projectRoot: string): RunCommandResult | { state: RunState; statePath: string } {
  try {
    const active = findActiveRun(projectRoot);
    return active || noActiveRunResult();
  } catch (error) {
    return {
      response: errorResponse(error instanceof Error ? error.message : String(error)),
      exitCode: 1
    };
  }
}

export function startRun(projectRoot: string, request: string): RunCommandResult {
  const normalizedRequest = request.trim();
  if (!normalizedRequest) {
    return {
      response: errorResponse('Missing run request. Usage: ome run start "<request>".'),
      exitCode: 1
    };
  }

  try {
    const active = findActiveRun(projectRoot);
    if (active) {
      return {
        response: responseFromState(active.state, active.statePath, [`An active run already exists: ${active.state.runId}. Finish or cancel it before starting another run.`]),
        exitCode: 1
      };
    }
  } catch (error) {
    return {
      response: errorResponse(error instanceof Error ? error.message : String(error)),
      exitCode: 1
    };
  }

  const state = createRunState(normalizedRequest, { policy: LEGACY_RUN_POLICY });

  writeRunState(projectRoot, state);
  return { response: responseFromState(state, runStatePath(projectRoot, state.runId)), exitCode: 0 };
}

export function statusRun(projectRoot: string): RunCommandResult {
  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;

  return {
    response: responseFromState(active.state, active.statePath),
    exitCode: 0
  };
}

export function recordRunEvidence(projectRoot: string, type: string, summary: string): RunCommandResult {
  if (!isEvidenceType(type)) {
    return {
      response: errorResponse(`Unknown evidence type: ${type}. Expected one of: ${RUN_EVIDENCE_TYPES.join(', ')}.`),
      exitCode: 1
    };
  }

  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;

  const normalizedSummary = summary.trim();
  if (!normalizedSummary) {
    return {
      response: errorResponse('Missing evidence summary. Usage: ome run evidence <type> "<summary>".'),
      exitCode: 1
    };
  }

  const transition = transitionRun(active.state, {
    type: 'record-evidence',
    evidence: {
      type,
      stage: active.state.stage,
      summary: normalizedSummary,
      createdAt: nowIso(),
      verificationStatus: type === 'verification_command' ? 'asserted' : undefined
    }
  }, LEGACY_RUN_POLICY);
  const state = transition.state;
  writeRunState(projectRoot, state);

  return {
    response: responseFromState(state, active.statePath),
    exitCode: 0
  };
}

export function executeRunVerification(projectRoot: string, command: string): RunCommandResult {
  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;
  if (active.state.stage !== 'verify') {
    return {
      response: responseFromState(active.state, active.statePath, [
        `Verification commands can only run during the verify stage; current stage is ${active.state.stage}.`
      ]),
      exitCode: 1
    };
  }

  const normalizedCommand = command.trim();
  if (!normalizedCommand) {
    return {
      response: responseFromState(active.state, active.statePath, ['Missing verification command.']),
      exitCode: 1
    };
  }

  try {
    runShellCommandInherit(normalizedCommand, projectRoot);
  } catch (error) {
    return {
      response: responseFromState(active.state, active.statePath, [
        `Verification command failed: ${error instanceof Error ? error.message : String(error)}`
      ]),
      exitCode: 1
    };
  }

  const transition = transitionRun(active.state, {
    type: 'record-evidence',
    evidence: {
      type: 'verification_command',
      stage: 'verify',
      summary: normalizedCommand,
      createdAt: nowIso(),
      verificationStatus: 'executed'
    }
  }, LEGACY_RUN_POLICY);
  active.state = transition.state;
  writeRunState(projectRoot, active.state);
  return {
    response: responseFromState(active.state, active.statePath),
    exitCode: 0
  };
}

export function nextRun(projectRoot: string): RunCommandResult {
  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;

  const state = active.state;
  const missing = missingEvidence(state);
  if (missing.length > 0) {
    return {
      response: responseFromState(state, active.statePath, missing.map(type => `Missing required evidence for ${state.stage}: ${type}.`)),
      exitCode: 1
    };
  }

  if (state.stage === 'learn') {
    return {
      response: responseFromState(state, active.statePath),
      exitCode: 0
    };
  }

  const transition = transitionRun(state, { type: 'advance' }, LEGACY_RUN_POLICY);
  writeRunState(projectRoot, transition.state);

  return {
    response: responseFromState(transition.state, active.statePath),
    exitCode: 0
  };
}

export function recordCompletedRun(projectRoot: string, state: RunState): CompletionResult {
  if (state.status !== 'completed' || !state.completedAt) {
    return { persisted: false, analyzed: false, error: 'Run state must be completed before recording memory.' };
  }

  try {
    const { recordExecutionMemory } = require('../skills/oh-my-engine/lib/memory-store');
    const memoryResult = recordExecutionMemory(projectRoot, {
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: state.completedAt,
      source: 'workflow_command',
      workflow: 'run',
      phase: 'ship',
      changeId: state.runId,
      changeSlug: state.runId,
      capability: 'delivery-runtime',
      captureLevel: 'summary',
      whyStored: 'Delivery run completed',
      summary: state.request,
      status: 'success',
      complexity: 'medium',
      filesTouched: [],
      testsRun: state.evidence
        .filter(item => item.type === 'verification_command' && item.verificationStatus === 'executed')
        .map(item => item.summary),
      durationMs: Math.max(0, new Date(state.completedAt).getTime() - new Date(state.createdAt).getTime()),
      errors: [],
      evidence: state.evidence.map(item => `${item.stage}:${item.type}:${item.summary}`),
      fixSummary: state.evidence.find(item => item.type === 'implementation_summary')?.summary || '',
      verificationSummary: state.evidence.find(item =>
        item.type === 'verification_command' && item.verificationStatus === 'executed'
      )?.summary || '',
      metadata: {
        evidenceCount: state.evidence.length,
        stages: RUN_STAGES
      }
    });

    let analyzed = false;
    try {
      const { autoAnalyzeEvolution } = require('../skills/oh-my-engine/lib/auto-evolution');
      autoAnalyzeEvolution(projectRoot);
      analyzed = true;
    } catch {
      // Evolution analysis remains best-effort and never changes run completion.
    }

    return { persisted: Boolean(memoryResult?.persisted), analyzed };
  } catch (error) {
    return {
      persisted: false,
      analyzed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function finishRun(projectRoot: string): RunCommandResult {
  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;

  const state = active.state;
  if (state.stage !== 'learn') {
    return {
      response: responseFromState(state, active.statePath, [`Run is not ready to finish. Current stage is ${state.stage}; advance through ship first.`]),
      exitCode: 1
    };
  }

  const transition = transitionRun(state, { type: 'finish', completedAt: nowIso() }, LEGACY_RUN_POLICY);
  writeRunState(projectRoot, transition.state);
  recordCompletedRun(projectRoot, transition.state);

  return {
    response: responseFromState(transition.state, active.statePath),
    exitCode: 0
  };
}

export function cancelRun(projectRoot: string, reason: string): RunCommandResult {
  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;

  const transition = transitionRun(active.state, { type: 'cancel', reason, cancelledAt: nowIso() }, LEGACY_RUN_POLICY);
  writeRunState(projectRoot, transition.state);

  return {
    response: responseFromState(transition.state, active.statePath),
    exitCode: 0
  };
}

export function renderRunResponse(response: RunResponse, format: RunOutputFormat): string {
  if (format === 'json') return `${JSON.stringify(response, null, 2)}\n`;

  const lines = [
    `Run: ${response.runId || '(none)'}`,
    `Status: ${response.status}`,
    `Stage: ${response.stage || '(none)'}`,
    `Next action: ${response.nextAction}`,
    `Required evidence: ${response.requiredEvidence.join(', ') || '(none)'}`
  ];

  if (response.blockingIssues.length > 0) {
    lines.push('Blocking issues:');
    for (const issue of response.blockingIssues) lines.push(`- ${issue}`);
  }

  return `${lines.join('\n')}\n`;
}

export function runDeliveryCommand(args: string[], projectRoot: string = process.cwd()): void {
  const format: RunOutputFormat = args.includes('--text') ? 'text' : 'json';
  const filteredArgs = args.filter(argument => argument !== '--text');
  const subcommand = filteredArgs[0] || 'status';
  let result: RunCommandResult;

  if (subcommand === 'start') {
    result = startRun(projectRoot, filteredArgs.slice(1).join(' '));
  } else if (subcommand === 'status') {
    result = statusRun(projectRoot);
  } else if (subcommand === 'next') {
    result = nextRun(projectRoot);
  } else if (subcommand === 'evidence') {
    result = recordRunEvidence(projectRoot, filteredArgs[1] || '', filteredArgs.slice(2).join(' '));
  } else if (subcommand === 'verify-command') {
    result = executeRunVerification(projectRoot, filteredArgs.slice(1).join(' '));
  } else if (subcommand === 'finish') {
    result = finishRun(projectRoot);
  } else if (subcommand === 'cancel') {
    result = cancelRun(projectRoot, filteredArgs.slice(1).join(' '));
  } else {
    result = {
      response: errorResponse(`Unknown run command: ${subcommand}`),
      exitCode: 1
    };
  }

  process.stdout.write(renderRunResponse(result.response, format));
  if (result.exitCode !== 0) process.exitCode = result.exitCode;
}

export type {
  RunCommandResult,
  RunEvidence,
  RunEvidenceType,
  RunOutputFormat,
  RunResponse,
  RunStage,
  RunState,
  RunStatus
};
