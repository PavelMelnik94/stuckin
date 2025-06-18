import React, { createContext, useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { StickyManager } from '../core/StickyManager';
import { StickyContextValue } from '../types/sticky.types';

/**
 * Context для управления sticky функциональностью
 */
const StickyContext = createContext<StickyContextValue | null>(null);

interface StickyProviderProps {
  children: React.ReactNode;
  debug?: boolean;
}

/**
 * Провайдер sticky контекста
 * Создает единственный экземпляр StickyManager для всего приложения
 */
export const StickyProvider: React.FC<StickyProviderProps> = observer(({
  children,
  debug = false
}) => {
  const managerRef = useRef<StickyManager | null>(null);

  // Инициализируем менеджер только один раз
  if (!managerRef.current) {
    managerRef.current = new StickyManager();

    if (debug) {
      // Добавляем debug функционал
      (window as any).__STICKY_DEBUG__ = managerRef.current;
    }
  }

  const manager = managerRef.current;

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, [manager]);

  const contextValue: StickyContextValue = {
    // Основные методы
    registerSticky: (element, config) => manager.registerSticky(element, config),
    unregisterSticky: (id) => manager.unregisterSticky(id),
    updateConfig: (id, config) => manager.updateConfig(id, config),

    // Группы
    createGroup: (groupId, priority) => manager.createGroup(groupId, priority),
    addToGroup: (elementId, groupId) => manager.addToGroup(elementId, groupId),
    removeFromGroup: (elementId, groupId) => {
      const group = manager.groups.get(groupId);
      if (group) {
        group.elements.delete(elementId);
      }
    },

    // Состояние (реактивное через MobX)
    elements: manager.elements,
    groups: manager.groups,
    isSSR: manager.isSSR,

    // Утилиты
    getElementState: (id) => {
      const element = manager.elements.get(id);
      return element ? element.state : null;
    },
    getActiveElements: () => manager.activeElements,
    refreshAll: () => {
      manager.elements.forEach((element) => {
        manager.updateStickyState(element);
      });
    }
  };

  return (
    <StickyContext.Provider value={contextValue}>
      {children}
    </StickyContext.Provider>
  );
});

/**
 * Хук для получения sticky контекста
 */
export const useStickyContext = (): StickyContextValue => {
  const context = useContext(StickyContext);

  if (!context) {
    throw new Error('useStickyContext must be used within StickyProvider');
  }

  return context;
};
