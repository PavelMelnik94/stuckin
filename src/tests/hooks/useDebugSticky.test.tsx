import React from 'react';
import { renderHook, act } from '@testing-library/react';

import { useDebugSticky } from '../../hooks/useDebugSticky';
import { StickyProvider } from '../../context/StickyContext';

// Mock компонентов и утилит
jest.mock('../../debug/debugLogger', () => ({
  debugLogger: {
    debug: jest.fn(),
    warn: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../debug/StickyDebugger', () => ({
  stickyDebugger: {
    log: jest.fn(),
    captureSnapshot: jest.fn(() => ({ id: 'snapshot-id', timestamp: Date.now() })),
    filteredEvents: [],
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('useDebugSticky', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('базовая функциональность', () => {
    it('должен возвращать правильные начальные значения', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isVisible).toBe(false);
      expect(result.current.position).toBe('bottom-right');
      expect(result.current.isCollapsed).toBe(false);
      expect(typeof result.current.toggleVisibility).toBe('function');
      expect(typeof result.current.setPosition).toBe('function');
      expect(typeof result.current.setCollapsed).toBe('function');
      expect(typeof result.current.getDebugInfo).toBe('function');
      expect(typeof result.current.exportDebugData).toBe('function');
      expect(typeof result.current.clearDebugHistory).toBe('function');
      expect(React.isValidElement(result.current.DebugPanelComponent)).toBe(true);
    });

    it('должен переключать видимость панели', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isVisible).toBe(false);

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('должен устанавливать позицию панели', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setPosition('top-left');
      });

      expect(result.current.position).toBe('top-left');

      act(() => {
        result.current.setPosition('bottom-center');
      });

      expect(result.current.position).toBe('bottom-center');
    });

    it('должен переключать состояние свернутости', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isCollapsed).toBe(false);

      act(() => {
        result.current.setCollapsed(true);
      });

      expect(result.current.isCollapsed).toBe(true);

      act(() => {
        result.current.setCollapsed(false);
      });

      expect(result.current.isCollapsed).toBe(false);
    });
  });

  describe('работа с debug данными', () => {
    it('должен возвращать информацию о debug', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      const debugInfo = result.current.getDebugInfo();

      expect(debugInfo).toHaveProperty('elements');
      expect(debugInfo).toHaveProperty('groups');
      expect(debugInfo).toHaveProperty('performance');
      expect(debugInfo).toHaveProperty('viewport');
      expect(Array.isArray(debugInfo.elements)).toBe(true);
      expect(Array.isArray(debugInfo.groups)).toBe(true);
    });

    it('должен экспортировать debug данные как JSON', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      const exportedData = result.current.exportDebugData();

      expect(typeof exportedData).toBe('string');
      expect(() => JSON.parse(exportedData)).not.toThrow();

      const parsed = JSON.parse(exportedData);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('data');
    });

    it('должен очищать историю debug', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      // Проверяем, что функция вызывается без ошибок
      expect(() => {
        act(() => {
          result.current.clearDebugHistory();
        });
      }).not.toThrow();
    });
  });

  describe('DebugPanelComponent', () => {
    it('должен рендерить DebugPanel с правильными пропсами', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      const component = result.current.DebugPanelComponent;
      
      expect(React.isValidElement(component)).toBe(true);
      expect(component.type).toBeDefined();
    });

    it('должен передавать правильные пропсы в DebugPanel', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.toggleVisibility();
        result.current.setPosition('top-left');
        result.current.setCollapsed(true);
      });

      const component = result.current.DebugPanelComponent;
      
      expect(component.props.isVisible).toBe(true);
      expect(component.props.position).toBe('top-left');
      expect(component.props.isCollapsed).toBe(true);
      expect(typeof component.props.onToggle).toBe('function');
      expect(typeof component.props.onPositionChange).toBe('function');
      expect(typeof component.props.onCollapseChange).toBe('function');
    });
  });

  describe('интеграция с StickyProvider', () => {
    it('должен работать без StickyProvider', () => {
      const { result } = renderHook(() => useDebugSticky());

      expect(result.current.isVisible).toBe(false);
      expect(typeof result.current.toggleVisibility).toBe('function');
      expect(typeof result.current.getDebugInfo).toBe('function');
    });

    it('должен использовать контекст из StickyProvider', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      const debugInfo = result.current.getDebugInfo();

      // Проверяем, что данные получены из контекста
      expect(debugInfo).toBeDefined();
      expect(debugInfo.elements).toBeDefined();
      expect(debugInfo.groups).toBeDefined();
    });
  });

  describe('обработка ошибок', () => {
    it('должен обрабатывать ошибки при экспорте данных', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      // Мокаем ошибку JSON.stringify
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn(() => {
        throw new Error('JSON error');
      });

      const exportedData = result.current.exportDebugData();

      expect(exportedData).toBe('{}');

      // Восстанавливаем оригинальную функцию
      JSON.stringify = originalStringify;
    });

    it('должен обрабатывать ошибки при получении debug информации', () => {
      const { result } = renderHook(() => useDebugSticky(), {
        wrapper: TestWrapper,
      });

      // Проверяем, что функция не падает при ошибках
      expect(() => {
        result.current.getDebugInfo();
      }).not.toThrow();
    });
  });

  describe('кастомные опции', () => {
    it('должен принимать начальные настройки', () => {
      const { result } = renderHook(() => useDebugSticky({
        initialVisible: true,
        initialPosition: 'top-center',
        initialCollapsed: true,
      }), {
        wrapper: TestWrapper,
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.position).toBe('top-center');
      expect(result.current.isCollapsed).toBe(true);
    });

    it('должен использовать колбеки', () => {
      const onVisibilityChange = jest.fn();
      const onPositionChange = jest.fn();
      const onCollapseChange = jest.fn();

      const { result } = renderHook(() => useDebugSticky({
        onVisibilityChange,
        onPositionChange,
        onCollapseChange,
      }), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.toggleVisibility();
      });
      expect(onVisibilityChange).toHaveBeenCalledWith(true);

      act(() => {
        result.current.setPosition('top-left');
      });
      expect(onPositionChange).toHaveBeenCalledWith('top-left');

      act(() => {
        result.current.setCollapsed(true);
      });
      expect(onCollapseChange).toHaveBeenCalledWith(true);
    });
  });
});
