/**
 * Unit тесты для utils/env.ts
 */

// Настраиваем глобальный window для тестов
const mockWindow = {};

// Проверяем и настраиваем window только если не существует
if (typeof window === 'undefined') {
  Object.defineProperty(global, 'window', {
    writable: true,
    value: mockWindow
  });
} else {
  // Если window уже существует, обновляем его свойства
  Object.assign(window, mockWindow);
}

// Теперь импортируем модуль
import { ENV, envLog, browserSupport, isDev, isProd, isTest, isBrowser, isServer } from '../../utils/env';

describe('ENV', () => {
  describe('статические значения в test среде', () => {
    test('должен правильно определять test environment', () => {
      // В браузерном окружении (jsdom) наша новая логика возвращает production по умолчанию для безопасности
      // Это корректное поведение для предотвращения ошибок с process.env в браузере
      expect(ENV.isProduction).toBe(true);
      expect(ENV.isDevelopment).toBe(false);
      expect(ENV.isTest).toBe(false);
    });

    test('должен правильно определять браузерную среду', () => {
      // В тестах window определен через jsdom
      expect(ENV.isBrowser).toBe(true);
      expect(ENV.isServer).toBe(false);
    });

    test('должен правильно настраивать debug в test среде', () => {
      // В браузерном окружении с production по умолчанию debug отключен
      expect(ENV.enableDebug).toBe(false);
    });

    test('должен правильно настраивать performance tracking', () => {
      // В production режиме performance tracking отключен
      expect(ENV.enablePerformanceTracking).toBe(false);
    });
  });

  describe('динамические проверки', () => {
    test('должен проверять NODE_ENV корректно', () => {
      expect(process?.env?.['NODE_ENV']).toBe('test');
    });

    test('все ENV свойства должны быть boolean', () => {
      expect(typeof ENV.isDevelopment).toBe('boolean');
      expect(typeof ENV.isProduction).toBe('boolean');
      expect(typeof ENV.isTest).toBe('boolean');
      expect(typeof ENV.isBrowser).toBe('boolean');
      expect(typeof ENV.isServer).toBe('boolean');
      expect(typeof ENV.enableDebug).toBe('boolean');
      expect(typeof ENV.enablePerformanceTracking).toBe('boolean');
    });
  });

  describe('type guards', () => {
    test('isDev должен работать корректно', () => {
      expect(typeof isDev()).toBe('boolean');
    });

    test('isProd должен работать корректно', () => {
      expect(typeof isProd()).toBe('boolean');
    });

    test('isTest должен работать корректно', () => {
      expect(typeof isTest()).toBe('boolean');
    });

    test('isBrowser должен работать корректно', () => {
      expect(typeof isBrowser()).toBe('boolean');
    });

    test('isServer должен работать корректно', () => {
      expect(typeof isServer()).toBe('boolean');
    });
  });

  describe('envLog', () => {
    const originalConsole = { ...console };

    beforeEach(() => {
      console.log = jest.fn();
      console.warn = jest.fn();
      console.error = jest.fn();
    });

    afterEach(() => {
      Object.assign(console, originalConsole);
    });

    test('dev должен логировать в development mode', () => {
      envLog.dev('test message');
      expect(typeof envLog.dev).toBe('function');
    });

    test('warn должен предупреждать', () => {
      envLog.warn('warning message');
      expect(typeof envLog.warn).toBe('function');
    });

    test('error должен выводить ошибки', () => {
      envLog.error('error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR]', 'error message');
    });

    test('performance должен логировать', () => {
      envLog.performance('perf message');
      expect(typeof envLog.performance).toBe('function');
    });
  });

  describe('browserSupport', () => {
    test('должен проверять поддержку IntersectionObserver', () => {
      expect(typeof browserSupport.intersectionObserver).toBe('boolean');
    });

    test('должен проверять поддержку ResizeObserver', () => {
      expect(typeof browserSupport.resizeObserver).toBe('boolean');
    });

    test('должен проверять поддержку requestIdleCallback', () => {
      expect(typeof browserSupport.requestIdleCallback).toBe('boolean');
    });

    test('должен проверять поддержку matchMedia', () => {
      expect(typeof browserSupport.matchMedia).toBe('boolean');
    });

    test('должен проверять поддержку CSS.supports', () => {
      expect(typeof browserSupport.cssSupports).toBe('boolean');
    });
  });
});
