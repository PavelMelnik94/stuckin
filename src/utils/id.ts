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

/**
 * Генерация детерминированного ID на основе контента
 */
export const generateContentId = (content: string): string => {
  // Простой хеш для генерации стабильного ID
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Конвертируем в 32-bit integer
  }
  return `sticky-${Math.abs(hash)}`;
};
