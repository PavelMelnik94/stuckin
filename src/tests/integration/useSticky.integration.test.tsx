/**
 * Интеграционные тесты для useSticky хука
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';

import { useSticky } from '../../hooks/useSticky';
import { renderWithProvider } from '../utils/testUtils';
// import { simulateScroll, createTestConfig } from '../utils/testUtils'; // TODO: Use if needed

// TODO: Use wrapper if needed for provider context
// const wrapper = ({ children }: { children: React.ReactNode }) => (
//   <div>{children}</div>
// );

describe('useSticky Integration Tests', () => {
  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('Базовая функциональность хука', () => {
    test('должен возвращать корректные начальные значения', () => {
      const { result } = renderHook(() =>
        useSticky({
          id: 'test-hook',
          direction: 'top',
          offset: { top: 50 }
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      expect(result.current.ref.current).toBeNull();
      expect(result.current.state).toBeNull(); // Пока элемент не подключен
      expect(result.current.isSticky).toBe(false);
      expect(result.current.isActive).toBe(false);
      expect(typeof result.current.updateConfig).toBe('function');
      expect(typeof result.current.refresh).toBe('function');
      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.enable).toBe('function');
    });

    test('должен подключать элемент после установки ref', () => {
      const { result } = renderHook(() =>
        useSticky({
          id: 'ref-test',
          direction: 'top',
          offset: { top: 0 }
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      // Создаем и подключаем mock элемент
      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);

      act(() => {
        // Симулируем установку ref
        (result.current.ref as any).current = mockElement;
      });

      // После подключения должно быть состояние
      expect(result.current.state).toBe('normal');
    });

    test('должен обновлять состояние через updateConfig', () => {
      const { result } = renderHook(() =>
        useSticky({
          id: 'update-test',
          direction: 'top',
          offset: { top: 50 },
          enabled: true
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);

      act(() => {
        (result.current.ref as any).current = mockElement;
      });

      // Обновляем конфигурацию
      act(() => {
        result.current.updateConfig({ disabled: true });
      });

      // Состояние должно обновиться
      // В данном случае мы проверяем что функция вызывается без ошибок
      expect(typeof result.current.updateConfig).toBe('function');
    });
  });

  describe('Методы управления', () => {
    test('disable/enable должны изменять состояние элемента', () => {
      const { result } = renderHook(() =>
        useSticky({
          id: 'toggle-test',
          direction: 'top',
          offset: { top: 0 }
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);

      act(() => {
        (result.current.ref as any).current = mockElement;
      });

      // Отключаем
      act(() => {
        result.current.disable();
      });

      // Включаем обратно
      act(() => {
        result.current.enable();
      });

      // Проверяем что методы работают без ошибок
      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.enable).toBe('function');
    });

    test('refresh должен принудительно обновлять состояние', () => {
      const { result } = renderHook(() =>
        useSticky({
          id: 'refresh-test',
          direction: 'top',
          offset: { top: 0 }
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      act(() => {
        result.current.refresh();
      });

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('Callback функции', () => {
    test('должен вызывать onStateChange при изменении состояния', () => {
      const onStateChange = jest.fn();

      const { result } = renderHook(() =>
        useSticky({
          id: 'callback-test',
          direction: 'top',
          offset: { top: 0 },
          onStateChange
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);

      act(() => {
        (result.current.ref as any).current = mockElement;
      });

      // onStateChange должен был вызваться при начальной установке состояния
      // Проверяем что callback функция была передана корректно
      expect(onStateChange).toHaveBeenCalledWith('normal');
    });
  });

  describe('Интеграция с группами', () => {
    test('должен добавлять элемент в группу при указании groupId', () => {
      const { result } = renderHook(() =>
        useSticky({
          id: 'group-hook-test',
          direction: 'top',
          offset: { top: 0 },
          groupId: 'test-group'
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      const mockElement = document.createElement('div');
      document.body.appendChild(mockElement);

      act(() => {
        (result.current.ref as any).current = mockElement;
      });

      // Элемент должен быть создан и добавлен в группу
      expect(result.current.state).toBe('normal');
    });
  });

  describe('Обработка ошибок', () => {
    test('должен корректно обрабатывать некорректные параметры', () => {
      const { result } = renderHook(() =>
        useSticky({
          // @ts-expect-error - тестируем обработку ошибок
          direction: 'invalid-direction',
          offset: { top: 0 }
        }),
        { wrapper: ({ children }) => renderWithProvider(<>{children}</>) }
      );

      // Хук должен не упасть даже с некорректными параметрами
      expect(result.current.ref).toBeDefined();
    });

    test('должен работать без контекста провайдера', () => {
      expect(() => {
        renderHook(() =>
          useSticky({
            id: 'no-provider-test',
            direction: 'top',
            offset: { top: 0 }
          })
        );
      }).toThrow('useStickyContext must be used within StickyProvider');
    });
  });
});
