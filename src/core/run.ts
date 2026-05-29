const fs = require('node:fs');
const path = require('node:path');

const { ENGINE_DIR } = require('./paths');
const { writeJsonFile } = require('./file-system');

type RunStatus = 'active' | 'completed' | 'cancelled';
type RunStage = 'validate' | 'define' | 'plan' | 'build' | 'verify' | 'review' | 'ship' | 'learn';
type RunEvidenceType =
  | 'requirement_summary'
  | 'plan_artifact'
  | 'implementation_summary'
  | 'verification_command'
  | 'review_summary'
  | 'ship_summary';

interface RunEvidence {
  type: RunEvidenceType;
  stage: RunStage;
  summary: string;
  createdAt: string;
}

interface RunState {
  version: 1;
  runId: string;
  request: string;
  status: RunStatus;
  stage: RunStage;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  evidence: RunEvidence[];
}

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

type RunOutputFormat = 'json' | 'text';

const STAGES: RunStage[] = ['validate', 'define', 'plan', 'build', 'verify', 'review', 'ship', 'learn'];
const EVIDENCE_TYPES: RunEvidenceType[] = [
  'requirement_summary',
  'plan_artifact',
  'implementation_summary',
  'verification_command',
  'review_summary',
  'ship_summary'
];

const STAGE_EVIDENCE: Record<RunStage, RunEvidenceType[]> = {
  validate: ['requirement_summary'],
  define: ['requirement_summary'],
  plan: ['plan_artifact'],
  build: ['implementation_summary'],
  verify: ['verification_command'],
  review: ['review_summary'],
  ship: ['ship_summary'],
  learn: []
};

const STAGE_ACTIONS: Record<RunStage, string> = {
  validate: 'Clarify the request into a concrete goal, scope, and success criteria.',
  define: 'Produce the requirement summary with scope, non-goals, assumptions, and open questions.',
  plan: 'Create an implementation plan with interfaces, risks, and test strategy.',
  build: 'Implement the planned change in small verified slices.',
  verify: 'Register successful verification evidence such as a test command or manual acceptance.',
  review: 'Register review findings or an explicit no-findings review summary.',
  ship: 'Prepare the final delivery summary, known risks, and release or handoff evidence.',
  learn: 'Finish the run and let OME summarize the completed delivery evidence.'
};

const EXIT_CODE_MEANING = '0 means stage is actionable or advanced; non-zero means blocked or invalid.';

function nowIso(): string {
  return new Date().toISOString();
}

function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function runsDirectory(projectRoot: string): string {
  return path.join(projectRoot, ENGINE_DIR, 'runs');
}

function runStatePath(projectRoot: string, runId: string): string {
  return path.join(runsDirectory(projectRoot), runId, 'state.json');
}

function isEvidenceType(value: string): value is RunEvidenceType {
  return EVIDENCE_TYPES.includes(value as RunEvidenceType);
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
  return STAGE_EVIDENCE[stage];
}

function evidenceForStage(state: RunState): RunEvidence[] {
  return state.evidence.filter(item => item.stage === state.stage);
}

function missingEvidence(state: RunState): RunEvidenceType[] {
  const present = new Set(evidenceForStage(state).map(item => item.type));
  return requiredEvidenceFor(state.stage).filter(type => !present.has(type));
}

function responseFromState(state: RunState, statePath?: string, blockingIssues: string[] = []): RunResponse {
  return {
    runId: state.runId,
    request: state.request,
    status: state.status,
    stage: state.stage,
    nextAction: STAGE_ACTIONS[state.stage],
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

function advanceStage(stage: RunStage): RunStage {
  const index = STAGES.indexOf(stage);
  return STAGES[Math.min(index + 1, STAGES.length - 1)];
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

  const timestamp = nowIso();
  const state: RunState = {
    version: 1,
    runId: generateRunId(),
    request: normalizedRequest,
    status: 'active',
    stage: 'validate',
    createdAt: timestamp,
    updatedAt: timestamp,
    evidence: []
  };

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
      response: errorResponse(`Unknown evidence type: ${type}. Expected one of: ${EVIDENCE_TYPES.join(', ')}.`),
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

  const state = active.state;
  state.evidence.push({
    type,
    stage: state.stage,
    summary: normalizedSummary,
    createdAt: nowIso()
  });
  writeRunState(projectRoot, state);

  return {
    response: responseFromState(state, active.statePath),
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

  state.stage = advanceStage(state.stage);
  writeRunState(projectRoot, state);

  return {
    response: responseFromState(state, active.statePath),
    exitCode: 0
  };
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

  state.status = 'completed';
  state.completedAt = nowIso();
  writeRunState(projectRoot, state);

  try {
    const { recordExecutionMemory } = require('../skills/oh-my-engine/lib/memory-store');
    recordExecutionMemory(projectRoot, {
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
      filesTouched: [],
      testsRun: state.evidence.filter(item => item.type === 'verification_command').map(item => item.summary),
      durationMs: Math.max(0, new Date(state.completedAt).getTime() - new Date(state.createdAt).getTime()),
      errors: [],
      metadata: {
        evidenceCount: state.evidence.length,
        stages: STAGES
      }
    });

    const { autoAnalyzeEvolution } = require('../skills/oh-my-engine/lib/auto-evolution');
    autoAnalyzeEvolution(projectRoot);
  } catch (error) {
    // Memory and evolution capture are best-effort; the run state remains the source of truth.
  }

  return {
    response: responseFromState(state, active.statePath),
    exitCode: 0
  };
}

export function cancelRun(projectRoot: string, reason: string): RunCommandResult {
  const active = getActiveRunOrError(projectRoot);
  if ('exitCode' in active) return active;

  const state = active.state;
  state.status = 'cancelled';
  state.cancelReason = reason.trim() || 'No reason provided.';
  state.cancelledAt = nowIso();
  writeRunState(projectRoot, state);

  return {
    response: responseFromState(state, active.statePath),
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
