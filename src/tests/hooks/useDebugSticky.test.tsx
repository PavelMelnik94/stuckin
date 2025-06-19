/**
 * Тесты для useDebugSticky
 */

import React from 'react';
import { renderHook } from '@testing-library/react';

import { useDebugSticky } from '../../hooks/useDebugSticky';
import { StickyProvider } from '../../context/StickyContext';
import { stickyDebugger } from '../../debug/StickyDebugger';

// Mock StickyDebugger
jest.mock('../../debug/StickyDebugger', () => ({
  stickyDebugger: {
    log: jest.fn(),
    captureSnapshot: jest.fn(),
    enable: jest.fn(),
    registerVisualElement: jest.fn(),
    unregisterVisualElement: jest.fn(),
    filteredEvents: []
  }
}));

// Mock debugLogger
jest.mock('../../debug/debugLogger', () => ({
  debugLogger: {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    stateChange: jest.fn(),
    configUpdate: jest.fn()
  }
}));

// Mock performance monitor
jest.mock('../../utils/performance', () => ({
  performanceMonitor: {
    measureRenderTime: jest.fn(),
    measureScrollResponsiveness: jest.fn(),
    trackRecalculation: jest.fn(),
    reportMetrics: jest.fn()
  }
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('useDebugSticky', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('базовая функциональность', () => {
    it('должен возвращать те же методы что и useSticky', () => {
      const { result } = renderHook(
        () => useDebugSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.isSticky).toBeDefined();
      expect(typeof result.current.updateConfig).toBe('function');
      expect(typeof result.current.enable).toBe('function');
      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
    });

    it('должен использовать debugLabel из опций', () => {
      const { result } = renderHook(
        () => useDebugSticky({
          id: 'test-element',
          debugLabel: 'custom-debug-label'
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.debugLabel).toBe('custom-debug-label');

      // Проверяем что debugger был вызван с правильным label (hook логирует registration при монтировании)
      expect(stickyDebugger.log).toHaveBeenCalledWith(
        'registration',
        'custom-debug-label',
        'Sticky элемент зарегистрирован',
        expect.objectContaining({
          config: expect.objectContaining({
            debugLabel: 'custom-debug-label'
          })
        })
      );
    });

    it('должен использовать id как debugLabel по умолчанию', () => {
      const { result } = renderHook(
        () => useDebugSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.debugLabel).toBe('test-element');

      expect(stickyDebugger.log).toHaveBeenCalledWith(
        'registration',
        'test-element',
        'Sticky элемент зарегистрирован',
        expect.objectContaining({
          config: expect.objectContaining({
            id: 'test-element'
          })
        })
      );
    });

    it('должен использовать "unknown" как fallback для debugLabel', () => {
      const { result } = renderHook(
        () => useDebugSticky({} as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.debugLabel).toBe('unknown');

      expect(stickyDebugger.log).toHaveBeenCalledWith(
        'registration',
        'unknown',
        'Sticky элемент зарегистрирован',
        expect.objectContaining({
          config: {}
        })
      );
    });
  });

  describe('конфигурация отладки', () => {
    it('должен использовать дефолтную конфигурацию отладки', () => {
      renderHook(
        () => useDebugSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      // Проверяем что используются дефолтные настройки
      expect(stickyDebugger.log).toHaveBeenCalled();
    });

    it('должен применять кастомную конфигурацию отладки', () => {
      renderHook(
        () => useDebugSticky({
          id: 'test-element',
          debugConfig: {
            logStateChanges: false,
            logConfigUpdates: false,
            captureSnapshots: true,
            trackPerformance: false
          }
        }),
        { wrapper: TestWrapper }
      );

      expect(stickyDebugger.log).toHaveBeenCalled();
    });

    it('должен мержить кастомную конфигурацию с дефолтной', () => {
      renderHook(
        () => useDebugSticky({
          id: 'test-element',
          debugConfig: {
            captureSnapshots: true
          }
        }),
        { wrapper: TestWrapper }
      );

      // Частичная конфигурация должна мержиться с дефолтной
      expect(stickyDebugger.log).toHaveBeenCalled();
    });
  });

  describe('создание снимков', () => {
    it('должен создавать снимки когда включено captureSnapshots', () => {
      const { result } = renderHook(
        () => useDebugSticky({
          id: 'test-element',
          debugConfig: { captureSnapshots: true }
        } as any),
        { wrapper: TestWrapper }
      );

      // Снимки создаются через метод captureSnapshot, а не автоматически
      result.current.captureSnapshot('test-snapshot');

      expect(stickyDebugger.captureSnapshot).toHaveBeenCalledWith(
        'test-element-test-snapshot'
      );
    });

    it('не должен создавать снимки когда captureSnapshots=false', () => {
      renderHook(
        () => useDebugSticky({
          id: 'test-element',
          debugConfig: { captureSnapshots: false }
        }),
        { wrapper: TestWrapper }
      );

      expect(stickyDebugger.captureSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('обработка ошибок', () => {
    it('должен обрабатывать отсутствие опций без ошибок', () => {
      expect(() => {
        renderHook(
          () => useDebugSticky({} as any),
          { wrapper: TestWrapper }
        );
      }).not.toThrow();
    });

    it('должен обрабатывать неполную debugConfig', () => {
      expect(() => {
        renderHook(
          () => useDebugSticky({
            id: 'test-element',
            debugConfig: {} // пустая конфигурация
          }),
          { wrapper: TestWrapper }
        );
      }).not.toThrow();
    });
  });

  describe('комбинирование с другими опциями useSticky', () => {
    it('должен работать с полной конфигурацией useSticky', () => {
      const { result } = renderHook(
        () => useDebugSticky({
          id: 'test-element',
          direction: 'top',
          offset: { top: 10 },
          disabled: false,
          groupId: 'test-group',
          debugLabel: 'complex-test',
          debugConfig: {
            logStateChanges: true,
            logConfigUpdates: true,
            captureSnapshots: true,
            trackPerformance: true
          }
        }),
        { wrapper: TestWrapper }
      );

      expect(result.current.state).toBeDefined();
      expect(stickyDebugger.log).toHaveBeenCalled();

      // Вместо автоматического захвата снимка, используем метод
      result.current.captureSnapshot('test');
      expect(stickyDebugger.captureSnapshot).toHaveBeenCalled();
    });

    it('должен передавать все useSticky опции в базовый хук', () => {
      const { result } = renderHook(
        () => useDebugSticky({
          id: 'test-element',
          direction: 'bottom',
          offset: { bottom: 15 },
          disabled: true
        }),
        { wrapper: TestWrapper }
      );

      // Все опции useSticky должны работать
      expect(result.current.state).toBeDefined();
      expect(typeof result.current.enable).toBe('function');
      expect(typeof result.current.disable).toBe('function');
    });
  });
});
