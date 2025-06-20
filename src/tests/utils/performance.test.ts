/**
 * Unit тесты для performance утилит
 */

import { performanceMonitor } from '../../utils/performance';

describe('Performance Utils', () => {
  const originalNodeEnv = process?.env?.['NODE_ENV'];

  beforeEach(() => {
    jest.useFakeTimers();
    performanceMonitor.disable();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    performanceMonitor.disable();
    process.env["NODE_ENV"] = originalNodeEnv;
  });

  describe('PerformanceMonitor', () => {
    test('должен включаться только в development режиме', () => {
      // Тестируем что в production не включается автоматически
      const originalNodeEnv = process.env["NODE_ENV"];

      try {
        process.env["NODE_ENV"] = 'production';
        performanceMonitor.disable();
        performanceMonitor.enable();

        // В production автоматически не должен включаться
        const testFn = () => 'result';
        performanceMonitor.measureRenderTime('test-prod', testFn);
        expect(performanceMonitor.getMetrics('test-prod')).toBeNull();

        // Но forceEnable должен работать всегда
        performanceMonitor.forceEnable();
        performanceMonitor.measureRenderTime('test-force', testFn);
        expect(performanceMonitor.getMetrics('test-force')).toBeTruthy();
      } finally {
        process.env["NODE_ENV"] = originalNodeEnv;
      }
    });

    test('должен измерять время рендера', () => {
      performanceMonitor.forceEnable(); // Используем принудительное включение

      const testFunction = jest.fn(() => 'result');
      const result = performanceMonitor.measureRenderTime('test-element', testFunction);

      expect(result).toBe('result');
      expect(testFunction).toHaveBeenCalledTimes(1);

      const metrics = performanceMonitor.getMetrics('test-element');
      expect(metrics).toBeTruthy();
      expect(metrics?.renderTime).toBeGreaterThanOrEqual(0);
    });

    test('должен измерять отзывчивость скролла', () => {
      performanceMonitor.forceEnable();

      const scrollHandler = jest.fn();
      const wrappedHandler = performanceMonitor.measureScrollResponsiveness('test-element', scrollHandler);

      wrappedHandler();

      expect(scrollHandler).toHaveBeenCalledTimes(1);

      const metrics = performanceMonitor.getMetrics('test-element');
      expect(metrics).toBeTruthy();
      expect(typeof metrics?.scrollResponsiveness).toBe('number');
    });

    test('должен отслеживать пересчеты', () => {
      performanceMonitor.forceEnable();

      // Сначала создаем метрику через measureRenderTime
      performanceMonitor.measureRenderTime('test-element', () => 'result');

      // Теперь отслеживаем пересчеты
      performanceMonitor.trackRecomputation('test-element');
      let metrics = performanceMonitor.getMetrics('test-element');
      expect(metrics?.recomputations).toBe(1);

      performanceMonitor.trackRecomputation('test-element');
      metrics = performanceMonitor.getMetrics('test-element');
      expect(metrics?.recomputations).toBe(2);
    });

    test('должен возвращать все метрики', () => {
      performanceMonitor.forceEnable();

      performanceMonitor.measureRenderTime('element1', () => 'test1');
      performanceMonitor.measureRenderTime('element2', () => 'test2');

      const allMetrics = performanceMonitor.getAllMetrics();
      expect(allMetrics.length).toBeGreaterThanOrEqual(2);
      expect(allMetrics.map(m => m.elementId)).toContain('element1');
      expect(allMetrics.map(m => m.elementId)).toContain('element2');
    });

    test('должен поддерживать подписку на изменения метрик', () => {
      performanceMonitor.forceEnable();

      const observer = jest.fn();
      const unsubscribe = performanceMonitor.subscribe(observer);

      performanceMonitor.measureRenderTime('test-element', () => 'result');

      expect(observer).toHaveBeenCalled();
      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({
          elementId: 'test-element',
          renderTime: expect.any(Number)
        })
      );

      unsubscribe();
    });

    test('должен генерировать отчет о производительности', () => {
      performanceMonitor.forceEnable();

      performanceMonitor.measureRenderTime('element1', () => 'test');
      performanceMonitor.trackRecomputation('element1');

      const report = performanceMonitor.generateReport();

      expect(report).toContain('Отчет о производительности');
      expect(report).toContain('element1');
    });

    test('должен возвращать сообщение об отсутствии данных для пустого отчета', () => {
      process.env["NODE_ENV"] = 'development';
      performanceMonitor.enable();

      const report = performanceMonitor.generateReport();
      expect(report).toBe('Нет данных для отчета о производительности');
    });

    test('должен корректно обрабатывать отключение мониторинга', () => {
      performanceMonitor.forceEnable();

      performanceMonitor.measureRenderTime('test-element', () => 'result');
      expect(performanceMonitor.getMetrics('test-element')).toBeTruthy();

      performanceMonitor.disable();
      expect(performanceMonitor.getMetrics('test-element')).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('должен работать без ошибок при отключенном мониторинге', () => {
      expect(() => {
        performanceMonitor.measureRenderTime('test', () => 'result');
        performanceMonitor.trackRecomputation('test');
        performanceMonitor.getMetrics('test');
      }).not.toThrow();
    });

    test('должен обрабатывать ошибки в измеряемых функциях', () => {
      process.env["NODE_ENV"] = 'development';
      performanceMonitor.enable();

      const errorFunction = () => {
        throw new Error('Test error');
      };

      expect(() => {
        performanceMonitor.measureRenderTime('error-element', errorFunction);
      }).toThrow('Test error');
    });

    test('должен возвращать null для несуществующего элемента', () => {
      process.env["NODE_ENV"] = 'development';
      performanceMonitor.enable();

      expect(performanceMonitor.getMetrics('non-existent')).toBeNull();
    });
  });
});
