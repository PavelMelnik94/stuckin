/**
 * Утилиты для определения окружения
 * - Не зависят от process.env
 * - Контролируются пользователем через провайдер
 * - Pure Functions: без побочных эффектов
 */

/**
 * Глобальное состояние debug режима
 * Будет устанавливаться через StickyProvider
 */
let globalDebugEnabled = false;

/**
 * Установка глобального debug режима
 */
export const setGlobalDebugMode = (enabled: boolean): void => {
  globalDebugEnabled = enabled;
};

/**
 * Получение текущего debug режима
 */
export const getGlobalDebugMode = (): boolean => {
  return globalDebugEnabled;
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
 * Константы окружения для всего приложения
 * Больше не зависят от NODE_ENV, контролируются пользователем
 */
export const ENV = {
  // Платформа
  isBrowser: isBrowserEnv(),
  isServer: isServerEnv(),

  // Debug режим контролируется пользователем
  get enableDebug() { return getGlobalDebugMode(); },
  get enablePerformanceTracking() { return getGlobalDebugMode(); },

  // Build флаги (статические)
  buildMode: 'library' as const,
  analyzeBundle: false
} as const;

/**
 * Type guards для проверки окружения
 * Теперь основаны на debug режиме пользователя
 */
export const isDebugMode = (): boolean => ENV.enableDebug;
export const isBrowser = (): boolean => ENV.isBrowser;
export const isServer = (): boolean => ENV.isServer;

/**
 * Логирование с учетом debug режима пользователя
 */
export const envLog = {
  /**
   * Логирование только в debug режиме
   */
  debug: (...args: unknown[]): void => {
    if (ENV.enableDebug) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Предупреждения только в debug режиме
   */
  warn: (...args: unknown[]): void => {
    if (ENV.enableDebug) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Ошибки всегда показываются
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Performance логи только если включен debug
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
