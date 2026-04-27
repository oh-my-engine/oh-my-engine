const DEFAULT_MEMORY_CONFIG = {
  enabled: true,
  captureMode: 'selective',
  allowSources: {
    workflow_command: true,
    explicit_remember: true,
    post_run_promotion: true
  },
  thresholds: {
    preferencePromotion: 0.8,
    knowledgePromotion: 0.85,
    skillCandidatePromotion: 0.9
  }
};

function mergeMemoryConfig(config: Record<string, any> = {}) {
  return {
    ...DEFAULT_MEMORY_CONFIG,
    ...config,
    allowSources: {
      ...DEFAULT_MEMORY_CONFIG.allowSources,
      ...(config.allowSources || {})
    },
    thresholds: {
      ...DEFAULT_MEMORY_CONFIG.thresholds,
      ...(config.thresholds || {})
    }
  };
}

function scorePromotion(event: Record<string, any>): number {
  const reusePotential = Number(event.reusePotential || 0);
  const stability = Number(event.stability || 0);
  const novelty = Number(event.novelty || 0);

  return (reusePotential + stability + novelty) / 3;
}

function decideCapture(event: Record<string, any>, config: Record<string, any> = {}) {
  const memoryConfig = mergeMemoryConfig(config);
  const source = event.source || 'chat';

  if (!memoryConfig.enabled) {
    return {
      shouldPersist: false,
      captureLevel: 'none',
      reason: 'memory_disabled'
    };
  }

  if (!memoryConfig.allowSources[source]) {
    return {
      shouldPersist: false,
      captureLevel: 'none',
      reason: 'source_not_allowed'
    };
  }

  if (event.sensitivity === 'high') {
    return {
      shouldPersist: false,
      captureLevel: 'none',
      reason: 'sensitive_material'
    };
  }

  if (source === 'explicit_remember') {
    return {
      shouldPersist: true,
      captureLevel: event.kind === 'execution' ? 'rich' : 'summary',
      reason: 'explicit_remember'
    };
  }

  if (source === 'workflow_command') {
    if (event.kind !== 'execution') {
      return {
        shouldPersist: true,
        captureLevel: 'summary',
        reason: 'workflow_command'
      };
    }

    if (event.complexity === 'high') {
      return {
        shouldPersist: true,
        captureLevel: 'rich',
        reason: 'workflow_command_high_complexity'
      };
    }

    if (event.complexity === 'medium') {
      return {
        shouldPersist: true,
        captureLevel: 'summary',
        reason: 'workflow_command_medium_complexity'
      };
    }

    if (Number(event.reusePotential || 0) >= 0.5 || Number(event.novelty || 0) >= 0.5) {
      return {
        shouldPersist: true,
        captureLevel: 'summary',
        reason: 'workflow_command_reusable'
      };
    }

    return {
      shouldPersist: false,
      captureLevel: 'none',
      reason: 'workflow_command_low_value'
    };
  }

  if (source === 'post_run_promotion') {
    const promotionScore = scorePromotion(event);
    const thresholds = memoryConfig.thresholds;

    if (event.kind === 'preference' && promotionScore >= thresholds.preferencePromotion) {
      return {
        shouldPersist: true,
        captureLevel: 'summary',
        reason: 'promoted_preference'
      };
    }

    if (event.kind === 'knowledge' && promotionScore >= thresholds.knowledgePromotion) {
      return {
        shouldPersist: true,
        captureLevel: 'summary',
        reason: 'promoted_knowledge'
      };
    }

    if (event.kind === 'skill_candidate' && promotionScore >= thresholds.skillCandidatePromotion) {
      return {
        shouldPersist: true,
        captureLevel: 'rich',
        reason: 'promoted_skill_candidate'
      };
    }
  }

  return {
    shouldPersist: false,
    captureLevel: 'none',
    reason: 'source_not_allowed'
  };
}

module.exports = {
  DEFAULT_MEMORY_CONFIG,
  mergeMemoryConfig,
  decideCapture
};

export {};
