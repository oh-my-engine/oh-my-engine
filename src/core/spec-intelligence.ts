export interface SpecIntakeInput {
  changeId: string;
  changeSlug: string;
  capability: string;
  sourceText: string;
  promptText: string;
  references: Record<string, any>;
}

export interface SpecDecomposition {
  blocked: boolean;
  blockingQuestions: string[];
  assumptions: string[];
  analysisMarkdown: string;
  llmPromptMarkdown: string;
  proposalMarkdown: string;
  designMarkdown: string;
  tasksMarkdown: string;
  specDeltaMarkdown: string;
}

interface IntakeFacts {
  sourceSentences: string[];
  promptSentences: string[];
  requirementSentences: string[];
  constraintSentences: string[];
  verificationSentences: string[];
  acceptanceSentences: string[];
  attachments: string[];
  summary: string;
  requirementName: string;
  requirementStatement: string;
  scenarioWhen: string;
  scenarioThen: string;
  changeType: 'Add' | 'Modify' | 'Remove';
}

function normalizeText(value: string): string {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function splitSentences(value: string): string[] {
  const normalized = normalizeText(value)
    .replace(/([.!?\u3002\uff01\uff1f])\s+/g, '$1\n')
    .replace(/\n{2,}/g, '\n');

  return normalized
    .split(/\n+/)
    .map(cleanSentence)
    .filter(Boolean);
}

function cleanSentence(value: string): string {
  return normalizeText(value)
    .replace(/^[-*]\s*/, '')
    .replace(/^(acceptance criteria|acceptance|requirement|goal|constraint|risk|verification|test|prompt|source)\s*[:\-]\s*/i, '')
    .replace(/[.;!?\u3002\uff01\uff1f]+$/g, '')
    .trim();
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function firstOrFallback(values: string[], fallback: string): string {
  return values.find(Boolean) || fallback;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowerFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function stripTrailingPunctuation(value: string): string {
  return cleanSentence(value).replace(/[.]+$/g, '');
}

function humanizeSlug(value: string): string {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match: string) => match.toUpperCase());
}

function titleFromRequirement(sentence: string, capability: string): string {
  const cleaned = stripTrailingPunctuation(sentence);
  const needsMatch = cleaned.match(/^(.+?)\s+needs?\s+(.+)$/i);
  const source = needsMatch ? needsMatch[2] : cleaned;
  const withoutFiller = source
    .replace(/\b(the system|users?|customers?|admins?|operators?|must|should|may|need|needs|required|required to|provide|support|enable|allow)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = withoutFiller.split(/\s+/).filter(Boolean).slice(0, 6);
  if (words.length > 0) return humanizeSlug(words.join(' '));
  return `${humanizeSlug(capability)} Behavior`;
}

function sentenceMatches(sentence: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(sentence));
}

function sentenceToRequirement(sentence: string, capability: string): string {
  const cleaned = stripTrailingPunctuation(sentence);

  if (/^the system\s+(MUST|SHOULD|MAY)\b/i.test(cleaned)) {
    return `${capitalize(cleaned)}.`;
  }

  const needsMatch = cleaned.match(/^(.+?)\s+needs?\s+(.+)$/i);
  if (needsMatch) {
    return `The system MUST provide ${lowerFirst(stripTrailingPunctuation(needsMatch[2]))} for ${lowerFirst(stripTrailingPunctuation(needsMatch[1]))}.`;
  }

  const mustMatch = cleaned.match(/\bmust\s+(.+)$/i);
  if (mustMatch) return `The system MUST ${lowerFirst(stripTrailingPunctuation(mustMatch[1]))}.`;

  const shouldMatch = cleaned.match(/\bshould\s+(.+)$/i);
  if (shouldMatch) return `The system SHOULD ${lowerFirst(stripTrailingPunctuation(shouldMatch[1]))}.`;

  return `The system MUST support ${humanizeSlug(capability).toLowerCase()} by ensuring ${lowerFirst(cleaned)}.`;
}

function inferChangeType(text: string): 'Add' | 'Modify' | 'Remove' {
  if (/\b(remove|delete|drop|deprecate|disable)\b/i.test(text)) return 'Remove';
  if (/\b(fix|bug|change|update|modify|improve|refactor|replace|existing)\b/i.test(text)) return 'Modify';
  return 'Add';
}

function isMeaningfulText(value: string): boolean {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (/^No text source imported/i.test(normalized)) return false;
  if (/^No explicit operator prompt was imported/i.test(normalized)) return false;
  return normalized.replace(/\s/g, '').length >= 12;
}

function collectFacts(input: SpecIntakeInput): IntakeFacts {
  const sourceSentences = splitSentences(input.sourceText);
  const promptSentences = splitSentences(input.promptText);
  const allSentences = dedupe([...sourceSentences, ...promptSentences]);
  const combinedText = `${input.sourceText}\n${input.promptText}`;
  const attachments = Array.isArray(input.references?.attachments)
    ? input.references.attachments.map((item: any) => String(item)).filter(Boolean)
    : [];

  const requirementSentences = dedupe(allSentences.filter(sentence => sentenceMatches(sentence, [
    /\bneed(s)?\b/i,
    /\bmust\b/i,
    /\bshould\b/i,
    /\brequire(d|s|ment)?\b/i,
    /\bacceptance\b/i,
    /\buser(s)?\b/i,
    /\bsupport\b/i,
    /\ballow\b/i,
    /\benable\b/i,
    /\bpersist\b/i,
    /\brestore\b/i
  ]))).slice(0, 5);

  const constraintSentences = dedupe(allSentences.filter(sentence => sentenceMatches(sentence, [
    /\bconstraint\b/i,
    /\bnon-goal\b/i,
    /\bmust not\b/i,
    /\bavoid\b/i,
    /\bpreserve\b/i,
    /\bcompatible\b/i,
    /\bmigration\b/i,
    /\bsecurity\b/i,
    /\bperformance\b/i,
    /\bmobile\b/i,
    /\bprioriti[sz]e\b/i
  ]))).slice(0, 5);

  const verificationSentences = dedupe(allSentences.filter(sentence => sentenceMatches(sentence, [
    /\btest(s|ing)?\b/i,
    /\bverify\b/i,
    /\bvalidation\b/i,
    /\bmanual\b/i,
    /\bregression\b/i
  ]))).slice(0, 5);

  const acceptanceSentences = dedupe(allSentences.filter(sentence => sentenceMatches(sentence, [
    /\bacceptance\b/i,
    /\bexpected\b/i,
    /\bthen\b/i,
    /\bsuccess\b/i,
    /\bcomplete\b/i
  ]))).slice(0, 5);

  const primaryRequirement = firstOrFallback(requirementSentences, firstOrFallback(sourceSentences, `${humanizeSlug(input.capability)} behavior is required`));
  const summary = firstOrFallback(sourceSentences, `${humanizeSlug(input.capability)} behavior must be defined from the imported context.`);
  const requirementName = titleFromRequirement(primaryRequirement, input.capability);
  const requirementStatement = sentenceToRequirement(primaryRequirement, input.capability);
  const capabilityName = humanizeSlug(input.capability).toLowerCase();

  return {
    sourceSentences,
    promptSentences,
    requirementSentences,
    constraintSentences,
    verificationSentences,
    acceptanceSentences,
    attachments,
    summary,
    requirementName,
    requirementStatement,
    scenarioWhen: `a user or operator exercises the ${capabilityName} flow described in the imported context`,
    scenarioThen: `the system delivers the ${capabilityName} behavior while preserving the documented constraints`,
    changeType: inferChangeType(combinedText)
  };
}

function hasGoalSignal(facts: IntakeFacts): boolean {
  return facts.requirementSentences.length > 0 || facts.acceptanceSentences.length > 0;
}

function buildBlockingQuestions(input: SpecIntakeInput, facts: IntakeFacts): string[] {
  const questions: string[] = [];
  if (!isMeaningfulText(input.sourceText) && !isMeaningfulText(input.promptText)) {
    questions.push(`What concrete behavior should change for ${humanizeSlug(input.capability)}?`);
  }
  if (!hasGoalSignal(facts)) {
    questions.push('What user-facing requirement or acceptance criterion proves this change is complete?');
  }
  if (facts.attachments.length > 0 && !isMeaningfulText(input.sourceText)) {
    questions.push('What facts from the imported assets should drive the spec?');
  }
  return dedupe(questions);
}

function renderBullets(values: string[], fallback: string): string {
  const items = values.length > 0 ? values : [fallback];
  return items.map(value => `- ${value}`).join('\n');
}

function renderCheckedChangeType(selected: 'Add' | 'Modify' | 'Remove'): string {
  return ['Add', 'Modify', 'Remove']
    .map(type => `- [${type === selected ? 'x' : ' '}] ${type}`)
    .join('\n');
}

function renderAnalysis(input: SpecIntakeInput, facts: IntakeFacts, blocked: boolean, questions: string[], assumptions: string[]): string {
  const goalStatus = hasGoalSignal(facts) ? 'CLEAR' : 'MISSING';
  const scopeStatus = facts.constraintSentences.length > 0 || facts.promptSentences.length > 0 ? 'CLEAR' : 'VAGUE';
  const acceptanceStatus = facts.acceptanceSentences.length > 0 || facts.requirementSentences.length > 0 ? 'CLEAR' : 'MISSING';
  const constraintsStatus = facts.constraintSentences.length > 0 ? 'CLEAR' : 'VAGUE';
  const edgeStatus = facts.verificationSentences.length > 0 ? 'CLEAR' : 'VAGUE';

  return [
    '# Intake Analysis',
    '',
    '## Change ID',
    `\`${input.changeId}\``,
    '',
    '## Inputs',
    `- Source: \`.ome/omespec/changes/${input.changeSlug}/context/source.md\``,
    `- Prompt: \`.ome/omespec/changes/${input.changeSlug}/context/prompt.md\``,
    `- References: \`.ome/omespec/changes/${input.changeSlug}/context/references.json\``,
    '',
    '## Extracted Requirements',
    renderBullets(facts.requirementSentences.map(sentence => sentenceToRequirement(sentence, input.capability)), facts.requirementStatement),
    '',
    '## Inferred Constraints',
    renderBullets(facts.constraintSentences, 'Preserve existing behavior outside the documented capability boundary.'),
    '',
    '## Image and Attachment Observations',
    facts.attachments.length > 0
      ? renderBullets(facts.attachments.map(name => `Imported asset available for review: ${name}`), '')
      : '- No attachments imported.',
    '',
    '## Ambiguities',
    questions.length > 0 ? renderBullets(questions, '') : '- No blocking ambiguities detected by local decomposition.',
    '',
    '## Open Questions',
    questions.length > 0 ? renderBullets(questions, '') : '- Confirm whether inferred assumptions need adjustment before implementation.',
    '',
    '## Recommended Capability Split',
    `- Primary capability: \`${input.capability}\``,
    '- Supporting capabilities: none inferred from imported context.',
    '',
    '---',
    '',
    '## Clarification Gate Result',
    '',
    '### Dimension Assessment',
    '| Dimension | Status | Notes |',
    '|-----------|--------|-------|',
    `| User goal | ${goalStatus} | ${facts.summary} |`,
    `| Scope boundary | ${scopeStatus} | ${facts.constraintSentences[0] || 'Boundary is inferred from the imported change scope.'} |`,
    `| Acceptance criteria | ${acceptanceStatus} | ${facts.acceptanceSentences[0] || facts.requirementStatement} |`,
    `| Key constraints | ${constraintsStatus} | ${facts.constraintSentences[0] || 'No explicit constraint was imported.'} |`,
    `| Edge cases | ${edgeStatus} | ${facts.verificationSentences[0] || 'No explicit edge-case or test instruction was imported.'} |`,
    '',
    '### Blocking Questions',
    questions.length > 0 ? renderBullets(questions, '') : '- None.',
    '',
    '### Assumptions',
    assumptions.length > 0 ? renderBullets(assumptions, '') : '- None.',
    '',
    '### Gate Decision',
    `- [${blocked ? 'x' : ' '}] BLOCKED - waiting for answers to blocking questions above.`,
    `- [${blocked ? ' ' : 'x'}] PASSED - proceeding to scaffold OME spec artifacts.`,
    ''
  ].join('\n');
}

function renderProposal(input: SpecIntakeInput, facts: IntakeFacts, blocked: boolean, questions: string[], assumptions: string[]): string {
  if (blocked) {
    return [
      '# Change Proposal',
      '',
      '## Change ID',
      `\`${input.changeId}\``,
      '',
      '## Summary',
      'TBD: Resolve clarification gate questions before writing the proposal.',
      '',
      '## Blocking Questions',
      renderBullets(questions, 'What behavior should change?'),
      '',
      '## Acceptance Criteria',
      '- [ ] TBD: Define acceptance criteria after clarification.',
      ''
    ].join('\n');
  }

  const capabilityName = humanizeSlug(input.capability).toLowerCase();
  const acceptance = facts.acceptanceSentences.length > 0
    ? facts.acceptanceSentences
    : [
      `Users can complete the ${capabilityName} behavior described in the imported source.`,
      `The implementation preserves the prompt constraint: ${facts.constraintSentences[0] || 'keep scope limited to the imported request'}.`
    ];

  return [
    '# Change Proposal',
    '',
    '## Change ID',
    `\`${input.changeId}\``,
    '',
    '## Summary',
    facts.summary,
    '',
    '## Intake Context',
    `- Source: \`.ome/omespec/changes/${input.changeSlug}/context/source.md\``,
    `- Prompt: \`.ome/omespec/changes/${input.changeSlug}/context/prompt.md\``,
    `- Analysis: \`.ome/omespec/changes/${input.changeSlug}/context/analysis.md\``,
    `- References: \`.ome/omespec/changes/${input.changeSlug}/context/references.json\``,
    '',
    '## Problem',
    `The imported context identifies a gap in ${capabilityName}: ${facts.summary}`,
    '',
    '## Goals',
    renderBullets(facts.requirementSentences.slice(0, 3).map(sentence => sentenceToRequirement(sentence, input.capability)), facts.requirementStatement),
    '',
    '## Non-Goals',
    `- Do not broaden scope beyond ${capabilityName} without a new spec change.`,
    '- Do not overwrite existing project-specific rules or memory outside this change.',
    '',
    '## User Impact',
    `- Affected users can rely on ${capabilityName} behavior matching the imported source.`,
    `- Operators keep the documented constraints: ${facts.constraintSentences[0] || 'preserve existing behavior outside this capability.'}`,
    '- Unrelated workflows remain unchanged.',
    '',
    '## Acceptance Criteria',
    acceptance.map(item => `- [ ] ${item}`).join('\n'),
    '',
    '## Assumptions',
    renderBullets(assumptions, 'No additional assumptions beyond the imported context.'),
    '',
    '## Risks',
    `- Risk: The imported context may omit edge cases for ${capabilityName}.`,
    '  Mitigation: Confirm assumptions during planning and add focused regression coverage.',
    '',
    '## Rollout Notes',
    '- Feature flag: not inferred; add one during planning if rollout risk requires it.',
    '- Migration: no migration inferred from imported context.',
    `- Monitoring: watch behavior connected to ${capabilityName} after rollout.`,
    '',
    '## Related Capability Specs',
    `- \`.ome/omespec/specs/${input.capability}/spec.md\``,
    ''
  ].join('\n');
}

function renderDesign(input: SpecIntakeInput, facts: IntakeFacts, blocked: boolean): string {
  if (blocked) {
    return [
      '# Technical Design',
      '',
      '## Overview',
      'TBD: Resolve clarification gate questions before writing the technical design.',
      ''
    ].join('\n');
  }

  const capabilityTitle = humanizeSlug(input.capability);
  return [
    '# Technical Design',
    '',
    '## Overview',
    `Implement ${capabilityTitle} by translating the imported requirement into the smallest project-local change that satisfies the proposal.`,
    '',
    '## Intake Context',
    `- Source: \`.ome/omespec/changes/${input.changeSlug}/context/source.md\``,
    `- Prompt: \`.ome/omespec/changes/${input.changeSlug}/context/prompt.md\``,
    `- Analysis: \`.ome/omespec/changes/${input.changeSlug}/context/analysis.md\``,
    `- References: \`.ome/omespec/changes/${input.changeSlug}/context/references.json\``,
    '',
    '## Architecture',
    `- Components involved: project modules that own ${capabilityTitle}.`,
    `- Boundaries: keep the change scoped to ${capabilityTitle} and preserve unrelated workflows.`,
    `- Data flow: input from the affected user or operator flow reaches existing project logic, which returns the behavior specified in the spec delta.`,
    '',
    '## Interfaces',
    '### Public/API Interfaces',
    `- Endpoint or command: infer during implementation from the modules owning ${capabilityTitle}.`,
    `- Input: preserve existing inputs unless the proposal requires a new field.`,
    `- Output: expose the ${capabilityTitle} behavior described in the acceptance criteria.`,
    '',
    '### Internal Interfaces',
    `- Module: implementation owner to be confirmed during planning for ${capabilityTitle}.`,
    '- Responsibility: isolate the new behavior behind the existing project boundary for this capability.',
    '',
    '## Data Model',
    '- New entities: none inferred from imported context.',
    '- Changed entities: add only if implementation requires persistent state.',
    '- Migration concerns: no migration inferred; revisit if persistent state changes.',
    '',
    '## Failure Modes',
    `- Failure mode: ${capabilityTitle} cannot satisfy the imported requirement.`,
    '  Handling: return the existing safe behavior and cover the failure with focused verification.',
    '',
    '## Risks and Tradeoffs',
    `- Tradeoff: local heuristics infer the first implementation plan; human review should confirm edge cases before coding.`,
    '- Rejected alternative: broad cross-project redesign, because the imported context only supports a scoped capability change.',
    '',
    '## Verification Plan',
    renderBullets(facts.verificationSentences, `Run focused tests or manual checks covering ${capabilityTitle} acceptance criteria.`),
    ''
  ].join('\n');
}

function renderTasks(input: SpecIntakeInput, facts: IntakeFacts, blocked: boolean, questions: string[]): string {
  const capabilityTitle = humanizeSlug(input.capability);
  const blockingTasks = questions.map(question => `- [ ] Resolve clarification: ${question}`);
  return [
    '# Implementation Tasks',
    '',
    '## Execution Rules',
    '- Keep tasks small, reviewable, and testable.',
    '- Each completed task should leave the repo in a working state.',
    '',
    '## Intake Context',
    `- Review \`.ome/omespec/changes/${input.changeSlug}/context/source.md\` before changing requirements.`,
    `- Review \`.ome/omespec/changes/${input.changeSlug}/context/prompt.md\` to preserve operator intent.`,
    `- Use \`.ome/omespec/changes/${input.changeSlug}/context/analysis.md\` as the decomposition audit trail.`,
    '',
    '## Phase 1: Discovery and Setup',
    ...(blocked ? blockingTasks : [
      `- [ ] Confirm impacted files and modules for ${capabilityTitle}.`,
      `- [ ] Review assumptions captured in proposal.md and analysis.md.`,
      `- [ ] Update or confirm the spec delta under \`.ome/omespec/changes/${input.changeSlug}/specs/${input.capability}/spec.md\`.`
    ]),
    '',
    '## Phase 2: Implementation',
    `- [ ] Implement ${capabilityTitle} behavior from the accepted requirements.`,
    '- [ ] Add or update regression coverage for the acceptance criteria.',
    '- [ ] Update docs or developer guidance if behavior changed.',
    '',
    '## Phase 3: Verification',
    `- [ ] Run focused verification for ${capabilityTitle}.`,
    '- [ ] Check all acceptance criteria in proposal.md.',
    '- [ ] Record remaining risks and follow-ups.',
    '',
    '## Verification Hints',
    renderBullets(facts.verificationSentences, `Cover ${capabilityTitle} with the closest existing test or manual command.`),
    '',
    '## Notes',
    '- Dependencies: none inferred.',
    '- Owners: implementation owner to confirm.',
    '- Follow-ups: add a follow-up spec if clarification expands scope.',
    ''
  ].join('\n');
}

function renderSpecDelta(input: SpecIntakeInput, facts: IntakeFacts, blocked: boolean): string {
  if (blocked) {
    return [
      '# Spec Delta',
      '',
      '## Capability',
      `\`${input.capability}\``,
      '',
      '## Change Type',
      '- [ ] Add',
      '- [ ] Modify',
      '- [ ] Remove',
      '',
      '## Requirements',
      '### Requirement: TBD requirement name',
      'The system MUST TBD: resolve clarification gate before defining required behavior.',
      '',
      '#### Scenario: TBD scenario name',
      '- **WHEN** TBD: clarification is complete.',
      '- **THEN** TBD: accepted behavior is documented.',
      ''
    ].join('\n');
  }

  const secondaryRequirement = facts.requirementSentences[1]
    ? sentenceToRequirement(facts.requirementSentences[1], input.capability)
    : `The system SHOULD preserve documented constraints for ${humanizeSlug(input.capability).toLowerCase()}.`;

  return [
    '# Spec Delta',
    '',
    '## Capability',
    `\`${input.capability}\``,
    '',
    '## Change Type',
    renderCheckedChangeType(facts.changeType),
    '',
    '## Requirements',
    `### Requirement: ${facts.requirementName}`,
    facts.requirementStatement,
    '',
    `#### Scenario: ${facts.requirementName} succeeds`,
    `- **WHEN** ${facts.scenarioWhen}`,
    `- **THEN** ${facts.scenarioThen}`,
    '',
    `### Requirement: ${humanizeSlug(input.capability)} Constraints`,
    secondaryRequirement,
    '',
    `#### Scenario: ${humanizeSlug(input.capability)} constraints are preserved`,
    `- **WHEN** implementation changes ${humanizeSlug(input.capability).toLowerCase()} behavior`,
    `- **THEN** the system preserves ${facts.constraintSentences[0] || 'existing unrelated project behavior'}`,
    '',
    '## Compatibility Notes',
    '- Backward compatibility: preserve existing behavior outside this capability.',
    '- Migration notes: no migration inferred from imported context.',
    `- Observability notes: watch ${humanizeSlug(input.capability).toLowerCase()} behavior after rollout.`,
    ''
  ].join('\n');
}

function renderLlmPrompt(input: SpecIntakeInput, facts: IntakeFacts, blocked: boolean, questions: string[], assumptions: string[]): string {
  const changeRoot = `.ome/omespec/changes/${input.changeSlug}`;
  const contextRoot = `${changeRoot}/context`;
  const capabilityTitle = humanizeSlug(input.capability);
  const attachmentLines = facts.attachments.length > 0
    ? facts.attachments.map(name => `- ${contextRoot}/assets/${name}`).join('\n')
    : '- No imported assets.';

  return [
    '# OME Spec Decomposition Prompt',
    '',
    '## Role',
    `You are refining an OME-owned spec change for \`${input.changeId}\`. Use the imported context and the current repository state to turn the draft artifacts into a precise implementation-ready spec.`,
    '',
    '## Operating Mode',
    '- Work inside the OME spec lifecycle only.',
    '- Do not call, install, or delegate to external OpenSpec tooling.',
    '- Treat the deterministic decompose output as a first draft, not as final authority.',
    '- Use repository evidence before making project architecture claims.',
    '- Remove `TBD:` markers only when the imported context or repository evidence supports the replacement.',
    '- If a requirement is missing, keep the clarification gate blocked and ask concrete questions instead of inventing behavior.',
    '',
    '## Required Context To Load',
    `- ${contextRoot}/source.md`,
    `- ${contextRoot}/prompt.md`,
    `- ${contextRoot}/references.json`,
    `- ${contextRoot}/analysis.md`,
    `- ${changeRoot}/proposal.md`,
    `- ${changeRoot}/design.md`,
    `- ${changeRoot}/tasks.md`,
    `- ${changeRoot}/specs/${input.capability}/spec.md`,
    '- .ome/omespec/project.md',
    `- .ome/omespec/specs/${input.capability}/spec.md if it already exists`,
    '- .ome/rules/ relevant to the implementation domain',
    '- .ome/memory/ relevant prior learnings when available',
    '',
    '## Imported Assets',
    attachmentLines,
    '',
    '## Current Clarification Gate',
    `- Status: ${blocked ? 'BLOCKED' : 'PASSED'}`,
    '',
    '### Blocking Questions',
    questions.length > 0 ? renderBullets(questions, '') : '- None.',
    '',
    '### Current Assumptions',
    assumptions.length > 0 ? renderBullets(assumptions, '') : '- None.',
    '',
    '## Refinement Tasks',
    `1. Re-read the source, prompt, references, assets, and analysis for ${capabilityTitle}.`,
    '2. Update `analysis.md` with evidence-backed requirements, constraints, risks, ambiguities, and asset observations.',
    '3. Rewrite `proposal.md` with a clear problem, goals, non-goals, user impact, acceptance criteria, assumptions, risks, and rollout notes.',
    '4. Rewrite `design.md` with impacted modules, interfaces, data model changes, failure modes, tradeoffs, and verification strategy.',
    '5. Rewrite `tasks.md` into small executable steps with explicit regression and verification work.',
    `6. Rewrite \`${changeRoot}/specs/${input.capability}/spec.md\` so it has exactly one selected change type and concrete requirement statements with WHEN/THEN scenarios.`,
    '7. Preserve all OME paths, lifecycle semantics, and traceability back to imported context.',
    '',
    '## Quality Bar',
    '- The result should be useful to an implementation agent without rereading the original PRD from scratch.',
    '- Every requirement should map to either source text, operator prompt, an imported asset observation, existing repo behavior, or a clearly marked assumption.',
    '- Acceptance criteria should be testable.',
    '- Tasks should identify the nearest verification command or manual check.',
    '- Risks should include compatibility, migration, rollout, and regression concerns when applicable.',
    '',
    '## Output Discipline',
    '- Edit the OME spec artifacts directly; do not create parallel proposal formats.',
    '- Keep unresolved questions in `analysis.md` and `proposal.md`.',
    '- Do not mark tasks or acceptance criteria complete during decomposition.',
    '- After refinement, continue with `ome spec plan <change-id>` and then `ome spec apply <change-id>` when implementation is ready.',
    ''
  ].join('\n');
}

export function decomposeSpecIntake(input: SpecIntakeInput): SpecDecomposition {
  const facts = collectFacts(input);
  const questions = buildBlockingQuestions(input, facts);
  const blocked = questions.length > 0;
  const assumptions = blocked
    ? []
    : [
      `Treat \`${input.capability}\` as the primary capability for this change.`,
      'Use the first imported requirement as the primary acceptance driver.',
      'Keep implementation scope limited unless planning uncovers a required dependency.'
    ];

  return {
    blocked,
    blockingQuestions: questions,
    assumptions,
    analysisMarkdown: renderAnalysis(input, facts, blocked, questions, assumptions),
    llmPromptMarkdown: renderLlmPrompt(input, facts, blocked, questions, assumptions),
    proposalMarkdown: renderProposal(input, facts, blocked, questions, assumptions),
    designMarkdown: renderDesign(input, facts, blocked),
    tasksMarkdown: renderTasks(input, facts, blocked, questions),
    specDeltaMarkdown: renderSpecDelta(input, facts, blocked)
  };
}
