const { listAdapters } = require('../adapters');
const { previewRulesSync, syncRulesInherit, validateRules, listRules, parseRuleMetadata } = require('../core/rules');
const { renderDoctorReport, runDoctorReport } = require('../core/doctor');
const { runSpecCommand, listSpecCommands } = require('../core/spec');
const { runMemoryCommand, runEvolveCommand } = require('../core/memory');
const { runGuidanceCommand } = require('../core/guidance');
const { initializeProject, initializeProjectRules, parseInitArgs, renderInitResult, renderInitRulesResult } = require('../core/init');
const { runAgentsCommand } = require('../core/agents');
const { runSuperpowersCommand } = require('../core/superpowers');
const { runMcpCommand } = require('../core/mcp');
const { renderWorkflowCommand } = require('../core/workflows');
const { isLifecycleWorkflow, lifecycleWorkflowNames, renderLifecycleGuidance } = require('../core/lifecycle');
const { migrateJsonToMarkdown, validateMarkdownConfig } = require('../core/config-migrator');
const { getCurrentSession, collectExecutionInfo, inferExecutionStatus, calculateComplexity, calculateReusePotential, cleanupSession, cleanupStaleSessions, formatDuration } = require('../core/session');

type CommandHandler = (args: string[]) => void;

const WORKFLOW_COMMANDS = ['bug', 'ui', 'comp', 'api', 'perf', 'security'] as const;
type WorkflowCommand = typeof WORKFLOW_COMMANDS[number];
type LifecycleCommand = 'define' | 'plan' | 'build' | 'test' | 'review' | 'ship';

function printHelp(): void {
  process.stdout.write(`Oh My Engine\n\nUsage:\n  ome <command> [args]\n\nCommands:\n  doctor                  Check project and platform status\n  init [args]             Initialize .ome, spec workspace, and project Agent rules\n  init-rules              Refresh scan context and local rule drafts for Agent personalization\n  agents <command>        Install/list/doctor global Agent command entries\n  superpowers <command>   Install/update/doctor Superpowers bridge entries\n  mcp <command>           Initialize, preview, or inspect design MCP configs\n  bug <description>       Render bug-analysis workflow guidance\n  ui <source>             Render UI restoration workflow guidance\n  comp <name>             Render component-generation workflow guidance\n  api <source>            Render API integration workflow guidance\n  perf <target>           Render performance optimization workflow guidance\n  security <concern>      Render security audit workflow guidance\n  define <target>         Clarify goal, scope, success criteria, and assumptions\n  plan <target>           Render implementation plan guidance with test strategy\n  build <target>          Render incremental implementation guidance\n  test <target>           Render lifecycle test and regression guidance\n  review <target>         Render lifecycle code review guidance\n  ship <target>           Render final readiness and handoff guidance\n  finish                  Finish workflow session and record execution\n  rules list              List all available rules\n  rules validate          Validate rule references\n  rules preview [platform] Show rule sync targets\n  rules init              Refresh scan context and local rule drafts\n  rules sync              Sync rules to platform files\n  config migrate          Migrate config.json to OME.md\n  config validate         Validate OME.md configuration\n  spec <command> [args]   Run spec workflow commands\n  guidance <workflow>     Render workflow memory guidance\n  memory view [args]      View engine memory\n  evolve analyze [args]   Analyze memory evolution candidates\n  evolve review           Review pending candidates for approval\n  evolve verify-learning  Verify a learning candidate\n  evolve verify-skill     Verify a skill candidate\n  evolve adopt-learning   Adopt a verified learning\n  evolve adopt-skill      Adopt a verified generated skill\n  adapters list           List configured platform adapters\n  help                    Show this help\n\nSpec commands:\n  ${listSpecCommands().join(', ')}\n`);
}

function runWorkflow(workflow: WorkflowCommand, args: string[]): void {
  process.stdout.write(renderWorkflowCommand(workflow, args));
}

function runLifecycle(workflow: LifecycleCommand, args: string[]): void {
  process.stdout.write(renderLifecycleGuidance({
    workflow,
    input: args.join(' '),
    cwd: process.cwd()
  }));
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

function runInitRules(args: string[]): void {
  const force = !args.includes('--preserve');
  const result = initializeProjectRules(process.cwd(), force);
  process.stdout.write(renderInitRulesResult(result));
}

function runRules(args: string[]): void {
  const subcommand = args[0] || 'help';

  if (subcommand === 'list') {
    const rules = listRules();
    const categories = ['universal', 'framework', 'domain', 'toolchain', 'other'];

    process.stdout.write(`📚 规则列表 (共 ${Object.keys(rules).length} 个)\n\n`);

    for (const category of categories) {
      const categoryRules = Object.keys(rules).filter(name => {
        if (category === 'other') {
          return !name.startsWith('universal-') &&
                 !name.startsWith('framework-') &&
                 !name.startsWith('domain-') &&
                 !name.startsWith('toolchain-');
        }
        return name.startsWith(`${category}-`);
      });

      if (categoryRules.length > 0) {
        const categoryName = {
          universal: '通用规则',
          framework: '框架规则',
          domain: '领域规则',
          toolchain: '工具链规则',
          other: '其他规则'
        }[category];

        process.stdout.write(`${categoryName}:\n`);
        for (const ruleName of categoryRules.sort()) {
          const metadata = parseRuleMetadata(rules[ruleName]);
          const desc = metadata?.tags?.join(', ') || '';
          process.stdout.write(`  - ${ruleName}${desc ? ` (${desc})` : ''}\n`);
        }
        process.stdout.write('\n');
      }
    }
    return;
  }

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

  if (subcommand === 'init') {
    runInitRules(args.slice(1));
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

function runFinish(args: string[]): void {
  const session = getCurrentSession();

  if (!session) {
    process.stderr.write('No active workflow session found.\n');
    process.exitCode = 1;
    return;
  }

  // 收集执行信息
  const executionInfo = collectExecutionInfo(session);

  // 智能推断状态
  const inferredStatus = inferExecutionStatus(executionInfo);

  // 计算复杂度和重用潜力
  const complexity = calculateComplexity(executionInfo);
  const reusePotential = calculateReusePotential(executionInfo);

  // 生成执行事件
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
    whyStored: 'Workflow execution completed',
    summary: session.input,
    status: inferredStatus,
    filesTouched: executionInfo.filesTouched,
    testsRun: [],
    durationMs: executionInfo.durationMs,
    errors: executionInfo.errorMessages,
    metadata: {},
    // 添加用于决策的字段
    complexity,
    reusePotential,
    novelty: 0.5,
    sensitivity: 0.0
  };

  // 记录到记忆系统
  const { recordExecutionMemory } = require('../skills/oh-my-engine/lib/memory-store');
  const result = recordExecutionMemory(process.cwd(), event);

  if (!result.persisted) {
    process.stdout.write(`⚠️  Execution not persisted\n`);
    process.stdout.write(`   Reason: ${result.decision?.reason || 'unknown'}\n`);
    cleanupSession();
    return;
  }

  process.stdout.write(`✅ Execution recorded (${result.decision.captureLevel} level)\n`);
  process.stdout.write(`   Session: ${session.id}\n`);
  process.stdout.write(`   Workflow: ${session.workflow}\n`);
  process.stdout.write(`   Status: ${inferredStatus}\n`);
  process.stdout.write(`   Files: ${executionInfo.filesTouched.length}\n`);
  process.stdout.write(`   Duration: ${formatDuration(executionInfo.durationMs)}\n`);
  process.stdout.write(`   Saved to: ${result.filePath}\n`);

  // 自动触发增量分析
  try {
    const { autoAnalyzeEvolution } = require('../skills/oh-my-engine/lib/auto-evolution');
    autoAnalyzeEvolution(process.cwd());
  } catch (error) {
    // 分析失败不影响记录流程
    process.stderr.write(`\nWarning: Auto-analysis failed: ${error instanceof Error ? error.message : String(error)}\n`);
  }

  cleanupSession();
}

function runConfig(args: string[]): void {
  const subcommand = args[0] || 'help';

  if (subcommand === 'migrate') {
    const dryRun = args.includes('--dry-run');
    const backup = !args.includes('--no-backup');
    const verbose = args.includes('--verbose');

    const result = migrateJsonToMarkdown(process.cwd(), { dryRun, backup, verbose });

    if (result.success) {
      process.stdout.write(`✅ ${result.message}\n`);
      process.stdout.write(`📄 Created: ${result.omemdPath}\n`);
      if (result.backupPaths && result.backupPaths.length > 0) {
        process.stdout.write(`💾 Backups:\n`);
        for (const backupPath of result.backupPaths) {
          process.stdout.write(`   - ${backupPath}\n`);
        }
      }
    } else {
      process.stderr.write(`❌ ${result.message}\n`);
      process.exitCode = 1;
    }
    return;
  }

  if (subcommand === 'validate') {
    const validation = validateMarkdownConfig(process.cwd());

    if (validation.valid) {
      process.stdout.write(`✅ OME.md is valid\n`);
    } else {
      process.stdout.write(`❌ OME.md validation failed\n`);
    }

    if (validation.errors.length > 0) {
      process.stdout.write(`\nErrors:\n`);
      for (const error of validation.errors) {
        process.stdout.write(`  - ${error}\n`);
      }
    }

    if (validation.warnings.length > 0) {
      process.stdout.write(`\nWarnings:\n`);
      for (const warning of validation.warnings) {
        process.stdout.write(`  - ${warning}\n`);
      }
    }

    if (!validation.valid) process.exitCode = 1;
    return;
  }

  throw new Error(`Unknown config command: ${subcommand}`);
}

function buildCommandHandlers(): Record<string, CommandHandler> {
  const handlers: Record<string, CommandHandler> = {
    doctor: () => runDoctor(),
    init: runInit,
    'init-rules': runInitRules,
    agents: runAgentsCommand,
    superpowers: runSuperpowersCommand,
    mcp: runMcpCommand,
    finish: runFinish,
    rules: runRules,
    config: runConfig,
    spec: args => runSpecCommand(args[0], args.slice(1)),
    guidance: runGuidanceCommand,
    memory: args => runMemoryCommand(args[0], args.slice(1)),
    evolve: args => runEvolveCommand(args[0], args.slice(1)),
    adapters: runAdapters
  };

  for (const workflow of WORKFLOW_COMMANDS) {
    handlers[workflow] = args => runWorkflow(workflow, args);
  }

  for (const workflow of lifecycleWorkflowNames()) {
    handlers[workflow] = args => runLifecycle(workflow, args);
  }

  return handlers;
}

const COMMAND_HANDLERS = buildCommandHandlers();

function main(argv: string[]): void {
  // 在执行任何命令前，清理过期会话
  cleanupStaleSessions();

  const command = argv[0] || 'help';
  const args = argv.slice(1);

  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const handler = COMMAND_HANDLERS[command];
  if (handler) {
    handler(args);
    return;
  }

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
  if (shortcut === 'init-rules') return run(['init-rules', ...args]);
  if ((WORKFLOW_COMMANDS as readonly string[]).includes(shortcut)) return run([shortcut, ...args]);
  if (isLifecycleWorkflow(shortcut)) return run([shortcut, ...args]);
  if (shortcut === 'spec') return run(['spec', ...args]);
  if (shortcut === 'memory') return run(['memory', 'view', ...args]);
  if (shortcut === 'evolve') return run(['evolve', 'analyze', ...args]);
  if (shortcut === 'superpowers') return run(['superpowers', ...args]);
  throw new Error(`Unknown shortcut: ${shortcut}`);
}
