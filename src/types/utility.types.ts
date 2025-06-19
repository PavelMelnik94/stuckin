/**
 * Утилитарные типы для sticky библиотеки
 * Принцип DRY: переиспользуемые типы для всей библиотеки
 */

// === БАЗОВЫЕ УТИЛИТАРНЫЕ ТИПЫ ===

/**
 * Делает все свойства объекта опциональными кроме указанных
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Строго типизированные ключи объекта
 */
export type StrictKeys<T> = keyof T;

/**
 * Извлекает тип значения из объекта по ключу
 */
export type ValueOf<T, K extends keyof T> = T[K];

/**
 * Создает union type из значений объекта
 */
export type ValueUnion<T> = T[keyof T];

/**
 * Безопасный доступ к вложенным свойствам
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Делает указанные свойства обязательными
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Исключает null и undefined из типа
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

// === ФУНКЦИОНАЛЬНЫЕ ТИПЫ ===

/**
 * Тип для callback функций с типизированными параметрами
 */
export type Callback<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => TReturn;

/**
 * Тип для async callback функций
 */
export type AsyncCallback<TArgs extends unknown[] = [], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

/**
 * Тип для функции очистки (cleanup)
 */
export type CleanupFunction = () => void;

/**
 * Тип для функции обновления состояния
 */
export type StateUpdater<T> = (prevState: T) => T;

// === DOM ТИПЫ ===

/**
 * Расширенный тип для HTML элементов с дополнительными свойствами
 */
export type ExtendedHTMLElement<T extends HTMLElement = HTMLElement> = T & {
  __stickyId?: string;
  __stickyConfig?: unknown;
};

/**
 * Тип для безопасной работы с CSS свойствами
 */
export type CSSPropertyValue = string | number | undefined;

/**
 * Тип для CSS переменных
 */
export type CSSVariable = `--${string}`;

/**
 * Тип для CSS calc() функций
 */
export type CSSCalc = `calc(${string})`;

// === RESPONSIVE ТИПЫ ===

/**
 * Тип для breakpoint значений
 */
export type BreakpointValue = number | `${number}px` | `${number}em` | `${number}rem`;

/**
 * Тип для медиа-запросов
 */
export type MediaQueryString = `(${string})`;

// === PERFORMANCE ТИПЫ ===

/**
 * Тип для метрик производительности
 */
export interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

/**
 * Тип для memory информации
 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// === ERROR HANDLING ТИПЫ ===

/**
 * Базовый тип для ошибок библиотеки
 */
export interface StickyError extends Error {
  code: string;
  context?: Record<string, unknown>;
}

/**
 * Тип для результата операции с возможной ошибкой
 */
export type Result<T, E = StickyError> =
  | { success: true; data: T }
  | { success: false; error: E };

// === CONFIGURATION ТИПЫ ===

/**
 * Базовый тип для конфигурации с валидацией
 */
export interface ValidatedConfig<T> {
  value: T;
  isValid: boolean;
  errors: string[];
}

/**
 * Тип для конфигурации с значениями по умолчанию
 */
export type ConfigWithDefaults<T, D extends Partial<T>> = T & {
  readonly defaults: D;
};
