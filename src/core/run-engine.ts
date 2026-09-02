export type RunStatus = 'active' | 'completed' | 'cancelled';
export type RunStage = 'validate' | 'define' | 'plan' | 'build' | 'verify' | 'review' | 'ship' | 'learn';
export type RunEvidenceType =
  | 'requirement_summary'
  | 'plan_artifact'
  | 'implementation_summary'
  | 'verification_command'
  | 'review_summary'
  | 'ship_summary';

export interface RunEvidence {
  type: RunEvidenceType;
  stage: RunStage;
  summary: string;
  createdAt: string;
  verificationStatus?: 'asserted' | 'executed';
  toolCallId?: string;
}

export interface RunPlanApproval {
  approvedAt: string;
  source: 'user-command';
}

export interface RunState {
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
  planApproval?: RunPlanApproval;
  evidence: RunEvidence[];
}

export interface RunPolicy {
  initialStage: RunStage;
  requirePlanApproval: boolean;
  requireExecutedVerification: boolean;
  allowStageSkip: boolean;
}

export type RunAction =
  | { type: 'record-evidence'; evidence: RunEvidence }
  | { type: 'approve-plan'; approvedAt: string; source: 'user-command' }
  | { type: 'advance'; toStage?: RunStage }
  | { type: 'finish'; completedAt?: string }
  | { type: 'cancel'; reason: string; cancelledAt?: string };

export interface RunTransition {
  state: RunState;
  blockingIssues: string[];
  nextAction: string;
}

export interface CreateRunStateOptions {
  runId?: string;
  now?: string;
  policy?: RunPolicy;
}

export const RUN_STAGES: readonly RunStage[] = [
  'validate',
  'define',
  'plan',
  'build',
  'verify',
  'review',
  'ship',
  'learn'
];

export const RUN_EVIDENCE_TYPES: readonly RunEvidenceType[] = [
  'requirement_summary',
  'plan_artifact',
  'implementation_summary',
  'verification_command',
  'review_summary',
  'ship_summary'
];

export const LEGACY_RUN_POLICY: RunPolicy = Object.freeze({
  initialStage: 'validate',
  requirePlanApproval: false,
  requireExecutedVerification: true,
  allowStageSkip: false
});

export const OME_ENGINEER_POLICY: RunPolicy = Object.freeze({
  initialStage: 'define',
  requirePlanApproval: true,
  requireExecutedVerification: true,
  allowStageSkip: false
});

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

function generatedRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneState(state: RunState): RunState {
  return {
    ...state,
    ...(state.planApproval ? { planApproval: { ...state.planApproval } } : {}),
    evidence: state.evidence.map(item => ({ ...item }))
  };
}

function transition(state: RunState, blockingIssues: string[] = []): RunTransition {
  return {
    state,
    blockingIssues,
    nextAction: STAGE_ACTIONS[state.stage]
  };
}

function nextStage(stage: RunStage): RunStage {
  const index = RUN_STAGES.indexOf(stage);
  return RUN_STAGES[Math.min(index + 1, RUN_STAGES.length - 1)] as RunStage;
}

export function requiredEvidenceForStage(stage: RunStage): RunEvidenceType[] {
  return [...STAGE_EVIDENCE[stage]];
}

export function missingRunEvidence(state: RunState, policy: RunPolicy = LEGACY_RUN_POLICY): RunEvidenceType[] {
  const current = state.evidence.filter(item => item.stage === state.stage);
  return requiredEvidenceForStage(state.stage).filter(type => {
    if (type === 'verification_command' && policy.requireExecutedVerification) {
      return !current.some(item => item.type === type && item.verificationStatus === 'executed');
    }
    return !current.some(item => item.type === type);
  });
}

export function runNextAction(stage: RunStage): string {
  return STAGE_ACTIONS[stage];
}

export function createRunState(request: string, options: CreateRunStateOptions = {}): RunState {
  const normalized = request.trim();
  if (!normalized) throw new Error('Run request must not be empty.');
  const now = options.now || new Date().toISOString();
  const policy = options.policy || LEGACY_RUN_POLICY;
  return {
    version: 1,
    runId: options.runId || generatedRunId(),
    request: normalized,
    status: 'active',
    stage: policy.initialStage,
    createdAt: now,
    updatedAt: now,
    evidence: []
  };
}

export function transitionRun(
  input: RunState,
  action: RunAction,
  policy: RunPolicy = LEGACY_RUN_POLICY
): RunTransition {
  const state = cloneState(input);
  if (state.status !== 'active') {
    return transition(state, [`Run is ${state.status}; no further transitions are allowed.`]);
  }

  if (action.type === 'record-evidence') {
    const evidence = { ...action.evidence, summary: action.evidence.summary.trim() };
    if (!RUN_EVIDENCE_TYPES.includes(evidence.type)) {
      return transition(state, [`Unknown evidence type: ${String(evidence.type)}.`]);
    }
    if (evidence.stage !== state.stage) {
      return transition(state, [`Evidence stage ${evidence.stage} does not match current stage ${state.stage}.`]);
    }
    if (!evidence.summary) return transition(state, ['Evidence summary must not be empty.']);
    state.evidence.push(evidence);
    state.updatedAt = evidence.createdAt;
    return transition(state);
  }

  if (action.type === 'approve-plan') {
    if (state.stage !== 'plan') return transition(state, ['Plan approval is only valid during the plan stage.']);
    state.planApproval = { approvedAt: action.approvedAt, source: action.source };
    state.updatedAt = action.approvedAt;
    return transition(state);
  }

  if (action.type === 'advance') {
    const missing = missingRunEvidence(state, policy);
    const blocking = missing.map(type => `Missing required evidence for ${state.stage}: ${type}.`);
    if (state.stage === 'plan' && policy.requirePlanApproval && !state.planApproval) {
      blocking.push('Plan approval must come from the user command before build.');
    }
    if (blocking.length > 0) return transition(state, blocking);
    if (state.stage === 'learn') return transition(state);

    const expected = nextStage(state.stage);
    const target = action.toStage || expected;
    if (!policy.allowStageSkip && target !== expected) {
      return transition(state, [`Cannot advance from ${state.stage} directly to ${target}.`]);
    }
    state.stage = target;
    return transition(state);
  }

  if (action.type === 'finish') {
    if (state.stage !== 'learn') {
      return transition(state, [`Run is not ready to finish. Current stage is ${state.stage}; advance through ship first.`]);
    }
    const completedAt = action.completedAt || state.updatedAt;
    state.status = 'completed';
    state.completedAt = completedAt;
    state.updatedAt = completedAt;
    return transition(state);
  }

  const cancelledAt = action.cancelledAt || state.updatedAt;
  state.status = 'cancelled';
  state.cancelReason = action.reason.trim() || 'No reason provided.';
  state.cancelledAt = cancelledAt;
  state.updatedAt = cancelledAt;
  return transition(state);
}
