import { useEffect, useState } from 'react';

import { ssrManager, SSRConfig } from '../utils/ssr';

import { useSticky, UseStickyOptions } from './useSticky';

export interface UseSSRStickyOptions extends UseStickyOptions {
  ssr?: SSRConfig;
}

/**
 * SSR-совместимый хук для sticky элементов
 * Принцип Liskov Substitution: можно использовать вместо обычного useSticky
 */
export const useSSRSticky = (options: UseSSRStickyOptions) => {
  const [isClientReady, setIsClientReady] = useState(false);
  const ssrState = ssrManager.getSSRState();

  /**
   * Ожидание готовности клиента
   */
  useEffect(() => {
    if (ssrState.isSSR) return;

    const cleanup = ssrManager.onHydrated(() => {
      // Добавляем небольшую задержку для стабилизации layout
      setTimeout(() => {
        setIsClientReady(true);
      }, options.ssr?.hydrationDelay || 100);
    });

    return cleanup;
  }, [ssrState.isSSR, options.ssr?.hydrationDelay]);

  /**
   * Отключаем sticky функциональность до hydration
   */
  const stickyOptions: UseStickyOptions = {
    ...options,
    enabled: isClientReady && (options.enabled !== false)
  };

  const stickyResult = useSticky(stickyOptions);

  return {
    ...stickyResult,
    isSSR: ssrState.isSSR,
    isHydrated: isClientReady,
    shouldSuppressWarning: ssrState.shouldSuppressWarning
  };
};
