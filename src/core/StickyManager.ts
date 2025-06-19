import { makeObservable, observable, action, computed } from 'mobx';

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
   * Обработка скролла с throttling
   */
  private handleScroll(): void {
    if (this.scrollTimeout) return;

    this.scrollTimeout = window.setTimeout(() => {
      this.elements.forEach((element) => {
        this.updateStickyState(element);
      });
      this.scrollTimeout = null;
    }, 16); // ~60fps
  }

  /**
   * Обработка изменения размера окна
   */
  private handleResize(): void {
    this.elements.forEach((element) => {
      element.originalPosition = element.element.getBoundingClientRect();
      this.updateStickyState(element);
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
   * Очистка ресурсов
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
    element: StickyElement,
    direction: StickyDirection,
    offset: StickyPosition,
    _containerRect: DOMRect, // Подчеркивание показывает что параметр намеренно не используется
    containerOffset: StickyPosition
  ): Partial<CSSStyleDeclaration> {
    const container = element.config.scrollContainer!.element;
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    const styles: Partial<CSSStyleDeclaration> = {};

    switch (direction) {
      case 'top':
        styles.top = `${scrollTop + (offset.top || 0) + (containerOffset.top || 0)}px`;
        break;
      case 'bottom':
        styles.bottom = `${(offset.bottom || 0) + (containerOffset.bottom || 0)}px`;
        break;
      case 'left':
        styles.left = `${scrollLeft + (offset.left || 0) + (containerOffset.left || 0)}px`;
        break;
      case 'right':
        styles.right = `${(offset.right || 0) + (containerOffset.right || 0)}px`;
        break;
    }

    return styles;
  }
}
