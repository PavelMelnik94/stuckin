/**
 * Type guards для безопасной работы с типами
 * Принцип Single Responsibility: каждая функция проверяет один тип
 */

import { StickyDirection, StickyState, StickyConfig } from './sticky.types';

// === БАЗОВЫЕ TYPE GUARDS ===

/**
 * Проверяет что значение не null и не undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Проверяет что значение является строкой
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Проверяет что значение является числом
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Проверяет что значение является положительным числом
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Проверяет что значение является булевым
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Проверяет что значение является функцией
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Проверяет что значение является объектом (не null, не array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Проверяет что значение является HTML элементом
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

// === STICKY SPECIFIC TYPE GUARDS ===

/**
 * Проверяет что строка является валидным направлением sticky
 */
export function isStickyDirection(value: unknown): value is StickyDirection {
  return isString(value) && ['top', 'bottom', 'left', 'right'].includes(value);
}

/**
 * Проверяет что строка является валидным состоянием sticky
 */
export function isStickyState(value: unknown): value is StickyState {
  return isString(value) && ['normal', 'sticky', 'bottom-reached'].includes(value);
}

/**
 * Проверяет что объект является валидной конфигурацией sticky
 */
export function isStickyConfig(value: unknown): value is StickyConfig {
  if (!isObject(value)) return false;

  const config = value as Record<string, unknown>;

  // Проверяем обязательные поля
  if (!('id' in config) || !isString(config.id)) return false;
  if (!('direction' in config) || !isStickyDirection(config.direction)) return false;
  if (!('offset' in config) || !isObject(config.offset)) return false;

  // Проверяем опциональные поля
  if ('priority' in config && !isNumber(config.priority)) return false;
  if ('zIndex' in config && !isNumber(config.zIndex)) return false;
  if ('disabled' in config && !isBoolean(config.disabled)) return false;
  if ('smooth' in config && !isBoolean(config.smooth)) return false;

  return true;
}

// === DOM TYPE GUARDS ===

/**
 * Проверяет что элемент находится в DOM
 */
export function isElementInDOM(element: HTMLElement): boolean {
  return document.contains(element);
}

/**
 * Проверяет что элемент видим пользователю
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0';
}

/**
 * Проверяет что DOMRect содержит валидные значения
 */
export function isValidDOMRect(rect: unknown): rect is DOMRect {
  if (!isObject(rect)) return false;

  const r = rect as Record<string, unknown>;
  return isNumber(r.width) &&
         isNumber(r.height) &&
         isNumber(r.top) &&
         isNumber(r.left) &&
         isNumber(r.bottom) &&
         isNumber(r.right);
}

// === BROWSER API TYPE GUARDS ===

/**
 * Проверяет поддержку Intersection Observer
 */
export function supportsIntersectionObserver(): boolean {
  return typeof window !== 'undefined' &&
         'IntersectionObserver' in window &&
         'IntersectionObserverEntry' in window;
}

/**
 * Проверяет поддержку Resize Observer
 */
export function supportsResizeObserver(): boolean {
  return typeof window !== 'undefined' && 'ResizeObserver' in window;
}

/**
 * Проверяет поддержку CSS position: sticky
 */
export function supportsStickyPosition(): boolean {
  if (typeof window === 'undefined') return false;

  const testElement = document.createElement('div');
  testElement.style.position = 'sticky';
  return testElement.style.position === 'sticky';
}

/**
 * Проверяет что код выполняется в браузере
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' &&
         typeof document !== 'undefined';
}

/**
 * Проверяет что код выполняется на сервере
 */
export function isServer(): boolean {
  return !isBrowser();
}

// === ADVANCED TYPE GUARDS ===

/**
 * Создает type guard для проверки свойства объекта
 */
export function hasProperty<K extends string>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * Создает type guard для массива определенного типа
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

/**
 * Комбинирует несколько type guards с И (AND)
 */
export function combineGuards<T, U>(
  guard1: (value: unknown) => value is T,
  guard2: (value: unknown) => value is U
) {
  return (value: unknown): value is T & U => {
    return guard1(value) && guard2(value);
  };
}

/**
 * Создает type guard для union типа
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value as T[number]);
}
