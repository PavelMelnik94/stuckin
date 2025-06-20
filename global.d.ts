/**
 * Глобальные типы для sticky библиотеки
 * Принцип Interface Segregation: отдельные интерфейсы для разных нужд
 */

// === BUILD-TIME CONSTANTS ===
declare const __NODE_ENV__: 'development' | 'production' | 'test';

// === WINDOW EXTENSIONS ===
declare global {
  interface Window {
    /**
     * Debug API для sticky библиотеки (только в development)
     */
    __STICKY_DEBUG__?: {
      enable: (config?: Partial<import('./src/debug/StickyDebugger').DebugConfig>) => void;
      disable: () => void;
      getEvents: () => import('./src/debug/StickyDebugger').DebugEvent[];
      getSnapshots: () => import('./src/debug/StickyDebugger').DebugSnapshot[];
      getPerformance: () => any;
      captureSnapshot: (label?: string) => any;
      clearHistory: () => void;
      exportData: () => string;
      setLogLevel: (level: 'error' | 'warn' | 'info' | 'debug') => void;
      toggleVisual: () => void;
    };

    /**
     * Performance API extensions
     */
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
  }

  // === ENVIRONMENT VARIABLES ===
  declare const __DEV__: boolean;

  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      readonly BUILD_MODE?: 'library' | 'standalone';
      readonly ANALYZE_BUNDLE?: 'true' | 'false';
    }
  }
}

// === CSS MODULES ===
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// === STATIC ASSETS ===
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

// === JSON MODULES ===
declare module '*.json' {
  const content: Record<string, any>;
  export default content;
}

// === WEB APIS EXTENSIONS ===
declare module 'resize-observer-polyfill' {
  export = ResizeObserver;
}

// === UTILITY TYPES ===
declare namespace StickyLib {
  /**
   * Утилитарный тип для создания строго типизированных ID
   */
  type StrictId<T extends string> = T & { readonly __brand: unique symbol };

  /**
   * Тип для безопасной работы с CSS свойствами
   */
  type CSSPropertyValue<T> = T | `var(--${string})` | `calc(${string})`;

  /**
   * Расширенный тип для Ref с дополнительными методами
   */
  type StickyRef<T extends HTMLElement = HTMLElement> = React.RefObject<T> & {
    readonly current: T | null;
  };

  /**
   * Тип для безопасной работы с медиа-запросами
   */
  type MediaQuery = `(${string})` | string;

  /**
   * Условные типы для производительности
   */
  type NonEmptyArray<T> = [T, ...T[]];

  /**
   * Утилитарный тип для создания union из array
   */
  type ArrayToUnion<T extends readonly unknown[]> = T[number];
}

// === MOBX EXTENSIONS ===
declare module 'mobx' {
  interface IObservableValue<T> {
    toJSON(): T;
  }
}

// === TESTING UTILITIES ===
declare namespace Testing {
  /**
   * Утилитарные типы для тестирования
   */
  type MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

  type PartialMock<T> = {
    [K in keyof T]?: T[K] extends (...args: any[]) => any
      ? MockFunction<T[K]>
      : T[K];
  };
}

export {};
