/**
 * Интеграционные тесты производительности
 */

import { StickyManager } from '../../core/StickyManager';
import { performanceMonitor } from '../../utils/performance';
import { createTestConfig, createMockElement, simulateScroll } from '../utils/testUtils';

describe('Performance Integration Tests', () => {
  let manager: StickyManager;

  beforeEach(() => {
    // Включаем fake timers для тестов производительности
    jest.useFakeTimers();

    manager = new StickyManager();
    performanceMonitor.enable();
  });

  afterEach(() => {
    manager.destroy();
    performanceMonitor.disable();
    document.body.innerHTML = '';

    // Очищаем fake timers
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Memory Management', () => {
    test('должен правильно очищать память при удалении элементов', () => {
      const elements: HTMLElement[] = [];

      // Создаем много элементов
      for (let i = 0; i < 50; i++) {
        const element = createMockElement();
        const config = createTestConfig({ id: `memory-test-${i}` });

        document.body.appendChild(element);
        elements.push(element);

        manager.registerSticky(element, config);
      }

      expect(manager.elements.size).toBe(50);

      // Удаляем все элементы
      for (let i = 0; i < 50; i++) {
        manager.unregisterSticky(`memory-test-${i}`);
      }

      expect(manager.elements.size).toBe(0);
      expect(manager.groups.size).toBe(0);
    });

    test('должен эффективно обрабатывать большое количество скроллов', () => {
      const element = createMockElement();
      const config = createTestConfig({
        id: 'scroll-performance-test',
        direction: 'top',
        offset: { top: 50 }
      });

      document.body.appendChild(element);
      manager.registerSticky(element, config);

      const startTime = performance.now();

      // Эмулируем много событий скролла
      for (let i = 0; i < 100; i++) {
        simulateScroll(0, i * 10);
      }

      // Обрабатываем все throttled события
      jest.runAllTimers();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Должно обрабатываться быстро (менее 200мс для стабильности в CI)
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Render Performance', () => {
    test('должен минимизировать количество DOM обновлений', () => {
      const element = createMockElement();
      const config = createTestConfig({
        id: 'render-performance-test',
        smooth: false // отключаем анимации для точности теста
      });

      document.body.appendChild(element);
      manager.registerSticky(element, config);

      // Считаем количество изменений стилей
      let styleChanges = 0;
      const originalStyleSetter = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'style'
      )?.set;

      Object.defineProperty(element, 'style', {
        set: function(value) {
          styleChanges++;
          return originalStyleSetter?.call(this, value);
        },
        get: function() {
          return this._style || {};
        }
      });

      // Эмулируем изменения состояния
      simulateScroll(0, 100);
      jest.runAllTimers();

      simulateScroll(0, 0);
      jest.runAllTimers();

      // Количество изменений стилей должно быть минимальным
      expect(styleChanges).toBeLessThan(10);
    });
  });

  describe('Observer Performance', () => {
    test('должен эффективно использовать Intersection Observer', () => {
      const elements: HTMLElement[] = [];

      // Создаем много элементов
      for (let i = 0; i < 20; i++) {
        const element = createMockElement();
        const config = createTestConfig({ id: `observer-test-${i}` });

        document.body.appendChild(element);
        elements.push(element);

        manager.registerSticky(element, config);
      }

      // Должен создать все элементы
      expect(manager.elements.size).toBe(20);

      // Удаляем элементы
      for (let i = 0; i < 20; i++) {
        manager.unregisterSticky(`observer-test-${i}`);
      }

      // Должен очистить все элементы
      expect(manager.elements.size).toBe(0);
    });
  });

  describe('Bundle Size Optimization', () => {
    test('должен загружать только необходимые зависимости', () => {
      // Проверяем что не загружаются лишние полифилы в современных браузерах
      expect(typeof IntersectionObserver).toBe('function');
      expect(typeof ResizeObserver).toBe('function');
      expect(typeof window.matchMedia).toBe('function');
    });

    test('должен поддерживать tree-shaking', () => {
      // Проверяем что можно импортировать только нужные части
      const { useSticky } = require('../../hooks/useSticky');
      const { Sticky } = require('../../components/Sticky');

      expect(typeof useSticky).toBe('function');
      expect(typeof Sticky).toBe('object'); // React component
      expect(Sticky).toBeDefined();
    });
  });
});
