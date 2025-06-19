import { useEffect, useState, useMemo } from 'react';

// import { observer } from 'mobx-react-lite'; // TODO: Add if needed
import { responsiveManager, ResponsiveConfig } from '../utils/responsive';
import { StickyConfig } from '../types/sticky.types';
import { debugLogger } from '../debug/debugLogger';

import { useSticky, UseStickyOptions } from './useSticky';

export interface UseResponsiveStickyOptions extends UseStickyOptions {
  responsive: ResponsiveConfig;
  fallback?: Partial<StickyConfig>; // конфигурация по умолчанию
}

/**
 * Хук для responsive sticky элементов
 * Принцип DRY: переиспользует логику useSticky, добавляя responsive функциональность
 */
export const useResponsiveSticky = (options: UseResponsiveStickyOptions) => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string | null>(
    responsiveManager.getCurrentBreakpoint()
  );

  /**
   * Подписка на изменения breakpoint
   */
  useEffect(() => {
    debugLogger.debug('useResponsiveSticky', 'Setting up breakpoint subscription');

    const unsubscribe = responsiveManager.subscribe((breakpoint) => {
      debugLogger.debug('useResponsiveSticky', 'Breakpoint changed', { breakpoint });
      setCurrentBreakpoint(breakpoint);
    });

    return () => {
      debugLogger.debug('useResponsiveSticky', 'Cleaning up breakpoint subscription');
      unsubscribe();
    };
  }, []);

  /**
   * Получение конфигурации для текущего breakpoint
   */
  const responsiveConfig = useMemo(() => {
    debugLogger.debug('useResponsiveSticky', 'Calculating responsive config', { currentBreakpoint });

    if (!currentBreakpoint) {
      debugLogger.debug('useResponsiveSticky', 'No breakpoint, using fallback config', { fallback: options.fallback });
      return options.fallback || {};
    }

    const breakpointConfig = responsiveManager.getConfigForBreakpoint(
      options.responsive as unknown as Record<string, unknown>
    );

    const mergedConfig = {
      ...options.fallback,
      ...(breakpointConfig || {})
    } as Partial<StickyConfig>;

    debugLogger.debug('useResponsiveSticky', 'Applied responsive config', {
      breakpointConfig,
      mergedConfig,
      currentBreakpoint
    });

    return mergedConfig;
  }, [currentBreakpoint, options.responsive, options.fallback]);

  /**
   * Объединяем базовые опции с responsive конфигурацией
   */
  const stickyOptions = useMemo((): UseStickyOptions => {
    const enabled = responsiveConfig.disabled !== undefined
      ? !responsiveConfig.disabled
      : options.enabled;

    return {
      ...options,
      ...responsiveConfig,
      enabled: enabled ?? true
    };
  }, [options, responsiveConfig]);

  const stickyResult = useSticky(stickyOptions);

  return {
    ...stickyResult,
    currentBreakpoint,
    responsiveConfig,
    isResponsiveDisabled: responsiveConfig.disabled === true
  };
};
