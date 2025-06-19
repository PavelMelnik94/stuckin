/**
 * Тесты для useResponsiveSticky
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';

import { useResponsiveSticky } from '../../hooks/useResponsiveSticky';
import { StickyProvider } from '../../context/StickyContext';
import { responsiveManager } from '../../utils/responsive';
import { debugLogger } from '../../debug/debugLogger';

// Mock responsiveManager
jest.mock('../../utils/responsive', () => ({
  responsiveManager: {
    getCurrentBreakpoint: jest.fn(),
    subscribe: jest.fn(),
    getConfigForBreakpoint: jest.fn(),
    addBreakpoint: jest.fn(),
    matches: jest.fn()
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

describe('useResponsiveSticky', () => {
  const mockResponsiveManager = responsiveManager as jest.Mocked<typeof responsiveManager>;
  const mockDebugLogger = debugLogger as jest.Mocked<typeof debugLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponsiveManager.getCurrentBreakpoint.mockReturnValue('md');
    mockResponsiveManager.subscribe.mockReturnValue(jest.fn());
    mockResponsiveManager.getConfigForBreakpoint.mockReturnValue({});
  });

  describe('базовая функциональность', () => {
    it('должен использовать текущий breakpoint при инициализации', () => {
      mockResponsiveManager.getCurrentBreakpoint.mockReturnValue('lg');

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' },
            lg: { direction: 'bottom' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.currentBreakpoint).toBe('lg');
      expect(mockResponsiveManager.getCurrentBreakpoint).toHaveBeenCalled();
    });

    it('должен подписываться на изменения breakpoint', () => {
      renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(mockResponsiveManager.subscribe).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useResponsiveSticky',
        'Setting up breakpoint subscription'
      );
    });

    it('должен возвращать правильные методы из useSticky', () => {
      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current).toHaveProperty('ref');
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('isSticky');
      expect(result.current).toHaveProperty('updateConfig');
      expect(result.current).toHaveProperty('enable');
      expect(result.current).toHaveProperty('disable');
    });

    it('должен предоставлять дополнительные responsive свойства', () => {
      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current).toHaveProperty('currentBreakpoint');
      expect(result.current).toHaveProperty('responsiveConfig');
      expect(result.current).toHaveProperty('isResponsiveDisabled');
    });
  });

  describe('responsive конфигурация', () => {
    it('должен использовать fallback конфигурацию когда нет breakpoint', () => {
      mockResponsiveManager.getCurrentBreakpoint.mockReturnValue(null);

      const fallbackConfig = { direction: 'top' as const, offset: { top: 10 } };
      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'bottom' }
          },
          fallback: fallbackConfig
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.responsiveConfig).toEqual(fallbackConfig);
      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useResponsiveSticky',
        'No breakpoint, using fallback config',
        { fallback: fallbackConfig }
      );
    });

    it('должен использовать конфигурацию для текущего breakpoint', () => {
      const breakpointConfig = { direction: 'bottom' as const, offset: { bottom: 15 } };
      mockResponsiveManager.getCurrentBreakpoint.mockReturnValue('lg');
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue(breakpointConfig);

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' },
            lg: { direction: 'bottom' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(mockResponsiveManager.getConfigForBreakpoint).toHaveBeenCalledWith({
        md: { direction: 'top' },
        lg: { direction: 'bottom' }
      });
      expect(result.current.responsiveConfig).toEqual(breakpointConfig);
    });

    it('должен мержить fallback с breakpoint конфигурацией', () => {
      const fallbackConfig = { direction: 'top' as const, offset: { top: 10 } };
      const breakpointConfig = { offset: { top: 20 } };
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue(breakpointConfig);

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { offset: { top: 20 } }
          },
          fallback: fallbackConfig
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.responsiveConfig).toEqual({
        direction: 'top',
        offset: { top: 20 }
      });
    });

    it('должен корректно обрабатывать disabled состояние', () => {
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue({ disabled: true });

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { disabled: true }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isResponsiveDisabled).toBe(true);
      expect(result.current.responsiveConfig).toEqual({ disabled: true });
    });
  });

  describe('изменения breakpoint', () => {
    it('должен обновляться при изменении breakpoint', () => {
      let subscriptionCallback: (breakpoint: string) => void = () => {};
      mockResponsiveManager.subscribe.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' },
            lg: { direction: 'bottom' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.currentBreakpoint).toBe('md');

      // Симулируем изменение breakpoint
      act(() => {
        subscriptionCallback('lg');
      });

      expect(result.current.currentBreakpoint).toBe('lg');
      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useResponsiveSticky',
        'Breakpoint changed',
        { breakpoint: 'lg' }
      );
    });

    it('должен пересчитывать конфигурацию при изменении breakpoint', () => {
      let subscriptionCallback: (breakpoint: string) => void = () => {};
      mockResponsiveManager.subscribe.mockImplementation((callback) => {
        subscriptionCallback = callback;
        return jest.fn();
      });

      // Начальная конфигурация для md
      mockResponsiveManager.getConfigForBreakpoint
        .mockReturnValueOnce({ direction: 'top' })
        .mockReturnValueOnce({ direction: 'bottom' });

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' },
            lg: { direction: 'bottom' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.responsiveConfig).toEqual({ direction: 'top' });

      // Изменяем breakpoint на lg
      act(() => {
        subscriptionCallback('lg');
      });

      expect(result.current.responsiveConfig).toEqual({ direction: 'bottom' });
    });
  });

  describe('обработка enabled/disabled состояния', () => {
    it('должен корректно обрабатывать enabled когда disabled=false', () => {
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue({ disabled: false });

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { disabled: false }
          },
          enabled: false
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isResponsiveDisabled).toBe(false);
    });

    it('должен использовать базовое enabled когда disabled не указан', () => {
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue({});

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          },
          enabled: false
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isResponsiveDisabled).toBe(false);
    });

    it('должен использовать enabled=true по умолчанию', () => {
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue({});

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.isResponsiveDisabled).toBe(false);
    });
  });

  describe('очистка ресурсов', () => {
    it('должен отписываться при размонтировании', () => {
      const unsubscribe = jest.fn();
      mockResponsiveManager.subscribe.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useResponsiveSticky',
        'Cleaning up breakpoint subscription'
      );
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать отсутствие responsive конфигурации', () => {
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue(null);

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {}
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.responsiveConfig).toEqual({});
    });

    it('должен обрабатывать null breakpoint', () => {
      mockResponsiveManager.getCurrentBreakpoint.mockReturnValue(null);

      const { result } = renderHook(
        () => useResponsiveSticky({
          responsive: {
            md: { direction: 'top' }
          }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(result.current.currentBreakpoint).toBeNull();
      expect(result.current.responsiveConfig).toEqual({});
    });

    it('должен логировать процесс вычисления конфигурации', () => {
      mockResponsiveManager.getCurrentBreakpoint.mockReturnValue('lg');
      const breakpointConfig = { direction: 'bottom' as const };
      mockResponsiveManager.getConfigForBreakpoint.mockReturnValue(breakpointConfig);

      renderHook(
        () => useResponsiveSticky({
          responsive: {
            lg: { direction: 'bottom' }
          },
          fallback: { offset: { top: 10 } }
        } as any),
        { wrapper: TestWrapper }
      );

      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useResponsiveSticky',
        'Calculating responsive config',
        { currentBreakpoint: 'lg' }
      );

      expect(mockDebugLogger.debug).toHaveBeenCalledWith(
        'useResponsiveSticky',
        'Applied responsive config',
        expect.objectContaining({
          breakpointConfig,
          currentBreakpoint: 'lg'
        })
      );
    });
  });
});
