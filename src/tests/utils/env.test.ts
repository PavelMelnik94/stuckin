/**
 * Unit тесты для utils/env.ts
 */

import { ENV, envLog, browserSupport, isDebugMode, isBrowser, isServer, setGlobalDebugMode, getGlobalDebugMode } from '../../utils/env';

describe('ENV', () => {
  beforeEach(() => {
    // Сбрасываем debug режим перед каждым тестом
    setGlobalDebugMode(false);
  });

  describe('platform detection', () => {
    test('должен правильно определять браузерную среду', () => {
      // В тестах window определен через jsdom
      expect(ENV.isBrowser).toBe(true);
      expect(ENV.isServer).toBe(false);
    });

    test('type guards должны работать корректно', () => {
      expect(isBrowser()).toBe(true);
      expect(isServer()).toBe(false);
    });
  });

  describe('debug mode control', () => {
    test('должен управлять debug режимом через global state', () => {
      // По умолчанию debug отключен
      expect(getGlobalDebugMode()).toBe(false);
      expect(ENV.enableDebug).toBe(false);

      // Включаем debug
      setGlobalDebugMode(true);
      expect(getGlobalDebugMode()).toBe(true);
      expect(ENV.enableDebug).toBe(true);

      // Выключаем debug
      setGlobalDebugMode(false);
      expect(getGlobalDebugMode()).toBe(false);
      expect(ENV.enableDebug).toBe(false);
    });

    test('performance tracking должен следовать за debug режимом', () => {
      setGlobalDebugMode(false);
      expect(ENV.enablePerformanceTracking).toBe(false);

      setGlobalDebugMode(true);
      expect(ENV.enablePerformanceTracking).toBe(true);
    });

    test('isDebugMode type guard должен работать корректно', () => {
      setGlobalDebugMode(false);
      expect(isDebugMode()).toBe(false);

      setGlobalDebugMode(true);
      expect(isDebugMode()).toBe(true);
    });
  });

  describe('static properties', () => {
    test('все свойства должны иметь правильные типы', () => {
      expect(typeof ENV.isBrowser).toBe('boolean');
      expect(typeof ENV.isServer).toBe('boolean');
      expect(typeof ENV.enableDebug).toBe('boolean');
      expect(typeof ENV.enablePerformanceTracking).toBe('boolean');
      expect(ENV.buildMode).toBe('library');
      expect(typeof ENV.analyzeBundle).toBe('boolean');
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

    test('debug должен логировать только в debug режиме', () => {
      setGlobalDebugMode(false);
      envLog.debug('test message');
      expect(console.log).not.toHaveBeenCalled();

      setGlobalDebugMode(true);
      envLog.debug('test message');
      expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'test message');
    });

    test('warn должен логировать только в debug режиме', () => {
      setGlobalDebugMode(false);
      envLog.warn('warning message');
      expect(console.warn).not.toHaveBeenCalled();

      setGlobalDebugMode(true);
      envLog.warn('warning message');
      expect(console.warn).toHaveBeenCalledWith('[WARN]', 'warning message');
    });

    test('error должен всегда выводить ошибки', () => {
      setGlobalDebugMode(false);
      envLog.error('error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR]', 'error message');

      setGlobalDebugMode(true);
      envLog.error('error message');
      expect(console.error).toHaveBeenCalledWith('[ERROR]', 'error message');
    });

    test('performance должен логировать только в debug режиме', () => {
      setGlobalDebugMode(false);
      envLog.performance('perf message');
      expect(console.log).not.toHaveBeenCalled();

      setGlobalDebugMode(true);
      envLog.performance('perf message');
      expect(console.log).toHaveBeenCalledWith('[PERF]', 'perf message');
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
