/**
 * Утилиты для генерации уникальных ID
 * Принцип Single Responsibility: только генерация ID
 */

let idCounter = 0;

/**
 * Генерация уникального ID для sticky элементов
 */
export const generateId = (): string => {
  return `sticky-${Date.now()}-${++idCounter}`;
};
