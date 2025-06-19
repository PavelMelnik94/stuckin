/**
 * Утилиты для мониторинга производительности sticky элементов
 * Принцип SRP: отвечает только за сбор и анализ метрик производительности
 */

import { debugLogger } from '@/debug/debugLogger';

export interface PerformanceMetrics {
  elementId: string;
  renderTime: number;
  scrollResponsiveness: number;
  memoryUsage: number;
  recomputations: number;
  lastUpdate: number;
}

export interface PerformanceThresholds {
  maxRenderTime: number; // мс
  maxScrollDelay: number; // мс
  maxMemoryUsage: number; // MB
  maxRecomputations: number; // за секунду
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private observers = new Set<(metrics: PerformanceMetrics) => void>();
  private thresholds: PerformanceThresholds;
  private isEnabled = false;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      maxRenderTime: 16, // 60fps
      maxScrollDelay: 8, // плавный скролл
      maxMemoryUsage: 10, // 10MB
      maxRecomputations: 60, // не более 60 пересчетов в секунду
      ...thresholds
    };
  }

  /**
   * Включение мониторинга (только в development)
   */
  enable(): void {
    if (process?.env['NODE_ENV'] === 'development') {
      this.isEnabled = true;
      debugLogger.info('performance-monitor', 'Performance monitoring enabled');
      this.startMemoryMonitoring();
    }
  }

  /**
   * Отключение мониторинга
   */
  disable(): void {
    debugLogger.info('performance-monitor', 'Performance monitoring disabled');
    this.isEnabled = false;
    this.metrics.clear();
    this.observers.clear();
  }

  /**
   * Измерение времени рендера элемента
   */
  measureRenderTime<T>(elementId: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const renderTime = performance.now() - start;

    this.updateMetric(elementId, { renderTime });

    // Предупреждение если рендер слишком медленный
    if (renderTime > this.thresholds.maxRenderTime) {
      debugLogger.warning(elementId, `Slow render detected: ${renderTime.toFixed(2)}ms`, {
        renderTime,
        threshold: this.thresholds.maxRenderTime
      });
      console.warn(
        `🐌 Медленный рендер sticky элемента "${elementId}": ${renderTime.toFixed(2)}мс`,
        '\nРекомендации:',
        '\n- Используйте React.memo для предотвращения лишних рендеров',
        '\n- Оптимизируйте вычисления в useMemo/useCallback',
        '\n- Проверьте зависимости в useEffect'
      );
    }

    return result;
  }

  /**
   * Измерение отзывчивости при скролле
   */
  measureScrollResponsiveness(elementId: string, scrollHandler: () => void): () => void {
    if (!this.isEnabled) return scrollHandler;

    return () => {
      const start = performance.now();
      scrollHandler();
      const scrollResponsiveness = performance.now() - start;

      this.updateMetric(elementId, { scrollResponsiveness });

      if (scrollResponsiveness > this.thresholds.maxScrollDelay) {
        debugLogger.warning(elementId, `Slow scroll handling detected: ${scrollResponsiveness.toFixed(2)}ms`, {
          scrollResponsiveness,
          threshold: this.thresholds.maxScrollDelay
        });
        console.warn(
          `🐌 Медленная обработка скролла для "${elementId}": ${scrollResponsiveness.toFixed(2)}мс`,
          '\nРекомендации:',
          '\n- Используйте throttle/debounce для обработчиков скролла',
          '\n- Минимизируйте DOM операции в обработчиках',
          '\n- Рассмотрите использование requestAnimationFrame'
        );
      }
    };
  }

  /**
   * Подсчет количества пересчетов состояния
   */
  trackRecomputation(elementId: string): void {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(elementId);
    const now = Date.now();

    if (metric) {
      // Сбрасываем счетчик каждую секунду
      if (now - metric.lastUpdate > 1000) {
        metric.recomputations = 1;
      } else {
        metric.recomputations++;
      }

      metric.lastUpdate = now;

      if (metric.recomputations > this.thresholds.maxRecomputations) {
        console.warn(
          `🔄 Слишком много пересчетов для "${elementId}": ${metric.recomputations}/сек`,
          '\nРекомендации:',
          '\n- Проверьте зависимости в useMemo/useCallback',
          '\n- Используйте React.memo для предотвращения лишних рендеров',
          '\n- Оптимизируйте логику вычислений sticky состояния'
        );
      }
    }
  }

  /**
   * Мониторинг использования памяти
   */
  private startMemoryMonitoring(): void {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    if (!memory) return;

    setInterval(() => {
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // в MB

      if (memoryUsage > this.thresholds.maxMemoryUsage) {
        console.warn(
          `🧠 Высокое использование памяти: ${memoryUsage.toFixed(2)}MB`,
          '\nРекомендации:',
          '\n- Проверьте на утечки памяти в sticky элементах',
          '\n- Убедитесь что элементы корректно отключаются при размонтировании',
          '\n- Рассмотрите виртуализацию для большого количества элементов'
        );
      }
    }, 5000); // каждые 5 секунд
  }

  /**
   * Обновление метрик элемента
   */
  private updateMetric(elementId: string, update: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(elementId) || {
      elementId,
      renderTime: 0,
      scrollResponsiveness: 0,
      memoryUsage: 0,
      recomputations: 0,
      lastUpdate: Date.now()
    };

    const updated = { ...existing, ...update, lastUpdate: Date.now() };
    this.metrics.set(elementId, updated);

    // Уведомляем наблюдателей
    this.observers.forEach(observer => observer(updated));
  }

  /**
   * Получение метрик по элементу
   */
  getMetrics(elementId: string): PerformanceMetrics | null {
    return this.metrics.get(elementId) || null;
  }

  /**
   * Получение всех метрик
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Подписка на изменения метрик
   */
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  /**
   * Генерация отчета о производительности
   */
  generateReport(): string {
    const metrics = this.getAllMetrics();

    if (metrics.length === 0) {
      return 'Нет данных для отчета о производительности';
    }

    const avgRenderTime = metrics.reduce((sum, m) => sum + m.renderTime, 0) / metrics.length;
    const avgScrollTime = metrics.reduce((sum, m) => sum + m.scrollResponsiveness, 0) / metrics.length;
    const totalRecomputations = metrics.reduce((sum, m) => sum + m.recomputations, 0);

    return `
📊 Отчет о производительности Sticky библиотеки
================================================
Общая статистика:
- Элементов отслеживается: ${metrics.length}
- Среднее время рендера: ${avgRenderTime.toFixed(2)}мс
- Среднее время обработки скролла: ${avgScrollTime.toFixed(2)}мс
- Общее количество пересчетов: ${totalRecomputations}

Детальная информация по элементам:
${metrics.map(m => `
• ${m.elementId}:
  - Время рендера: ${m.renderTime.toFixed(2)}мс
  - Отзывчивость скролла: ${m.scrollResponsiveness.toFixed(2)}мс
  - Пересчетов в секунду: ${m.recomputations}
`).join('')}

${this.generateRecommendations(metrics)}
    `.trim();
  }

  /**
   * Генерация рекомендаций по оптимизации
   */
  private generateRecommendations(metrics: PerformanceMetrics[]): string {
    const recommendations: string[] = [];

    const slowRenders = metrics.filter(m => m.renderTime > this.thresholds.maxRenderTime);
    if (slowRenders.length > 0) {
      recommendations.push('🐌 Обнаружены медленные рендеры - рассмотрите мемоизацию компонентов');
    }

    const slowScroll = metrics.filter(m => m.scrollResponsiveness > this.thresholds.maxScrollDelay);
    if (slowScroll.length > 0) {
      recommendations.push('📜 Медленная обработка скролла - используйте throttling');
    }

    const manyRecomputations = metrics.filter(m => m.recomputations > this.thresholds.maxRecomputations);
    if (manyRecomputations.length > 0) {
      recommendations.push('🔄 Слишком много пересчетов - оптимизируйте зависимости');
    }

    return recommendations.length > 0
      ? `Рекомендации по оптимизации:\n${recommendations.join('\n')}`
      : '✅ Производительность в норме!';
  }
}

// Синглтон для глобального мониторинга
export const performanceMonitor = new PerformanceMonitor();
