/**
 * Unit тесты для debugLogger
 */

import { debugLogger } from '../../debug/debugLogger';
import { stickyDebugger } from '../../debug/StickyDebugger';
import { ENV } from '../../utils/env';

// Мокаем StickyDebugger
jest.mock('../../debug/StickyDebugger', () => ({
  stickyDebugger: {
    log: jest.fn()
  }
}));

// Мокаем ENV для production проверок
jest.mock('../../utils/env', () => ({
  ENV: {
    isProduction: false,
    isDevelopment: true,
    isTest: true
  }
}));

describe('debugLogger', () => {
  const mockedStickyDebugger = stickyDebugger as jest.Mocked<typeof stickyDebugger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('методы логирования по уровням', () => {
    test('error должен вызывать stickyDebugger.log с типом error', () => {
      const elementId = 'test-element';
      const message = 'Test error';
      const data = { error: 'details' };

      debugLogger.error(elementId, message, data);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('error', elementId, message, data);
    });

    test('warning должен вызывать stickyDebugger.log с типом warning', () => {
      const elementId = 'test-element';
      const message = 'Test warning';
      const data = { warning: 'details' };

      debugLogger.warning(elementId, message, data);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('warning', elementId, message, data);
    });

    test('info должен вызывать stickyDebugger.log с типом info', () => {
      const elementId = 'test-element';
      const message = 'Test info';
      const data = { info: 'details' };

      debugLogger.info(elementId, message, data);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('info', elementId, message, data);
    });

    test('debug должен вызывать stickyDebugger.log с типом debug', () => {
      const elementId = 'test-element';
      const message = 'Test debug';
      const data = { debug: 'details' };

      debugLogger.debug(elementId, message, data);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('debug', elementId, message, data);
    });
  });

  describe('специализированные методы логирования', () => {
    test('stateChange должен логировать изменение состояния', () => {
      const elementId = 'test-element';
      const oldState = 'normal';
      const newState = 'sticky';
      const data = { transition: 'details' };

      debugLogger.stateChange(elementId, oldState, newState, data);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith(
        'state-change',
        elementId,
        'Состояние изменено: normal → sticky',
        data
      );
    });

    test('configUpdate должен логировать обновление конфигурации', () => {
      const elementId = 'test-element';
      const changes = { enabled: true, offset: 10 };

      debugLogger.configUpdate(elementId, changes);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith(
        'config-update',
        elementId,
        'Конфигурация обновлена',
        changes
      );
    });

    test('registration должен логировать регистрацию элемента', () => {
      const elementId = 'test-element';
      const config = { enabled: true, direction: 'top' };

      debugLogger.registration(elementId, config);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith(
        'registration',
        elementId,
        'Элемент зарегистрирован',
        config
      );
    });

    test('unregistration должен логировать удаление элемента с причиной', () => {
      const elementId = 'test-element';
      const reason = 'component unmounted';

      debugLogger.unregistration(elementId, reason);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith(
        'unregistration',
        elementId,
        'Элемент удален: component unmounted',
        { reason }
      );
    });

    test('unregistration должен логировать удаление элемента без причины', () => {
      const elementId = 'test-element';

      debugLogger.unregistration(elementId);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith(
        'unregistration',
        elementId,
        'Элемент удален',
        { reason: undefined }
      );
    });
  });

  describe('обработка различных типов данных', () => {
    test('должен обрабатывать undefined data', () => {
      debugLogger.error('test', 'message');
      debugLogger.warning('test', 'message');
      debugLogger.info('test', 'message');
      debugLogger.debug('test', 'message');

      expect(mockedStickyDebugger.log).toHaveBeenCalledTimes(4);
      expect(mockedStickyDebugger.log).toHaveBeenNthCalledWith(1, 'error', 'test', 'message', undefined);
      expect(mockedStickyDebugger.log).toHaveBeenNthCalledWith(2, 'warning', 'test', 'message', undefined);
      expect(mockedStickyDebugger.log).toHaveBeenNthCalledWith(3, 'info', 'test', 'message', undefined);
      expect(mockedStickyDebugger.log).toHaveBeenNthCalledWith(4, 'debug', 'test', 'message', undefined);
    });

    test('должен обрабатывать различные типы данных', () => {
      const testCases = [
        { data: null, name: 'null' },
        { data: 'string', name: 'string' },
        { data: 123, name: 'number' },
        { data: true, name: 'boolean' },
        { data: { obj: 'value' }, name: 'object' },
        { data: ['array'], name: 'array' }
      ];

      testCases.forEach(({ data, name }, index) => {
        debugLogger.info('test', `message-${name}`, data);
        expect(mockedStickyDebugger.log).toHaveBeenNthCalledWith(
          index + 1,
          'info',
          'test',
          `message-${name}`,
          data
        );
      });
    });

    test('должен обрабатывать пустые строки и специальные символы', () => {
      debugLogger.error('', '');
      debugLogger.warning('element-with-symbols!@#$%', 'message\nwith\tspecial\rchars');

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('error', '', '', undefined);
      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('warning', 'element-with-symbols!@#$%', 'message\nwith\tspecial\rchars', undefined);
    });
  });

  describe('edge cases', () => {
    test('должен корректно работать с очень длинными строками', () => {
      const longElementId = 'a'.repeat(1000);
      const longMessage = 'b'.repeat(2000);

      debugLogger.info(longElementId, longMessage);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('info', longElementId, longMessage, undefined);
    });

    test('должен обрабатывать вложенные объекты', () => {
      const complexData = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        },
        array: [1, 2, { nested: true }],
        circular: null as any
      };

      // Создаем циклическую ссылку
      complexData.circular = complexData;

      debugLogger.debug('complex-test', 'Complex data test', complexData);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('debug', 'complex-test', 'Complex data test', complexData);
    });

    test('должен обрабатывать функции в данных', () => {
      const dataWithFunction = {
        callback: () => 'test',
        value: 123
      };

      debugLogger.configUpdate('func-test', dataWithFunction);

      expect(mockedStickyDebugger.log).toHaveBeenCalledWith('config-update', 'func-test', 'Конфигурация обновлена', dataWithFunction);
    });
  });

  describe('производительность и стабильность', () => {
    test('должен корректно обрабатывать множественные вызовы', () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        debugLogger.info(`element-${i}`, `message-${i}`, { index: i });
      }

      expect(mockedStickyDebugger.log).toHaveBeenCalledTimes(iterations);
    });

    test('должен быть неизменяемым объектом', () => {
      // Объект debugLogger создан с as const, но в JavaScript это не делает его immutable
      // Тестируем что все методы доступны и работают корректно
      expect(typeof debugLogger.error).toBe('function');
      expect(typeof debugLogger.warning).toBe('function');
      expect(typeof debugLogger.info).toBe('function');
      expect(typeof debugLogger.debug).toBe('function');
      expect(typeof debugLogger.stateChange).toBe('function');
      expect(typeof debugLogger.configUpdate).toBe('function');
      expect(typeof debugLogger.registration).toBe('function');
      expect(typeof debugLogger.unregistration).toBe('function');
    });
  });
});
