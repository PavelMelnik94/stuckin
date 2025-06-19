import { makeObservable, observable, action, computed, runInAction } from 'mobx';

import { debugLogger } from '@/debug/debugLogger';
import type { StickyConfig, StickyDirection, StickyElement, StickyGroup, StickyState, StickyBoundary, StickyPosition, StickyScrollContainer } from '@/types/sticky.types';


/**
 * Основной менеджер для управления sticky элементами
 * Использует MobX для реактивности и Intersection Observer для оптимизации
 */
export class StickyManager {
  @observable elements = new Map<string, StickyElement>();
  @observable groups = new Map<string, StickyGroup>();
  @observable scrollContainers = new Map<HTMLElement, Set<string>>(); // Контейнеры и их элементы
  @observable isSSR = typeof window === 'undefined';

  private intersectionObserver: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private scrollTimeout: number | null = null;
  private zIndexCounter = 1000;

  // === ОПТИМИЗАЦИИ ПРОТИВ ДРОЖАНИЯ ===

  // Кеш для getBoundingClientRect - самая дорогая операция
  private rectCache = new Map<string, { rect: DOMRect; timestamp: number }>();
  private stateCache = new Map<string, StickyState>();
  private stateDebounceTimeouts = new Map<string, number>();

  // Конфигурация оптимизации
  private readonly RECT_CACHE_TTL = 8; // ms - время жизни кеша
  private readonly STATE_DEBOUNCE = 30; // ms - дебаунс состояний
  private readonly POSITION_THRESHOLD = 2; // px - порог для предотвращения дрожания
  private readonly SCROLL_THROTTLE_REDUCED = 8; // ms - уменьшенный throttle

  // Состояние скролла для управления CSS transitions
  private isScrolling = false;
  private scrollEndTimeout: number | null = null;
  private readonly SCROLL_END_DELAY = 150; // ms

  constructor() {
    makeObservable(this);

    if (!this.isSSR) {
      this.initializeObservers();
      this.handleResize = this.handleResize.bind(this);
      this.handleScroll = this.handleScroll.bind(this);
      this.handleContainerScroll = this.handleContainerScroll.bind(this);

      window.addEventListener('resize', this.handleResize);
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    }
  }

  /**
   * Инициализация наблюдателей для оптимизации производительности
   */
  private initializeObservers(): void {
    // Intersection Observer для отслеживания видимости
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = this.findElementByNode(entry.target as HTMLElement);
          if (element) {
            this.updateElementVisibility(element, entry.isIntersecting);
          }
        });
      },
      {
        root: null,
        rootMargin: '100px 0px', // Предзагрузка для плавности
        threshold: [0, 0.1, 0.9, 1]
      }
    );

    // Resize Observer для отслеживания изменений размеров
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = this.findElementByNode(entry.target as HTMLElement);
        if (element) {
          this.updateElementDimensions(element);
        }
      });
    });
  }

  /**
   * Регистрация нового sticky элемента
   */
  @action
  registerSticky(htmlElement: HTMLElement, config: StickyConfig): void {
    if (this.elements.has(config.id)) {
      debugLogger.warning(config.id, 'Попытка регистрации уже существующего элемента', { config });
      console.warn(`Sticky element with id "${config.id}" already exists`);
      return;
    }

    debugLogger.info(config.id, 'Начало регистрации sticky элемента', {
      elementTag: htmlElement.tagName,
      config
    });

    const originalPosition = htmlElement.getBoundingClientRect();
    const zIndex = config.zIndex || this.getNextZIndex(config.priority);

    const stickyElement: StickyElement = {
      id: config.id,
      element: htmlElement,
      config,
      state: 'normal',
      previousState: null,
      originalPosition,
      currentZIndex: zIndex,
      isActive: false,
      lastUpdate: Date.now(),
      transitionCount: 0
    };

    this.elements.set(config.id, stickyElement);

    // 🔧 Логирование успешной регистрации
    debugLogger.registration(config.id, {
      zIndex,
      position: originalPosition,
      totalElements: this.elements.size
    });

    // Подключаем наблюдатели
    this.intersectionObserver?.observe(htmlElement);
    this.resizeObserver?.observe(htmlElement);

    // Регистрируем кастомный скролл-контейнер если указан
    if (config.scrollContainer) {
      this.registerScrollContainer(config.id, config.scrollContainer);
    }

    // Применяем начальные стили
    this.applyInitialStyles(stickyElement);

    // Инициальная проверка позиции
    this.updateStickyState(stickyElement);
  }

  /**
   * Отмена регистрации sticky элемента
   */
  @action
  unregisterSticky(id: string): void {
    const element = this.elements.get(id);
    if (!element) {
      debugLogger.warning(id, 'Попытка удаления несуществующего элемента');
      return;
    }

    debugLogger.info(id, 'Начало удаления sticky элемента', {
      groupsCount: this.groups.size,
      totalElements: this.elements.size
    });

    // Отключаем наблюдатели
    this.intersectionObserver?.unobserve(element.element);
    this.resizeObserver?.unobserve(element.element);

    // Отключаем кастомный контейнер если был зарегистрирован
    if (element.config.scrollContainer) {
      this.unregisterScrollContainer(id);
    }

    // Сбрасываем стили
    this.resetElementStyles(element);

    // Удаляем из групп
    this.groups.forEach((group) => {
      group.elements.delete(id);
    });

    this.elements.delete(id);

    // 🔧 Логирование завершения удаления
    debugLogger.unregistration(id, 'manual unregister');
  }

  /**
   * Обновление конфигурации элемента
   */
  @action
  updateConfig(id: string, newConfig: Partial<StickyConfig>): void {
    const element = this.elements.get(id);
    if (!element) return;

    element.config = { ...element.config, ...newConfig };

    // Пересчитываем z-index если изменился приоритет
    if (newConfig.priority !== undefined) {
      element.currentZIndex = this.getNextZIndex(newConfig.priority);
    }

    this.updateStickyState(element);
    this.updateGroupPriorities();
  }

  /**
   * Создание группы sticky элементов
   */
  @action
  createGroup(groupId: string, priority: number): void {
    if (this.groups.has(groupId)) {
      console.warn(`Sticky group "${groupId}" already exists`);
      return;
    }

    this.groups.set(groupId, {
      id: groupId,
      elements: new Map(),
      priority,
      maxZIndex: this.getNextZIndex(priority)
    });
  }

  /**
   * Добавление элемента в группу
   */
  @action
  addToGroup(elementId: string, groupId: string): void {
    const element = this.elements.get(elementId);
    const group = this.groups.get(groupId);

    if (!element || !group) {
      console.warn(`Element "${elementId}" or group "${groupId}" not found`);
      return;
    }

    group.elements.set(elementId, element);
    element.currentZIndex = this.getGroupZIndex(group, element.config.priority);

    this.updateGroupPriorities();
  }

  /**
   * Основная логика обновления sticky состояния
   */
  @action
  protected updateStickyState(element: StickyElement): void {
    if (element.config.disabled || this.isSSR) {
      this.resetElementStyles(element);
      return;
    }

    const rect = element.element.getBoundingClientRect();

    const newState = this.calculateStickyState(element, rect);

    if (newState !== element.state) {
      element.state = newState;
      this.applyStateStyles(element, newState);

      // Вызываем callback если есть
      this.notifyStateChange(element, newState);
    }
  }

  /**
   * Оптимизированное обновление состояния с дебаунсингом и кешированием
   */
  @action
  protected updateStickyStateOptimized(element: StickyElement): void {
    if (element.config.disabled || this.isSSR) {
      this.resetElementStyles(element);
      return;
    }

    // Используем кешированный rect для оптимизации
    const rect = this.getCachedRect(element.element, element.id);
    const newState = this.calculateStickyStateWithThreshold(element, rect);

    // Проверяем кеш состояния
    const cachedState = this.stateCache.get(element.id);
    if (newState === cachedState) {
      return; // Состояние не изменилось, пропускаем обновление
    }

    // Дебаунсинг для предотвращения дрожания на границах
    const existingTimeout = this.stateDebounceTimeouts.get(element.id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = window.setTimeout(() => {
      this.finalizeStateChange(element, newState);
      this.stateDebounceTimeouts.delete(element.id);
    }, this.STATE_DEBOUNCE);

    this.stateDebounceTimeouts.set(element.id, timeout);
  }

  /**
   * Финализация изменения состояния с оптимизациями
   */
  @action
  private finalizeStateChange(element: StickyElement, newState: StickyState): void {
    const oldState = element.state;

    if (newState !== oldState) {
      element.state = newState;
      element.previousState = oldState;
      element.lastUpdate = Date.now();
      element.transitionCount++;

      this.stateCache.set(element.id, newState);

      this.applyStateStylesOptimized(element, newState);
      this.notifyStateChange(element, newState);

      debugLogger.stateChange(element.id, oldState, newState);
    }
  }

  /**
   * Расчет нового состояния sticky элемента
   */
  private calculateStickyState(element: StickyElement, rect: DOMRect): StickyState {
    const { direction, offset, boundary, scrollContainer } = element.config;

    // Используем кастомный контейнер или viewport
    const container = scrollContainer ?
      this.getContainerDimensions(scrollContainer.element) :
      this.getViewportDimensions();

    // Проверяем границы если заданы
    if (boundary && this.isOutsideBoundary(element, boundary)) {
      return 'bottom-reached';
    }

    // Для кастомного контейнера используем позицию элемента относительно контейнера
    const targetRect = scrollContainer ?
      this.getRelativeRect(rect, scrollContainer.element) :
      rect;

    // Учитываем дополнительные отступы контейнера
    const containerOffset = scrollContainer?.offset || {};

    switch (direction) {
      case 'top':
        const topThreshold = (offset.top || 0) + (containerOffset.top || 0);
        return targetRect.top <= topThreshold ? 'sticky' : 'normal';

      case 'bottom':
        const bottomThreshold = container.height - (offset.bottom || 0) - (containerOffset.bottom || 0);
        return targetRect.bottom >= bottomThreshold ? 'sticky' : 'normal';

      case 'left':
        const leftThreshold = (offset.left || 0) + (containerOffset.left || 0);
        return targetRect.left <= leftThreshold ? 'sticky' : 'normal';

      case 'right':
        const rightThreshold = container.width - (offset.right || 0) - (containerOffset.right || 0);
        return targetRect.right >= rightThreshold ? 'sticky' : 'normal';

      default:
        return 'normal';
    }
  }

  /**
   * Расчет состояния с пороговыми значениями для предотвращения дрожания
   */
  private calculateStickyStateWithThreshold(element: StickyElement, rect: DOMRect): StickyState {
    const { direction, offset, boundary, scrollContainer } = element.config;

    // Используем кастомный контейнер или viewport
    const container = scrollContainer ?
      this.getContainerDimensions(scrollContainer.element) :
      this.getViewportDimensions();

    // Проверяем границы если заданы
    if (boundary && this.isOutsideBoundary(element, boundary)) {
      return 'bottom-reached';
    }

    // Для кастомного контейнера используем позицию элемента относительно контейнера
    const targetRect = scrollContainer ?
      this.getRelativeRect(rect, scrollContainer.element) :
      rect;

    // Учитываем дополнительные отступы контейнера
    const containerOffset = scrollContainer?.offset || {};

    // ВАЖНО: Добавляем пороговые значения для предотвращения дрожания
    const THRESHOLD = this.POSITION_THRESHOLD;

    switch (direction) {
      case 'top':
        const topThreshold = (offset.top || 0) + (containerOffset.top || 0);
        return targetRect.top <= (topThreshold + THRESHOLD) ? 'sticky' : 'normal';

      case 'bottom':
        const bottomThreshold = container.height - (offset.bottom || 0) - (containerOffset.bottom || 0);
        return targetRect.bottom >= (bottomThreshold - THRESHOLD) ? 'sticky' : 'normal';

      case 'left':
        const leftThreshold = (offset.left || 0) + (containerOffset.left || 0);
        return targetRect.left <= (leftThreshold + THRESHOLD) ? 'sticky' : 'normal';

      case 'right':
        const rightThreshold = container.width - (offset.right || 0) - (containerOffset.right || 0);
        return targetRect.right >= (rightThreshold - THRESHOLD) ? 'sticky' : 'normal';

      default:
        return 'normal';
    }
  }

  /**
   * Оптимизированное применение стилей с GPU ускорением
   */
  private applyStateStylesOptimized(element: StickyElement, state: StickyState): void {
    const { element: htmlElement, config } = element;

    // Добавляем базовый класс оптимизации
    htmlElement.classList.add('sticky-optimized');

    if (state === 'sticky' && !element.isActive) {
      element.isActive = true;

      const styles = htmlElement.style;
      styles.position = 'sticky';

      // GPU ускорение только если не в режиме активного скролла
      if (!this.isScrolling) {
        styles.willChange = 'transform';
        styles.transform = 'translate3d(0,0,0)';
      }

      this.applyPositionWithThreshold(htmlElement, config);

      if (config.priority !== undefined) {
        element.currentZIndex = this.getNextZIndex(config.priority);
        styles.zIndex = String(element.currentZIndex);
      }

    } else if (state !== 'sticky' && element.isActive) {
      element.isActive = false;
      this.resetElementStylesOptimized(htmlElement);
    }
  }

  /**
   * Применение позиционирования с округлением для предотвращения дрожания
   */
  private applyPositionWithThreshold(element: HTMLElement, config: StickyConfig): void {
    const { direction, offset = {} } = config;
    const styles = element.style;

    // Округляем значения для избежания субпиксельного дрожания
    const roundedOffset = (value: number) =>
      Math.round(value / this.POSITION_THRESHOLD) * this.POSITION_THRESHOLD;

    switch (direction) {
      case 'top':
        styles.top = `${roundedOffset(offset.top || 0)}px`;
        break;
      case 'bottom':
        styles.bottom = `${roundedOffset(offset.bottom || 0)}px`;
        break;
      case 'left':
        styles.left = `${roundedOffset(offset.left || 0)}px`;
        break;
      case 'right':
        styles.right = `${roundedOffset(offset.right || 0)}px`;
        break;
    }
  }

  /**
   * Оптимизированный сброс стилей
   */
  private resetElementStylesOptimized(htmlElement: HTMLElement): void {
    const styles = htmlElement.style;
    styles.position = '';
    styles.top = '';
    styles.bottom = '';
    styles.left = '';
    styles.right = '';
    styles.zIndex = '';
    styles.willChange = '';
    styles.transform = '';

    // Убираем классы оптимизации
    htmlElement.classList.remove('sticky-scrolling', 'sticky-stable', 'sticky-optimized');
  }

  /**
   * Применение стилей в зависимости от состояния
   */
  private applyStateStyles(element: StickyElement, state: StickyState): void {
    const { direction, offset, smooth, scrollContainer } = element.config;
    const style = element.element.style;

    // Базовые стили
    const baseStyles = {
      transition: smooth ? 'all 0.2s ease-out' : 'none',
      zIndex: element.currentZIndex.toString()
    };

    switch (state) {
      case 'sticky':
        // Для новых стратегий позиционирования не используем простое offset[direction]
        if (['top', 'bottom', 'left', 'right'].includes(direction)) {
          // Для кастомного контейнера используем absolute позиционирование
          if (scrollContainer) {
            const containerRect = scrollContainer.element.getBoundingClientRect();
            const containerOffset = scrollContainer.offset || {};

            // ✅ ИСПРАВЛЕНО: Убеждаемся, что контейнер имеет relative позиционирование
            const containerStyle = getComputedStyle(scrollContainer.element);
            if (containerStyle.position === 'static') {
              scrollContainer.element.style.position = 'relative';
            }

            Object.assign(style, baseStyles, {
              position: 'absolute',
              ...this.getContainerPosition(element, direction, offset, containerRect, containerOffset)
            });
          } else {
            // Обычное fixed позиционирование для viewport
            Object.assign(style, baseStyles, {
              position: 'fixed',
              [direction]: `${offset[direction as keyof StickyPosition] || 0}px`
            });
          }
        } else {
          // Для новых стратегий используем позиционирование через менеджер стратегий
          Object.assign(style, baseStyles, {
            position: scrollContainer ? 'absolute' : 'fixed'
          });
        }
        element.isActive = true;
        break;

      case 'bottom-reached':
        if (['top', 'bottom', 'left', 'right'].includes(direction)) {
          Object.assign(style, baseStyles, {
            position: 'absolute',
            [this.getOppositeDirection(direction)]: '0px'
          });
        } else {
          Object.assign(style, baseStyles, {
            position: 'absolute'
          });
        }
        element.isActive = false;
        break;

      case 'normal':
      default:
        this.resetElementStyles(element);
        element.isActive = false;
        break;
    }
  }

  /**
   * Получение активных элементов
   */
  @computed
  get activeElements(): StickyElement[] {
    return Array.from(this.elements.values()).filter(el => el.isActive);
  }

  /**
   * Оптимизированная обработка скролла с предотвращением дрожания
   */
  private handleScroll(): void {
    // Отмечаем начало скролла для управления CSS transitions
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.toggleScrollingState(true);
    }

    // Сброс таймера окончания скролла
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
    }

    this.scrollEndTimeout = window.setTimeout(() => {
      this.isScrolling = false;
      this.toggleScrollingState(false);
    }, this.SCROLL_END_DELAY);

    if (this.scrollTimeout) return;

    this.scrollTimeout = window.setTimeout(() => {
      // Группируем все изменения в один MobX action для лучшей производительности
      runInAction(() => {
        this.elements.forEach((element) => {
          this.updateStickyStateOptimized(element);
        });
      });
      this.scrollTimeout = null;
    }, this.SCROLL_THROTTLE_REDUCED);
  }

  /**
   * Обработка изменения размера окна с очисткой кешей
   */
  private handleResize(): void {
    // Очищаем кеши при изменении размеров
    this.clearCaches();

    this.elements.forEach((element) => {
      element.originalPosition = this.getCachedRect(element.element, element.id);
      this.updateStickyStateOptimized(element);
    });
  }

  /**
   * Регистрация кастомного скролл-контейнера
   */
  @action
  private registerScrollContainer(elementId: string, container: StickyScrollContainer): void {
    const containerElement = container.element;

    if (!this.scrollContainers.has(containerElement)) {
      this.scrollContainers.set(containerElement, new Set());

      // Добавляем обработчик скролла для контейнера
      containerElement.addEventListener('scroll', this.handleContainerScroll, { passive: true });

      // Добавляем наблюдатель за размерами контейнера если нужно
      if (container.observeResize !== false) {
        this.resizeObserver?.observe(containerElement);
      }
    }

    this.scrollContainers.get(containerElement)?.add(elementId);
  }

  /**
   * Отмена регистрации элемента из кастомного контейнера
   */
  @action
  private unregisterScrollContainer(elementId: string): void {
    this.scrollContainers.forEach((elementIds, container) => {
      if (elementIds.has(elementId)) {
        elementIds.delete(elementId);

        // Если в контейнере больше нет элементов, отключаем обработчики
        if (elementIds.size === 0) {
          container.removeEventListener('scroll', this.handleContainerScroll);
          this.resizeObserver?.unobserve(container);
          this.scrollContainers.delete(container);
        }
      }
    });
  }

  /**
   * Обработка скролла кастомного контейнера
   */
  private handleContainerScroll(event: Event): void {
    const container = event.target as HTMLElement;
    const elementIds = this.scrollContainers.get(container);

    if (!elementIds) return;

    elementIds.forEach(elementId => {
      const element = this.elements.get(elementId);
      if (element) {
        this.updateStickyState(element);
      }
    });
  }

  /**
   * Получение следующего z-index с учетом приоритета
   */
  private getNextZIndex(priority: number): number {
    return this.zIndexCounter + priority * 100;
  }

  /**
   * Утилиты для работы с позиционированием
   */
  private getViewportDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private getOppositeDirection(direction: StickyDirection): string {
    const opposites: Record<string, string> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    return opposites[direction] || 'bottom'; // Fallback для новых направлений
  }

  private findElementByNode(node: HTMLElement): StickyElement | undefined {
    return Array.from(this.elements.values()).find(el => el.element === node);
  }

  private isOutsideBoundary(element: StickyElement, boundary: StickyBoundary): boolean {
    // Проверка, находится ли элемент за пределами установленной границы
    const elementRect = element.element.getBoundingClientRect();
    const boundaryRect = boundary.element.getBoundingClientRect();
    const offset = boundary.offset || 0;

    // Элемент считается вне границы, если его верхняя часть
    // превышает нижнюю границу контейнера с учетом offset
    return elementRect.top > (boundaryRect.bottom - offset);
  }

  private resetElementStyles(element: StickyElement): void {
    const style = element.element.style;
    style.position = '';
    style.top = '';
    style.bottom = '';
    style.left = '';
    style.right = '';
    style.zIndex = '';
    style.transition = '';
  }

  private applyInitialStyles(element: StickyElement): void {
    // Применяем начальные стили если нужно
    const style = element.element.style;
    const dataset = element.element.dataset;

    // Сохраняем исходные стили для возможного восстановления
    if (!dataset['originalPosition']) {
      dataset['originalPosition'] = style.position || 'static';
      dataset['originalTop'] = style.top || 'auto';
      dataset['originalLeft'] = style.left || 'auto';
      dataset['originalZIndex'] = style.zIndex || 'auto';
    }

    // Дополнительная инициализация если нужно
    debugLogger.debug(element.id, 'Initial styles applied');
  }

  private updateElementVisibility(element: StickyElement, isVisible: boolean): void {
    // Оптимизация: обновляем только видимые элементы
    if (isVisible) {
      this.updateStickyState(element);
    }
  }

  private updateElementDimensions(element: StickyElement): void {
    element.originalPosition = element.element.getBoundingClientRect();
    this.updateStickyState(element);
  }

  private clearCaches(): void {
    this.rectCache.clear();
    this.stateCache.clear();
  }

  private toggleScrollingState(isScrolling: boolean): void {
    this.elements.forEach(element => {
      const el = element.element;
      if (isScrolling) {
        el.classList.add('sticky-scrolling');
        el.classList.remove('sticky-stable');
      } else {
        el.classList.remove('sticky-scrolling');
        el.classList.add('sticky-stable');
      }
    });
  }

  private updateGroupPriorities(): void {
    // Обновление приоритетов групп
    this.groups.forEach((group) => {
      let maxZ = 0;
      group.elements.forEach((element) => {
        maxZ = Math.max(maxZ, element.currentZIndex);
      });
      group.maxZIndex = maxZ;
    });
  }

  private getGroupZIndex(group: StickyGroup, priority: number): number {
    return group.maxZIndex + priority;
  }

  private notifyStateChange(element: StickyElement, newState: StickyState): void {
    // Здесь можно добавить callback'и для уведомления о смене состояния
    console.debug(`Sticky element ${element.id} changed state to ${newState}`);
  }

  /**
   * Публичный метод для обновления состояния элемента
   */
  @action
  public refreshElement(element: StickyElement): void {
    this.updateStickyState(element);
  }

  /**
   * Публичный метод для обновления всех элементов
   */
  @action
  public refreshAllElements(): void {
    this.elements.forEach((element) => {
      this.updateStickyState(element);
    });
  }

  /**
   * Очистка ресурсов с полной очисткой оптимизаций
   */
  destroy(): void {
    if (!this.isSSR) {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('scroll', this.handleScroll);

      this.intersectionObserver?.disconnect();
      this.resizeObserver?.disconnect();
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Очищаем новые таймауты для оптимизаций
    if (this.scrollEndTimeout) {
      clearTimeout(this.scrollEndTimeout);
    }

    // Очищаем все debounce таймауты
    this.stateDebounceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.stateDebounceTimeouts.clear();

    // Очищаем кеши
    this.clearCaches();

    this.elements.clear();
    this.groups.clear();
  }

  /**
   * Получение размеров кастомного контейнера
   */
  private getContainerDimensions(container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right
    };
  }

  /**
   * Получение позиции элемента относительно кастомного контейнера
   */
  private getRelativeRect(elementRect: DOMRect, container: HTMLElement): DOMRect {
    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    // Вычисляем позицию элемента относительно видимой области контейнера
    return {
      top: elementRect.top - containerRect.top + scrollTop,
      left: elementRect.left - containerRect.left + scrollLeft,
      right: elementRect.right - containerRect.left + scrollLeft,
      bottom: elementRect.bottom - containerRect.top + scrollTop,
      width: elementRect.width,
      height: elementRect.height,
      x: elementRect.x - containerRect.x + scrollLeft,
      y: elementRect.y - containerRect.y + scrollTop,
      toJSON: elementRect.toJSON
    } as DOMRect;
  }

  /**
   * Вычисление позиции элемента внутри кастомного контейнера
   */
  private getContainerPosition(
    _element: StickyElement,
    direction: StickyDirection,
    offset: StickyPosition,
    _containerRect: DOMRect, // Подчеркивание показывает что параметр намеренно не используется
    containerOffset: StickyPosition
  ): Partial<CSSStyleDeclaration> {
    const styles: Partial<CSSStyleDeclaration> = {};

    switch (direction) {
      case 'top':
        // ✅ ИСПРАВЛЕНО: Прилипаем к верхней видимой части контейнера, а не к scrollTop
        styles.top = `${(offset.top || 0) + (containerOffset.top || 0)}px`;
        break;
      case 'bottom':
        // ✅ ИСПРАВЛЕНО: Прилипаем к нижней видимой части контейнера
        styles.bottom = `${(offset.bottom || 0) + (containerOffset.bottom || 0)}px`;
        break;
      case 'left':
        // ✅ ИСПРАВЛЕНО: Прилипаем к левой видимой части контейнера
        styles.left = `${(offset.left || 0) + (containerOffset.left || 0)}px`;
        break;
      case 'right':
        // ✅ ИСПРАВЛЕНО: Прилипаем к правой видимой части контейнера
        styles.right = `${(offset.right || 0) + (containerOffset.right || 0)}px`;
        break;
    }

    return styles;
  }

  /**
   * Кешированное получение DOMRect для оптимизации производительности
   */
  private getCachedRect(element: HTMLElement, elementId: string): DOMRect {
    const cached = this.rectCache.get(elementId);
    const now = performance.now();

    if (cached && (now - cached.timestamp) < this.RECT_CACHE_TTL) {
      return cached.rect;
    }

    const rect = element.getBoundingClientRect();
    this.rectCache.set(elementId, { rect, timestamp: now });

    return rect;
  }
}
