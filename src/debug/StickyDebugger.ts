/**
 * Система отладки для sticky библиотеки
 * Принцип SRP: отвечает только за debugging функциональность
 */

import { makeObservable, observable, action, computed } from 'mobx';
import { StickyElement, StickyGroup, StickyState } from '../types/sticky.types';
import { performanceMonitor } from '../utils/performance';

export interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'state-change' | 'config-update' | 'registration' | 'unregistration' | 'error' | 'warning';
  elementId: string;
  data: any;
  stack?: string;
}

export interface DebugConfig {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxHistorySize: number;
  visualDebug: boolean;
  performanceTracking: boolean;
  autoCapture: boolean;
}

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
  @observable private visualElements = new Map<string, HTMLElement>();

  private eventCounter = 0;
  private visualOverlay: HTMLElement | null = null;

  constructor() {
    makeObservable(this);

    // Включаем отладку только в development
    if (process.env.NODE_ENV === 'development') {
      this.enable();
      this.setupGlobalAPI();
    }
  }

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

    this.log('info', 'debug-system', 'Система отладки включена', this.config);
  }

  /**
   * Отключение системы отладки
   */
  @action
  disable(): void {
    this.config.enabled = false;
    this.removeVisualOverlay();
    performanceMonitor.disable();
    this.events.length = 0;
    this.snapshots.length = 0;

    console.log('🔧 Система отладки sticky библиотеки отключена');
  }

  /**
   * Логирование событий
   */
  @action
  log(
    level: DebugEvent['type'],
    elementId: string,
    message: string,
    data?: any
  ): void {
    if (!this.config.enabled) return;

    const event: DebugEvent = {
      id: `debug-${++this.eventCounter}`,
      timestamp: Date.now(),
      type: level,
      elementId,
      data: { message, ...data },
      stack: this.config.logLevel === 'debug' ? new Error().stack : undefined
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

    console.log(`📸 Снимок состояния${label ? ` "${label}"` : ''} создан`, snapshot);
    return snapshot;
  }

  /**
   * Сравнение двух снимков
   */
  compareSnapshots(snapshot1: DebugSnapshot, snapshot2: DebugSnapshot): any {
    const changes = {
      timestamp: {
        from: snapshot1.timestamp,
        to: snapshot2.timestamp,
        diff: snapshot2.timestamp - snapshot1.timestamp
      },
      elements: this.compareObjects(snapshot1.elements, snapshot2.elements),
      groups: this.compareObjects(snapshot1.groups, snapshot2.groups),
      viewport: this.compareObjects(snapshot1.viewport, snapshot2.viewport)
    };

    console.log('📊 Сравнение снимков:', changes);
    return changes;
  }

  /**
   * Анализ производительности
   */
  @computed
  get performanceAnalysis() {
    const metrics = performanceMonitor.getAllMetrics();

    if (metrics.length === 0) {
      return { summary: 'Нет данных о производительности' };
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
   * Получение отфильтрованных событий
   */
  @computed
  get filteredEvents() {
    return this.events.filter(event => {
      const levelPriority = {
        'error': 4,
        'warning': 3,
        'info': 2,
        'debug': 1
      };

      const configPriority = levelPriority[this.config.logLevel];
      const eventPriority = levelPriority[event.type as keyof typeof levelPriority] || 1;

      return eventPriority >= configPriority;
    });
  }

  /**
   * Поиск проблем в конфигурации
   */
  validateConfiguration(elements: Map<string, StickyElement>): string[] {
    const issues: string[] = [];

    elements.forEach((element, id) => {
      // Проверка конфликтов z-index
      const conflictingElements = Array.from(elements.values()).filter(
        el => el.id !== id &&
        el.currentZIndex === element.currentZIndex &&
        el.isActive &&
        element.isActive
      );

      if (conflictingElements.length > 0) {
        issues.push(
          `❗ Конфликт z-index у элементов: ${id}, ${conflictingElements.map(el => el.id).join(', ')}`
        );
      }

      // Проверка производительности
      const metrics = performanceMonitor.getMetrics(id);
      if (metrics && metrics.renderTime > 32) { // < 30fps
        issues.push(`🐌 Медленный рендер элемента "${id}": ${metrics.renderTime.toFixed(2)}мс`);
      }

      // Проверка корректности конфигурации
      if (!element.config.direction) {
        issues.push(`⚠️ Не указано направление для элемента "${id}"`);
      }

      if (element.config.offset && Object.keys(element.config.offset).length === 0) {
        issues.push(`⚠️ Пустой объект offset для элемента "${id}"`);
      }
    });

    return issues;
  }

  /**
   * Создание визуального overlay для отладки
   */
  private createVisualOverlay(): void {
    if (this.visualOverlay) return;

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
   */
  private updateVisualOverlay(): void {
    if (!this.visualOverlay) return;

    const recentEvents = this.events.slice(-10);
    const performance = this.performanceAnalysis;

    this.visualOverlay.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #4CAF50;">
        🔧 Sticky Debug Panel
      </div>

      <div style="margin-bottom: 6px;">
        <strong>📊 Performance:</strong><br>
        Elements: ${performance.summary?.totalElements || 0}<br>
        Avg Render: ${performance.summary?.avgRenderTime || 0}ms<br>
        Slow: ${performance.summary?.slowElementsCount || 0}
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
   * Обновление визуальной отладки для элемента
   */
  private updateVisualDebug(elementId: string, event: DebugEvent): void {
    this.updateVisualOverlay();

    // Добавляем визуальные индикаторы к элементам
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

      // Получение данных
      getEvents: () => this.events,
      getSnapshots: () => this.snapshots,
      getPerformance: () => this.performanceAnalysis,

      // Действия
      captureSnapshot: (label?: string) => this.captureSnapshot(label),
      clearHistory: () => this.clearHistory(),
      exportData: () => this.exportDebugData(),

      // Конфигурация
      setLogLevel: (level: DebugConfig['logLevel']) => {
        this.config.logLevel = level;
      },

      toggleVisual: () => {
        this.config.visualDebug = !this.config.visualDebug;
        if (this.config.visualDebug) {
          this.createVisualOverlay();
        } else {
          this.removeVisualOverlay();
        }
      }
    };

    console.log(
      '%c🔧 Sticky Debug API доступен через window.__STICKY_DEBUG__',
      'color: #4CAF50; font-weight: bold; font-size: 14px'
    );
  }

  /**
   * Сериализация элементов для снимков
   */
  private serializeElements(): Record<string, any> {
    // Эта функция будет получать элементы от StickyManager
    // Пока возвращаем пустой объект
    return {};
  }

  /**
   * Сериализация групп для снимков
   */
  private serializeGroups(): Record<string, any> {
    // Аналогично для групп
    return {};
  }

  /**
   * Получение информации о viewport
   */
  private getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  }

  /**
   * Сравнение объектов для снимков
   */
  private compareObjects(obj1: any, obj2: any): any {
    const changes: any = {};

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
      if (obj1[key] !== obj2[key]) {
        changes[key] = {
          from: obj1[key],
          to: obj2[key]
        };
      }
    });

    return changes;
  }

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
   * Получение иконки для типа события
   */
  private getEventIcon(type: DebugEvent['type']): string {
    const icons = {
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
  private getEventColor(type: DebugEvent['type']): string {
    const colors = {
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

  /**
   * Очистка истории отладки
   */
  @action
  private clearHistory(): void {
    this.events.length = 0;
    this.snapshots.length = 0;
    console.log('🧹 История отладки очищена');
  }

  /**
   * Экспорт данных отладки
   */
  private exportDebugData(): string {
    const data = {
      config: this.config,
      events: this.events,
      snapshots: this.snapshots,
      performance: this.performanceAnalysis,
      timestamp: Date.now()
    };

    const json = JSON.stringify(data, null, 2);

    // Создаем blob для скачивания
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `sticky-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📤 Данные отладки экспортированы');
    return json;
  }
}

// Глобальный экземпляр отладчика
export const stickyDebugger = new StickyDebugger();
