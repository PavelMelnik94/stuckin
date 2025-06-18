/**
 * Утилиты для работы с responsive breakpoints
 * Принцип Open/Closed: легко расширяется новыми breakpoints
 */

export interface Breakpoint {
  name: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  orientation?: 'portrait' | 'landscape';
}

export interface ResponsiveConfig {
  mobile: Partial<StickyConfig>;
  tablet: Partial<StickyConfig>;
  desktop: Partial<StickyConfig>;
  largeDesktop?: Partial<StickyConfig>;
}

/**
 * Предустановленные breakpoints
 */
export const DEFAULT_BREAKPOINTS: Record<string, Breakpoint> = {
  mobile: {
    name: 'mobile',
    maxWidth: 767
  },
  tablet: {
    name: 'tablet',
    minWidth: 768,
    maxWidth: 1023
  },
  desktop: {
    name: 'desktop',
    minWidth: 1024,
    maxWidth: 1439
  },
  largeDesktop: {
    name: 'largeDesktop',
    minWidth: 1440
  }
};

class ResponsiveManager {
  private breakpoints: Map<string, Breakpoint> = new Map();
  private currentBreakpoint: string | null = null;
  private observers = new Set<(breakpoint: string) => void>();
  private mediaQueries = new Map<string, MediaQueryList>();

  constructor(breakpoints: Record<string, Breakpoint> = DEFAULT_BREAKPOINTS) {
    Object.entries(breakpoints).forEach(([name, bp]) => {
      this.addBreakpoint(name, bp);
    });

    if (typeof window !== 'undefined') {
      this.initializeMediaQueries();
      this.updateCurrentBreakpoint();
    }
  }

  /**
   * Добавление нового breakpoint
   */
  addBreakpoint(name: string, breakpoint: Breakpoint): void {
    this.breakpoints.set(name, { ...breakpoint, name });

    if (typeof window !== 'undefined') {
      this.createMediaQuery(name, breakpoint);
    }
  }

  /**
   * Получение текущего breakpoint
   */
  getCurrentBreakpoint(): string | null {
    return this.currentBreakpoint;
  }

  /**
   * Проверка соответствия breakpoint
   */
  matches(breakpointName: string): boolean {
    const mediaQuery = this.mediaQueries.get(breakpointName);
    return mediaQuery?.matches || false;
  }

  /**
   * Получение конфигурации для текущего breakpoint
   */
  getConfigForBreakpoint<T>(responsiveConfig: Record<string, T>): T | null {
    if (!this.currentBreakpoint) return null;

    return responsiveConfig[this.currentBreakpoint] || null;
  }

  /**
   * Подписка на изменения breakpoint
   */
  subscribe(callback: (breakpoint: string) => void): () => void {
    this.observers.add(callback);

    return () => {
      this.observers.delete(callback);
    };
  }

  /**
   * Создание media query для breakpoint
   */
  private createMediaQuery(name: string, breakpoint: Breakpoint): void {
    const conditions: string[] = [];

    if (breakpoint.minWidth) {
      conditions.push(`(min-width: ${breakpoint.minWidth}px)`);
    }

    if (breakpoint.maxWidth) {
      conditions.push(`(max-width: ${breakpoint.maxWidth}px)`);
    }

    if (breakpoint.minHeight) {
      conditions.push(`(min-height: ${breakpoint.minHeight}px)`);
    }

    if (breakpoint.maxHeight) {
      conditions.push(`(max-height: ${breakpoint.maxHeight}px)`);
    }

    if (breakpoint.orientation) {
      conditions.push(`(orientation: ${breakpoint.orientation})`);
    }

    if (conditions.length === 0) return;

    const query = conditions.join(' and ');
    const mediaQuery = window.matchMedia(query);

    mediaQuery.addEventListener('change', () => {
      this.updateCurrentBreakpoint();
    });

    this.mediaQueries.set(name, mediaQuery);
  }

  /**
   * Инициализация всех media queries
   */
  private initializeMediaQueries(): void {
    this.breakpoints.forEach((breakpoint, name) => {
      this.createMediaQuery(name, breakpoint);
    });
  }

  /**
   * Обновление текущего breakpoint
   */
  private updateCurrentBreakpoint(): void {
    // Находим подходящий breakpoint по приоритету (от меньшего к большему)
    const sortedBreakpoints = Array.from(this.breakpoints.entries())
      .sort(([, a], [, b]) => (a.minWidth || 0) - (b.minWidth || 0));

    for (const [name] of sortedBreakpoints) {
      if (this.matches(name)) {
        if (this.currentBreakpoint !== name) {
          this.currentBreakpoint = name;
          this.notifyObservers(name);
        }
        return;
      }
    }

    // Fallback к mobile если ничего не подошло
    if (this.currentBreakpoint !== 'mobile') {
      this.currentBreakpoint = 'mobile';
      this.notifyObservers('mobile');
    }
  }

  /**
   * Уведомление наблюдателей об изменении breakpoint
   */
  private notifyObservers(breakpoint: string): void {
    this.observers.forEach(observer => observer(breakpoint));
  }
}

// Глобальный экземпляр responsive manager
export const responsiveManager = new ResponsiveManager();
