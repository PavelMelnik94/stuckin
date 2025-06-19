import React, { createContext, useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import type { StickyContextValue } from '@/types/sticky.types';
import { StickyManager } from '@/core/StickyManager';
import { debugLogger } from '@/debug/debugLogger';


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

    // 🔧 Логирование инициализации контекста
    debugLogger.info('context', 'StickyProvider инициализирован', {
      debug,
      timestamp: Date.now()
    });

    if (debug) {
      // Добавляем debug функционал
      (window as unknown as { __STICKY_DEBUG__: StickyManager }).__STICKY_DEBUG__ = managerRef.current;
      debugLogger.info('context', 'Debug режим активирован', {
        globalObject: '__STICKY_DEBUG__'
      });
    }
  }

  const manager = managerRef.current;

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      debugLogger.info('context', 'StickyProvider размонтирован', {
        totalElements: manager.elements.size,
        totalGroups: manager.groups.size
      });
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
      manager.refreshAllElements();
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
