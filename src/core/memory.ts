const { runAdoptLearningCandidate } = require('../skills/oh-my-engine/scripts/adopt-learning-candidate');
const { runAdoptSkillCandidate } = require('../skills/oh-my-engine/scripts/adopt-skill-candidate');
const { runEvolveAnalyzeCommand } = require('../skills/oh-my-engine-evolve/scripts/run-evolve');
const { runVerifyLearningCandidate } = require('../skills/oh-my-engine-evolve/scripts/verify-learning-candidate');
const { runVerifySkillCandidate } = require('../skills/oh-my-engine-evolve/scripts/verify-skill-candidate');
const { runViewMemoryCommand } = require('../skills/oh-my-engine-memory/scripts/view-memory');

export function runMemoryCommand(command: string, args: string[]): void {
  if (command !== 'view') {
    throw new Error(`Unknown memory command: ${command}`);
  }

  runViewMemoryCommand(args);
}

export function runEvolveCommand(command: string, args: string[]): void {
  const commandHandlers: Record<string, (handlerArgs: string[]) => void> = {
    analyze: runEvolveAnalyzeCommand,
    'verify-learning': runVerifyLearningCandidate,
    'verify-skill': runVerifySkillCandidate,
    'adopt-learning': runAdoptLearningCandidate,
    'adopt-skill': runAdoptSkillCandidate
  };

  const handler = commandHandlers[command];
  if (handler) {
    handler(args);
    return;
  }

  throw new Error(`Unknown evolve command: ${command}`);
}
