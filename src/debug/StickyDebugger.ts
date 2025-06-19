/**
 * Система отладки для sticky библиотеки
 * Принципы:
 * - SRP: отвечает только за debugging функциональность
 * - Information Expert: управляет собственными данными
 * - Encapsulation: контролируемый доступ через геттеры
 * - Type Safety: строгая типизация для надежности
 */

import { makeObservable, observable, action, computed } from 'mobx';

import { performanceMonitor } from '../utils/performance';
import { ENV, envLog } from '../utils/env';

// === СТРОГО ТИПИЗИРОВАННЫЕ ИНТЕРФЕЙСЫ ===

/**
 * Уровни логирования (строго типизированы)
 * Принцип: явное определение допустимых значений
 */
export type DebugLogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Типы событий отладки (расширенные и согласованные)
 * Принцип Open/Closed: легко добавлять новые типы
 */
export type DebugEventType =
  | 'error'
  | 'warning'
  | 'info'          // ← Добавляем недостающий тип
  | 'debug'         // ← Добавляем недостающий тип
  | 'state-change'
  | 'config-update'
  | 'registration'
  | 'unregistration';

/**
 * Интерфейс события отладки
 * Исправлено: stack может быть undefined с учетом exactOptionalPropertyTypes
 */
export interface DebugEvent {
  id: string;
  timestamp: number;
  type: DebugEventType;
  elementId: string;
  data: any;
  stack?: string | undefined; // ← Явно указываем undefined
}

/**
 * Конфигурация отладки
 * Обновлено: используем DebugLogLevel
 */
export interface DebugConfig {
  enabled: boolean;
  logLevel: DebugLogLevel; // ← Используем строго типизированный уровень
  maxHistorySize: number;
  visualDebug: boolean;
  performanceTracking: boolean;
  autoCapture: boolean;
}

/**
 * Снимок состояния отладки
 */
export interface DebugSnapshot {
  timestamp: number;
  elements: Record<string, any>;
  groups: Record<string, any>;
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
  };
  performance: any[];
}

/**
 * Типизированный анализ производительности
 * Принцип: явная типизация для безопасности
 */
export interface PerformanceAnalysis {
  summary: {
    totalElements: number;
    avgRenderTime: number;
    maxRenderTime: number;
    totalRecomputations: number;
    slowElementsCount: number;
    activeElementsCount: number;
  } | null;
  slowElements?: Array<{
    id: string;
    renderTime: number;
    recomputations: number;
  }>;
  recommendations?: string[];
}

/**
 * Визуальный элемент отладки
 * Принцип: явная типизация для visual debug элементов
 */
interface VisualDebugElement {
  element: HTMLElement;
  overlay?: HTMLElement;
  lastUpdate: number;
  isActive: boolean;
}

class StickyDebugger {
  @observable private config: DebugConfig = {
    enabled: false,
    logLevel: 'info',
    maxHistorySize: 1000,
    visualDebug: false,
    performanceTracking: true,
    autoCapture: false
  };

  @observable private events: DebugEvent[] = [];
  @observable private snapshots: DebugSnapshot[] = [];

  // ← Исправлено: теперь используется для визуальной отладки
  @observable private visualElements = new Map<string, VisualDebugElement>();

  private eventCounter = 0;
  private visualOverlay: HTMLElement | null = null;

  /**
   * Карта приоритетов уровней логирования
   * Исправлено: полное соответствие типам
   */
  private readonly LOG_LEVEL_PRIORITY: Record<DebugLogLevel, number> = {
    'error': 4,
    'warn': 3,    // ← Исправлено: warn вместо warning
    'info': 2,
    'debug': 1
  } as const;

  constructor() {
    makeObservable(this);

    // Включаем отладку только в development
    if (ENV.isDevelopment) {
      this.enable();
      this.setupGlobalAPI();
    }
  }

  // === ПУБЛИЧНЫЕ ГЕТТЕРЫ ===
  // Принцип Encapsulation: контролируемый доступ к приватным данным

  /**
   * Получение конфигурации отладки (readonly)
   */
  @computed
  get debugConfig(): Readonly<DebugConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Получение всех событий (readonly)
   */
  @computed
  get allEvents(): readonly DebugEvent[] {
    return Object.freeze([...this.events]);
  }

  /**
   * Получение всех снимков (readonly)
   */
  @computed
  get allSnapshots(): readonly DebugSnapshot[] {
    return Object.freeze([...this.snapshots]);
  }

  /**
   * Получение отфильтрованных событий по уровню логирования
   * Исправлено: безопасное обращение к приоритетам
   */
  @computed
  get filteredEvents(): readonly DebugEvent[] {
    const filtered = this.events.filter(event => {
      const configPriority = this.LOG_LEVEL_PRIORITY[this.config.logLevel];

      // Маппинг event types на log levels для фильтрации
      const eventToLogLevel: Record<DebugEventType, DebugLogLevel> = {
        'error': 'error',
        'warning': 'warn',
        'info': 'info',
        'debug': 'debug',
        'state-change': 'info',
        'config-update': 'info',
        'registration': 'debug',
        'unregistration': 'debug'
      };

      const eventLogLevel = eventToLogLevel[event.type];
      const eventPriority = this.LOG_LEVEL_PRIORITY[eventLogLevel];

      return eventPriority >= configPriority;
    });

    return Object.freeze(filtered);
  }

  /**
   * Анализ производительности (computed для кеширования)
   * Исправлено: строгая типизация возвращаемого объекта
   */
  @computed
  get performanceAnalysis(): PerformanceAnalysis {
    const metrics = performanceMonitor.getAllMetrics();

    if (metrics.length === 0) {
      return {
        summary: null,
        slowElements: [],
        recommendations: ['Нет данных о производительности']
      };
    }

    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const maxRenderTime = Math.max(...metrics.map(m => m.renderTime));
    const totalRecomputations = metrics.reduce((sum, m) => sum + m.recomputations, 0);

    const slowElements = metrics.filter(m => m.renderTime > 16); // > 60fps
    const activeElements = metrics.filter(m => m.recomputations > 0);

    return {
      summary: {
        totalElements: metrics.length,
        avgRenderTime: Math.round(avgRenderTime * 100) / 100,
        maxRenderTime: Math.round(maxRenderTime * 100) / 100,
        totalRecomputations,
        slowElementsCount: slowElements.length,
        activeElementsCount: activeElements.length
      },
      slowElements: slowElements.map(m => ({
        id: m.elementId,
        renderTime: m.renderTime,
        recomputations: m.recomputations
      })),
      recommendations: this.generatePerformanceRecommendations(metrics)
    };
  }

  /**
   * Проверка включенности отладки
   */
  @computed
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Получение статистики визуальных элементов
   * Принцип Information Expert: класс знает о своих визуальных элементах
   */
  @computed
  get visualElementsStats() {
    return {
      total: this.visualElements.size,
      active: Array.from(this.visualElements.values()).filter(el => el.isActive).length
    };
  }

  // === ПУБЛИЧНЫЕ МЕТОДЫ ===

  /**
   * Включение системы отладки
   */
  @action
  enable(config: Partial<DebugConfig> = {}): void {
    this.config = { ...this.config, enabled: true, ...config };

    if (this.config.visualDebug) {
      this.createVisualOverlay();
    }

    if (this.config.performanceTracking) {
      performanceMonitor.enable();
    }

    // ← Исправлено: используем правильный тип события
    this.log('info', 'debug-system', 'Система отладки включена', this.config);
  }

  /**
   * Отключение системы отладки
   */
  @action
  disable(): void {
    this.config.enabled = false;
    this.removeVisualOverlay();
    this.clearVisualElements();
    performanceMonitor.disable();
    this.events.length = 0;
    this.snapshots.length = 0;

    envLog.dev('🔧 Система отладки sticky библиотеки отключена');
  }

  /**
   * Логирование событий
   * Исправлено: правильная типизация и handling stack
   */
  @action
  log(
    level: DebugEventType, // ← Используем DebugEventType вместо строки
    elementId: string,
    message: string,
    data?: any
  ): void {
    if (!this.config.enabled) return;

    // Исправлено: правильное создание stack с учетом exactOptionalPropertyTypes
    const stack = this.config.logLevel === 'debug' ? new Error().stack : undefined;

    const event: DebugEvent = {
      id: `debug-${++this.eventCounter}`,
      timestamp: Date.now(),
      type: level,
      elementId,
      data: { message, ...data },
      ...(stack && { stack }) // ← Условное добавление stack только если он есть
    };

    this.events.push(event);

    // Ограничиваем размер истории
    if (this.events.length > this.config.maxHistorySize) {
      this.events.shift();
    }

    // Выводим в консоль
    this.logToConsole(event);

    // Обновляем визуальную отладку
    if (this.config.visualDebug) {
      this.updateVisualDebug(elementId, event);
    }
  }

  /**
   * Создание снимка текущего состояния
   */
  @action
  captureSnapshot(label?: string): DebugSnapshot {
    const snapshot: DebugSnapshot = {
      timestamp: Date.now(),
      elements: this.serializeElements(),
      groups: this.serializeGroups(),
      viewport: this.getViewportInfo(),
      performance: performanceMonitor.getAllMetrics()
    };

    this.snapshots.push(snapshot);

    // Ограничиваем количество снимков
    if (this.snapshots.length > 50) {
      this.snapshots.shift();
    }

    envLog.dev(`📸 Снимок состояния${label ? ` "${label}"` : ''} создан`, snapshot);
    return snapshot;
  }

  /**
   * Регистрация визуального элемента для отладки
   * Принцип: теперь visualElements используется
   */
  @action
  registerVisualElement(elementId: string, element: HTMLElement): void {
    if (!this.config.visualDebug) return;

    this.visualElements.set(elementId, {
      element,
      lastUpdate: Date.now(),
      isActive: true
    });

    this.log('registration', elementId, 'Визуальный элемент зарегистрирован');
  }

  /**
   * Удаление визуального элемента
   */
  @action
  unregisterVisualElement(elementId: string): void {
    const visualEl = this.visualElements.get(elementId);
    if (visualEl) {
      // Очищаем overlay если есть
      if (visualEl.overlay) {
        visualEl.overlay.remove();
      }

      this.visualElements.delete(elementId);
      this.log('unregistration', elementId, 'Визуальный элемент удален');
    }
  }

  /**
   * Обновление конфигурации отладки
   */
  @action
  updateConfig(newConfig: Partial<DebugConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Обновляем визуальную отладку при изменении настроек
    if (oldConfig.visualDebug !== this.config.visualDebug) {
      if (this.config.visualDebug) {
        this.createVisualOverlay();
      } else {
        this.removeVisualOverlay();
        this.clearVisualElements();
      }
    }

    this.log('config-update', 'debug-system', 'Конфигурация обновлена', {
      oldConfig,
      newConfig: this.config
    });
  }

  /**
   * Очистка истории отладки
   */
  @action
  clearHistory(): void {
    this.events.length = 0;
    this.snapshots.length = 0;
    envLog.dev('🧹 История отладки очищена');
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===

  /**
   * Генерация рекомендаций по производительности
   */
  private generatePerformanceRecommendations(metrics: any[]): string[] {
    const recommendations: string[] = [];

    const slowElements = metrics.filter(m => m.renderTime > 16);
    if (slowElements.length > 0) {
      recommendations.push(
        `Оптимизируйте рендер медленных элементов: ${slowElements.map(m => m.elementId).join(', ')}`
      );
    }

    const activeElements = metrics.filter(m => m.recomputations > 30);
    if (activeElements.length > 0) {
      recommendations.push(
        `Уменьшите количество пересчетов для: ${activeElements.map(m => m.elementId).join(', ')}`
      );
    }

    if (metrics.length > 20) {
      recommendations.push('Рассмотрите виртуализацию при большом количестве sticky элементов');
    }

    return recommendations;
  }

  /**
   * Создание визуального overlay для отладки
   */
  private createVisualOverlay(): void {
    if (this.visualOverlay || !ENV.isBrowser) return;

    this.visualOverlay = document.createElement('div');
    this.visualOverlay.setAttribute('data-sticky-debug', 'overlay');
    this.visualOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      padding: 10px;
      border-radius: 6px;
      z-index: 999999;
      overflow-y: auto;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    document.body.appendChild(this.visualOverlay);
    this.updateVisualOverlay();
  }

  /**
   * Обновление визуального overlay
   * Исправлено: безопасная работа с performance.summary
   */
  private updateVisualOverlay(): void {
    if (!this.visualOverlay) return;

    const recentEvents = this.events.slice(-10);
    const performance = this.performanceAnalysis;

    // ← Исправлено: безопасное обращение к summary
    const summary = performance.summary;
    const hasSummary = summary !== null;

    this.visualOverlay.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #4CAF50;">
        🔧 Sticky Debug Panel
      </div>

      <div style="margin-bottom: 6px;">
        <strong>📊 Performance:</strong><br>
        Elements: ${hasSummary ? summary.totalElements : 0}<br>
        Avg Render: ${hasSummary ? summary.avgRenderTime : 0}ms<br>
        Slow: ${hasSummary ? summary.slowElementsCount : 0}<br>
        Visual Elements: ${this.visualElementsStats.total} (${this.visualElementsStats.active} active)
      </div>

      <div style="margin-bottom: 6px;">
        <strong>📝 Recent Events:</strong>
      </div>

      ${recentEvents.map(event => `
        <div style="margin-bottom: 2px; padding: 2px; background: rgba(255,255,255,0.1); border-radius: 2px;">
          <span style="color: ${this.getEventColor(event.type)}">${this.getEventIcon(event.type)}</span>
          <span style="color: #999">${new Date(event.timestamp).toLocaleTimeString()}</span><br>
          <span style="font-size: 10px;">${event.elementId}: ${event.data.message}</span>
        </div>
      `).join('')}
    `;
  }

  /**
   * Удаление визуального overlay
   */
  private removeVisualOverlay(): void {
    if (this.visualOverlay) {
      document.body.removeChild(this.visualOverlay);
      this.visualOverlay = null;
    }
  }

  /**
   * Очистка всех визуальных элементов
   */
  private clearVisualElements(): void {
    this.visualElements.forEach((visualEl, _elementId) => {
      if (visualEl.overlay) {
        visualEl.overlay.remove();
      }
    });
    this.visualElements.clear();
  }

  /**
   * Обновление визуальной отладки для элемента
   */
  private updateVisualDebug(elementId: string, event: DebugEvent): void {
    this.updateVisualOverlay();

    // Работаем с зарегистрированными визуальными элементами
    const visualEl = this.visualElements.get(elementId);
    if (visualEl) {
      visualEl.lastUpdate = Date.now();

      if (event.type === 'error') {
        visualEl.element.style.outline = '2px solid red';
        setTimeout(() => {
          visualEl.element.style.outline = '';
        }, 2000);
      }
    }

    // Fallback: поиск по data-sticky-id
    const elements = document.querySelectorAll(`[data-sticky-id="${elementId}"]`);
    elements.forEach(el => {
      if (event.type === 'error') {
        (el as HTMLElement).style.outline = '2px solid red';
        setTimeout(() => {
          (el as HTMLElement).style.outline = '';
        }, 2000);
      }
    });
  }

  /**
   * Вывод в консоль с красивым форматированием
   */
  private logToConsole(event: DebugEvent): void {
    const icon = this.getEventIcon(event.type);
    const color = this.getEventColor(event.type);
    const time = new Date(event.timestamp).toLocaleTimeString();

    const message = `%c${icon} [${time}] ${event.elementId}: ${event.data.message}`;

    switch (event.type) {
      case 'error':
        console.error(message, `color: ${color}; font-weight: bold`, event.data);
        break;
      case 'warning':
        console.warn(message, `color: ${color}; font-weight: bold`, event.data);
        break;
      default:
        console.log(message, `color: ${color}`, event.data);
    }
  }

  /**
   * Настройка глобального API для отладки
   */
  private setupGlobalAPI(): void {
    (window as any).__STICKY_DEBUG__ = {
      // Методы управления
      enable: (config?: Partial<DebugConfig>) => this.enable(config),
      disable: () => this.disable(),

      // Получение данных через геттеры
      getEvents: () => this.allEvents,
      getSnapshots: () => this.allSnapshots,
      getPerformance: () => this.performanceAnalysis,
      getConfig: () => this.debugConfig,

      // Действия
      captureSnapshot: (label?: string) => this.captureSnapshot(label),
      clearHistory: () => this.clearHistory(),
      updateConfig: (config: Partial<DebugConfig>) => this.updateConfig(config),

      // Визуальная отладка
      registerVisualElement: (id: string, el: HTMLElement) => this.registerVisualElement(id, el),
      unregisterVisualElement: (id: string) => this.unregisterVisualElement(id),
      getVisualStats: () => this.visualElementsStats,

      // Утилиты
      log: (level: DebugEventType, elementId: string, message: string, data?: any) =>
        this.log(level, elementId, message, data)
    };

    envLog.dev(
      '%c🔧 Sticky Debug API доступен через window.__STICKY_DEBUG__',
      'color: #4CAF50; font-weight: bold; font-size: 14px'
    );
  }

  /**
   * Сериализация элементов для снимков
   */
  private serializeElements(): Record<string, any> {
    const serialized: Record<string, any> = {};

    // Сериализуем зарегистрированные визуальные элементы
    this.visualElements.forEach((visualEl, elementId) => {
      const rect = visualEl.element.getBoundingClientRect();
      serialized[elementId] = {
        isActive: visualEl.isActive,
        lastUpdate: visualEl.lastUpdate,
        bounds: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        styles: {
          position: visualEl.element.style.position,
          zIndex: visualEl.element.style.zIndex
        }
      };
    });

    return serialized;
  }

  /**
   * Сериализация групп для снимков
   */
  private serializeGroups(): Record<string, any> {
    // TODO: Интеграция с StickyManager для получения групп
    return {};
  }

  /**
   * Получение информации о viewport
   */
  private getViewportInfo() {
    if (!ENV.isBrowser) {
      return { width: 0, height: 0, scrollX: 0, scrollY: 0 };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  }

  /**
   * Получение иконки для типа события
   */
  private getEventIcon(type: DebugEventType): string {
    const icons: Record<DebugEventType, string> = {
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'debug': '🔍',
      'state-change': '🔄',
      'config-update': '⚙️',
      'registration': '📝',
      'unregistration': '🗑️'
    };

    return icons[type] || '📌';
  }

  /**
   * Получение цвета для типа события
   */
  private getEventColor(type: DebugEventType): string {
    const colors: Record<DebugEventType, string> = {
      'error': '#f44336',
      'warning': '#ff9800',
      'info': '#2196f3',
      'debug': '#9e9e9e',
      'state-change': '#4caf50',
      'config-update': '#673ab7',
      'registration': '#009688',
      'unregistration': '#795548'
    };

    return colors[type] || '#000000';
  }
}

// Глобальный экземпляр отладчика
export const stickyDebugger = new StickyDebugger();
