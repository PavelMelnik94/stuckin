/**
 * Простая демонстрация проблемы с селекторами в StickyContainer
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Мокаем MobX observer
jest.mock('mobx-react-lite', () => ({
  observer: (component: any) => component,
}));

describe('StickyContainer - Selector Issue Demo', () => {
  beforeEach(() => {
    document.body.innerHTML = '';

    global.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as any;

    global.ResizeObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as any;
  });

  it('should demonstrate querySelector resolution', () => {
    // Создаем DOM структуру в body
    document.body.innerHTML = `
      <div class="modal-container" id="modal">
        <div class="modal-header">Header</div>
        <div class="modal-body">
          <!-- Здесь будет StickyContainer -->
        </div>
      </div>
    `;

    // Проверяем, что селектор работает
    const foundBySelector = document.querySelector('.modal-container');
    const foundById = document.getElementById('modal');

    expect(foundBySelector).toBeTruthy();
    expect(foundById).toBeTruthy();
    expect(foundBySelector).toBe(foundById);

    console.log('✅ querySelector работает корректно');
    console.log('Element found:', foundBySelector?.className);
  });

  it('should show the timing issue with dynamic content', async () => {
    // Сначала создаем пустой контейнер
    const container = document.createElement('div');
    container.className = 'dynamic-container';
    document.body.appendChild(container);

    // В этот момент контейнер пустой
    expect(container.children.length).toBe(0);

    // Симулируем добавление содержимого позже (как в React)
    const content = document.createElement('div');
    content.className = 'sticky-content';
    content.textContent = 'Sticky element';
    container.appendChild(content);

    // Теперь из sticky-content можем найти родительский контейнер
    const foundFromInside = content.closest('.dynamic-container');
    expect(foundFromInside).toBe(container);

    // Но если бы мы пытались найти через querySelector изнутри content...
    const foundByQuerySelector = document.querySelector('.dynamic-container');
    expect(foundByQuerySelector).toBe(container);

    console.log('✅ Селектор работает даже с динамическим содержимым');
    console.log('Container:', foundByQuerySelector?.className);
    console.log('Content:', content.textContent);
  });

  it('should demonstrate the real issue with useMemo timing', () => {
    // Симулируем ситуацию из useStickyInContainer
    const resolveContainer = (containerSelector: string) => {
      console.log('🔍 Пытаемся найти контейнер:', containerSelector);
      const found = document.querySelector(containerSelector);
      console.log('📍 Найден элемент:', found?.className || 'null');
      return found as HTMLElement;
    };

    // Сценарий 1: Контейнер уже существует
    document.body.innerHTML = '<div class="existing-container">Existing</div>';

    const existing = resolveContainer('.existing-container');
    expect(existing).toBeTruthy();
    expect(existing.className).toBe('existing-container');

    // Сценарий 2: Контейнер не существует
    document.body.innerHTML = '<div class="other-container">Other</div>';

    const missing = resolveContainer('.missing-container');
    expect(missing).toBeNull();

    // Сценарий 3: Контейнер создается после попытки поиска
    document.body.innerHTML = '';

    const notYetCreated = resolveContainer('.future-container');
    expect(notYetCreated).toBeNull();

    // Теперь создаем контейнер
    document.body.innerHTML = '<div class="future-container">Future</div>';

    const nowExists = resolveContainer('.future-container');
    expect(nowExists).toBeTruthy();

    console.log('✅ Демонстрация проблемы timing завершена');
  });

  it('should show useMemo dependency issue', () => {
    // Симулируем работу useMemo с зависимостями
    let memoCallCount = 0;
    let lastContainer: HTMLElement | null = null;

    const simulateUseMemo = (containerProp: string | HTMLElement | null) => {
      memoCallCount++;
      console.log(`🔄 useMemo call #${memoCallCount}, container:`, typeof containerProp === 'string' ? containerProp : containerProp?.className || 'null');

      if (!containerProp) return null;

      if (typeof containerProp === 'string') {
        const found = document.querySelector(containerProp) as HTMLElement;
        console.log('🔍 querySelector result:', found?.className || 'null');
        lastContainer = found;
        return found;
      }

      lastContainer = containerProp;
      return containerProp;
    };

    // Тест 1: Селектор со строкой
    document.body.innerHTML = '<div class="test-container">Test</div>';

    const result1 = simulateUseMemo('.test-container');
    expect(result1).toBeTruthy();
    expect(memoCallCount).toBe(1);

    // Тест 2: Повторный вызов с тем же селектором (должен закешироваться)
    const result2 = simulateUseMemo('.test-container');
    expect(result2).toBe(lastContainer);
    expect(memoCallCount).toBe(2); // useMemo все равно вызовется, но вернет тот же результат

    // Тест 3: Элемент удален из DOM, но useMemo закеширован
    document.body.innerHTML = '';

    const result3 = simulateUseMemo('.test-container');
    expect(result3).toBeNull(); // querySelector не найдет элемент
    expect(memoCallCount).toBe(3);

    console.log('✅ Демонстрация проблемы useMemo завершена');
    console.log('Total memo calls:', memoCallCount);
  });
});
