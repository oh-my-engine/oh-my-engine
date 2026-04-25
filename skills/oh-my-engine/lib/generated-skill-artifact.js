const DIRECTIVE_PRESETS = {
  'react-event-handler-invocation': [
    'Avoid immediate invocation in React JSX event handlers; pass function references instead of calling handlers during render.',
    'If a handler needs arguments, wrap it in an explicit closure at the event boundary rather than invoking it while rendering.',
    'When updating affected components, add or refresh interaction coverage that proves handlers run on user action rather than render.'
  ],
  'async-await-missing': [
    'Await async calls or explicitly mark them as intentionally detached; do not leave floating promises in production paths.',
    'When wiring async logic into lifecycle code, make failure handling and cancellation behavior explicit.'
  ],
  'react-state-mutation': [
    'Do not mutate React state objects directly; always route updates through the relevant setter or immutable state transition.',
    'When changing nested state, preserve immutability so rerender behavior remains predictable.'
  ],
  'useeffect-missing-deps': [
    'Keep React useEffect dependency arrays aligned with the external values used inside the effect.',
    'If a dependency is intentionally omitted, document the reason and restructure the effect to keep behavior stable.'
  ],
  'memory-leak-event-listener': [
    'Pair every event listener registration with a cleanup path so listeners do not survive component or resource teardown.',
    'When adding subscriptions in React effects, include cleanup logic in the returned disposer.'
  ],
  'race-condition-async': [
    'Guard async effects against stale updates by using cancellation, AbortController, or an equivalent cleanup mechanism.',
    'Do not let older async responses overwrite newer state without an explicit ordering rule.'
  ]
};

function buildFallbackDirectives(record) {
  const patternLabel = record.patternId || record.slug || 'adopted-skill';
  const directives = [
    `Apply the adopted fix pattern "${patternLabel}" before repeating the same implementation shape.`
  ];

  if (record.summary) {
    directives.push(`Review touched code for repeats of: ${record.summary}`);
  }

  return directives;
}

function buildGeneratedSkillArtifact(record, adoptedAt) {
  const executionDirectives =
    DIRECTIVE_PRESETS[record.patternId] || buildFallbackDirectives(record);

  return {
    slug: record.slug,
    title: record.title,
    patternId: record.patternId,
    summary: record.summary,
    evidenceCount: record.evidenceCount,
    adoptedAt,
    adoptedFrom: `.oh-my-engine/memory/skill-candidates/${record.slug}.json`,
    source: record.source,
    status: 'adopted',
    executionDirectives
  };
}

module.exports = {
  buildGeneratedSkillArtifact
};
