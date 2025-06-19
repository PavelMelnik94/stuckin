/**
 * Хук для работы со sticky элементами в кастомных скролл-контейнерах
 */

import { useMemo } from 'react';

import { useSticky } from './useSticky';

import type { UseStickyOptions, UseStickyReturn, StickyScrollContainer } from '@/types/sticky.types';

export interface UseStickyInContainerOptions extends Omit<UseStickyOptions, 'scrollContainer'> {
  /** Элемент-контейнер с прокруткой или селектор */
  container: HTMLElement | string | null;
  /** Отступы от границ контейнера */
  containerOffset?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  /** Следует ли отслеживать изменения размеров контейнера */
  observeResize?: boolean;
  /** Направление прилипания (обязательное для контейнеров) */
  direction: UseStickyOptions['direction'];
}

/**
 * Хук для создания sticky элементов внутри кастомных скролл-контейнеров
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, isSticky } = useStickyInContainer({
 *     container: '.my-scroll-container',
 *     direction: 'top',
 *     offset: { top: 10 },
 *     containerOffset: { top: 20 }
 *   });
 *
 *   return (
 *     <div className="my-scroll-container" style={{ height: '400px', overflow: 'auto' }}>
 *       <div style={{ height: '200px' }}>Content before</div>
 *       <div ref={ref} className={isSticky ? 'sticky-active' : ''}>
 *         Sticky inside container!
 *       </div>
 *       <div style={{ height: '800px' }}>Long content...</div>
 *     </div>
 *   );
 * }
 * ```
 */
export const useStickyInContainer = (options: UseStickyInContainerOptions): UseStickyReturn => {
  // Находим элемент контейнера
  const resolvedContainer = useMemo(() => {
    if (!options.container) return null;

    if (typeof options.container === 'string') {
      return document.querySelector(options.container) as HTMLElement;
    }

    return options.container;
  }, [options.container]);

  // Создаем конфигурацию для scrollContainer
  const scrollContainer = useMemo((): StickyScrollContainer | undefined => {
    if (!resolvedContainer) return undefined;

    const containerConfig: StickyScrollContainer = {
      element: resolvedContainer,
      observeResize: options.observeResize !== false // по умолчанию true
    };

    if (options.containerOffset) {
      containerConfig.offset = options.containerOffset;
    }

    return containerConfig;
  }, [resolvedContainer, options.containerOffset, options.observeResize]);

  // Используем базовый useSticky с дополнительной конфигурацией
  const stickyOptions: UseStickyOptions = useMemo(() => {
    return {
      ...options,
      ...(scrollContainer ? { scrollContainer } : {})
    };
  }, [options, scrollContainer]);

  return useSticky(stickyOptions);
};

/**
 * Хук для создания нескольких sticky элементов в одном контейнере
 */
export interface UseStickyContainerGroupOptions {
  /** Элемент-контейнер с прокруткой */
  container: HTMLElement | string | null;
  /** ID группы для элементов */
  groupId: string;
  /** Базовые настройки для всех элементов */
  baseOptions?: Partial<UseStickyInContainerOptions>;
}

export const useStickyContainerGroup = (options: UseStickyContainerGroupOptions) => {
  const { container, groupId, baseOptions = {} } = options;

  /**
   * Создает sticky элемент с привязкой к группе и контейнеру
   */
  const createStickyElement = (elementOptions: UseStickyInContainerOptions) => {
    return useStickyInContainer({
      ...baseOptions,
      ...elementOptions,
      container,
      groupId
    });
  };

  return {
    createStickyElement,
    groupId
  };
};
