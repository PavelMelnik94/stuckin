import { useEffect, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStickyContext } from '../context/StickyContext';
import { StickyElement } from '../types/sticky.types';

export interface UseStickyGroupOptions {
  groupId: string;
  priority?: number;
  autoCreate?: boolean;
}

export interface UseStickyGroupReturn {
  elements: StickyElement[];
  activeElements: StickyElement[];
  addElement: (elementId: string) => void;
  removeElement: (elementId: string) => void;
  refreshGroup: () => void;
  getTotalHeight: () => number;
  getGroupBounds: () => DOMRect | null;
}

/**
 * Хук для управления группой sticky элементов
 * Принцип SRP: отвечает только за управление группой
 */
export const useStickyGroup = (options: UseStickyGroupOptions): UseStickyGroupReturn => {
  const context = useStickyContext();
  const { groupId, priority = 0, autoCreate = true } = options;

  /**
   * Создаем группу если её нет и включено автосоздание
   */
  useEffect(() => {
    if (autoCreate && !context.groups.has(groupId)) {
      context.createGroup(groupId, priority);
    }
  }, [context, groupId, priority, autoCreate]);

  /**
   * Получаем элементы группы (реактивно)
   */
  const group = context.groups.get(groupId);
  const elements = useMemo(() =>
    group ? Array.from(group.elements.values()) : [],
    [group]
  );

  /**
   * Активные элементы в группе
   */
  const activeElements = useMemo(() =>
    elements.filter(el => el.isActive),
    [elements]
  );

  /**
   * Методы управления группой
   */
  const addElement = useCallback((elementId: string) => {
    context.addToGroup(elementId, groupId);
  }, [context, groupId]);

  const removeElement = useCallback((elementId: string) => {
    context.removeFromGroup(elementId, groupId);
  }, [context, groupId]);

  const refreshGroup = useCallback(() => {
    elements.forEach(element => {
      // Принудительно обновляем состояние элементов группы
      const rect = element.element.getBoundingClientRect();
      // Здесь можно добавить логику обновления
    });
  }, [elements]);

  /**
   * Утилитарные методы для работы с группой
   */
  const getTotalHeight = useCallback(() => {
    return activeElements.reduce((total, element) => {
      return total + element.element.offsetHeight;
    }, 0);
  }, [activeElements]);

  const getGroupBounds = useCallback((): DOMRect | null => {
    if (elements.length === 0) return null;

    const rects = elements.map(el => el.element.getBoundingClientRect());
    const top = Math.min(...rects.map(r => r.top));
    const bottom = Math.max(...rects.map(r => r.bottom));
    const left = Math.min(...rects.map(r => r.left));
    const right = Math.max(...rects.map(r => r.right));

    return new DOMRect(left, top, right - left, bottom - top);
  }, [elements]);

  return {
    elements,
    activeElements,
    addElement,
    removeElement,
    refreshGroup,
    getTotalHeight,
    getGroupBounds
  };
};
