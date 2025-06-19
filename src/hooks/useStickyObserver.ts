import { useEffect, useRef, useCallback } from 'react';

import { useStickyContext } from '@/context/StickyContext';

export interface UseStickyObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  onIntersect?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

/**
 * Хук для продвинутого наблюдения за sticky элементами
 * Принцип SRP: отвечает только за наблюдение
 */
export const useStickyObserver = (options: UseStickyObserverOptions = {}) => {
  const context = useStickyContext();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<HTMLElement>>(new Set());
  const onIntersectRef = useRef(options.onIntersect);

  const {
    threshold = [0, 0.25, 0.5, 0.75, 1],
    rootMargin = '0px',
    onIntersect
  } = options;

  // Обновляем ref при изменении callback
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  /**
   * Создаем наблюдатель
   */
  useEffect(() => {
    if (context.isSSR) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          onIntersectRef.current?.(entry.isIntersecting, entry);
        });
      },
      {
        threshold,
        rootMargin,
        root: null
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, context.isSSR]);

  /**
   * Добавление элемента для наблюдения
   */
  const observe = useCallback((element: HTMLElement) => {
    if (!observerRef.current || elementsRef.current.has(element)) return;

    observerRef.current.observe(element);
    elementsRef.current.add(element);
  }, []);

  /**
   * Удаление элемента из наблюдения
   */
  const unobserve = useCallback((element: HTMLElement) => {
    if (!observerRef.current || !elementsRef.current.has(element)) return;

    observerRef.current.unobserve(element);
    elementsRef.current.delete(element);
  }, []);

  /**
   * Очистка всех наблюдений
   */
  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    elementsRef.current.clear();
  }, []);

  return {
    observe,
    unobserve,
    disconnect,
    observer: observerRef.current
  };
};
