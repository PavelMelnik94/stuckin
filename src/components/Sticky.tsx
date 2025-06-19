import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';

import { useSticky, UseStickyOptions } from '../hooks/useSticky';
import { StickyState } from '../types/sticky.types';

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
    // updateConfig, // TODO: Use this method if needed
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

  /**
   * Объединяем стили
   */
  const combinedStyle = {
    ...style,
    ...(isActive && activeStyle)
  };

  const Element = Tag as any;

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
