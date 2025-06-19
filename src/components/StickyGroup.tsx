import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';

import type { StickyElement } from '@/types/sticky.types';
import { useStickyGroup } from '@/hooks';
import { debugLogger } from '@/debug/debugLogger';


export interface StickyGroupProps {
  children: React.ReactNode;
  groupId: string;
  priority?: number;
  className?: string;
  style?: React.CSSProperties;
  onGroupChange?: (elements: StickyElement[]) => void;
}

export interface StickyGroupRef {
  elements: StickyElement[];
  activeElements: StickyElement[];
  totalHeight: number;
  refreshGroup: () => void;
}

/**
 * Контейнер для группы sticky элементов
 * Принцип Dependency Inversion: зависит от абстракций, не от конкретных реализаций
 */
export const StickyGroup = observer(forwardRef<StickyGroupRef, StickyGroupProps>(({
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

  // Initial setup logging
  React.useEffect(() => {
    debugLogger.info(groupId, 'StickyGroup initialized', {
      priority,
      elementsCount: elements.length
    });

    return () => {
      debugLogger.info(groupId, 'StickyContainer unmounted');
    };
  }, [groupId, priority, elements.length]);

  /**
   * Уведомляем о изменениях в группе
   */
  React.useEffect(() => {
    debugLogger.debug(groupId, 'Group elements changed', {
      elementsCount: elements.length,
      activeCount: activeElements.length
    });
    onGroupChange?.(elements);
  }, [elements, onGroupChange, groupId, activeElements.length]);

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

StickyGroup.displayName = 'StickyGroup';
