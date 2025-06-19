/**
 * Стратегии позиционирования sticky элементов
 * Принцип Strategy Pattern: различные алгоритмы позиционирования
 */

import type { StickyConfig } from '../types/sticky.types';

export interface PositionStrategy {
  name: string;
  calculate: (element: HTMLElement, config: StickyConfig, viewport: ViewportInfo) => PositionResult;
  canHandle: (config: StickyConfig) => boolean;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export interface PositionResult {
  position: 'fixed' | 'absolute' | 'static';
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transform?: string;
  zIndex: number;
}

/**
 * Стандартная стратегия позиционирования
 */
export const standardStrategy: PositionStrategy = {
  name: 'standard',

  canHandle: (config) => {
    return ['top', 'bottom', 'left', 'right'].includes(config.direction);
  },

  calculate: (_element, config, _viewport) => {
    // TODO: Use element rect for proper calculation
    // const rect = element.getBoundingClientRect();
    const { direction, offset } = config;

    return {
      position: 'fixed',
      [direction]: offset[direction] || 0,
      zIndex: config.zIndex || 1000
    };
  }
};

/**
 * Центрированная стратегия
 */
export const centeredStrategy: PositionStrategy = {
  name: 'centered',

  canHandle: (config) => {
    return config.direction === 'center' as any;
  },

  calculate: (element, config, viewport) => {
    const rect = element.getBoundingClientRect();

    return {
      position: 'fixed',
      top: (viewport.height - rect.height) / 2,
      left: (viewport.width - rect.width) / 2,
      zIndex: config.zIndex || 1000
    };
  }
};

/**
 * Стратегия "умного" позиционирования
 * Автоматически выбирает лучшую позицию в зависимости от контекста
 */
export const smartStrategy: PositionStrategy = {
  name: 'smart',

  canHandle: (config) => {
    return config.direction === 'smart' as any;
  },

  calculate: (element, config, viewport) => {
    const rect = element.getBoundingClientRect();
    const elementHeight = rect.height;
    const elementWidth = rect.width;

    // Анализируем лучшую позицию
    const spaceTop = rect.top;
    const spaceBottom = viewport.height - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewport.width - rect.right;

    // Выбираем направление с наибольшим свободным пространством
    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);

    if (maxSpace === spaceTop && spaceTop > elementHeight) {
      return { position: 'fixed', top: 0, zIndex: config.zIndex || 1000 };
    }

    if (maxSpace === spaceBottom && spaceBottom > elementHeight) {
      return { position: 'fixed', bottom: 0, zIndex: config.zIndex || 1000 };
    }

    if (maxSpace === spaceLeft && spaceLeft > elementWidth) {
      return { position: 'fixed', left: 0, zIndex: config.zIndex || 1000 };
    }

    if (maxSpace === spaceRight && spaceRight > elementWidth) {
      return { position: 'fixed', right: 0, zIndex: config.zIndex || 1000 };
    }

    // Fallback к верхней позиции
    return { position: 'fixed', top: 0, zIndex: config.zIndex || 1000 };
  }
};

/**
 * Менеджер стратегий позиционирования
 */
class PositionStrategyManager {
  private strategies = new Map<string, PositionStrategy>();

  constructor() {
    // Добавляем встроенные стратегии
    this.addStrategy(standardStrategy);
    this.addStrategy(centeredStrategy);
    this.addStrategy(smartStrategy);
  }

  /**
   * Добавление новой стратегии
   */
  addStrategy(strategy: PositionStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Получение стратегии по имени
   */
  getStrategy(name: string): PositionStrategy | null {
    return this.strategies.get(name) || null;
  }

  /**
   * Поиск подходящей стратегии для конфигурации
   */
  findStrategy(config: StickyConfig): PositionStrategy {
    // Сначала пробуем найти по explicit стратегии
    if (config.positionStrategy) {
      const strategy = this.getStrategy(config.positionStrategy);
      if (strategy && strategy.canHandle(config)) {
        return strategy;
      }
    }

    // Ищем первую подходящую стратегию
    for (const strategy of this.strategies.values()) {
      if (strategy.canHandle(config)) {
        return strategy;
      }
    }

    // Fallback к стандартной стратегии
    return standardStrategy;
  }

  /**
   * Вычисление позиции с использованием подходящей стратегии
   */
  calculatePosition(
    element: HTMLElement,
    config: StickyConfig,
    viewport: ViewportInfo
  ): PositionResult {
    const strategy = this.findStrategy(config);
    return strategy.calculate(element, config, viewport);
  }
}

// Глобальный менеджер стратегий
export const positionStrategyManager = new PositionStrategyManager();
