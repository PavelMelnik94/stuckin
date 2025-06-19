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
  // Проверка браузерного окружения первым приоритетом
  if (typeof window !== 'undefined') {
    // В браузере используем production по умолчанию для безопасности
    return 'production';
  }

  // Node.js окружение
  try {
    if (typeof process !== 'undefined' && process.env) {
      const env = process.env['NODE_ENV'];
      if (env === 'development' || env === 'production' || env === 'test') {
        return env;
      }
    }
  } catch {
    // Если process недоступен, используем fallback
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
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // В браузере не используем environment переменные
  if (typeof window !== 'undefined') {
    return defaultValue;
  }

  // Node.js окружение
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || defaultValue;
    }
  } catch {
    // process недоступен
  }
  return defaultValue;
};

/**
 * Константы окружения для всего приложения
 * Принцип Information Expert: централизованная информация об окружении
 */
export const ENV = {
  // Основные флаги окружения
  isDevelopment: getNodeEnv() === 'development',
  isProduction: getNodeEnv() === 'production',
  isTest: getNodeEnv() === 'test',

  // Исходное значение
  nodeEnv: getNodeEnv(),

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
