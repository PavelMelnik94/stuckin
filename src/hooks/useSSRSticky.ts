import { useEffect, useState } from 'react';


import { useSticky, UseStickyOptions } from './useSticky';

import type { SSRConfig } from '@/types/sticky.types';
import { ssrManager } from '@/utils/ssr';
import { debugLogger } from '@/debug/debugLogger';

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
    debugLogger.debug('useSSRSticky', 'Initializing SSR hook', {
      isSSR: ssrState.isSSR,
      elementId: options.id
    });

    if (ssrState.isSSR) return;

    const cleanup = ssrManager.onHydrated(() => {
      debugLogger.debug('useSSRSticky', 'Client hydrated, enabling sticky functionality', {
        elementId: options.id,
        delay: options.ssr?.hydrationDelay || 100
      });

      // Добавляем небольшую задержку для стабилизации layout
      setTimeout(() => {
        setIsClientReady(true);
      }, options.ssr?.hydrationDelay || 100);
    });

    return cleanup;
  }, [ssrState.isSSR, options.ssr?.hydrationDelay, options.id]);

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
