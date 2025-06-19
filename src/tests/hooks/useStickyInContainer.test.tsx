import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';

import { useStickyInContainer } from '../../hooks/useStickyInContainer';
import { StickyProvider } from '../../context/StickyContext';
import { renderWithProvider } from '../utils/testUtils';

describe('useStickyInContainer', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Создаем mock контейнер
    mockContainer = document.createElement('div');
    mockContainer.className = 'test-container';
    mockContainer.style.height = '300px';
    mockContainer.style.overflow = 'auto';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
  });

  describe('базовая функциональность', () => {
    it('должен возвращать корректные начальные значения', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-sticky'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.isSticky).toBe(false);
      expect(result.current.state).toBe('normal');
      expect(result.current.isActive).toBe(false);
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.enable).toBe('function');
    });

    it('должен принимать HTMLElement как контейнер', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: mockContainer,
            direction: 'top',
            offset: { top: 10 },
            id: 'test-sticky-element'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.state).toBe('normal');
    });

    it('должен принимать null как контейнер', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: null,
            direction: 'top',
            offset: { top: 10 },
            id: 'test-sticky-null'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.state).toBe('normal');
    });
  });

  describe('конфигурация контейнера', () => {
    it('должен использовать containerOffset', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            containerOffset: { top: 20, left: 15 },
            id: 'test-container-offset'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
    });

    it('должен поддерживать observeResize опцию', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            observeResize: true,
            id: 'test-observe-resize'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
    });

    it('должен поддерживать отключение observeResize', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            observeResize: false,
            id: 'test-no-observe-resize'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
    });
  });

  describe('направления sticky', () => {
    const directions = ['top', 'bottom', 'left', 'right'] as const;

    directions.forEach(direction => {
      it(`должен поддерживать направление ${direction}`, () => {
        const { result } = renderHook(
          () =>
            useStickyInContainer({
              container: '.test-container',
              direction,
              offset: { [direction]: 10 },
              id: `test-direction-${direction}`
            }),
          { wrapper: StickyProvider }
        );

        expect(result.current.ref).toBeDefined();
        expect(result.current.state).toBe('normal');
      });
    });
  });

  describe('интеграция с компонентом', () => {
    it('должен работать в реальном компоненте', () => {
      function TestComponent() {
        const { ref, isSticky, state } = useStickyInContainer({
          container: '.test-container',
          direction: 'top',
          offset: { top: 10 },
          id: 'component-test'
        });

        return (
          <div className="test-container" style={{ height: '300px', overflow: 'auto' }}>
            <div style={{ height: '200px' }}>Content before</div>
            <div ref={ref} data-testid="sticky-element" data-sticky={isSticky} data-state={state}>
              Sticky Element
            </div>
            <div style={{ height: '600px' }}>Content after</div>
          </div>
        );
      }

      renderWithProvider(<TestComponent />);

      const stickyElement = screen.getByTestId('sticky-element');
      expect(stickyElement).toBeInTheDocument();
      expect(stickyElement.getAttribute('data-sticky')).toBe('false');
      expect(stickyElement.getAttribute('data-state')).toBe('normal');
    });
  });

  describe('методы управления', () => {
    it('должен предоставлять метод refresh', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-refresh'
          }),
        { wrapper: StickyProvider }
      );

      expect(typeof result.current.refresh).toBe('function');

      act(() => {
        result.current.refresh();
      });

      // Не должно быть ошибок
      expect(result.current.ref).toBeDefined();
    });

    it('должен предоставлять методы disable и enable', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-disable-enable'
          }),
        { wrapper: StickyProvider }
      );

      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.enable).toBe('function');

      act(() => {
        result.current.disable();
      });

      act(() => {
        result.current.enable();
      });

      // Не должно быть ошибок
      expect(result.current.ref).toBeDefined();
    });
  });

  describe('обработка ошибок', () => {
    it('должен работать без контейнера', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.non-existent-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-no-container'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.state).toBe('normal');
    });

    it('должен обрабатывать пустую строку как контейнер', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-empty-container'
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
    });
  });

  describe('дополнительные опции', () => {
    it('должен поддерживать все опции из useSticky', () => {
      const onStateChange = jest.fn();

      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-all-options',
            enabled: true,
            groupId: 'test-group',
            priority: 5,
            onStateChange,
            boundary: {
              top: 0,
              bottom: 1000,
              left: 0,
              right: 1000
            }
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.state).toBe('normal');
    });

    it('должен поддерживать disabled состояние', () => {
      const { result } = renderHook(
        () =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-disabled',
            enabled: false
          }),
        { wrapper: StickyProvider }
      );

      expect(result.current.ref).toBeDefined();
      expect(result.current.state).toBe('normal');
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать изменение контейнера', () => {
      const { result, rerender } = renderHook(
        ({ container }: { container: HTMLElement | string }) =>
          useStickyInContainer({
            container,
            direction: 'top',
            offset: { top: 10 },
            id: 'test-container-change'
          }),
        {
          wrapper: StickyProvider,
          initialProps: { container: '.test-container' as HTMLElement | string }
        }
      );

      expect(result.current.ref).toBeDefined();

      // Меняем контейнер
      rerender({ container: mockContainer as HTMLElement | string });

      expect(result.current.ref).toBeDefined();
    });

    it('должен работать без StickyProvider', () => {
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() =>
          useStickyInContainer({
            container: '.test-container',
            direction: 'top',
            offset: { top: 10 },
            id: 'test-no-provider'
          })
        );
      }).toThrow('useStickyContext must be used within StickyProvider');

      console.error = originalError;
    });
  });
});
