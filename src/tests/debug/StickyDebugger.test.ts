/**
 * Тесты для StickyDebugger
 */

import { stickyDebugger } from '../../debug/StickyDebugger';
import { setGlobalDebugMode } from '../../utils/env';

// Mock environment для тестирования
jest.mock('../../utils/env', () => ({
  ENV: {
    isBrowser: true,
    isServer: false,
    enableDebug: true,
    enablePerformanceTracking: true
  },
  envLog: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    performance: jest.fn()
  },
  setGlobalDebugMode: jest.fn(),
  getGlobalDebugMode: jest.fn(() => true)
}));

// Mock performance monitor
jest.mock('../../utils/performance', () => ({
  performanceMonitor: {
    enable: jest.fn(),
    disable: jest.fn(),
    getAllMetrics: jest.fn(() => []),
    trackRecalculation: jest.fn(),
    measureRenderTime: jest.fn(),
    measureScrollResponsiveness: jest.fn(),
    reportMetrics: jest.fn(),
    getMetrics: jest.fn(() => ({
      renderTime: 0,
      scrollResponsiveness: 0,
      recalculations: 0
    }))
  }
}));

describe('StickyDebugger', () => {
  beforeEach(() => {
    // Включаем debug режим для тестов
    setGlobalDebugMode(true);

    // Очищаем состояние debugger между тестами
    stickyDebugger.clearHistory();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Выключаем debug режим после тестов
    setGlobalDebugMode(false);
  });

  describe('базовая функциональность', () => {
    it('должен быть определен и иметь правильные свойства', () => {
      expect(stickyDebugger).toBeDefined();
      expect(typeof stickyDebugger.log).toBe('function');
      expect(typeof stickyDebugger.clearHistory).toBe('function');
      expect(typeof stickyDebugger.captureSnapshot).toBe('function');
      expect(typeof stickyDebugger.enable).toBe('function');
      expect(typeof stickyDebugger.disable).toBe('function');
    });

    it('должен иметь геттеры для доступа к данным', () => {
      expect(stickyDebugger.allEvents).toBeDefined();
      expect(Array.isArray(stickyDebugger.allEvents)).toBe(true);
      expect(stickyDebugger.debugConfig).toBeDefined();
      expect(typeof stickyDebugger.debugConfig).toBe('object');
      expect(typeof stickyDebugger.isEnabled).toBe('boolean');
    });

    it('должен логировать события', () => {
      const initialCount = stickyDebugger.allEvents.length;

      stickyDebugger.log('debug', 'test-element', 'Test message', { test: 'data' });

      expect(stickyDebugger.allEvents.length).toBe(initialCount + 1);
      const event = stickyDebugger.allEvents[stickyDebugger.allEvents.length - 1];
      expect(event).toBeDefined();
      expect(event!.type).toBe('debug');
      expect(event!.elementId).toBe('test-element');
      expect(event!.data.message).toBe('Test message');
      expect(event!.data.test).toBe('data');
    });

    it('должен создавать уникальные ID для событий', () => {
      stickyDebugger.log('debug', 'element-1', 'Message 1');
      stickyDebugger.log('debug', 'element-2', 'Message 2');

      const events = stickyDebugger.allEvents;
      const lastTwoEvents = events.slice(-2);
      expect(lastTwoEvents.length).toBe(2);
      expect(lastTwoEvents[0]!.id).not.toBe(lastTwoEvents[1]!.id);
    });

    it('должен очищать историю событий', () => {
      stickyDebugger.log('debug', 'test-element', 'Test message');
      expect(stickyDebugger.allEvents.length).toBeGreaterThan(0);

      stickyDebugger.clearHistory();
      expect(stickyDebugger.allEvents.length).toBe(0);
    });
  });

  describe('конфигурация и управление', () => {
    it('должен включаться и выключаться', () => {
      stickyDebugger.enable({ logLevel: 'debug' });
      expect(stickyDebugger.isEnabled).toBe(true);
      expect(stickyDebugger.debugConfig.logLevel).toBe('debug');

      stickyDebugger.disable();
      expect(stickyDebugger.isEnabled).toBe(false);
    });

    it('должен обновлять конфигурацию', () => {
      stickyDebugger.enable({ maxHistorySize: 500, logLevel: 'warn' });

      const newConfig = stickyDebugger.debugConfig;
      expect(newConfig.maxHistorySize).toBe(500);
      expect(newConfig.logLevel).toBe('warn');
    });

    it('должен применять дефолтную конфигурацию', () => {
      stickyDebugger.enable();

      const config = stickyDebugger.debugConfig;
      expect(config.enabled).toBe(true);
      expect(config.maxHistorySize).toBeDefined();
      expect(config.logLevel).toBeDefined();
    });
  });

  describe('снимки состояния', () => {
    it('должен создавать снимки', () => {
      const initialCount = stickyDebugger.allSnapshots.length;

      const snapshot = stickyDebugger.captureSnapshot('test-snapshot');

      expect(stickyDebugger.allSnapshots.length).toBe(initialCount + 1);
      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.elements).toBeDefined();
      expect(snapshot.groups).toBeDefined();
      expect(snapshot.viewport).toBeDefined();
    });

    it('должен включать метрики производительности в снимки', () => {
      const snapshot = stickyDebugger.captureSnapshot();

      expect(snapshot.performance).toBeDefined();
      expect(Array.isArray(snapshot.performance)).toBe(true);
    });
  });

  describe('типы событий', () => {
    it('должен поддерживать все типы событий', () => {
      const eventTypes = ['error', 'warning', 'info', 'debug', 'state-change', 'config-update', 'registration', 'unregistration'] as const;

      eventTypes.forEach(type => {
        stickyDebugger.log(type, 'test-element', `${type} message`);
      });

      const events = stickyDebugger.allEvents;
      const recentEvents = events.slice(-eventTypes.length);

      eventTypes.forEach((type, index) => {
        expect(recentEvents[index]).toBeDefined();
        expect(recentEvents[index]!.type).toBe(type);
      });
    });
  });

  describe('фильтрация событий', () => {
    it('должен фильтровать события по уровню логирования', () => {
      stickyDebugger.enable({ logLevel: 'error' });
      stickyDebugger.clearHistory();

      stickyDebugger.log('error', 'test-element', 'Error message');
      stickyDebugger.log('debug', 'test-element', 'Debug message');

      const filteredEvents = stickyDebugger.filteredEvents;
      expect(filteredEvents.length).toBe(1);
      expect(filteredEvents[0]).toBeDefined();
      expect(filteredEvents[0]!.type).toBe('error');
    });

    it('должен показывать все события при debug уровне', () => {
      stickyDebugger.enable({ logLevel: 'debug' });
      stickyDebugger.clearHistory();

      stickyDebugger.log('error', 'test-element', 'Error message');
      stickyDebugger.log('warning', 'test-element', 'Warning message');
      stickyDebugger.log('info', 'test-element', 'Info message');
      stickyDebugger.log('debug', 'test-element', 'Debug message');

      const filteredEvents = stickyDebugger.filteredEvents;
      expect(filteredEvents.length).toBe(4);
    });
  });

  describe('визуальная отладка', () => {
    it('должен регистрировать визуальные элементы', () => {
      const mockElement = document.createElement('div');
      stickyDebugger.enable({ visualDebug: true });

      expect(() => {
        stickyDebugger.registerVisualElement('test-element', mockElement);
      }).not.toThrow();

      expect(stickyDebugger.visualElementsStats.total).toBeGreaterThan(0);
    });

    it('должен удалять визуальные элементы', () => {
      const mockElement = document.createElement('div');
      stickyDebugger.enable({ visualDebug: true });

      stickyDebugger.registerVisualElement('test-element', mockElement);
      const initialCount = stickyDebugger.visualElementsStats.total;

      stickyDebugger.unregisterVisualElement('test-element');

      expect(stickyDebugger.visualElementsStats.total).toBeLessThan(initialCount);
    });

    it('должен предоставлять статистику визуальных элементов', () => {
      const stats = stickyDebugger.visualElementsStats;

      expect(stats).toBeDefined();
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
    });
  });

  describe('анализ производительности', () => {
    it('должен предоставлять анализ производительности', () => {
      const analysis = stickyDebugger.performanceAnalysis;

      expect(analysis).toBeDefined();
      expect(analysis.summary).toBeDefined();
      expect(Array.isArray(analysis.slowElements)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('должен возвращать пустой анализ при отсутствии данных', () => {
      const analysis = stickyDebugger.performanceAnalysis;

      expect(analysis.summary).toBeNull();
      expect(analysis.slowElements).toHaveLength(0);
      expect(analysis.recommendations).toContain('Нет данных о производительности');
    });
  });

  describe('ограничения и производительность', () => {
    it('должен ограничивать количество событий в истории', () => {
      stickyDebugger.enable({ maxHistorySize: 5 });
      stickyDebugger.clearHistory();

      // Добавляем больше событий чем лимит
      for (let i = 0; i < 10; i++) {
        stickyDebugger.log('debug', `element-${i}`, `Message ${i}`);
      }

      expect(stickyDebugger.allEvents.length).toBeLessThanOrEqual(5);
    });

    it('должен сохранять последние события при превышении лимита', () => {
      stickyDebugger.enable({ maxHistorySize: 3 });
      stickyDebugger.clearHistory();

      stickyDebugger.log('debug', 'element-1', 'Message 1');
      stickyDebugger.log('debug', 'element-2', 'Message 2');
      stickyDebugger.log('debug', 'element-3', 'Message 3');
      stickyDebugger.log('debug', 'element-4', 'Message 4');

      const events = stickyDebugger.allEvents;
      expect(events.length).toBe(3);
      const lastEvent = events[events.length - 1];
      expect(lastEvent).toBeDefined();
      expect(lastEvent!.data.message).toBe('Message 4');
    });
  });

  describe('обработка ошибок', () => {
    it('должен обрабатывать undefined данные', () => {
      expect(() => {
        stickyDebugger.log('debug', 'test-element', 'Test message', undefined);
      }).not.toThrow();

      const events = stickyDebugger.allEvents;
      const lastEvent = events[events.length - 1];
      expect(lastEvent).toBeDefined();
      expect(lastEvent!.data.message).toBe('Test message');
    });

    it('должен обрабатывать null данные', () => {
      expect(() => {
        stickyDebugger.log('debug', 'test-element', 'Test message', null);
      }).not.toThrow();
    });

    it('должен работать в отключенном состоянии', () => {
      stickyDebugger.disable();
      const initialCount = stickyDebugger.allEvents.length;

      stickyDebugger.log('debug', 'test-element', 'Test message');

      // События не должны добавляться когда debugger отключен
      expect(stickyDebugger.allEvents.length).toBe(initialCount);
    });
  });
});
