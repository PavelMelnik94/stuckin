/**
 * Интеграционные тесты для StickyManager
 * Тестируем взаимодействие всех частей системы
 */

import { StickyManager } from '../../core/StickyManager';
import { createTestConfig, createMockElement, simulateScroll, simulateResize } from '../utils/testUtils';

describe('StickyManager Integration Tests', () => {
  let manager: StickyManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    manager = new StickyManager();
    mockElement = createMockElement(200, 100, { top: 200, left: 0 });

    // Добавляем элемент в DOM для корректной работы observers
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    manager.destroy();
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('Базовая функциональность', () => {
    test('должен корректно регистрировать и отслеживать sticky элемент', () => {
      const config = createTestConfig({
        id: 'test-element',
        direction: 'top',
        offset: { top: 50 }
      });

      // Регистрируем элемент
      manager.registerSticky(mockElement, config);

      // Проверяем что элемент добавлен
      expect(manager.elements.has('test-element')).toBe(true);

      const element = manager.elements.get('test-element');
      expect(element).toBeDefined();
      expect(element!.config).toEqual(config);
      expect(element!.state).toBe('normal');
    });

    test('должен обновлять состояние при скролле', async () => {
      const config = createTestConfig({
        id: 'scroll-test',
        direction: 'top',
        offset: { top: 100 }
      });

      manager.registerSticky(mockElement, config);
      const element = manager.elements.get('scroll-test')!;

      // Изначально элемент не sticky
      expect(element.state).toBe('normal');

      // Симулируем скролл, когда элемент должен стать sticky
      // Элемент находится на позиции top: 200, offset: 100
      // При скролле на 150px элемент должен стать sticky
      simulateScroll(0, 150);

      // Ждем обработки скролла (throttled)
      jest.advanceTimersByTime(20);

      expect(element.state).toBe('sticky');
      expect(element.isActive).toBe(true);
    });

    test('должен корректно удалять элементы', () => {
      const config = createTestConfig({ id: 'remove-test' });

      manager.registerSticky(mockElement, config);
      expect(manager.elements.has('remove-test')).toBe(true);

      // Удаляем элемент
      manager.unregisterSticky('remove-test');
      expect(manager.elements.has('remove-test')).toBe(false);
    });
  });

  describe('Работа с группами', () => {
    test('должен создавать группы и добавлять в них элементы', () => {
      const config1 = createTestConfig({ id: 'group-element-1' });
      const config2 = createTestConfig({ id: 'group-element-2' });
      const element2 = createMockElement();
      document.body.appendChild(element2);

      // Создаем группу
      manager.createGroup('test-group', 10);
      expect(manager.groups.has('test-group')).toBe(true);

      // Регистрируем элементы
      manager.registerSticky(mockElement, config1);
      manager.registerSticky(element2, config2);

      // Добавляем в группу
      manager.addToGroup('group-element-1', 'test-group');
      manager.addToGroup('group-element-2', 'test-group');

      const group = manager.groups.get('test-group')!;
      expect(group.elements.size).toBe(2);
      expect(group.elements.has('group-element-1')).toBe(true);
      expect(group.elements.has('group-element-2')).toBe(true);
    });

    test('должен управлять z-index в группах', () => {
      const config1 = createTestConfig({
        id: 'z-index-1',
        priority: 1,
        zIndex: 1000
      });
      const config2 = createTestConfig({
        id: 'z-index-2',
        priority: 2,
        zIndex: 1000
      });

      manager.createGroup('z-index-group', 100);

      const element2 = createMockElement();
      document.body.appendChild(element2);

      manager.registerSticky(mockElement, config1);
      manager.registerSticky(element2, config2);

      manager.addToGroup('z-index-1', 'z-index-group');
      manager.addToGroup('z-index-2', 'z-index-group');

      const element1 = manager.elements.get('z-index-1')!;
      const elementObj2 = manager.elements.get('z-index-2')!;

      // Элемент с большим приоритетом должен иметь больший z-index
      expect(elementObj2.currentZIndex).toBeGreaterThan(element1.currentZIndex);
    });
  });

  describe('Отзывчивость на изменения viewport', () => {
    test('должен пересчитывать позиции при изменении размера окна', () => {
      const config = createTestConfig({
        id: 'resize-test',
        direction: 'right',
        offset: { right: 100 }
      });

      manager.registerSticky(mockElement, config);

      // Изменяем размер окна
      simulateResize(800, 600);

      // Проверяем что элемент пересчитал свою позицию
      const element = manager.elements.get('resize-test')!;
      expect(element.originalPosition.width).toBeDefined();
    });
  });

  describe('Performance и оптимизации', () => {
    test('должен использовать throttling для скролла', () => {
      const config = createTestConfig({ id: 'throttle-test' });
      manager.registerSticky(mockElement, config);

      const updateSpy = jest.spyOn(manager as any, 'updateStickyState');

      // Быстро эмулируем несколько событий скролла
      simulateScroll(0, 10);
      simulateScroll(0, 20);
      simulateScroll(0, 30);

      // Сразу после событий обновления еще не должно быть
      expect(updateSpy).not.toHaveBeenCalled();

      // После завершения throttle периода должно быть обновление
      jest.advanceTimersByTime(20);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    test('должен корректно очищать ресурсы при destroy', () => {
      const config = createTestConfig({ id: 'cleanup-test' });
      manager.registerSticky(mockElement, config);

      expect(manager.elements.size).toBe(1);

      // Уничтожаем менеджер
      manager.destroy();

      expect(manager.elements.size).toBe(0);
      expect(manager.groups.size).toBe(0);
    });
  });

  describe('Граничные случаи', () => {
    test('должен обрабатывать регистрацию элемента с дублирующимся ID', () => {
      const config = createTestConfig({ id: 'duplicate-test' });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Первая регистрация
      manager.registerSticky(mockElement, config);
      expect(manager.elements.size).toBe(1);

      // Попытка повторной регистрации
      const element2 = createMockElement();
      manager.registerSticky(element2, config);

      // Должно быть предупреждение и элемент не должен добавиться
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      );
      expect(manager.elements.size).toBe(1);

      consoleSpy.mockRestore();
    });

    test('должен корректно обрабатывать удаление несуществующего элемента', () => {
      // Попытка удалить несуществующий элемент не должна вызывать ошибку
      expect(() => {
        manager.unregisterSticky('non-existent');
      }).not.toThrow();
    });

    test('должен работать с элементами вне viewport', () => {
      // Создаем элемент далеко за пределами экрана
      const farElement = createMockElement(100, 50, { top: 5000, left: 0 });
      document.body.appendChild(farElement);

      const config = createTestConfig({
        id: 'far-element',
        direction: 'top',
        offset: { top: 0 }
      });

      manager.registerSticky(farElement, config);
      const element = manager.elements.get('far-element')!;

      // Элемент должен быть зарегистрирован но не active
      expect(element.state).toBe('normal');
      expect(element.isActive).toBe(false);
    });
  });

  describe('Конфигурация и обновления', () => {
    test('должен обновлять конфигурацию элемента', () => {
      const config = createTestConfig({
        id: 'update-config-test',
        direction: 'top',
        offset: { top: 50 }
      });

      manager.registerSticky(mockElement, config);
      const element = manager.elements.get('update-config-test')!;

      // Обновляем конфигурацию
      manager.updateConfig('update-config-test', {
        offset: { top: 100 },
        priority: 5
      });

      expect(element.config.offset.top).toBe(100);
      expect(element.config.priority).toBe(5);
    });

    test('должен поддерживать disabled состояние', () => {
      const config = createTestConfig({
        id: 'disabled-test',
        disabled: true
      });

      manager.registerSticky(mockElement, config);

      // Симулируем условия для sticky
      simulateScroll(0, 300);
      jest.advanceTimersByTime(20);

      const element = manager.elements.get('disabled-test')!;

      // Элемент не должен стать sticky если disabled
      expect(element.state).toBe('normal');
      expect(element.isActive).toBe(false);
    });
  });
});
