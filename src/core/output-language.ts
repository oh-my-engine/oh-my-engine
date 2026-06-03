const { loadConfig } = require('./config-loader');

export type OutputLanguageCode = 'en-US' | 'zh-CN';
export type OutputLanguageSource = 'explicit' | 'config' | 'env' | 'system' | 'default';

export interface OutputLanguageResolution {
  code: OutputLanguageCode;
  source: OutputLanguageSource;
  requested?: string;
  systemLocale?: string;
}

export interface ResolveOutputLanguageOptions {
  explicit?: unknown;
  config?: Record<string, any>;
  includeSystem?: boolean;
}

function firstLocale(value: string): string {
  return value.split(':')[0].split('.')[0].trim();
}

export function normalizeOutputLanguage(value: unknown): OutputLanguageCode | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  const normalized = firstLocale(raw)
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');

  if (
    normalized === 'zh' ||
    normalized === 'zh-cn' ||
    normalized === 'zh-hans' ||
    normalized === 'cn' ||
    normalized === 'chinese' ||
    normalized === 'simplified-chinese' ||
    raw === '中文' ||
    raw === '简体中文' ||
    raw === '汉语'
  ) {
    return 'zh-CN';
  }

  if (
    normalized === 'en' ||
    normalized === 'en-us' ||
    normalized === 'en-gb' ||
    normalized === 'english' ||
    normalized === 'us'
  ) {
    return 'en-US';
  }

  if (normalized.startsWith('zh-')) {
    return 'zh-CN';
  }

  if (normalized.startsWith('en-')) {
    return 'en-US';
  }

  return undefined;
}

export function detectSystemLocale(): string | undefined {
  const envLocale = process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    process.env.LANGUAGE;

  if (typeof envLocale === 'string' && envLocale.trim()) {
    return firstLocale(envLocale);
  }

  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return typeof locale === 'string' && locale.trim() ? locale : undefined;
  } catch (error) {
    return undefined;
  }
}

function resolveConfigLanguage(config?: Record<string, any>): unknown {
  if (!config || typeof config !== 'object') {
    return undefined;
  }

  return config.output?.language || config.outputLanguage;
}

function loadProjectConfig(projectRoot: string): Record<string, any> | undefined {
  try {
    return loadConfig(projectRoot);
  } catch (error) {
    return undefined;
  }
}

export function resolveOutputLanguage(
  projectRoot: string = process.cwd(),
  options: ResolveOutputLanguageOptions = {}
): OutputLanguageResolution {
  const explicit = normalizeOutputLanguage(options.explicit);
  if (explicit) {
    return {
      code: explicit,
      source: 'explicit',
      requested: typeof options.explicit === 'string' ? options.explicit : undefined
    };
  }

  const config = options.config || loadProjectConfig(projectRoot);
  const configLanguage = resolveConfigLanguage(config);
  const fromConfig = normalizeOutputLanguage(configLanguage);
  if (fromConfig) {
    return {
      code: fromConfig,
      source: 'config',
      requested: typeof configLanguage === 'string' ? configLanguage : undefined
    };
  }

  const envValue = process.env.OME_OUTPUT_LANGUAGE || process.env.OME_LANGUAGE;
  const fromEnv = normalizeOutputLanguage(envValue);
  if (fromEnv) {
    return {
      code: fromEnv,
      source: 'env',
      requested: envValue
    };
  }

  if (options.includeSystem !== false) {
    const systemLocale = detectSystemLocale();
    const fromSystem = normalizeOutputLanguage(systemLocale);
    if (fromSystem) {
      return {
        code: fromSystem,
        source: 'system',
        requested: systemLocale,
        systemLocale
      };
    }
  }

  return { code: 'en-US', source: 'default' };
}

export function isOutputLanguageChinese(language: OutputLanguageCode | OutputLanguageResolution): boolean {
  return (typeof language === 'string' ? language : language.code) === 'zh-CN';
}

export function outputLanguageDisplayName(language: OutputLanguageCode | OutputLanguageResolution): string {
  const code = typeof language === 'string' ? language : language.code;
  return code === 'zh-CN' ? '简体中文' : 'English (US)';
}
