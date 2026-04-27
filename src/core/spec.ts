const fs = require('node:fs');
const path = require('node:path');

const { initializeProject, parseInitArgs } = require('./init');


const SPEC_COMMANDS = ['init', 'import', 'decompose', 'propose', 'plan', 'apply', 'status', 'verify', 'archive'];

interface SpecProposeOptions {
  changeId: string;
  mode: 'feature' | 'design-first' | 'bugfix';
  capability: string;
  force: boolean;
  projectRoot: string;
  repoRoot: string;
}

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
}

function utcIso(): string {
  return new Date().toISOString();
}

function renderTemplate(sourcePath: string, replacements: Record<string, string>): string {
  let content = fs.readFileSync(sourcePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  return content;
}

function writeFile(filePath: string, content: string): void {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function countOpenCheckboxes(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').filter((line: string) => /^- \[ \]/.test(line)).length;
}

function countDoneCheckboxes(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').filter((line: string) => /^- \[[xX]\]/.test(line)).length;
}

function parseSpecProposeArgs(args: string[]): SpecProposeOptions {
  if (args.length < 1) {
    throw new Error('Usage: ome spec propose <change-id> [--design-first] [--bugfix] [--capability <name>] [--force]');
  }

  const options: SpecProposeOptions = {
    changeId: args[0],
    mode: 'feature',
    capability: '',
    force: false,
    projectRoot: process.cwd(),
    repoRoot: process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..')
  };

  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--design-first') {
      options.mode = 'design-first';
      continue;
    }

    if (argument === '--bugfix') {
      options.mode = 'bugfix';
      continue;
    }

    if (argument === '--capability') {
      if (index + 1 >= args.length) throw new Error('Missing value for --capability');
      options.capability = args[index + 1];
      index += 1;
      continue;
    }

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    throw new Error(`Unknown option: ${argument}`);
  }

  return options;
}

function recordSpecExecutionMemory(projectRoot: string, event: Record<string, any>): void {
  const { recordExecutionMemory } = require('../skills/oh-my-engine/lib/memory-store');
  recordExecutionMemory(projectRoot, event);
}

export function listSpecCommands(): string[] {
  return SPEC_COMMANDS;
}

export function runSpecInit(args: string[]): void {
  const result = initializeProject(parseInitArgs(args));
  process.stdout.write(`Initialized Oh My Engine project in ${result.projectRoot}\n`);
  process.stdout.write(`Template: ${result.template}\n`);
  process.stdout.write(`Config: ${result.configCreated ? 'created' : 'preserved'}\n`);
  process.stdout.write(`openspec/project.md: ${result.projectCreated ? 'created' : 'preserved'}\n`);
  process.stdout.write(`Rule files updated: ${result.rulesUpdated}\n`);
}

export function runSpecPropose(args: string[]): void {
  const options = parseSpecProposeArgs(args);
  const changeSlug = slugify(options.changeId);
  if (!changeSlug) throw new Error(`Invalid change id: ${options.changeId}`);

  const capabilitySlug = slugify(options.capability || changeSlug);
  if (!capabilitySlug) throw new Error(`Invalid capability: ${options.capability}`);

  initializeProject({
    force: false,
    template: 'default',
    projectRoot: options.projectRoot,
    repoRoot: options.repoRoot
  });

  const changeDirectory = path.join(options.projectRoot, 'openspec', 'changes', changeSlug);
  const changeSpecDirectory = path.join(changeDirectory, 'specs', capabilitySlug);
  const memoryFile = path.join(options.projectRoot, '.oh-my-engine', 'memory', 'specs', `${changeSlug}.json`);

  if (fs.existsSync(changeDirectory) && !options.force) {
    const hasExistingChange = ['proposal.md', 'design.md', 'tasks.md'].some(name => fs.existsSync(path.join(changeDirectory, name))) || fs.existsSync(path.join(changeDirectory, 'specs'));
    if (hasExistingChange) {
      throw new Error(`Change already exists: ${changeDirectory}\nUse --force to overwrite.`);
    }
  }

  if (options.force && fs.existsSync(changeDirectory)) {
    for (const fileName of ['proposal.md', 'design.md', 'tasks.md']) {
      fs.rmSync(path.join(changeDirectory, fileName), { force: true });
    }
    fs.rmSync(path.join(changeDirectory, 'specs'), { recursive: true, force: true });
  }

  ensureDirectory(changeSpecDirectory);
  ensureDirectory(path.dirname(memoryFile));

  const templateRoot = path.join(options.repoRoot, 'skills', 'oh-my-engine-spec', 'templates');
  const proposalTemplate = options.mode === 'bugfix' ? 'bugfix-proposal.md' : 'proposal.md';
  const replacements = {
    '<change-id>': options.changeId,
    '<change-slug>': changeSlug,
    '<capability>': capabilitySlug
  };

  writeFile(path.join(changeDirectory, 'proposal.md'), renderTemplate(path.join(templateRoot, proposalTemplate), replacements));

  let designContent = renderTemplate(path.join(templateRoot, 'design.md'), replacements);
  if (options.mode === 'design-first') {
    designContent += '\n## Planning Mode\n- design-first\n';
  }
  writeFile(path.join(changeDirectory, 'design.md'), designContent);
  writeFile(path.join(changeDirectory, 'tasks.md'), renderTemplate(path.join(templateRoot, 'tasks.md'), replacements));
  writeFile(path.join(changeSpecDirectory, 'spec.md'), renderTemplate(path.join(templateRoot, 'spec-delta.md'), replacements));

  const memory = {
    changeId: options.changeId,
    changeSlug,
    capability: capabilitySlug,
    mode: options.mode,
    status: 'proposed',
    phase: 'propose',
    updatedAt: utcIso(),
    openTasks: countOpenCheckboxes(path.join(changeDirectory, 'tasks.md')),
    completedTasks: countDoneCheckboxes(path.join(changeDirectory, 'tasks.md')),
    openAcceptanceCriteria: countOpenCheckboxes(path.join(changeDirectory, 'proposal.md')),
    archivedPath: ''
  };
  writeFile(memoryFile, JSON.stringify(memory, null, 2));

  recordSpecExecutionMemory(options.projectRoot, {
    source: 'workflow_command',
    workflow: 'spec',
    phase: 'propose',
    changeId: options.changeId,
    changeSlug,
    capability: capabilitySlug,
    complexity: 'high',
    confidence: 'high',
    sensitivity: 'low',
    reusePotential: 0.8,
    stability: 0.8,
    novelty: 0.7,
    status: 'proposed',
    summary: 'Scaffolded a spec change and initialized project memory.',
    filesTouched: [
      `openspec/changes/${changeSlug}/proposal.md`,
      `openspec/changes/${changeSlug}/design.md`,
      `openspec/changes/${changeSlug}/tasks.md`,
      `openspec/changes/${changeSlug}/specs/${capabilitySlug}/spec.md`,
      `.oh-my-engine/memory/specs/${changeSlug}.json`
    ],
    testsRun: [],
    errors: [],
    metadata: { mode: options.mode }
  });

  process.stdout.write('Created change scaffold:\n');
  process.stdout.write(`  - openspec/changes/${changeSlug}/proposal.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/design.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/tasks.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/specs/${capabilitySlug}/spec.md\n`);
  process.stdout.write(`  - .oh-my-engine/memory/specs/${changeSlug}.json\n`);
}


function readJson(filePath: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath: string, payload: Record<string, any>): void {
  writeFile(filePath, JSON.stringify(payload, null, 2));
}

function ensureChangeContext(changeInput: string): { changeSlug: string; projectRoot: string; changeDirectory: string; memoryFile: string; memory: Record<string, any> } {
  const changeSlug = slugify(changeInput);
  const projectRoot = process.cwd();
  const changeDirectory = path.join(projectRoot, 'openspec', 'changes', changeSlug);
  const memoryFile = path.join(projectRoot, '.oh-my-engine', 'memory', 'specs', `${changeSlug}.json`);

  if (!fs.existsSync(changeDirectory)) {
    throw new Error(`Change does not exist: ${changeInput}`);
  }

  if (!fs.existsSync(memoryFile)) {
    throw new Error(`Missing memory file for change: ${changeInput}`);
  }

  return { changeSlug, projectRoot, changeDirectory, memoryFile, memory: readJson(memoryFile) };
}

function updateMemoryState(memoryFile: string, memory: Record<string, any>, status: string, phase: string, changeDirectory: string): Record<string, any> {
  const updated = {
    changeId: memory.changeId,
    changeSlug: memory.changeSlug,
    capability: memory.capability,
    mode: memory.mode,
    status,
    phase,
    updatedAt: utcIso(),
    openTasks: countOpenCheckboxes(path.join(changeDirectory, 'tasks.md')),
    completedTasks: countDoneCheckboxes(path.join(changeDirectory, 'tasks.md')),
    openAcceptanceCriteria: countOpenCheckboxes(path.join(changeDirectory, 'proposal.md')),
    archivedPath: ''
  };
  writeJson(memoryFile, updated);
  return updated;
}

function appendPlanningNotes(designPath: string): void {
  const content = fs.existsSync(designPath) ? fs.readFileSync(designPath, 'utf8') : '';
  if (!content.includes('## Planning Notes')) {
    fs.appendFileSync(designPath, '\n## Planning Notes\n- Refine boundaries, interfaces, and rollout sequencing here.\n', 'utf8');
  }
}

function setAllCheckboxes(filePath: string, marker: 'x' | ' '): void {
  const content = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync(filePath, content.replace(/^- \[[ xX]\]/gm, `- [${marker}]`), 'utf8');
}

function setFirstMatchingCheckbox(filePath: string, query: string, marker: 'x' | ' '): boolean {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const index = lines.findIndex((line: string) => /^- \[[ xX]\]/.test(line) && line.includes(query));
  if (index < 0) return false;
  lines[index] = lines[index].replace(/^- \[[ xX]\]/, `- [${marker}]`);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return true;
}

function appendNoteToTasks(tasksPath: string, note: string): void {
  fs.appendFileSync(tasksPath, `\n- Note: ${note}\n`, 'utf8');
}

function refreshEngineMemoryContext(projectRoot: string, changeSlug: string, capability: string, workflow: string): void {
  const { collectWorkflowGuidance, renderWorkflowGuidanceText } = require('../skills/oh-my-engine/lib/workflow-guidance');
  const report = collectWorkflowGuidance(projectRoot, workflow);
  const contextPath = path.join(projectRoot, 'openspec', 'changes', changeSlug, 'context', 'engine-memory.md');
  ensureDirectory(path.dirname(contextPath));
  writeFile(contextPath, renderWorkflowGuidanceText(report, `change=${changeSlug} capability=${capability}`));
}

function printExistingReviewFiles(changeDirectory: string, changeSlug: string): void {
  const optional = ['source.md', 'prompt.md', 'analysis.md', 'engine-memory.md'];
  for (const fileName of optional) {
    if (fs.existsSync(path.join(changeDirectory, 'context', fileName))) {
      process.stdout.write(`  - openspec/changes/${changeSlug}/context/${fileName}\n`);
    }
  }
}

function printEngineDirectives(changeDirectory: string): void {
  const engineMemoryPath = path.join(changeDirectory, 'context', 'engine-memory.md');
  if (!fs.existsSync(engineMemoryPath)) return;

  const lines = fs.readFileSync(engineMemoryPath, 'utf8').split('\n');
  const start = lines.findIndex((line: string) => line === '## Execution Directives');
  if (start < 0) return;

  const directives: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) break;
    if (lines[index].trim()) directives.push(lines[index]);
  }

  if (directives.some(line => line.startsWith('- '))) {
    process.stdout.write('Execution directives from adopted skills:\n');
    for (const line of directives.slice(0, 120)) process.stdout.write(`${line}\n`);
  }
}

function countEngineDirectives(changeDirectory: string): number {
  const engineMemoryPath = path.join(changeDirectory, 'context', 'engine-memory.md');
  if (!fs.existsSync(engineMemoryPath)) return 0;

  const lines = fs.readFileSync(engineMemoryPath, 'utf8').split('\n');
  const start = lines.findIndex((line: string) => line === '## Execution Directives');
  if (start < 0) return 0;

  let count = 0;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) break;
    if (lines[index].startsWith('- ')) count += 1;
  }
  return count;
}

function recordLifecycleMemory(projectRoot: string, memory: Record<string, any>, phase: string, status: string, summary: string): void {
  recordSpecExecutionMemory(projectRoot, {
    source: 'workflow_command',
    workflow: 'spec',
    phase,
    changeId: memory.changeId,
    changeSlug: memory.changeSlug,
    capability: memory.capability,
    complexity: 'medium',
    confidence: 'high',
    sensitivity: 'low',
    reusePotential: 0.7,
    stability: 0.8,
    novelty: 0.5,
    status,
    summary,
    filesTouched: [
      `openspec/changes/${memory.changeSlug}/proposal.md`,
      `openspec/changes/${memory.changeSlug}/design.md`,
      `openspec/changes/${memory.changeSlug}/tasks.md`,
      `.oh-my-engine/memory/specs/${memory.changeSlug}.json`
    ],
    testsRun: [],
    errors: [],
    metadata: {}
  });
}

export function runSpecPlan(args: string[]): void {
  if (args.length < 1) throw new Error('Usage: ome spec plan <change-id>');
  const { changeSlug, projectRoot, changeDirectory, memoryFile, memory } = ensureChangeContext(args[0]);

  appendPlanningNotes(path.join(changeDirectory, 'design.md'));
  refreshEngineMemoryContext(projectRoot, changeSlug, memory.capability, 'spec');
  const updated = updateMemoryState(memoryFile, memory, 'planned', 'plan', changeDirectory);
  recordLifecycleMemory(projectRoot, updated, 'plan', 'planned', 'Refined the spec change plan and updated lifecycle state.');

  process.stdout.write(`Planned change: ${args[0]}\n`);
  process.stdout.write('Review:\n');
  printExistingReviewFiles(changeDirectory, changeSlug);
  process.stdout.write(`  - openspec/changes/${changeSlug}/proposal.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/design.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/tasks.md\n`);
  const promotedSpec = path.join(projectRoot, 'openspec', 'specs', memory.capability, 'spec.md');
  process.stdout.write(`  - openspec/specs/${memory.capability}/spec.md${fs.existsSync(promotedSpec) ? '' : ' (not promoted yet)'}\n`);
  printEngineDirectives(changeDirectory);
}

function parseApplyArgs(args: string[]): Record<string, any> {
  if (args.length < 1) throw new Error('Usage: ome spec apply <change-id> [--task <text>] [--undo-task <text>] [--acceptance <text>] [--undo-acceptance <text>] [--all-tasks] [--all-acceptance] [--note <text>]');
  const options: Record<string, any> = { changeId: args[0], tasks: [], undoTasks: [], acceptance: [], undoAcceptance: [], notes: [], allTasks: false, allAcceptance: false, hasMutations: false };
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--all-tasks') { options.allTasks = true; options.hasMutations = true; continue; }
    if (argument === '--all-acceptance') { options.allAcceptance = true; options.hasMutations = true; continue; }
    const listByArg: Record<string, string> = { '--task': 'tasks', '--undo-task': 'undoTasks', '--acceptance': 'acceptance', '--undo-acceptance': 'undoAcceptance', '--note': 'notes' };
    const key = listByArg[argument];
    if (key) {
      if (index + 1 >= args.length) throw new Error(`Missing value for ${argument}`);
      options[key].push(args[index + 1]);
      options.hasMutations = true;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

export function runSpecApply(args: string[]): void {
  const options = parseApplyArgs(args);
  const { changeSlug, projectRoot, changeDirectory, memoryFile, memory } = ensureChangeContext(options.changeId);
  const tasksPath = path.join(changeDirectory, 'tasks.md');
  const proposalPath = path.join(changeDirectory, 'proposal.md');

  if (options.allTasks) setAllCheckboxes(tasksPath, 'x');
  if (options.allAcceptance) setAllCheckboxes(proposalPath, 'x');

  for (const query of options.tasks) {
    if (!setFirstMatchingCheckbox(tasksPath, query, 'x')) throw new Error(`Task not found: ${query}`);
  }
  for (const query of options.undoTasks) {
    if (!setFirstMatchingCheckbox(tasksPath, query, ' ')) throw new Error(`Task not found for undo: ${query}`);
  }
  for (const query of options.acceptance) {
    if (!setFirstMatchingCheckbox(proposalPath, query, 'x')) throw new Error(`Acceptance criterion not found: ${query}`);
  }
  for (const query of options.undoAcceptance) {
    if (!setFirstMatchingCheckbox(proposalPath, query, ' ')) throw new Error(`Acceptance criterion not found for undo: ${query}`);
  }
  for (const note of options.notes) appendNoteToTasks(tasksPath, note);

  refreshEngineMemoryContext(projectRoot, changeSlug, memory.capability, 'spec');
  const updated = updateMemoryState(memoryFile, memory, 'in_progress', 'apply', changeDirectory);
  recordLifecycleMemory(projectRoot, updated, 'apply', 'in_progress', 'Updated spec implementation progress and lifecycle state.');

  process.stdout.write(`Apply context for change: ${options.changeId}\n`);
  process.stdout.write('Load these files before implementing:\n');
  process.stdout.write('  - .oh-my-engine/config.json\n');
  process.stdout.write('  - openspec/project.md\n');
  printExistingReviewFiles(changeDirectory, changeSlug);
  process.stdout.write(`  - openspec/changes/${changeSlug}/proposal.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/design.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/tasks.md\n`);
  const promotedSpec = path.join(projectRoot, 'openspec', 'specs', memory.capability, 'spec.md');
  process.stdout.write(`  - openspec/specs/${memory.capability}/spec.md${fs.existsSync(promotedSpec) ? '' : ' (not promoted yet)'}\n`);
  printEngineDirectives(changeDirectory);
  process.stdout.write(`Pending tasks: ${updated.openTasks}\n`);
  process.stdout.write(`Completed tasks: ${updated.completedTasks}\n`);
  process.stdout.write(`Open acceptance criteria: ${updated.openAcceptanceCriteria}\n`);
  if (options.hasMutations) process.stdout.write('Progress files updated.\n');
  process.stdout.write('This helper updates lifecycle state and spec progress; code changes remain manual.\n');
}

export function runSpecStatus(args: string[]): void {
  if (args.length < 1) throw new Error('Usage: ome spec status <change-id>');

  const changeInput = args[0];
  const changeSlug = slugify(changeInput);
  const projectRoot = process.cwd();
  const changeDirectory = path.join(projectRoot, 'openspec', 'changes', changeSlug);
  const memoryFile = path.join(projectRoot, '.oh-my-engine', 'memory', 'specs', `${changeSlug}.json`);

  if (!fs.existsSync(memoryFile)) {
    throw new Error(`Missing memory file for change: ${changeInput}`);
  }

  const memory = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
  process.stdout.write(`Change: ${memory.changeId || ''}\n`);
  process.stdout.write(`Slug: ${memory.changeSlug || ''}\n`);
  process.stdout.write(`Capability: ${memory.capability || ''}\n`);
  process.stdout.write(`Mode: ${memory.mode || ''}\n`);
  process.stdout.write(`Status: ${memory.status || ''}\n`);
  process.stdout.write(`Phase: ${memory.phase || ''}\n`);
  process.stdout.write(`Updated: ${memory.updatedAt || ''}\n`);
  if (memory.archivedPath) process.stdout.write(`Archive: ${memory.archivedPath}\n`);

  if (fs.existsSync(changeDirectory)) {
    if (fs.existsSync(path.join(changeDirectory, 'context'))) {
      process.stdout.write('Intake context: present\n');
      if (fs.existsSync(path.join(changeDirectory, 'context', 'engine-memory.md'))) {
        process.stdout.write(`Engine memory: openspec/changes/${changeSlug}/context/engine-memory.md\n`);
        process.stdout.write(`Execution directives: ${countEngineDirectives(changeDirectory)}\n`);
      }
    }
    process.stdout.write(`Open tasks: ${countOpenCheckboxes(path.join(changeDirectory, 'tasks.md'))}\n`);
    process.stdout.write(`Completed tasks: ${countDoneCheckboxes(path.join(changeDirectory, 'tasks.md'))}\n`);
    process.stdout.write(`Open acceptance criteria: ${countOpenCheckboxes(path.join(changeDirectory, 'proposal.md'))}\n`);
  }
}


function replaceSectionBody(content: string, heading: string, body: string): string {
  const lines = content.split('\n');
  const start = lines.findIndex((line: string) => line.trim() === heading);
  if (start < 0) return `${content.trim()}\n\n${heading}\n${body.trim()}\n`;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) { end = index; break; }
  }
  return [...lines.slice(0, start + 1), body.trim(), '', ...lines.slice(end)].join('\n').replace(/\n{3,}/g, '\n\n');
}

function extractRequirementsBody(deltaContent: string): string {
  const requirements = extractSection(deltaContent, '## Requirements');
  return requirements || 'No accepted requirements promoted yet.';
}

function buildCapabilitySpec(projectRoot: string, repoRoot: string, capability: string, changeId: string, deltaPath: string): void {
  const targetPath = path.join(projectRoot, 'openspec', 'specs', capability, 'spec.md');
  if (!fs.existsSync(targetPath)) {
    ensureDirectory(path.dirname(targetPath));
    fs.copyFileSync(path.join(repoRoot, 'skills', 'oh-my-engine-spec', 'templates', 'capability-spec.md'), targetPath);
  }

  const proposalPath = path.join(projectRoot, 'openspec', 'changes', slugify(changeId), 'proposal.md');
  const proposalContent = fs.existsSync(proposalPath) ? fs.readFileSync(proposalPath, 'utf8') : '';
  const deltaContent = fs.readFileSync(deltaPath, 'utf8');
  const summary = firstNonemptySectionLine(proposalContent, ['## Summary', '## Bug Summary']) || `Accepted behavior for capability \`${capability}\`.`;
  const requirements = extractRequirementsBody(deltaContent);
  const compatibility = extractSection(deltaContent, '## Compatibility Notes') || 'No accepted compatibility notes promoted yet.';
  const changeBlock = `### Latest Accepted Change: ${changeId}\n\n${deltaContent.split('\n').map((line: string) => `    ${line}`).join('\n')}`;
  const historyBlock = `### Archived Change: ${changeId}\n\n${deltaContent.split('\n').map((line: string) => `    ${line}`).join('\n')}`;

  let targetContent = fs.readFileSync(targetPath, 'utf8');
  targetContent = replaceSectionBody(targetContent, '## Capability Summary', summary);
  targetContent = replaceSectionBody(targetContent, '## Requirements', requirements);
  targetContent = replaceSectionBody(targetContent, '## Compatibility Notes', compatibility);
  targetContent = replaceSectionBody(targetContent, '## Current Accepted Delta', changeBlock);
  targetContent = replaceSectionBody(targetContent, '## Change History', historyBlock);
  writeFile(targetPath, targetContent);
}

function utcStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
}

export function runSpecArchive(args: string[]): void {
  if (args.length < 1) throw new Error('Usage: ome spec archive <change-id>');
  const projectRoot = process.cwd();
  const repoRoot = process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..');
  const { changeSlug, changeDirectory, memoryFile, memory } = ensureChangeContext(args[0]);

  runSpecVerify([args[0], '--skip-execution-memory']);
  if (process.exitCode) return;

  const archiveName = `${utcStamp()}-${changeSlug}`;
  const archiveTarget = path.join(projectRoot, 'openspec', 'archive', archiveName);

  const specsDirectory = path.join(changeDirectory, 'specs');
  for (const capability of fs.readdirSync(specsDirectory)) {
    const deltaPath = path.join(specsDirectory, capability, 'spec.md');
    if (fs.existsSync(deltaPath)) buildCapabilitySpec(projectRoot, repoRoot, capability, args[0], deltaPath);
  }

  ensureDirectory(path.dirname(archiveTarget));
  fs.renameSync(changeDirectory, archiveTarget);

  const archivedPath = `openspec/archive/${archiveName}`;
  const updated = {
    changeId: memory.changeId,
    changeSlug: memory.changeSlug,
    capability: memory.capability,
    mode: memory.mode,
    status: 'archived',
    phase: 'archive',
    updatedAt: utcIso(),
    openTasks: 0,
    completedTasks: countDoneCheckboxes(path.join(archiveTarget, 'tasks.md')),
    openAcceptanceCriteria: 0,
    archivedPath
  };
  writeJson(memoryFile, updated);
  recordLifecycleMemory(projectRoot, updated, 'archive', 'archived', 'Archived the accepted spec change into long-lived capability specs.');

  process.stdout.write(`Archived change: ${args[0]}\n`);
  process.stdout.write(`Archive location: ${archivedPath}\n`);
}


function extractSection(content: string, heading: string): string {
  const lines = content.split('\n');
  const start = lines.findIndex((line: string) => line.trim() === heading);
  if (start < 0) return '';
  const collected: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) break;
    collected.push(lines[index]);
  }
  return collected.join('\n').trim();
}

function firstNonemptySectionLine(content: string, headings: string[]): string {
  for (const heading of headings) {
    const section = extractSection(content, heading);
    const line = section.split('\n').map((item: string) => item.trim()).find(Boolean);
    if (line) return line;
  }
  return '';
}

function parseSourceTextBlock(content: string): string {
  const match = content.match(/~~~text\n([\s\S]*?)\n~~~/);
  return match ? match[1].trim() : '';
}

function parseImportArgs(args: string[]): Record<string, any> {
  if (args.length < 1) throw new Error('Usage: ome spec import <change-id> [--source-file <path> | --source-text <text>] [--prompt-file <path> | --prompt-text <text>] [--asset <path>] [--source-type <type>] [--force]');
  const options: Record<string, any> = { changeId: args[0], sourceFile: '', sourceText: '', promptFile: '', promptText: '', sourceType: 'document', assets: [], force: false };
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--force') { options.force = true; continue; }
    const keyByArg: Record<string, string> = { '--source-file': 'sourceFile', '--source-text': 'sourceText', '--prompt-file': 'promptFile', '--prompt-text': 'promptText', '--source-type': 'sourceType' };
    if (argument === '--asset') {
      if (index + 1 >= args.length) throw new Error('Missing value for --asset');
      options.assets.push(args[index + 1]);
      index += 1;
      continue;
    }
    const key = keyByArg[argument];
    if (key) {
      if (index + 1 >= args.length) throw new Error(`Missing value for ${argument}`);
      options[key] = args[index + 1];
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${argument}`);
  }
  if (options.sourceFile && options.sourceText) throw new Error('Choose either --source-file or --source-text, not both.');
  if (options.promptFile && options.promptText) throw new Error('Choose either --prompt-file or --prompt-text, not both.');
  if (!options.sourceFile && !options.sourceText && options.assets.length === 0) throw new Error('Import requires source text or at least one asset.');
  if (options.sourceFile && !fs.existsSync(options.sourceFile)) throw new Error(`Source file not found: ${options.sourceFile}`);
  if (options.promptFile && !fs.existsSync(options.promptFile)) throw new Error(`Prompt file not found: ${options.promptFile}`);
  return options;
}

function copyAssetUnique(sourcePath: string, assetDirectory: string): string {
  if (!fs.existsSync(sourcePath)) throw new Error(`Asset file not found: ${sourcePath}`);
  const parsed = path.parse(sourcePath);
  let candidate = parsed.base;
  let counter = 2;
  while (fs.existsSync(path.join(assetDirectory, candidate))) {
    candidate = `${parsed.name}-${counter}${parsed.ext}`;
    counter += 1;
  }
  fs.copyFileSync(sourcePath, path.join(assetDirectory, candidate));
  return candidate;
}

export function runSpecImport(args: string[]): void {
  const options = parseImportArgs(args);
  const projectRoot = process.cwd();
  const repoRoot = process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..');
  const changeSlug = slugify(options.changeId);
  if (!changeSlug) throw new Error(`Invalid change id: ${options.changeId}`);

  initializeProject({ force: false, template: 'default', projectRoot, repoRoot });

  const contextDirectory = path.join(projectRoot, 'openspec', 'changes', changeSlug, 'context');
  const assetDirectory = path.join(contextDirectory, 'assets');
  if (options.force) fs.rmSync(contextDirectory, { recursive: true, force: true });
  ensureDirectory(assetDirectory);
  ensureDirectory(path.join(projectRoot, '.oh-my-engine', 'memory', 'specs'));

  const importedAt = utcIso();
  const templateRoot = path.join(repoRoot, 'skills', 'oh-my-engine-spec', 'templates');
  const sourceReference = options.sourceFile ? options.sourceFile : options.sourceText ? 'inline-text' : 'not-provided';
  const promptReference = options.promptFile ? options.promptFile : options.promptText ? 'inline-text' : 'not-provided';
  const replacements = { '<change-id>': options.changeId, '<change-slug>': changeSlug, '<source-type>': options.sourceType, '<imported-at>': importedAt, '<source-reference>': sourceReference, '<prompt-reference>': promptReference, '<capability>': changeSlug };

  const sourceText = options.sourceFile ? fs.readFileSync(options.sourceFile, 'utf8') : options.sourceText || 'No text source imported. Use attachments and references for context.';
  writeFile(path.join(contextDirectory, 'source.md'), `${renderTemplate(path.join(templateRoot, 'source.md'), replacements)}\n~~~text\n${sourceText}\n~~~\n\n## Source Notes\n- Keep this file as the normalized text source of truth for decomposition.\n`);

  const hasPrompt = Boolean(options.promptFile || options.promptText);
  const promptText = options.promptFile ? fs.readFileSync(options.promptFile, 'utf8') : options.promptText || 'No explicit operator prompt was imported.';
  writeFile(path.join(contextDirectory, 'prompt.md'), `${renderTemplate(path.join(templateRoot, 'prompt.md'), replacements)}\n~~~text\n${promptText}\n~~~\n\n## Prompt Notes\n- ${hasPrompt ? 'Preserve the emphasis and exclusions in this prompt during decomposition.' : 'Decomposition will proceed without an explicit operator prompt unless this file is later updated.'}\n`);

  const attachments = options.assets.map((assetPath: string) => copyAssetUnique(assetPath, assetDirectory));
  const references = { changeId: options.changeId, changeSlug, importedAt, sourceType: options.sourceType, sourceReference, promptReference, attachments };
  writeJson(path.join(contextDirectory, 'references.json'), references);

  const memoryFile = path.join(projectRoot, '.oh-my-engine', 'memory', 'specs', `${changeSlug}.json`);
  writeJson(memoryFile, { changeId: options.changeId, changeSlug, capability: changeSlug, mode: 'import', status: 'imported', phase: 'import', updatedAt: importedAt, openTasks: 0, completedTasks: 0, openAcceptanceCriteria: 0, archivedPath: '' });

  recordLifecycleMemory(projectRoot, readJson(memoryFile), 'import', 'imported', 'Imported source context for spec decomposition.');
  process.stdout.write(`Imported context for change: ${options.changeId}\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/context/source.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/context/prompt.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/context/references.json\n`);
  if (attachments.length > 0) process.stdout.write(`Assets copied: ${attachments.length}\n`);
}

function parseDecomposeArgs(args: string[]): SpecProposeOptions {
  const options = parseSpecProposeArgs(args);
  return options;
}

export function runSpecDecompose(args: string[]): void {
  const options = parseDecomposeArgs(args);
  const projectRoot = process.cwd();
  const repoRoot = process.env.OME_REPO_ROOT || path.resolve(__dirname, '..', '..');
  const changeSlug = slugify(options.changeId);
  const capabilitySlug = slugify(options.capability || changeSlug);
  const contextDirectory = path.join(projectRoot, 'openspec', 'changes', changeSlug, 'context');
  const sourcePath = path.join(contextDirectory, 'source.md');
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing intake source for change: ${options.changeId}`);

  runSpecPropose([options.changeId, '--capability', capabilitySlug, '--force', ...(options.mode === 'bugfix' ? ['--bugfix'] : []), ...(options.mode === 'design-first' ? ['--design-first'] : [])]);

  const templateRoot = path.join(repoRoot, 'skills', 'oh-my-engine-spec', 'templates');
  const analysisContent = renderTemplate(path.join(templateRoot, 'analysis.md'), { '<change-id>': options.changeId, '<change-slug>': changeSlug, '<capability>': capabilitySlug });
  writeFile(path.join(contextDirectory, 'analysis.md'), analysisContent);

  const memoryFile = path.join(projectRoot, '.oh-my-engine', 'memory', 'specs', `${changeSlug}.json`);
  const memory = readJson(memoryFile);
  memory.status = 'decomposed';
  memory.phase = 'decompose';
  memory.updatedAt = utcIso();
  writeJson(memoryFile, memory);
  recordLifecycleMemory(projectRoot, memory, 'decompose', 'decomposed', 'Decomposed imported context into proposal, design, tasks, and spec delta scaffolds.');

  process.stdout.write(`Decomposed change: ${options.changeId}\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/context/analysis.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/proposal.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/design.md\n`);
  process.stdout.write(`  - openspec/changes/${changeSlug}/tasks.md\n`);
}

function findUnresolvedPlaceholders(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8').split('\n').filter((line: string) => /TBD:|<change-id>|<change-slug>|<capability>/.test(line));
}

function selectedChangeTypeCount(deltaPath: string): number {
  const content = fs.readFileSync(deltaPath, 'utf8');
  return (content.match(/^- \[[xX]\] (Add|Modify|Remove)$/gm) || []).length;
}

function hasConcreteRequirement(deltaPath: string): boolean {
  const content = fs.readFileSync(deltaPath, 'utf8');
  return /The system (MUST|SHOULD|MAY)\s+(?!TBD)/.test(content);
}

function hasConcreteScenario(deltaPath: string): boolean {
  const content = fs.readFileSync(deltaPath, 'utf8');
  return /- \*\*WHEN\*\*\s+(?!TBD)/.test(content) && /- \*\*THEN\*\*\s+(?!TBD)/.test(content);
}

function getVerifyCommands(projectRoot: string): string[] {
  const configPath = path.join(projectRoot, '.oh-my-engine', 'config.json');
  if (!fs.existsSync(configPath)) return [];
  const config = readJson(configPath);
  const commands = config.workflows?.spec?.options?.verifyCommands || config.spec?.verifyCommands || [];
  return Array.isArray(commands) ? commands : [];
}

export function runSpecVerify(args: string[]): void {
  if (args.length < 1) throw new Error('Usage: ome spec verify <change-id> [--skip-execution-memory]');
  const skipExecutionMemory = args.includes('--skip-execution-memory');
  const { projectRoot, changeDirectory, memoryFile, memory } = ensureChangeContext(args[0]);
  const specRoot = path.join(changeDirectory, 'specs');
  if (!fs.existsSync(specRoot)) throw new Error(`Missing change specs directory: ${specRoot}`);

  const deltaFiles: string[] = [];
  for (const capability of fs.readdirSync(specRoot)) {
    const deltaPath = path.join(specRoot, capability, 'spec.md');
    if (fs.existsSync(deltaPath)) deltaFiles.push(deltaPath);
  }

  const openTasks = countOpenCheckboxes(path.join(changeDirectory, 'tasks.md'));
  const doneTasks = countDoneCheckboxes(path.join(changeDirectory, 'tasks.md'));
  const openAcceptance = countOpenCheckboxes(path.join(changeDirectory, 'proposal.md'));
  const placeholders = [path.join(changeDirectory, 'proposal.md'), path.join(changeDirectory, 'design.md'), ...deltaFiles].flatMap(findUnresolvedPlaceholders);
  const deltaErrors: string[] = [];
  for (const deltaPath of deltaFiles) {
    if (selectedChangeTypeCount(deltaPath) !== 1) deltaErrors.push(`${deltaPath}: select exactly one Change Type checkbox`);
    if (!hasConcreteRequirement(deltaPath)) deltaErrors.push(`${deltaPath}: add at least one concrete requirement statement`);
    if (!hasConcreteScenario(deltaPath)) deltaErrors.push(`${deltaPath}: add at least one concrete WHEN/THEN scenario`);
  }

  if (deltaFiles.length === 0 || openTasks > 0 || openAcceptance > 0 || placeholders.length > 0 || deltaErrors.length > 0) {
    const failed = updateMemoryState(memoryFile, memory, 'verify_failed', 'verify', changeDirectory);
    if (!skipExecutionMemory) recordLifecycleMemory(projectRoot, failed, 'verify', 'verify_failed', 'Verification failed for the spec change.');
    process.stderr.write(`Verification failed for ${args[0]}\n`);
    process.stderr.write(`Change spec delta files: ${deltaFiles.length}\n`);
    process.stderr.write(`Open tasks: ${openTasks}\n`);
    process.stderr.write(`Open acceptance criteria: ${openAcceptance}\n`);
    if (placeholders.length > 0) process.stderr.write(`Unresolved template markers still present:\n${placeholders.map(line => `  - ${line}`).join('\n')}\n`);
    if (deltaErrors.length > 0) process.stderr.write(`Spec delta validation errors:\n${deltaErrors.map(line => `  - ${line}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }

  let verifyCommandCount = 0;
  for (const command of getVerifyCommands(projectRoot)) {
    verifyCommandCount += 1;
    process.stdout.write(`Running verify command [${verifyCommandCount}]: ${command}\n`);
    require('node:child_process').execFileSync('/bin/sh', ['-c', command], { cwd: projectRoot, stdio: 'inherit' });
  }

  const verified = updateMemoryState(memoryFile, memory, 'verified', 'verify', changeDirectory);
  if (!skipExecutionMemory) recordLifecycleMemory(projectRoot, verified, 'verify', 'verified', 'Verified the spec change and acceptance state.');
  process.stdout.write(`Verification passed for ${args[0]}\n`);
  process.stdout.write(`Completed tasks: ${doneTasks}\n`);
  process.stdout.write(`Open tasks: ${openTasks}\n`);
  process.stdout.write(`Open acceptance criteria: ${openAcceptance}\n`);
  process.stdout.write(`Verify commands run: ${verifyCommandCount}\n`);
}

export function runSpecCommand(command: string, args: string[]): void {
  if (command === 'init') return runSpecInit(args);
  if (command === 'propose') return runSpecPropose(args);
  if (command === 'status') return runSpecStatus(args);
  if (command === 'plan') return runSpecPlan(args);
  if (command === 'apply') return runSpecApply(args);
  if (command === 'import') return runSpecImport(args);
  if (command === 'decompose') return runSpecDecompose(args);
  if (command === 'verify') return runSpecVerify(args);
  if (command === 'archive') return runSpecArchive(args);

  throw new Error(`Unknown spec command: ${command}`);
}
