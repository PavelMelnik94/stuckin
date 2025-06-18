import { useEffect, useRef } from 'react';
import { useSticky, UseStickyOptions } from './useSticky';
import { stickyDebugger } from '../debug/StickyDebugger';
import { StickyState } from '../types/sticky.types';

export interface UseDebugStickyOptions extends UseStickyOptions {
  debugLabel?: string;
  debugConfig?: {
    logStateChanges?: boolean;
    logConfigUpdates?: boolean;
    captureSnapshots?: boolean;
    trackPerformance?: boolean;
  };
}

/**
 * Хук с расширенными возможностями отладки
 * Принцип Decorator Pattern: добавляет отладочную функциональность к базовому хуку
 */
export const useDebugSticky = (options: UseDebugStickyOptions) => {
  const prevStateRef = useRef<StickyState | null>(null);
  const debugLabel = options.debugLabel || options.id || 'unknown';

  const debugConfig = {
    logStateChanges: true,
    logConfigUpdates: true,
    captureSnapshots: false,
    trackPerformance: true,
    ...options.debugConfig
  };

  const stickyResult = useSticky(options);

  /**
   * Отслеживание изменений состояния
   */
  useEffect(() => {
    if (!debugConfig.logStateChanges) return;

    const currentState = stickyResult.state;
    const prevState = prevStateRef.current;

    if (currentState !== prevState) {
      stickyDebugger.log(
        'state-change',
        debugLabel,
        `Состояние изменилось: ${prevState} → ${currentState}`,
        {
          previousState: prevState,
          currentState: currentState,
          isSticky: stickyResult.isSticky,
          isActive: stickyResult.isActive
        }
      );

      // Создаем снимок при важных изменениях состояния
      if (debugConfig.captureSnapshots && currentState === 'sticky') {
        stickyDebugger.captureSnapshot(`${debugLabel}-became-sticky`);
      }

      prevStateRef.current = currentState;
    }
  }, [stickyResult.state, debugLabel, debugConfig]);

  /**
   * Логирование при монтировании/размонтировании
   */
  useEffect(() => {
    stickyDebugger.log(
      'registration',
      debugLabel,
      'Sticky элемент зарегистрирован',
      {
        config: options,
        element: stickyResult.ref.current
      }
    );

    return () => {
      stickyDebugger.log(
        'unregistration',
        debugLabel,
        'Sticky элемент удален'
      );
    };
  }, [debugLabel]);

  /**
   * Отслеживание производительности рендера
   */
  const debugRender = <T,>(fn: () => T): T => {
    if (!debugConfig.trackPerformance) return fn();

    return stickyDebugger.performanceMonitor?.measureRenderTime(debugLabel, fn) || fn();
  };

  /**
   * Расширенный метод обновления конфигурации с логированием
   */
  const debugUpdateConfig = (newConfig: Parameters<typeof stickyResult.updateConfig>[0]) => {
    if (debugConfig.logConfigUpdates) {
      stickyDebugger.log(
        'config-update',
        debugLabel,
        'Конфигурация обновлена',
        {
          newConfig,
          timestamp: Date.now()
        }
      );
    }

    return stickyResult.updateConfig(newConfig);
  };

  /**
   * Метод для создания снимка состояния
   */
  const captureSnapshot = (label?: string) => {
    return stickyDebugger.captureSnapshot(`${debugLabel}${label ? `-${label}` : ''}`);
  };

  /**
   * Метод для логирования кастомных событий
   */
  const logDebug = (message: string, data?: any) => {
    stickyDebugger.log('debug', debugLabel, message, data);
  };

  return {
    ...stickyResult,

    // Расширенные методы
    updateConfig: debugUpdateConfig,
    captureSnapshot,
    logDebug,
    debugRender,

    // Debug информация
    debugLabel,
    debugHistory: stickyDebugger.filteredEvents.filter(
      event => event.elementId === debugLabel
    )
  };
};
