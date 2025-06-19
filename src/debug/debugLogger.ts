/**
 * Type-safe логгер для отладки
 * Принцип Single Responsibility: только логирование
 */

import { stickyDebugger } from './StickyDebugger';

/**
 * Типизированные методы логирования
 * Принцип: явные методы для каждого уровня
 */
export const debugLogger = {
  /**
   * Логирование ошибок
   */
  error: (elementId: string, message: string, data?: unknown): void => {
    stickyDebugger.log('error', elementId, message, data);
  },

  /**
   * Логирование предупреждений
   */
  warning: (elementId: string, message: string, data?: unknown): void => {
    stickyDebugger.log('warning', elementId, message, data);
  },

  /**
   * Информационное логирование
   */
  info: (elementId: string, message: string, data?: unknown): void => {
    stickyDebugger.log('info', elementId, message, data);
  },

  /**
   * Debug логирование
   */
  debug: (elementId: string, message: string, data?: unknown): void => {
    stickyDebugger.log('debug', elementId, message, data);
  },

  /**
   * Логирование изменения состояния
   */
  stateChange: (elementId: string, oldState: string, newState: string, data?: unknown): void => {
    stickyDebugger.log('state-change', elementId, `Состояние изменено: ${oldState} → ${newState}`, data);
  },

  /**
   * Логирование обновления конфигурации
   */
  configUpdate: (elementId: string, changes: Record<string, unknown>): void => {
    stickyDebugger.log('config-update', elementId, 'Конфигурация обновлена', changes);
  },

  /**
   * Логирование регистрации элемента
   */
  registration: (elementId: string, config: unknown): void => {
    stickyDebugger.log('registration', elementId, 'Элемент зарегистрирован', config);
  },

  /**
   * Логирование удаления элемента
   */
  unregistration: (elementId: string, reason?: string): void => {
    stickyDebugger.log('unregistration', elementId, `Элемент удален${reason ? `: ${reason}` : ''}`, { reason });
  }
} as const;
