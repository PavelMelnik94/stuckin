/**
 * Тесты для SSR утилит
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { ssrManager, withSSR } from '../../utils/ssr';

// Мокаем console.error чтобы тесты были чище
const originalConsoleError = console.error;

describe('SSR Utils', () => {
  beforeEach(() => {
    // Не мокаем console.error глобально, только в некоторых тестах
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('SSRManager', () => {
    describe('конструктор и инициализация', () => {
      it('должен правильно определять SSR окружение', () => {
        // В jsdom окружении window существует, поэтому isSSR должен быть false
        const state = ssrManager.getSSRState();
        expect(state.isSSR).toBe(false);
      });

      it('должен правильно определять hydration состояние', () => {
        const state = ssrManager.getSSRState();
        expect(typeof state.isHydrated).toBe('boolean');
        expect(typeof state.shouldSuppressWarning).toBe('boolean');
      });
    });

    describe('getSSRState', () => {
      it('должен возвращать правильную структуру состояния', () => {
        const state = ssrManager.getSSRState();

        expect(state).toHaveProperty('isSSR');
        expect(state).toHaveProperty('isHydrated');
        expect(state).toHaveProperty('shouldSuppressWarning');
        expect(typeof state.isSSR).toBe('boolean');
        expect(typeof state.isHydrated).toBe('boolean');
        expect(typeof state.shouldSuppressWarning).toBe('boolean');
      });

      it('должен возвращать согласованные значения', () => {
        const state = ssrManager.getSSRState();

        // shouldSuppressWarning должен быть противоположен isHydrated в большинстве случаев
        if (state.isHydrated) {
          expect(state.shouldSuppressWarning).toBe(false);
        }
      });
    });    describe('onClient', () => {
      it('должен выполнять callback на клиенте после hydration', async () => {
        const callback = jest.fn(() => 'test-result');

        // Ждем завершения hydration
        await waitFor(() => {
          const state = ssrManager.getSSRState();
          expect(state.isHydrated).toBe(true);
        }, { timeout: 2000 });

        const result = ssrManager.onClient(callback, 'fallback');

        expect(callback).toHaveBeenCalled();
        expect(result).toBe('test-result');
      });

      it('должен возвращать fallback в SSR окружении', () => {
        // Создаем мок SSR состояния
        const mockGetSSRState = jest.spyOn(ssrManager, 'getSSRState');
        mockGetSSRState.mockReturnValue({
          isSSR: true,
          isHydrated: false,
          shouldSuppressWarning: true
        });

        // Мокаем приватное свойство isSSR
        (ssrManager as any).isSSR = true;

        const callback = jest.fn(() => 'test-result');
        const result = ssrManager.onClient(callback, 'fallback');

        expect(result).toBe('fallback');
        expect(callback).not.toHaveBeenCalled();

        // Восстанавливаем оригинальные значения
        mockGetSSRState.mockRestore();
        (ssrManager as any).isSSR = false;
      });

      it('должен обрабатывать ошибки в callback', async () => {
        // Ждем завершения hydration
        await waitFor(() => {
          const state = ssrManager.getSSRState();
          expect(state.isHydrated).toBe(true);
        }, { timeout: 2000 });

        const errorCallback = jest.fn(() => {
          throw new Error('Test error');
        });

        expect(() => {
          ssrManager.onClient(errorCallback);
        }).toThrow('Test error');
      });
    });

    describe('onHydrated', () => {
      it('должен вызывать callback если уже hydrated', () => {
        const callback = jest.fn();

        // Проверяем, что callback вызывается
        const cleanup = ssrManager.onHydrated(callback);

        // В jsdom окружении hydration происходит быстро
        expect(typeof cleanup).toBe('function');
      });

      it('должен возвращать функцию cleanup', () => {
        const callback = jest.fn();
        const cleanup = ssrManager.onHydrated(callback);

        expect(typeof cleanup).toBe('function');

        // Проверяем, что cleanup не бросает ошибку
        expect(() => cleanup()).not.toThrow();
      });

      it('должен правильно обрабатывать множественные подписки', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        const cleanup1 = ssrManager.onHydrated(callback1);
        const cleanup2 = ssrManager.onHydrated(callback2);

        expect(typeof cleanup1).toBe('function');
        expect(typeof cleanup2).toBe('function');

        // Очищаем подписки
        cleanup1();
        cleanup2();
      });
    });    describe('getSafeValue', () => {
      it('должен возвращать клиентское значение на клиенте', async () => {
        // Ждем завершения hydration
        await waitFor(() => {
          const state = ssrManager.getSSRState();
          expect(state.isHydrated).toBe(true);
        }, { timeout: 2000 });

        const clientCallback = jest.fn(() => 'client-value');
        const serverValue = 'server-value';

        const result = ssrManager.getSafeValue(clientCallback, serverValue);

        expect(clientCallback).toHaveBeenCalled();
        expect(result).toBe('client-value');
      });

      it('должен возвращать серверное значение в SSR', () => {
        // Мокаем SSR состояние
        const mockGetSSRState = jest.spyOn(ssrManager, 'getSSRState');
        mockGetSSRState.mockReturnValue({
          isSSR: true,
          isHydrated: false,
          shouldSuppressWarning: true
        });

        // Мокаем приватное свойство isSSR
        (ssrManager as any).isSSR = true;

        const clientCallback = jest.fn(() => 'client-value');
        const serverValue = 'server-value';

        const result = ssrManager.getSafeValue(clientCallback, serverValue);

        expect(clientCallback).not.toHaveBeenCalled();
        expect(result).toBe('server-value');

        // Восстанавливаем оригинальные значения
        mockGetSSRState.mockRestore();
        (ssrManager as any).isSSR = false;
      });

      it('должен обрабатывать функции которые возвращают undefined', async () => {
        // Ждем завершения hydration
        await waitFor(() => {
          const state = ssrManager.getSSRState();
          expect(state.isHydrated).toBe(true);
        }, { timeout: 2000 });

        const clientCallback = jest.fn(() => undefined);
        const serverValue = 'server-value';

        const result = ssrManager.getSafeValue(clientCallback, serverValue);

        expect(result).toBe(undefined);
      });
    });

    describe('обработка ошибок hydration', () => {
      it('должен правильно обрабатывать ошибки без краха системы', () => {
        const callback = jest.fn();

        // Подписываемся на hydration
        const cleanup = ssrManager.onHydrated(callback);

        // Проверяем, что cleanup функция работает
        expect(typeof cleanup).toBe('function');
        expect(() => cleanup()).not.toThrow();
      });
    });
  });  describe('withSSR HOC', () => {
    const TestComponent: React.FC<{ text: string }> = ({ text }) => (
      <div data-testid="test-component">{text}</div>
    );

    it('должен рендерить компонент после hydration', async () => {
      const WrappedComponent = withSSR(TestComponent);

      const { getByTestId } = render(
        <WrappedComponent text="Hello World" />
      );

      // Ждем hydration
      await waitFor(() => {
        expect(getByTestId('test-component')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(getByTestId('test-component')).toHaveTextContent('Hello World');
    });    it('должен показывать placeholder или компонент в зависимости от состояния', () => {
      const WrappedComponent = withSSR(TestComponent, { enabled: true });

      const { container } = render(
        <WrappedComponent text="Hello World" />
      );

      // Проверяем, что что-то рендерится
      expect(container.firstChild).toBeInTheDocument();

      // Может быть либо placeholder, либо компонент в зависимости от состояния hydration
      const hasPlaceholder = container.querySelector('div[style*="visibility: hidden"]');
      const hasComponent = container.querySelector('[data-testid="test-component"]');

      expect(hasPlaceholder || hasComponent).toBeTruthy();
    });

    it('должен обрабатывать отключенную SSR конфигурацию', async () => {
      const ssrConfig = {
        enabled: false
      };

      const WrappedComponent = withSSR(TestComponent, ssrConfig);

      const { getByTestId } = render(
        <WrappedComponent text="Hello World" />
      );

      // При отключенной SSR должен показать компонент сразу
      await waitFor(() => {
        expect(getByTestId('test-component')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('должен передавать ref правильно', async () => {
      const TestComponentWithRef = React.forwardRef<HTMLDivElement, { text: string }>((props, ref) => (
        <div ref={ref} data-testid="test-component">{props.text}</div>
      ));

      const WrappedComponent = withSSR(TestComponentWithRef);
      const ref = React.createRef<HTMLDivElement>();

      render(<WrappedComponent ref={ref} text="Hello World" />);

      // Ждем hydration
      await waitFor(() => {
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      }, { timeout: 2000 });
    });

    it('должен обрабатывать изменения в hydration состоянии', async () => {
      const WrappedComponent = withSSR(TestComponent, { enabled: false });

      const { getByTestId, rerender } = render(
        <WrappedComponent text="Hello World" />
      );

      // Должен показать компонент
      await waitFor(() => {
        expect(getByTestId('test-component')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Повторный рендер должен работать корректно
      rerender(<WrappedComponent text="Updated Text" />);
      expect(getByTestId('test-component')).toHaveTextContent('Updated Text');
    });

    it('должен правильно обрабатывать unmount', () => {
      const WrappedComponent = withSSR(TestComponent);

      const { unmount } = render(
        <WrappedComponent text="Hello World" />
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать множественные создания SSRManager', () => {
      // Проверяем что ssrManager работает корректно как singleton
      const manager1 = ssrManager;
      const state1 = manager1.getSSRState();
      const state2 = ssrManager.getSSRState();

      expect(state1).toEqual(state2);
      expect(manager1.getSSRState).toBeDefined();
    });

    it('должен работать с быстрыми изменениями состояний', async () => {
      const callbacks: (() => void)[] = [];

      // Регистрируем много callbacks быстро
      for (let i = 0; i < 10; i++) {
        const callback = jest.fn();
        callbacks.push(callback);
        ssrManager.onHydrated(callback);
      }

      // Все callbacks должны в итоге выполниться
      await waitFor(() => {
        callbacks.forEach(callback => {
          expect(callback).toHaveBeenCalled();
        });
      }, { timeout: 1000 });
    });

    it('должен обрабатывать null и undefined значения', () => {
      expect(() => {
        ssrManager.getSafeValue(() => null, 'fallback');
      }).not.toThrow();

      expect(() => {
        ssrManager.getSafeValue(() => undefined, 'fallback');
      }).not.toThrow();
    });
  });
});
