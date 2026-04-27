const { listAdapters } = require('../adapters');
const { previewRulesSync, syncRulesInherit, validateRules } = require('../core/rules');
const { renderDoctorReport, runDoctorReport } = require('../core/doctor');
const { runSpecCommand, listSpecCommands } = require('../core/spec');
const { runMemoryCommand, runEvolveCommand } = require('../core/memory');
const { runGuidanceCommand } = require('../core/guidance');
const { initializeProject, parseInitArgs, renderInitResult } = require('../core/init');
const { runAgentsCommand } = require('../core/agents');
const { renderWorkflowCommand } = require('../core/workflows');

function printHelp(): void {
  process.stdout.write(`Oh My Engine\n\nUsage:\n  ome <command> [args]\n\nCommands:\n  doctor                  Check project and platform status\n  init [args]             Initialize .ome, openspec, and project Agent rules\n  agents <command>        Install/list/doctor global Agent command entries\n  bug <description>       Render bug-analysis workflow guidance\n  ui <source>             Render UI restoration workflow guidance\n  comp <name>             Render component-generation workflow guidance\n  api <source>            Render API integration workflow guidance\n  rules validate          Validate rule references\n  rules preview [platform] Show rule sync targets\n  rules sync              Sync rules to platform files\n  spec <command> [args]   Run spec workflow commands\n  guidance <workflow>     Render workflow memory guidance\n  memory view [args]      View engine memory\n  evolve analyze [args]   Analyze memory evolution candidates\n  evolve verify-learning  Verify a learning candidate\n  evolve verify-skill     Verify a skill candidate\n  evolve adopt-learning   Adopt a verified learning\n  evolve adopt-skill      Adopt a verified generated skill\n  adapters list           List configured platform adapters\n  help                    Show this help\n\nSpec commands:\n  ${listSpecCommands().join(', ')}\n`);
}

function runDoctor(): void {
  const report = runDoctorReport();
  process.stdout.write(renderDoctorReport(report));
  if (report.issues.length > 0) process.exitCode = 1;
}

function runInit(args: string[]): void {
  const result = initializeProject(parseInitArgs(args));
  process.stdout.write(renderInitResult(result));
}

function runRules(args: string[]): void {
  const subcommand = args[0] || 'help';

  if (subcommand === 'validate') {
    const report = validateRules();
    process.stdout.write(`Rules valid: ${report.ok ? 'yes' : 'no'}\n`);
    process.stdout.write(`Rules found: ${report.rules.join(', ') || '(none)'}\n`);
    for (const issue of report.issues) {
      process.stdout.write(`- ${issue.severity}: ${issue.message}\n`);
    }
    if (!report.ok) process.exitCode = 1;
    return;
  }

  if (subcommand === 'preview') {
    const targets = previewRulesSync(args[1]);
    process.stdout.write('Rules sync preview\n');
    for (const target of targets) {
      process.stdout.write(`- ${target.platform}: ${target.action} ${target.target}\n`);
    }
    return;
  }

  if (subcommand === 'sync') {
    syncRulesInherit(args.slice(1));
    return;
  }

  throw new Error(`Unknown rules command: ${subcommand}`);
}

function runAdapters(args: string[]): void {
  const subcommand = args[0] || 'list';
  if (subcommand !== 'list') {
    throw new Error(`Unknown adapters command: ${subcommand}`);
  }

  for (const adapter of listAdapters()) {
    process.stdout.write(`${adapter.id}\t${adapter.name}\t${adapter.type}\t${adapter.target}\t${adapter.detected ? 'present' : 'missing'}\n`);
  }
}

function main(argv: string[]): void {
  const command = argv[0] || 'help';
  const args = argv.slice(1);

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'doctor') return runDoctor();
  if (command === 'init') return runInit(args);
  if (command === 'agents') return runAgentsCommand(args);
  if (command === 'bug') {
    process.stdout.write(renderWorkflowCommand('bug', args));
    return;
  }
  if (command === 'ui') {
    process.stdout.write(renderWorkflowCommand('ui', args));
    return;
  }
  if (command === 'comp') {
    process.stdout.write(renderWorkflowCommand('comp', args));
    return;
  }
  if (command === 'api') {
    process.stdout.write(renderWorkflowCommand('api', args));
    return;
  }
  if (command === 'rules') return runRules(args);
  if (command === 'spec') return runSpecCommand(args[0], args.slice(1));
  if (command === 'guidance') return runGuidanceCommand(args);
  if (command === 'memory') return runMemoryCommand(args[0], args.slice(1));
  if (command === 'evolve') return runEvolveCommand(args[0], args.slice(1));
  if (command === 'adapters') return runAdapters(args);

  throw new Error(`Unknown command: ${command}`);
}

export function run(argv: string[]): void {
  try {
    main(argv);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export function runShortcut(shortcut: string, args: string[]): void {
  if (shortcut === 'init') return run(['init', ...args]);
  if (shortcut === 'bug') return run(['bug', ...args]);
  if (shortcut === 'ui') return run(['ui', ...args]);
  if (shortcut === 'comp') return run(['comp', ...args]);
  if (shortcut === 'api') return run(['api', ...args]);
  if (shortcut === 'spec') return run(['spec', ...args]);
  if (shortcut === 'memory') return run(['memory', 'view', ...args]);
  if (shortcut === 'evolve') return run(['evolve', 'analyze', ...args]);
  throw new Error(`Unknown shortcut: ${shortcut}`);
}
