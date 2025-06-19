import { useEffect, useState, useMemo } from 'react';
// import { observer } from 'mobx-react-lite'; // TODO: Add if needed
import { useSticky, UseStickyOptions } from './useSticky';
import { responsiveManager, ResponsiveConfig } from '../utils/responsive';
import { StickyConfig } from '../types/sticky.types';

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
    const unsubscribe = responsiveManager.subscribe((breakpoint) => {
      setCurrentBreakpoint(breakpoint);
    });

    return unsubscribe;
  }, []);

  /**
   * Получение конфигурации для текущего breakpoint
   */
  const responsiveConfig = useMemo(() => {
    if (!currentBreakpoint) return options.fallback || {};

    const breakpointConfig = responsiveManager.getConfigForBreakpoint(
      options.responsive as unknown as Record<string, unknown>
    );

    return {
      ...options.fallback,
      ...(breakpointConfig || {})
    } as Partial<StickyConfig>;
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
