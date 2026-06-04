const { runAdoptLearningCandidate } = require('../skills/oh-my-engine/scripts/adopt-learning-candidate');
const { runAdoptSkillCandidate } = require('../skills/oh-my-engine/scripts/adopt-skill-candidate');
const { runEvolveAnalyzeCommand } = require('../skills/oh-my-engine-evolve/scripts/run-evolve');
const { runVerifyLearningCandidate } = require('../skills/oh-my-engine-evolve/scripts/verify-learning-candidate');
const { runVerifySkillCandidate } = require('../skills/oh-my-engine-evolve/scripts/verify-skill-candidate');
const { runReviewCandidates } = require('../skills/oh-my-engine-evolve/scripts/review-candidates');
const { runViewMemoryCommand } = require('../skills/oh-my-engine-memory/scripts/view-memory');
const { runRecordPreferenceMemory } = require('../skills/oh-my-engine/scripts/record-preference-memory');

function normalizeRememberArgs(args: string[]): string[] {
  const passthrough: string[] = [];
  const positional: string[] = [];
  let hasProjectRoot = false;
  let hasStatement = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument.startsWith('--')) {
      passthrough.push(argument);
      if (argument === '--project-root') hasProjectRoot = true;
      if (argument === '--statement') hasStatement = true;

      if (index + 1 < args.length && !args[index + 1].startsWith('--')) {
        passthrough.push(args[index + 1]);
        index += 1;
      }
      continue;
    }

    positional.push(argument);
  }

  if (!hasProjectRoot) {
    passthrough.push('--project-root', process.cwd());
  }

  if (!hasStatement && positional.length > 0) {
    passthrough.push('--statement', positional.join(' '));
  }

  return passthrough;
}

export function runMemoryCommand(command: string, args: string[]): void {
  if (command === 'view' || !command) {
    runViewMemoryCommand(args);
    return;
  }

  if (command === 'remember') {
    runRecordPreferenceMemory(normalizeRememberArgs(args));
    return;
  }

  throw new Error(`Unknown memory command: ${command}`);
}

export function runHistoryCommand(command: string, args: string[]): void {
  if (command === 'view' || !command) {
    runViewMemoryCommand(['--type', 'history', ...args]);
    return;
  }

  throw new Error(`Unknown history command: ${command}`);
}

export function runEvolveCommand(command: string, args: string[]): void {
  const commandHandlers: Record<string, (handlerArgs: string[]) => void> = {
    analyze: runEvolveAnalyzeCommand,
    'verify-learning': runVerifyLearningCandidate,
    'verify-skill': runVerifySkillCandidate,
    'adopt-learning': runAdoptLearningCandidate,
    'adopt-skill': runAdoptSkillCandidate,
    review: runReviewCandidates
  };

  const handler = commandHandlers[command];
  if (handler) {
    handler(args);
    return;
  }

  throw new Error(`Unknown evolve command: ${command}`);
}
