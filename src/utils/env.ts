/**
 * Утилиты для работы с environment переменными
 * - Single Responsibility: только env логика
 * - Pure Functions: без побочных эффектов
 * - Type Safety: строгая типизация
 */

/**
 * Безопасное получение NODE_ENV с fallback для browser/node окружений
 */
const getNodeEnv = (): 'development' | 'production' | 'test' => {
  // В браузере всегда используем production
  if (typeof window !== 'undefined') {
    return 'production';
  }

  // В Node.js окружении (например, тесты)
  // Используем глобальную переменную, которая будет заменена во время сборки
  try {
    // @ts-ignore - эта переменная будет заменена Vite
    const nodeEnv = __NODE_ENV__;
    if (nodeEnv === 'development' || nodeEnv === 'production' || nodeEnv === 'test') {
      return nodeEnv;
    }
  } catch {
    // Fallback
  }

  // Fallback для неопределенного NODE_ENV
  return 'development';
};

/**
 * Проверка выполнения в браузере
 */
const isBrowserEnv = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Проверка выполнения на сервере
 */
const isServerEnv = (): boolean => {
  return !isBrowserEnv();
};

/**
 * Безопасное получение environment переменных для browser/node окружений
 */
const getEnvVar = (_key: string, defaultValue: string = ''): string => {
  // В браузере не используем environment переменные
  if (typeof window !== 'undefined') {
    return defaultValue;
  }

  // В Node.js среде возвращаем дефолтное значение
  // Это безопасно, так как мы не храним чувствительных данных
  return defaultValue;
};

/**
 * Константы окружения для всего приложения
 * Принцип Information Expert: централизованная информация об окружении
 */
export const ENV = {
  // Основные флаги окружения (динамические)
  get isDevelopment() { return getNodeEnv() === 'development'; },
  get isProduction() { return getNodeEnv() === 'production'; },
  get isTest() { return getNodeEnv() === 'test'; },

  // Исходное значение (динамическое)
  get nodeEnv() { return getNodeEnv(); },

  // Флаги платформы
  isBrowser: isBrowserEnv(),
  isServer: isServerEnv(),

  // Дополнительные build флаги
  buildMode: getEnvVar('BUILD_MODE', 'library') as 'library' | 'standalone',
  analyzeBundle: getEnvVar('ANALYZE_BUNDLE') === 'true',

  // Debug флаги
  enableDebug: getNodeEnv() === 'development',
  enablePerformanceTracking: getNodeEnv() !== 'production'
} as const;

/**
 * Type guards для проверки окружения
 * Принцип: явные функции вместо прямого обращения к константам
 */
export const isDev = (): boolean => ENV.isDevelopment;
export const isProd = (): boolean => ENV.isProduction;
export const isTest = (): boolean => ENV.isTest;
export const isBrowser = (): boolean => ENV.isBrowser;
export const isServer = (): boolean => ENV.isServer;

/**
 * Логирование с учетом окружения
 * Принцип: централизованная логика логирования
 */
export const envLog = {
  /**
   * Логирование только в development
   */
  dev: (...args: unknown[]): void => {
    if (ENV.isDevelopment) {
      console.log('[DEV]', ...args);
    }
  },

  /**
   * Предупреждения во всех окружениях кроме production
   */
  warn: (...args: unknown[]): void => {
    if (!ENV.isProduction) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Ошибки во всех окружениях
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Performance логи только если включено
   */
  performance: (...args: unknown[]): void => {
    if (ENV.enablePerformanceTracking) {
      console.log('[PERF]', ...args);
    }
  }
};

/**
 * Проверка поддержки браузерных API
 * Принцип: безопасная проверка доступности API
 */
export const browserSupport = {
  intersectionObserver: isBrowser() && 'IntersectionObserver' in window,
  resizeObserver: isBrowser() && 'ResizeObserver' in window,
  requestIdleCallback: isBrowser() && 'requestIdleCallback' in window,
  matchMedia: isBrowser() && 'matchMedia' in window,
  cssSupports: isBrowser() && 'CSS' in window && 'supports' in CSS
} as const;
