/**
 * Тесты для useSSRSticky
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';

import { useSSRSticky } from '../../hooks/useSSRSticky';
import { StickyProvider } from '../../context/StickyContext';
import { ssrManager } from '../../utils/ssr';
import { debugLogger } from '../../debug/debugLogger';

// Mock ssrManager
jest.mock('../../utils/ssr', () => ({
  ssrManager: {
    getSSRState: jest.fn(),
    onHydrated: jest.fn(),
    onClient: jest.fn(),
    waitForHydration: jest.fn()
  }
}));

// Mock debugLogger
jest.mock('../../debug/debugLogger', () => ({
  debugLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn()
  }
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('useSSRSticky', () => {
  const mockSSRManager = ssrManager as jest.Mocked<typeof ssrManager>;
  const mockDebugLogger = debugLogger as jest.Mocked<typeof debugLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default: client-side, но еще не hydrated
    mockSSRManager.getSSRState.mockReturnValue({
      isSSR: false,
      isHydrated: false,
      shouldSuppressWarning: false
    });

    // Мокаем onHydrated чтобы callback вызывался немедленно для большинства тестов
    mockSSRManager.onHydrated.mockImplementation((callback) => {
      setTimeout(callback, 0);
      return jest.fn();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('базовая функциональность', () => {
    it('должен возвращать все методы useSticky', () => {
      const { result } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current).toHaveProperty('ref');
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('isSticky');
      expect(result.current).toHaveProperty('updateConfig');
      expect(result.current).toHaveProperty('enable');
      expect(result.current).toHaveProperty('disable');
    });

    it('должен предоставлять дополнительные SSR свойства', () => {
      const { result } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current).toHaveProperty('isSSR');
      expect(result.current).toHaveProperty('isHydrated');
      expect(result.current).toHaveProperty('shouldSuppressWarning');
    });

    it('должен логировать инициализацию', () => {
      renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useSSRSticky',
        'Initializing SSR hook',
        {
          isSSR: false,
          elementId: 'test-element'
        }
      );
    });
  });

  describe('SSR окружение', () => {
    it('должен корректно обрабатывать SSR состояние', () => {
      mockSSRManager.getSSRState.mockReturnValue({
        isSSR: true,
        isHydrated: false,
        shouldSuppressWarning: true
      });

      const { result } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isSSR).toBe(true);
      expect(result.current.isHydrated).toBe(false);
      expect(result.current.shouldSuppressWarning).toBe(true);
    });

    it('не должен подписываться на hydration в SSR', () => {
      mockSSRManager.getSSRState.mockReturnValue({
        isSSR: true,
        isHydrated: false,
        shouldSuppressWarning: true
      });

      renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(mockSSRManager.onHydrated).not.toHaveBeenCalled();
    });

    it('должен отключать sticky функциональность в SSR', () => {
      mockSSRManager.getSSRState.mockReturnValue({
        isSSR: true,
        isHydrated: false,
        shouldSuppressWarning: true
      });

      const { result } = renderHook(
        () => useSSRSticky({
          id: 'test-element',
          enabled: true
        } as any),
        { wrapper: TestWrapper }
      );

      // В SSR sticky должен быть отключен
      expect(result.current.isHydrated).toBe(false);
    });
  });

  describe('процесс hydration', () => {
    it('должен подписываться на hydration события', () => {
      const cleanupFn = jest.fn();
      mockSSRManager.onHydrated.mockReturnValue(cleanupFn);

      renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(mockSSRManager.onHydrated).toHaveBeenCalledWith(expect.any(Function));
    });

    it('должен активировать sticky после hydration с задержкой', () => {
      let hydrationCallback: () => void = () => {};
      mockSSRManager.onHydrated.mockImplementation((callback) => {
        hydrationCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(
        () => useSSRSticky({
          id: 'test-element',
          ssr: { hydrationDelay: 200 }
        } as any),
        { wrapper: TestWrapper }
      );

      // До hydration
      expect(result.current.isHydrated).toBe(false);

      // Вызываем hydration callback
      act(() => {
        hydrationCallback();
      });

      // Проверяем логирование
      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useSSRSticky',
        'Client hydrated, enabling sticky functionality',
        {
          elementId: 'test-element',
          delay: 200
        }
      );

      // Пропускаем время задержки
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.isHydrated).toBe(true);
    });

    it('должен использовать дефолтную задержку 100ms', () => {
      let hydrationCallback: () => void = () => {};
      mockSSRManager.onHydrated.mockImplementation((callback) => {
        hydrationCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      act(() => {
        hydrationCallback();
      });

      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useSSRSticky',
        'Client hydrated, enabling sticky functionality',
        {
          elementId: 'test-element',
          delay: 100
        }
      );

      // Проверяем что задержка применена
      expect(result.current.isHydrated).toBe(false);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isHydrated).toBe(true);
    });

    it('должен очищать подписку при размонтировании', () => {
      const cleanupFn = jest.fn();
      mockSSRManager.onHydrated.mockReturnValue(cleanupFn);

      const { unmount } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      unmount();

      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('управление enabled состоянием', () => {
    it('должен учитывать enabled из опций', () => {
      let hydrationCallback: () => void = () => {};
      mockSSRManager.onHydrated.mockImplementation((callback) => {
        hydrationCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(
        () => useSSRSticky({
          id: 'test-element',
          enabled: false
        } as any),
        { wrapper: TestWrapper }
      );

      // Симулируем hydration
      act(() => {
        hydrationCallback();
        jest.advanceTimersByTime(100);
      });

      // После hydration, но enabled=false, поэтому sticky должен быть отключен
      expect(result.current.isHydrated).toBe(true);
      expect(result.current.isActive).toBe(false);
    });

    it('должен использовать enabled=true по умолчанию после hydration', () => {
      let hydrationCallback: () => void = () => {};
      mockSSRManager.onHydrated.mockImplementation((callback) => {
        hydrationCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      act(() => {
        hydrationCallback();
        jest.advanceTimersByTime(100);
      });

      expect(result.current.isHydrated).toBe(true);
    });

    it('должен отключать sticky до hydration даже если enabled=true', () => {
      mockSSRManager.getSSRState.mockReturnValue({
        isSSR: false,
        isHydrated: false,
        shouldSuppressWarning: true
      });

      const { result } = renderHook(
        () => useSSRSticky({
          id: 'test-element',
          enabled: true
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isHydrated).toBe(false);
    });
  });

  describe('конфигурация SSR', () => {
    it('должен обрабатывать отсутствие SSR конфигурации', () => {
      const { result } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.isSSR).toBe('boolean');
      expect(typeof result.current.isHydrated).toBe('boolean');
    });

    it('должен передавать все опции в базовый useSticky', () => {
      const options = {
        id: 'test-element',
        direction: 'top' as const,
        offset: { top: 10 },
        groupId: 'test-group',
        ssr: { hydrationDelay: 150 }
      };

      const { result } = renderHook(
        () => useSSRSticky(options as any),
        { wrapper: TestWrapper }
      );

      // Проверяем что базовая функциональность работает
      expect(result.current.ref).toBeDefined();
      expect(result.current.updateConfig).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать изменение SSR состояния', () => {
      mockSSRManager.getSSRState
        .mockReturnValueOnce({
          isSSR: true,
          isHydrated: false,
          shouldSuppressWarning: true
        })
        .mockReturnValueOnce({
          isSSR: false,
          isHydrated: true,
          shouldSuppressWarning: false
        });

      const { result, rerender } = renderHook(
        () => useSSRSticky({ id: 'test-element' } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isSSR).toBe(true);

      rerender();

      expect(result.current.isSSR).toBe(false);
    });

    it('должен обрабатывать undefined elementId', () => {
      renderHook(
        () => useSSRSticky({} as any),
        { wrapper: TestWrapper }
      );

      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useSSRSticky',
        'Initializing SSR hook',
        {
          isSSR: false,
          elementId: undefined
        }
      );
    });

    it('должен обрабатывать нулевую задержку hydration', () => {
      let hydrationCallback: () => void = () => {};
      mockSSRManager.onHydrated.mockImplementation((callback) => {
        hydrationCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(
        () => useSSRSticky({
          id: 'test-element',
          ssr: { hydrationDelay: 0 }
        } as any),
        { wrapper: TestWrapper }
      );

      // Вызываем hydration callback и выполняем все pending timers
      act(() => {
        hydrationCallback();
        jest.runAllTimers();
      });

      expect(result.current.isHydrated).toBe(true);
    });
  });
});
