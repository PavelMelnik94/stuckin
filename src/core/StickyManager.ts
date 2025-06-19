import { makeObservable, observable, action, computed } from 'mobx';

import type { StickyElement, StickyConfig, StickyGroup, StickyState, StickyDirection } from '../types/sticky.types';

/**
 * Основной менеджер для управления sticky элементами
 * Использует MobX для реактивности и Intersection Observer для оптимизации
 */
export class StickyManager {
  @observable elements = new Map<string, StickyElement>();
  @observable groups = new Map<string, StickyGroup>();
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
      console.warn(`Sticky element with id "${config.id}" already exists`);
      return;
    }

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

    // Подключаем наблюдатели
    this.intersectionObserver?.observe(htmlElement);
    this.resizeObserver?.observe(htmlElement);

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
    if (!element) return;

    // Отключаем наблюдатели
    this.intersectionObserver?.unobserve(element.element);
    this.resizeObserver?.unobserve(element.element);

    // Сбрасываем стили
    this.resetElementStyles(element);

    // Удаляем из групп
    this.groups.forEach((group) => {
      group.elements.delete(id);
    });

    this.elements.delete(id);
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
    // TODO: Use these values in sticky calculation
    // const { direction, offset, boundary } = element.config;

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
    const { direction, offset, boundary } = element.config;
    const viewport = this.getViewportDimensions();

    // Проверяем границы если заданы
    if (boundary && this.isOutsideBoundary(element, boundary)) {
      return 'bottom-reached';
    }

    switch (direction) {
      case 'top':
        return rect.top <= (offset.top || 0) ? 'sticky' : 'normal';

      case 'bottom':
        return rect.bottom >= viewport.height - (offset.bottom || 0) ? 'sticky' : 'normal';

      case 'left':
        return rect.left <= (offset.left || 0) ? 'sticky' : 'normal';

      case 'right':
        return rect.right >= viewport.width - (offset.right || 0) ? 'sticky' : 'normal';

      default:
        return 'normal';
    }
  }

  /**
   * Применение стилей в зависимости от состояния
   */
  private applyStateStyles(element: StickyElement, state: StickyState): void {
    const { direction, offset, smooth } = element.config;
    const style = element.element.style;

    // Базовые стили
    const baseStyles = {
      transition: smooth ? 'all 0.2s ease-out' : 'none',
      zIndex: element.currentZIndex.toString()
    };

    switch (state) {
      case 'sticky':
        Object.assign(style, baseStyles, {
          position: 'fixed',
          [direction]: `${offset[direction] || 0}px`
        });
        element.isActive = true;
        break;

      case 'bottom-reached':
        Object.assign(style, baseStyles, {
          position: 'absolute',
          [this.getOppositeDirection(direction)]: '0px'
        });
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
    const opposites = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    return opposites[direction];
  }

  private findElementByNode(node: HTMLElement): StickyElement | undefined {
    return Array.from(this.elements.values()).find(el => el.element === node);
  }

  private isOutsideBoundary(_element: StickyElement, _boundary: any): boolean {
    // Логика проверки границ
    // Реализация зависит от типа boundary
    return false;
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

  private applyInitialStyles(_element: StickyElement): void {
    // Применяем начальные стили если нужно
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
}
