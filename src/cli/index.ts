const { listAdapters } = require('../adapters');
const { previewRulesSync, syncRulesInherit, validateRules, listRules, parseRuleMetadata } = require('../core/rules');
const { renderDoctorReport, runDoctorReport } = require('../core/doctor');
const { runSpecCommand } = require('../core/spec');
const { runMemoryCommand, runEvolveCommand } = require('../core/memory');
const { runGuidanceCommand } = require('../core/guidance');
const { initializeProject, initializeProjectRules, parseInitArgs, renderInitResult, renderInitRulesResult } = require('../core/init');
const { runAgentsCommand } = require('../core/agents');
const { runSuperpowersCommand } = require('../core/superpowers');
const { runMcpCommand } = require('../core/mcp');
const { runDeliveryCommand } = require('../core/run');
const { renderWorkflowCommand } = require('../core/workflows');
const { isLifecycleWorkflow, lifecycleWorkflowNames, renderLifecycleGuidance } = require('../core/lifecycle');
const { migrateJsonToMarkdown, validateMarkdownConfig } = require('../core/config-migrator');
const { getCurrentSession, collectExecutionInfo, inferExecutionStatus, calculateComplexity, calculateReusePotential, cleanupSession, cleanupStaleSessions, formatDuration } = require('../core/session');
const { runUpdateCommand } = require('../core/update');
const { findOmeProjects, updateWorkspace } = require('../core/workspace');

type CommandHandler = (args: string[]) => void;

const WORKFLOW_COMMANDS = ['bug', 'ui', 'comp', 'api', 'perf', 'security'] as const;
type WorkflowCommand = typeof WORKFLOW_COMMANDS[number];
type LifecycleCommand = 'define' | 'plan' | 'build' | 'test' | 'review' | 'ship';

function printHelp(): void {
  process.stdout.write(`Oh My Engine\n\nUsage:\n  ome <command> [args]\n\nDefault delivery workflow:\n  define <target>         Clarify goal, scope, success criteria, and assumptions\n  plan <target>           Explore code and render implementation guidance with test strategy\n  build <target>          Render incremental implementation guidance\n  test <target>           Render lifecycle test and regression guidance\n  review <target>         Render lifecycle code review guidance\n  ship <target>           Render final readiness and handoff guidance\n\nCommands:\n  doctor                  Check project and platform status\n  init [args]             Initialize .ome and project Agent rules\n  init-rules              Refresh scan context and local rule drafts for Agent personalization\n  agents <command>        Install/list/doctor global Agent command entries\n  superpowers <command>   Install/update/doctor Superpowers bridge entries\n  mcp <command>           Initialize, preview, or inspect design MCP configs\n  bug <description>       Render bug-analysis workflow guidance\n  ui <source>             Render UI restoration workflow guidance\n  comp <name>             Render component-generation workflow guidance\n  api <source>            Render API integration workflow guidance\n  perf <target>           Render performance optimization workflow guidance\n  security <concern>      Render security audit workflow guidance\n  run <command>           Manage an evidence-gated delivery workflow run\n  finish                  Finish workflow session and record execution\n  rules list              List all available rules\n  rules validate          Validate rule references\n  rules preview [platform] Show rule sync targets\n  rules init              Refresh scan context and local rule drafts\n  rules sync              Sync rules to platform files\n  config migrate          Migrate config.json to OME.md\n  config validate         Validate OME.md configuration\n  update [args]           Update global CLI from npm and sync project configurations\n  workspace <command>     Manage multiple OME projects in a workspace\n  guidance <workflow>     Render workflow memory guidance\n  memory view [args]      View engine memory\n  memory remember <text>  Remember an explicit preference or instruction\n  remember <text>         Shortcut for memory remember\n  evolve analyze [args]   Analyze memory evolution candidates\n  evolve review           Review pending candidates for approval\n  evolve verify-learning  Verify a learning candidate\n  evolve verify-skill     Verify a skill candidate\n  evolve adopt-learning   Adopt a verified learning\n  evolve adopt-skill      Adopt a verified generated skill\n  adapters list           List configured platform adapters\n  help                    Show this help\n`);
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
  const force = args.includes('--force') || args.includes('--force-rules');
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

function parseFinishOptions(args: string[]): Record<string, any> {
  const options: Record<string, any> = {
    evidence: [],
    exclusions: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const value = args[index + 1] && !args[index + 1].startsWith('--')
      ? args[index + 1]
      : 'true';

    if (value !== 'true') index += 1;

    if (key === 'evidence') {
      options.evidence.push(value);
    } else if (key === 'exclude' || key === 'exclusion') {
      options.exclusions.push(value);
    } else {
      options[key] = value;
    }
  }

  return options;
}

function hasExplicitFinishPayload(options: Record<string, any>): boolean {
  return Boolean(
    options.symptom ||
    options.impact ||
    options['root-cause'] ||
    options.rootCause ||
    options.fix ||
    options['fix-summary'] ||
    options.verification ||
    options.learning ||
    options['reusable-learning'] ||
    options.evidence.length > 0
  );
}

function hasCoreFinishPayload(options: Record<string, any>): boolean {
  return Boolean(
    options['root-cause'] ||
    options.rootCause ||
    options.fix ||
    options['fix-summary'] ||
    options.verification ||
    options.learning ||
    options['reusable-learning'] ||
    options.evidence.length > 0
  );
}

function printFinishRecordResult(result: Record<string, any>, sessionId: string, workflow: string, status: string, fileCount: number, durationMs: number): void {
  process.stdout.write(`✅ Execution recorded (${result.decision.captureLevel} level)\n`);
  process.stdout.write(`   Session: ${sessionId}\n`);
  process.stdout.write(`   Workflow: ${workflow}\n`);
  process.stdout.write(`   Status: ${status}\n`);
  process.stdout.write(`   Files: ${fileCount}\n`);
  process.stdout.write(`   Duration: ${formatDuration(durationMs)}\n`);
  process.stdout.write(`   Saved to: ${result.filePath}\n`);
}

function recordFinishEvent(event: Record<string, any>, sessionId: string, workflow: string, status: string, fileCount: number, durationMs: number, cleanup: boolean): void {
  const { recordExecutionMemory } = require('../skills/oh-my-engine/lib/memory-store');
  const result = recordExecutionMemory(process.cwd(), event);

  if (!result.persisted) {
    process.stdout.write(`⚠️  Execution not persisted\n`);
    process.stdout.write(`   Reason: ${result.decision?.reason || 'unknown'}\n`);
    if (cleanup) cleanupSession();
    return;
  }

  printFinishRecordResult(result, sessionId, workflow, status, fileCount, durationMs);

  try {
    const { autoAnalyzeEvolution } = require('../skills/oh-my-engine/lib/auto-evolution');
    autoAnalyzeEvolution(process.cwd());
  } catch (error) {
    process.stderr.write(`\nWarning: Auto-analysis failed: ${error instanceof Error ? error.message : String(error)}\n`);
  }

  if (cleanup) cleanupSession();
}

function runFinish(args: string[]): void {
  const finishOptions = parseFinishOptions(args);
  const session = getCurrentSession();

  if (!session) {
    if (hasExplicitFinishPayload(finishOptions)) {
      if (!hasCoreFinishPayload(finishOptions)) {
        process.stderr.write('No active workflow session found.\n');
        process.stderr.write('Sessionless finish memory requires core diagnostic fields such as --root-cause, --evidence, --fix, --verification, or --learning.\n');
        process.exitCode = 1;
        return;
      }

      const workflow = finishOptions.workflow || 'bug';
      const sessionId = `adhoc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const summary = finishOptions.symptom ||
        finishOptions['root-cause'] ||
        finishOptions.fix ||
        finishOptions.verification ||
        'Ad-hoc workflow completion';
      const event = {
        id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        source: 'workflow_command',
        workflow,
        phase: 'execution',
        changeId: sessionId,
        changeSlug: workflow,
        capability: workflow,
        captureLevel: 'summary',
        whyStored: 'Explicit finish payload recorded without active session',
        summary,
        status: 'success',
        filesTouched: [],
        testsRun: [],
        symptom: finishOptions.symptom || summary,
        impact: finishOptions.impact || '',
        rootCause: finishOptions['root-cause'] || finishOptions.rootCause || '',
        evidence: finishOptions.evidence,
        fixSummary: finishOptions.fix || finishOptions['fix-summary'] || '',
        verificationSummary: finishOptions.verification || '',
        reusableLearning: finishOptions.learning || finishOptions['reusable-learning'] || '',
        exclusions: finishOptions.exclusions,
        durationMs: 0,
        errors: [],
        metadata: {
          adHocFinish: true,
          reason: 'no_active_session'
        },
        complexity: 'medium',
        reusePotential: 0.8,
        novelty: 0.8,
        sensitivity: 0.0
      };

      recordFinishEvent(event, sessionId, workflow, 'success', 0, 0, false);
      return;
    }

    process.stderr.write('No active workflow session found.\n');
    process.stderr.write('Run an OME workflow command first, or pass structured finish fields such as --symptom, --root-cause, --fix, or --verification to record an ad-hoc completion.\n');
    process.exitCode = 1;
    return;
  }

  // 收集执行信息
  const executionInfo = collectExecutionInfo(session);

  if (session.workflow === 'bug' && !hasCoreFinishPayload(finishOptions)) {
    process.stdout.write('⚠️  Execution not persisted\n');
    process.stdout.write('   Reason: bug workflow memory requires core diagnostic fields.\n');
    process.stdout.write('   Pass --root-cause, --evidence, --fix, --verification, or --learning to record a useful memory.\n');
    process.stdout.write('   You can rerun ome finish with those fields even after this session is cleaned up.\n');
    cleanupSession();
    return;
  }

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
    symptom: finishOptions.symptom || session.input,
    impact: finishOptions.impact || '',
    rootCause: finishOptions['root-cause'] || finishOptions.rootCause || '',
    evidence: finishOptions.evidence,
    fixSummary: finishOptions.fix || finishOptions['fix-summary'] || '',
    verificationSummary: finishOptions.verification || '',
    reusableLearning: finishOptions.learning || finishOptions['reusable-learning'] || '',
    exclusions: [
      ...finishOptions.exclusions,
      ...executionInfo.noiseFilesIgnored
    ],
    durationMs: executionInfo.durationMs,
    errors: executionInfo.errorMessages,
    metadata: {
      noiseFilesIgnored: executionInfo.noiseFilesIgnored
    },
    // 添加用于决策的字段
    complexity,
    reusePotential,
    novelty: 0.5,
    sensitivity: 0.0
  };

  recordFinishEvent(event, session.id, session.workflow, inferredStatus, executionInfo.filesTouched.length, executionInfo.durationMs, true);
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
    run: runDeliveryCommand,
    finish: runFinish,
    rules: runRules,
    config: runConfig,
    spec: args => runSpecCommand(args[0], args.slice(1)),
    guidance: runGuidanceCommand,
    memory: args => runMemoryCommand(args[0], args.slice(1)),
    remember: args => runMemoryCommand('remember', args),
    evolve: args => runEvolveCommand(args[0], args.slice(1)),
    adapters: runAdapters,
    update: runUpdateCommand,
    workspace: args => {
      const subcommand = args[0] || 'list';
      if (subcommand === 'list') {
        const projects: string[] = findOmeProjects(process.cwd());
        process.stdout.write(`Found ${projects.length} OME projects:\n`);
        projects.forEach((p: string) => process.stdout.write(`  - ${p}\n`));
      } else if (subcommand === 'update') {
        const results: any[] = updateWorkspace(process.cwd(), { force: args.includes('--force') });
        process.stdout.write(`Updated ${results.filter((r: any) => r.success).length}/${results.length} projects.\n`);
      } else {
        throw new Error(`Unknown workspace command: ${subcommand}`);
      }
    }
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
  if (shortcut === 'remember') return run(['memory', 'remember', ...args]);
  if (shortcut === 'evolve') return run(['evolve', 'analyze', ...args]);
  if (shortcut === 'superpowers') return run(['superpowers', ...args]);
  throw new Error(`Unknown shortcut: ${shortcut}`);
}
