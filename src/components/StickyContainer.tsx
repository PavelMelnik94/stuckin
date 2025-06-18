import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';
import { useStickyGroup } from '../hooks/useStickyGroup';
import { StickyElement } from '../types/sticky.types';

export interface StickyContainerProps {
  children: React.ReactNode;
  groupId: string;
  priority?: number;
  className?: string;
  style?: React.CSSProperties;
  onGroupChange?: (elements: StickyElement[]) => void;
}

export interface StickyContainerRef {
  elements: StickyElement[];
  activeElements: StickyElement[];
  totalHeight: number;
  refreshGroup: () => void;
}

/**
 * Контейнер для группы sticky элементов
 * Принцип Dependency Inversion: зависит от абстракций, не от конкретных реализаций
 */
export const StickyContainer = observer(forwardRef<StickyContainerRef, StickyContainerProps>(({
  children,
  groupId,
  priority = 0,
  className = '',
  style,
  onGroupChange
}, ref) => {
  const {
    elements,
    activeElements,
    refreshGroup,
    getTotalHeight
  } = useStickyGroup({
    groupId,
    priority,
    autoCreate: true
  });

  /**
   * Уведомляем о изменениях в группе
   */
  React.useEffect(() => {
    onGroupChange?.(elements);
  }, [elements, onGroupChange]);

  /**
   * Предоставляем API через ref
   */
  useImperativeHandle(ref, () => ({
    elements,
    activeElements,
    totalHeight: getTotalHeight(),
    refreshGroup
  }), [elements, activeElements, getTotalHeight, refreshGroup]);

  /**
   * CSS переменные для стилизации
   */
  const cssVariables = {
    '--sticky-group-height': `${getTotalHeight()}px`,
    '--sticky-active-count': activeElements.length
  } as React.CSSProperties;

  return (
    <div
      className={`sticky-container ${className}`}
      style={{ ...style, ...cssVariables }}
      data-sticky-group={groupId}
      data-active-count={activeElements.length}
    >
      {children}
    </div>
  );
}));

StickyContainer.displayName = 'StickyContainer';
