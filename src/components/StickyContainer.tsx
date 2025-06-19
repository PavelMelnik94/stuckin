import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';

import type { StickyState } from '@/types/sticky.types';
import { useStickyInContainer, type UseStickyInContainerOptions } from '@/hooks/useStickyInContainer';
import { debugLogger } from '@/debug/debugLogger';

export interface StickyContainerProps extends UseStickyInContainerOptions {
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
 *
 * @example
 * ```tsx
 * <div className="scroll-container" style={{ height: '400px', overflow: 'auto' }}>
 *   <div style={{ height: '200px' }}>Content before</div>
 *   <StickyContainer
 *     container=".scroll-container"
 *     direction="top"
 *     offset={{ top: 10 }}
 *     containerOffset={{ top: 20 }}
 *     className="my-sticky"
 *     activeClassName="is-sticky"
 *   >
 *     <div>I stick to the container!</div>
 *   </StickyContainer>
 *   <div style={{ height: '800px' }}>Long content...</div>
 * </div>
 * ```
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
      debugLogger.debug(stickyOptions['id'], 'StickyContainer state change', {
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
