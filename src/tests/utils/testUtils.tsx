/**
 * Утилиты для тестирования sticky компонентов
 * Принцип DRY: переиспользуемые функции для тестов
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';

import { StickyProvider } from '../../context/StickyContext';
import { StickyConfig } from '../../types/sticky.types';

/**
 * Обертка для провайдера в тестах
 */
interface TestWrapperProps {
  children: React.ReactNode;
  debug?: boolean;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children, debug = false }) => (
  <StickyProvider debug={debug}>
    {children}
  </StickyProvider>
);

/**
 * Кастомная функция рендера с провайдером
 */
export function renderWithProvider(
  ui: ReactElement,
  options: RenderOptions & { debug?: boolean } = {}
): RenderResult {
  const { debug = false, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper debug={debug}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions
  });
}

/**
 * Создание мокового элемента с заданными размерами
 */
export function createMockElement(
  width: number = 100,
  height: number = 50,
  position: { top: number; left: number } = { top: 0, left: 0 }
): HTMLElement {
  const element = document.createElement('div');

  // Мокируем getBoundingClientRect
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    width,
    height,
    top: position.top,
    left: position.left,
    bottom: position.top + height,
    right: position.left + width,
    x: position.left,
    y: position.top,
    toJSON: jest.fn()
  } as DOMRect);

  // Мокируем offsetWidth/Height
  Object.defineProperties(element, {
    offsetWidth: { value: width, writable: true },
    offsetHeight: { value: height, writable: true },
    offsetTop: { value: position.top, writable: true },
    offsetLeft: { value: position.left, writable: true }
  });

  return element;
}

/**
 * Симуляция скролла страницы
 */
export function simulateScroll(x: number = 0, y: number = 0): void {
  // Обновляем scroll позицию
  Object.defineProperties(window, {
    scrollX: { value: x, writable: true },
    scrollY: { value: y, writable: true },
    pageXOffset: { value: x, writable: true },
    pageYOffset: { value: y, writable: true }
  });

  // Эмулируем событие скролла
  window.dispatchEvent(new Event('scroll'));
}

/**
 * Симуляция изменения размера окна
 */
export function simulateResize(width: number = 1024, height: number = 768): void {
  Object.defineProperties(window, {
    innerWidth: { value: width, writable: true },
    innerHeight: { value: height, writable: true }
  });

  window.dispatchEvent(new Event('resize'));
}

/**
 * Симуляция Intersection Observer события
 */
export function simulateIntersection(
  element: HTMLElement,
  isIntersecting: boolean = true,
  intersectionRatio: number = 1
): void {
  const mockObserver = (global.IntersectionObserver as jest.Mock).mock;
  const observerCallback = mockObserver.calls[mockObserver.calls.length - 1][0];

  if (observerCallback) {
    observerCallback([{
      target: element,
      isIntersecting,
      intersectionRatio,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRect: element.getBoundingClientRect(),
      rootBounds: {
        top: 0,
        left: 0,
        bottom: window.innerHeight,
        right: window.innerWidth,
        width: window.innerWidth,
        height: window.innerHeight
      },
      time: Date.now()
    }]);
  }
}

/**
 * Ожидание завершения анимаций и таймеров
 */
export async function waitForAnimations(): Promise<void> {
  // Ждем завершения всех таймеров
  jest.runAllTimers();

  // Ждем следующий tick для обновления компонентов
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Создание тестовой конфигурации sticky
 */
export function createTestConfig(overrides: Partial<StickyConfig> = {}): StickyConfig {
  return {
    id: `test-sticky-${Date.now()}`,
    direction: 'top',
    offset: { top: 0 },
    priority: 0,
    disabled: false,
    smooth: true,
    ...overrides
  };
}

/**
 * Мок для медиа-запросов
 */
export function mockMediaQuery(query: string, matches: boolean = true): jest.SpyInstance {
  const mockMediaQuery = {
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  return jest.spyOn(window, 'matchMedia').mockReturnValue(mockMediaQuery as any);
}

/**
 * Проверка CSS свойств элемента
 */
export function expectElementToHaveStyles(
  element: HTMLElement,
  styles: Record<string, string>
): void {
  Object.entries(styles).forEach(([property, value]) => {
    expect(element.style[property as any]).toBe(value);
  });
}

/**
 * Получение всех sticky элементов на странице
 */
export function getAllStickyElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[data-sticky-id]')) as HTMLElement[];
}
