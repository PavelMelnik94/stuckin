import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';

import type { StickyState, UseStickyOptions } from '@/types/sticky.types';
import { useSticky } from '@/hooks';
import { debugLogger } from '@/debug/debugLogger';


export interface StickyProps extends UseStickyOptions {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  tag?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
}

export interface StickyRef {
  element: HTMLElement | null;
  state: StickyState | null;
  isSticky: boolean;
  refresh: () => void;
  disable: () => void;
  enable: () => void;
}

/**
 * Основной компонент для создания sticky элементов
 * Принцип Open/Closed: расширяем функциональность через props
 */
export const Sticky = observer(forwardRef<StickyRef, StickyProps>(({
  children,
  className = '',
  activeClassName = '',
  tag: Tag = 'div',
  style,
  activeStyle,
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
  } = useSticky(stickyOptions);

  /**
   * Предоставляем API через ref
   */
  useImperativeHandle(ref, () => ({
    element: elementRef.current,
    state,
    isSticky,
    refresh,
    disable,
    enable
  }), [elementRef.current, state, isSticky, refresh, disable, enable]);

  /**
   * Формируем классы в зависимости от состояния
   */
  const classes = [
    className,
    isActive && activeClassName,
    `sticky-${state}`,
    isSticky && 'is-sticky'
  ].filter(Boolean).join(' ');

  // 🔧 Логирование изменений состояния компонента
  React.useEffect(() => {
    if (stickyOptions.id && state) {
      debugLogger.debug(stickyOptions.id, 'Компонент Sticky: изменение состояния', {
        state,
        isSticky,
        isActive,
        className: classes
      });
    }
  }, [state, isSticky, isActive, stickyOptions.id, classes]);

  /**
   * Объединяем стили
   */
  const combinedStyle = {
    ...style,
    ...(isActive && activeStyle)
  };

  const Element = Tag as React.ElementType;

  return (
    <Element
      ref={elementRef}
      className={classes}
      style={combinedStyle}
      data-sticky-id={stickyOptions.id}
      data-sticky-state={state}
    >
      {children}
    </Element>
  );
}));

Sticky.displayName = 'Sticky';
