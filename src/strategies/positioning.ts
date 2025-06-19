/**
 * Стратегии позиционирования sticky элементов
 * Принцип Strategy Pattern: различные алгоритмы позиционирования
 */

import type { StickyConfig } from '@/types/sticky.types';

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

  calculate: (element, config, _viewport) => {
    const rect = element.getBoundingClientRect();
    const { direction, offset } = config;

    // Расчет позиции с учетом размеров элемента
    const result: PositionResult = {
      position: 'fixed',
      zIndex: config.zIndex || 1000
    };

    switch (direction) {
      case 'top':
        result.top = offset.top || 0;
        result.left = rect.left;
        break;
      case 'bottom':
        result.bottom = offset.bottom || 0;
        result.left = rect.left;
        break;
      case 'left':
        result.left = offset.left || 0;
        result.top = rect.top;
        break;
      case 'right':
        result.right = offset.right || 0;
        result.top = rect.top;
        break;
    }

    return result;
  }
};

/**
 * Центрированная стратегия
 */
export const centeredStrategy: PositionStrategy = {
  name: 'centered',

  canHandle: (config) => {
    return config.direction === 'center' as unknown;
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
    return config.direction === 'smart' as unknown;
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
 * Follow-scroll стратегия - следование за скроллом с плавным движением
 */
export const followScrollStrategy: PositionStrategy = {
  name: 'follow-scroll',

  canHandle: (config) => {
    return config.direction === 'follow-scroll';
  },

  calculate: (element, config, viewport) => {
    const rect = element.getBoundingClientRect();
    const followConfig = (config as any).followScroll || {};
    const lag = followConfig.lag || 0.1;
    const bounds = followConfig.bounds || {};

    // Вычисляем позицию с учетом лага
    const targetY = viewport.scrollY * (1 - lag);
    const targetX = viewport.scrollX * (1 - lag);

    let top = targetY + (bounds.top || 0);
    let left = targetX + (bounds.left || 0);

    // Применяем ограничения
    if (bounds.bottom !== undefined) {
      top = Math.min(top, viewport.height - rect.height - bounds.bottom);
    }
    if (bounds.right !== undefined) {
      left = Math.min(left, viewport.width - rect.width - bounds.right);
    }

    return {
      position: 'fixed',
      top,
      left,
      zIndex: config.zIndex || 1000,
      transform: `translate3d(0, 0, 0)` // Hardware acceleration
    };
  }
};

/**
 * Magnetic стратегия - магнитное притяжение к краям
 */
export const magneticStrategy: PositionStrategy = {
  name: 'magnetic',

  canHandle: (config) => {
    return config.direction === 'magnetic';
  },

  calculate: (element, config, viewport) => {
    const rect = element.getBoundingClientRect();
    const magneticConfig = (config as any).magnetic || {};
    const threshold = magneticConfig.threshold || 50;
    const strength = magneticConfig.strength || 0.8;
    const activeEdges = magneticConfig.edges || ['top', 'bottom', 'left', 'right'];

    const result: PositionResult = {
      position: 'fixed',
      zIndex: config.zIndex || 1000
    };

    // Проверяем близость к каждому краю
    const distances = {
      top: rect.top,
      bottom: viewport.height - rect.bottom,
      left: rect.left,
      right: viewport.width - rect.right
    };

    // Находим ближайший край в пределах threshold
    let closestEdge: string | null = null;
    let minDistance = threshold;

    for (const edge of activeEdges) {
      if (distances[edge as keyof typeof distances] < minDistance) {
        minDistance = distances[edge as keyof typeof distances];
        closestEdge = edge;
      }
    }

    // Применяем магнитное притяжение
    if (closestEdge) {
      const pullForce = (threshold - minDistance) / threshold * strength;

      switch (closestEdge) {
        case 'top':
          // Притягиваем к верху (top = 0)
          result.top = rect.top * (1 - pullForce);
          result.left = rect.left;
          break;
        case 'bottom':
          // Притягиваем к низу
          result.top = rect.top + (viewport.height - rect.bottom) * pullForce;
          result.left = rect.left;
          break;
        case 'left':
          // Притягиваем к левому краю (left = 0)
          result.left = rect.left * (1 - pullForce);
          result.top = rect.top;
          break;
        case 'right':
          // Притягиваем к правому краю
          result.left = rect.left + (viewport.width - rect.right) * pullForce;
          result.top = rect.top;
          break;
      }
    } else {
      // Возвращаем текущую позицию
      result.top = rect.top;
      result.left = rect.left;
    }

    return result;
  }
};

/**
 * Parallax стратегия - параллакс эффект
 */
export const parallaxStrategy: PositionStrategy = {
  name: 'parallax',

  canHandle: (config) => {
    return config.direction === 'parallax';
  },

  calculate: (element, config, viewport) => {
    const rect = element.getBoundingClientRect();
    const parallaxConfig = (config as any).parallax || {};
    const speed = parallaxConfig.speed || 0.5;
    const direction = parallaxConfig.direction || 'vertical';
    const reverse = parallaxConfig.reverse || false;

    const scrollMultiplier = reverse ? -speed : speed;
    let transform = '';

    switch (direction) {
      case 'vertical':
        const yOffset = viewport.scrollY * scrollMultiplier;
        transform = `translateY(${yOffset}px)`;
        break;
      case 'horizontal':
        const xOffset = viewport.scrollX * scrollMultiplier;
        transform = `translateX(${xOffset}px)`;
        break;
      case 'both':
        const yOffsetBoth = viewport.scrollY * scrollMultiplier;
        const xOffsetBoth = viewport.scrollX * scrollMultiplier;
        transform = `translate(${xOffsetBoth}px, ${yOffsetBoth}px)`;
        break;
    }

    return {
      position: 'fixed',
      top: rect.top,
      left: rect.left,
      transform: transform + ' translate3d(0, 0, 0)', // Добавляем hardware acceleration
      zIndex: config.zIndex || 1000
    };
  }
};

/**
 * Adaptive стратегия - адаптивное позиционирование
 */
export const adaptiveStrategy: PositionStrategy = {
  name: 'adaptive',

  canHandle: (config) => {
    return config.direction === 'adaptive';
  },

  calculate: (element, config, viewport) => {
    const rect = element.getBoundingClientRect();
    const elementArea = rect.width * rect.height;
    const viewportArea = viewport.width * viewport.height;
    const sizeRatio = elementArea / viewportArea;

    // Адаптируем стратегию в зависимости от размера элемента
    if (sizeRatio > 0.2) {
      // Большой элемент - используем центрирование
      return {
        position: 'fixed',
        top: Math.max(0, (viewport.height - rect.height) / 2),
        left: Math.max(0, (viewport.width - rect.width) / 2),
        zIndex: config.zIndex || 1000
      };
    } else if (viewport.width < 768) {
      // Мобильное устройство - прижимаем к низу
      return {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: config.zIndex || 1000
      };
    } else {
      // Обычное позиционирование для маленьких элементов - по центру
      return {
        position: 'fixed',
        top: (viewport.height - rect.height) / 2,
        left: (viewport.width - rect.width) / 2,
        zIndex: config.zIndex || 1000
      };
    }
  }
};

/**
 * Animated стратегия - анимированные переходы
 */
export const animatedStrategy: PositionStrategy = {
  name: 'animated',

  canHandle: (config) => {
    return config.direction === 'animated';
  },

  calculate: (element, config, viewport) => {
    const animatedConfig = (config as any).animated || {};
    const duration = animatedConfig.duration || 300;
    const easing = animatedConfig.easing || 'ease-in-out';

    // Применяем CSS transitions для плавной анимации
    element.style.transition = `all ${duration}ms ${easing}`;

    // Используем стандартное позиционирование с анимацией
    const baseResult = standardStrategy.calculate(element, config, viewport);

    return {
      ...baseResult,
      // Добавляем дополнительные стили для анимации
      transform: (baseResult.transform || '') + ' translate3d(0, 0, 0)'
    };
  }
};

/**
 * Stacking стратегия - умное стекирование элементов
 */
export const stackingStrategy: PositionStrategy = {
  name: 'stacking',

  canHandle: (config) => {
    return config.direction === 'stacking';
  },

  calculate: (element, config, viewport) => {
    const stackingConfig = (config as any).stacking || {};
    const spacing = stackingConfig.spacing || 10;
    const direction = stackingConfig.direction || 'vertical';
    const alignment = stackingConfig.alignment || 'start';

    // Получаем все sticky элементы той же группы
    const groupId = (config as any).groupId || 'default';
    const groupElements = document.querySelectorAll(`[data-sticky-group="${groupId}"]`);
    const currentIndex = Array.from(groupElements).indexOf(element);

    let top = 0;
    let left = 0;

    if (direction === 'vertical') {
      // Вертикальное стекирование
      for (let i = 0; i < currentIndex; i++) {
        const prevElement = groupElements[i] as HTMLElement;
        top += prevElement.offsetHeight + spacing;
      }

      switch (alignment) {
        case 'center':
          left = (viewport.width - element.offsetWidth) / 2;
          break;
        case 'end':
          left = viewport.width - element.offsetWidth;
          break;
        default:
          left = 0;
      }
    } else {
      // Горизонтальное стекирование
      for (let i = 0; i < currentIndex; i++) {
        const prevElement = groupElements[i] as HTMLElement;
        left += prevElement.offsetWidth + spacing;
      }

      switch (alignment) {
        case 'center':
          top = (viewport.height - element.offsetHeight) / 2;
          break;
        case 'end':
          top = viewport.height - element.offsetHeight;
          break;
        default:
          top = 0;
      }
    }

    return {
      position: 'fixed',
      top,
      left,
      zIndex: Math.max(1000, (config.zIndex || 1000) + currentIndex)
    };
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
    this.addStrategy(followScrollStrategy);
    this.addStrategy(magneticStrategy);
    this.addStrategy(parallaxStrategy);
    this.addStrategy(adaptiveStrategy);
    this.addStrategy(animatedStrategy);
    this.addStrategy(stackingStrategy);
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
