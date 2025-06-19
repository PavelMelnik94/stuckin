import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';

import type { StickyState } from '@/types/sticky.types';
import { useStickyInContainer, type UseStickyContainerOptions } from '@/hooks/useStickyInContainer';
import { debugLogger } from '@/debug/debugLogger';

export interface StickyContainerProps extends UseStickyContainerOptions {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  tag?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
}

export interface StickyContainerRef {
  element: HTMLElement | null;
  state: StickyState | null;
  isSticky: boolean;
  refresh: () => void;
  disable: () => void;
  enable: () => void;
}

/**
 * Компонент для создания sticky элементов внутри кастомных скролл-контейнеров
 */
export const StickyContainer = observer(forwardRef<StickyContainerRef, StickyContainerProps>(({
  children,
  className = '',
  activeClassName = '',
  tag: Tag = 'div',
  style,
  activeStyle,
  container,
  containerOffset,
  observeResize,
  ...stickyOptions
}, ref) => {
  const {
    ref: elementRef,
    state,
    isSticky,
    isActive,
    refresh,
    disable,
    enable
  } = useStickyInContainer({
    container,
    ...(containerOffset ? { containerOffset } : {}),
    ...(observeResize !== undefined ? { observeResize } : {}),
    ...stickyOptions
  });

  /**
   * Предоставляем API через ref
   * Принцип Interface Segregation: предоставляем только необходимые методы
   */
  useImperativeHandle(ref, () => ({
    element: elementRef.current,
    state,
    isSticky,
    refresh,
    disable,
    enable
  }), [elementRef, state, isSticky, refresh, disable, enable]);

  // Вычисляем финальные классы
  const finalClassName = [
    className,
    isActive && activeClassName
  ].filter(Boolean).join(' ');

  // Вычисляем финальные стили
  const finalStyle = {
    ...style,
    ...(isActive && activeStyle ? activeStyle : {})
  };

  // 🔧 Отладочное логирование состояния
  React.useEffect(() => {
    if (stickyOptions['id']) {
      debugLogger.debug(stickyOptions['id'], 'StickyGroup state change', {
        state,
        isSticky,
        isActive,
        hasContainer: !!container,
        containerType: typeof container
      });
    }
  }, [stickyOptions['id'], state, isSticky, isActive, container]);

  return React.createElement(Tag, {
    ref: elementRef,
    className: finalClassName,
    style: finalStyle,
    'data-sticky-id': stickyOptions['id'],
    'data-sticky': isSticky ? 'true' : 'false',
    'data-sticky-state': state,
    'data-sticky-container': !!container
  }, children);
}));

StickyContainer.displayName = 'StickyContainer';
