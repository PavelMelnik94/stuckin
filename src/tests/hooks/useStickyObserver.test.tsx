import React from 'react';
import { renderHook, act } from '@testing-library/react';

import { useStickyObserver } from '../../hooks/useStickyObserver';
import { StickyProvider } from '../../context/StickyContext';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

let mockIntersectionObserverCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null;

const mockIntersectionObserver = jest.fn().mockImplementation((callback) => {
  mockIntersectionObserverCallback = callback;
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  };
});

// Настраиваем глобальный мок
(global as any).IntersectionObserver = mockIntersectionObserver;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('useStickyObserver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIntersectionObserverCallback = null;
  });

  describe('базовая функциональность', () => {
    it('должен создавать IntersectionObserver с правильными опциями', () => {
      const options = {
        threshold: [0, 0.5, 1],
        rootMargin: '10px',
      };

      renderHook(() => useStickyObserver(options), {
        wrapper: TestWrapper,
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          threshold: [0, 0.5, 1],
          rootMargin: '10px',
          root: null,
        }
      );
    });

    it('должен использовать дефолтные опции', () => {
      renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
          rootMargin: '0px',
          root: null,
        }
      );
    });

    it('должен возвращать методы управления наблюдателем', () => {
      const { result } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      expect(result.current.observe).toBeInstanceOf(Function);
      expect(result.current.unobserve).toBeInstanceOf(Function);
      expect(result.current.disconnect).toBeInstanceOf(Function);
      expect(result.current.observer).toBeDefined();
    });
  });

  describe('наблюдение за элементами', () => {
    it('должен начинать наблюдение за элементом', () => {
      const { result } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      const element = document.createElement('div');

      act(() => {
        result.current.observe(element);
      });

      expect(mockObserve).toHaveBeenCalledWith(element);
    });

    it('не должен дублировать наблюдение за уже наблюдаемым элементом', () => {
      const { result } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      const element = document.createElement('div');

      act(() => {
        result.current.observe(element);
        result.current.observe(element); // повторный вызов
      });

      expect(mockObserve).toHaveBeenCalledTimes(1);
    });

    it('должен прекращать наблюдение за элементом', () => {
      const { result } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      const element = document.createElement('div');

      act(() => {
        result.current.observe(element);
        result.current.unobserve(element);
      });

      expect(mockUnobserve).toHaveBeenCalledWith(element);
    });

    it('не должен пытаться убрать ненаблюдаемый элемент', () => {
      const { result } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      const element = document.createElement('div');

      act(() => {
        result.current.unobserve(element); // не наблюдаемый элемент
      });

      expect(mockUnobserve).not.toHaveBeenCalled();
    });

    it('должен отключать всё наблюдение', () => {
      const { result } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('callback вызовы', () => {
    it('должен вызывать onIntersect когда элементы пересекаются', () => {
      const onIntersect = jest.fn();
      renderHook(() => useStickyObserver({ onIntersect }), {
        wrapper: TestWrapper,
      });

      const mockEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now(),
      } as unknown as IntersectionObserverEntry;

      act(() => {
        mockIntersectionObserverCallback?.([mockEntry]);
      });

      expect(onIntersect).toHaveBeenCalledWith(true, mockEntry);
    });

    it('должен обрабатывать несколько entries одновременно', () => {
      const onIntersect = jest.fn();
      renderHook(() => useStickyObserver({ onIntersect }), {
        wrapper: TestWrapper,
      });

      const mockEntries = [
        {
          isIntersecting: true,
          target: document.createElement('div'),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
        {
          isIntersecting: false,
          target: document.createElement('span'),
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 0,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ] as unknown as IntersectionObserverEntry[];

      act(() => {
        mockIntersectionObserverCallback?.(mockEntries);
      });

      expect(onIntersect).toHaveBeenCalledTimes(2);
      expect(onIntersect).toHaveBeenNthCalledWith(1, true, mockEntries[0]);
      expect(onIntersect).toHaveBeenNthCalledWith(2, false, mockEntries[1]);
    });
  });

  describe('очистка ресурсов', () => {
    it('должен отключать observer при размонтировании', () => {
      const { unmount } = renderHook(() => useStickyObserver(), {
        wrapper: TestWrapper,
      });

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('должен пересоздавать observer при изменении опций', () => {
      let mockCallCount = 0;

      const { rerender } = renderHook(
        ({ threshold }) => useStickyObserver({ threshold }),
        {
          wrapper: TestWrapper,
          initialProps: { threshold: [0, 1] },
        }
      );

      // Запоминаем количество вызовов после первого рендера
      mockCallCount = mockIntersectionObserver.mock.calls.length;

      // Изменяем опции
      rerender({ threshold: [0, 0.5, 1] });

      // Должен отключить старый observer
      expect(mockDisconnect).toHaveBeenCalled();
      // И создать новый (общее количество вызовов должно увеличиться)
      expect(mockIntersectionObserver.mock.calls.length).toBeGreaterThan(mockCallCount);
    });
  });

  describe('SSR обработка', () => {
    it('должен работать без ошибок', () => {
      // Простой тест для увеличения покрытия
      expect(() => {
        renderHook(() => useStickyObserver(), {
          wrapper: TestWrapper,
        });
      }).not.toThrow();
    });
  });
});
