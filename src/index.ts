export {
  listAdapterManifests,
  listAdapters,
  previewAdapterSync
} from './adapters';

export {
  getAdapter,
  getAdapters
} from './adapters/registry';

export type {
  PlatformAdapter,
  PlatformAdapterManifest,
  PlatformAdapterSyncPlan,
  PlatformAdapterStatus,
  PlatformConfig
} from './adapters/types';

export {
  ensureDirectory,
  writeJsonFile,
  writeTextFile
} from './core/file-system';

export {
  countDoneCheckboxes,
  countOpenCheckboxes,
  renderTemplate,
  slugify,
  utcIso,
  utcStamp
} from './core/spec-utils';

export {
  loadConfig,
  loadPlatformsConfig,
  isUsingJsonConfig,
  isUsingMarkdownConfig
} from './core/config-loader';

export {
  renderDoctorReport,
  runDoctorReport
} from './core/doctor';

export type {
  DoctorLine,
  DoctorReport
} from './core/doctor';

export {
  initializeProject,
  parseInitArgs,
  renderInitResult
} from './core/init';

export type {
  InitOptions,
  InitResult
} from './core/init';

export {
  ENGINE_DIR,
  currentEnginePath,
  engineDirectory,
  enginePath,
  repoEnginePath
} from './core/paths';

export {
  listRules,
  listRulesByCategory,
  previewRulesSync,
  selectApplicableRules,
  syncRules,
  validateRules
} from './core/rules';

export type {
  RuleMetadata,
  RulesPreviewTarget,
  RulesSyncResult,
  RulesValidationIssue,
  RulesValidationReport
} from './core/rules';

export {
  schemaPath,
  validateJsonFile
} from './core/schema/validator';

export type {
  SchemaIssue,
  SchemaValidationResult
} from './core/schema/validator';

export {
  listSpecCommands
} from './core/spec';

export {
  renderWorkflowCommand
} from './core/workflows';

export {
  doctorMcp,
  initMcp,
  parseMcpArgs,
  previewMcp
} from './core/mcp';

export type {
  McpOptions,
  McpProviderId,
  McpTargetResult,
  McpTargetStatus
} from './core/mcp';

export type {
  WorkflowName
} from './core/workflows';

export {
  lifecycleWorkflowNames,
  renderLifecycleGuidance
} from './core/lifecycle';

export type {
  LifecycleGuidanceOptions,
  LifecycleWorkflowName
} from './core/lifecycle';

export {
  assessSkillMarkdown,
  verifySkillCandidate
} from './skills/oh-my-engine/lib/skill-candidate-verifier';

export {
  generateAgentGuidanceFile,
  generateAllAgentGuidanceFiles
} from './core/agents';

export type {
  AgentGuidanceResult
} from './core/agents';
