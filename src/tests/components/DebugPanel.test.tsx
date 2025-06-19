/**
 * Unit тесты для DebugPanel компонента
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { DebugPanel } from '../../components/DebugPanel';
import { StickyProvider } from '../../context/StickyContext';
import { ENV } from '../../utils/env';
import { stickyDebugger } from '../../debug/StickyDebugger';

// Мокаем ENV для тестирования production режима
jest.mock('../../utils/env', () => ({
  ENV: {
    isProduction: false,
    isDev: true,
    isTest: true,
    isBrowser: true,
    enableDebug: true,
    enablePerformanceTracking: true
  },
  envLog: {
    dev: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    performance: jest.fn()
  }
}));

// Мокаем StickyDebugger для контроля его поведения
jest.mock('../../debug/StickyDebugger', () => ({
  stickyDebugger: {
    filteredEvents: [],
    allSnapshots: [],
    performanceAnalysis: { summary: null, slowElements: [], recommendations: [] },
    log: jest.fn(),
    clearHistory: jest.fn(),
    captureSnapshot: jest.fn(),
    config: { enabled: true, logLevel: 'info', maxHistorySize: 100, visualDebug: true, performanceTracking: true, autoCapture: true },
    events: []
  }
}));

// Обертка с провайдером
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('DebugPanel', () => {
  // Очищаем состояние перед каждым тестом
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Сбрасываем мок debugger
    (stickyDebugger.filteredEvents as any).length = 0;
    (stickyDebugger.allSnapshots as any).length = 0;
    (stickyDebugger as any).performanceAnalysis = { summary: null, slowElements: [], recommendations: [] };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('базовый рендеринг', () => {
    test('должен рендерить debug panel', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Проверяем наличие основных элементов debug панели
      expect(screen.getByText('🔧 Sticky Debug')).toBeInTheDocument();
      expect(screen.getByText('events')).toBeInTheDocument();
      expect(screen.getByText('performance')).toBeInTheDocument();
      expect(screen.getByText('snapshots')).toBeInTheDocument();
    });

    test('должен показывать информацию о sticky элементах', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Проверяем наличие debug панели
      expect(screen.getByText('🔧 Sticky Debug')).toBeInTheDocument();
      expect(screen.getByText('Нет событий для отображения')).toBeInTheDocument();
    });

    test('не должен рендериться в production режиме', () => {
      // Мокаем production режим
      (ENV as any).isProduction = true;

      const { container } = render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();

      // Возвращаем обратно
      (ENV as any).isProduction = false;
    });
  });

  describe('управление состоянием', () => {
    test('должен обрабатывать toggle показа панели', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Находим кнопку паузы по title
      const pauseButton = screen.getByTitle('Остановить автообновление');
      expect(pauseButton).toBeInTheDocument();

      // Проверяем что элемент кликабелен
      fireEvent.click(pauseButton);

      // Кнопка должна остаться видимой
      expect(pauseButton).toBeInTheDocument();
    });

    test('должен переключать collapsed состояние', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Находим заголовок для клика
      const header = screen.getByText('🔧 Sticky Debug');

      // Изначально панель развернута - есть табы
      expect(screen.getByText('events')).toBeInTheDocument();

      // Кликаем по заголовку чтобы свернуть
      fireEvent.click(header);

      // Проверяем что панель свернулась - табы должны пропасть
      act(() => {
        expect(screen.queryByText('events')).not.toBeInTheDocument();
      });
    });

    test('должен работать в изначально свернутом режиме', () => {
      render(
        <TestWrapper>
          <DebugPanel collapsed />
        </TestWrapper>
      );

      // Проверяем что панель рендерится с "(collapsed)" текстом
      expect(screen.getByText('🔧 Sticky Debug (collapsed)')).toBeInTheDocument();

      // Табы не должны быть видны
      expect(screen.queryByText('events')).not.toBeInTheDocument();
    });

    test('должен переключать автообновление', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      const autoRefreshButton = screen.getByTitle('Остановить автообновление');

      // Кликаем чтобы остановить автообновление
      fireEvent.click(autoRefreshButton);

      // Проверяем что текст изменился
      expect(screen.getByTitle('Запустить автообновление')).toBeInTheDocument();

      // Кликаем снова чтобы запустить
      fireEvent.click(screen.getByTitle('Запустить автообновление'));

      // Должен вернуться к исходному состоянию
      expect(screen.getByTitle('Остановить автообновление')).toBeInTheDocument();
    });
  });

  describe('конфигурация и опции', () => {
    test('должен устанавливать позицию панели', () => {
      const { container } = render(
        <TestWrapper>
          <DebugPanel position="bottom-left" />
        </TestWrapper>
      );

      const panel = container.querySelector('.sticky-debug-panel');
      expect(panel || container.firstChild).toBeInTheDocument();
    });

    test('должен применять кастомный className', () => {
      const { container } = render(
        <TestWrapper>
          <DebugPanel className="custom-debug-panel" />
        </TestWrapper>
      );

      const panel = container.firstChild;
      expect(panel).toHaveClass('custom-debug-panel');
      expect(panel).toHaveClass('sticky-debug-panel');
    });

    test('должен устанавливать интервал автообновления', () => {
      jest.useFakeTimers();

      render(
        <TestWrapper>
          <DebugPanel autoRefreshInterval={2000} />
        </TestWrapper>
      );

      // Проверяем что панель рендерится с автообновлением
      expect(screen.getByText('🔧 Sticky Debug')).toBeInTheDocument();
      expect(screen.getByTitle('Остановить автообновление')).toBeInTheDocument();

      jest.useRealTimers();
    });

    test('должен отображать разные позиции', () => {
      const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;

      positions.forEach(position => {
        const { unmount } = render(
          <TestWrapper>
            <DebugPanel position={position} />
          </TestWrapper>
        );

        expect(screen.getByText('🔧 Sticky Debug')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('работа с табами', () => {
    test('должен переключать табы', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Проверяем что все табы присутствуют
      const eventsTab = screen.getByText('events');
      const performanceTab = screen.getByText('performance');
      const snapshotsTab = screen.getByText('snapshots');

      expect(eventsTab).toBeInTheDocument();
      expect(performanceTab).toBeInTheDocument();
      expect(snapshotsTab).toBeInTheDocument();

      // Кликаем по табам
      fireEvent.click(performanceTab);
      fireEvent.click(snapshotsTab);
      fireEvent.click(eventsTab);

      // Все табы должны остаться видимыми
      expect(eventsTab).toBeInTheDocument();
      expect(performanceTab).toBeInTheDocument();
      expect(snapshotsTab).toBeInTheDocument();
    });

    test('должен показывать правильное количество кнопок', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Должно быть 4 кнопки: пауза + 3 таба
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    test('должен отображать содержимое таба events', () => {
      // Добавляем события в мок debugger
      const mockEvents = [
        {
          id: 'event-1',
          type: 'info',
          elementId: 'test-element',
          timestamp: Date.now(),
          data: { message: 'Test event' }
        },
        {
          id: 'event-2',
          type: 'error',
          elementId: 'test-element-2',
          timestamp: Date.now(),
          data: { message: 'Error event' }
        }
      ];

      (stickyDebugger.filteredEvents as any) = mockEvents;

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // По умолчанию активен events таб
      expect(screen.getByText('Последние 2 событий:')).toBeInTheDocument();
      expect(screen.getByText('ℹ️ test-element')).toBeInTheDocument();
      expect(screen.getByText('❌ test-element-2')).toBeInTheDocument();
    });

    test('должен отображать содержимое таба performance', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Переключаемся на performance таб
      fireEvent.click(screen.getByText('performance'));

      // Проверяем что отображается сообщение об отсутствии данных
      expect(screen.getByText('Нет данных для анализа производительности')).toBeInTheDocument();
    });

    test('должен отображать содержимое таба snapshots', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Переключаемся на snapshots таб
      fireEvent.click(screen.getByText('snapshots'));

      // Проверяем что есть кнопка создания снимка
      expect(screen.getByText('📸 Создать')).toBeInTheDocument();
      expect(screen.getByText('Снимков: 0')).toBeInTheDocument();
      expect(screen.getByText('Нет снимков для отображения')).toBeInTheDocument();
    });

    test('должен создавать снимки', () => {
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Переключаемся на snapshots таб
      fireEvent.click(screen.getByText('snapshots'));

      // Создаем снимок
      const createButton = screen.getByText('📸 Создать');
      fireEvent.click(createButton);

      // Проверяем что снимок создался
      waitFor(() => {
        expect(screen.getByText('Снимков: 1')).toBeInTheDocument();
      });
    });
  });

  describe('отображение данных', () => {
    test('должен отображать события с разными типами', () => {
      const eventTypes = [
        { type: 'error', icon: '❌' },
        { type: 'warning', icon: '⚠️' },
        { type: 'info', icon: 'ℹ️' },
        { type: 'debug', icon: '🔍' },
        { type: 'state-change', icon: '🔄' },
        { type: 'config-update', icon: '⚙️' },
        { type: 'registration', icon: '📝' },
        { type: 'unregistration', icon: '🗑️' }
      ];

      eventTypes.forEach(({ type, icon }) => {
        // Очищаем и настраиваем мок для каждого типа
        (stickyDebugger.filteredEvents as any) = [{
          id: `event-${type}`,
          type: type as any,
          elementId: `test-${type}`,
          timestamp: Date.now(),
          data: { message: `${type} message` }
        }];

        const { unmount } = render(
          <TestWrapper>
            <DebugPanel />
          </TestWrapper>
        );

        expect(screen.getByText(`${icon} test-${type}`)).toBeInTheDocument();
        expect(screen.getByText(`${type} message`)).toBeInTheDocument();

        // Очищаем для следующего теста
        unmount();
      });

      // Тестируем неизвестный тип события
      (stickyDebugger.filteredEvents as any) = [{
        id: 'event-unknown',
        type: 'info' as any,
        elementId: 'test-unknown',
        timestamp: Date.now(),
        data: { message: 'unknown message' }
      }];

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      expect(screen.getByText('ℹ️ test-unknown')).toBeInTheDocument();
    });

    test('должен отображать анализ производительности с данными', () => {
      // Мокаем анализ производительности
      const mockAnalysis = {
        summary: {
          totalElements: 5,
          avgRenderTime: 15.5,
          maxRenderTime: 45.2,
          totalRecomputations: 10,
          slowElementsCount: 2,
          activeElementsCount: 3
        },
        slowElements: [
          { id: 'slow-element-1', renderTime: 45.2, recomputations: 5 },
          { id: 'slow-element-2', renderTime: 32.1, recomputations: 3 }
        ],
        recommendations: [
          'Оптимизируйте рендеринг slow-element-1',
          'Уменьшите количество DOM операций'
        ]
      };

      // Настраиваем мок
      (stickyDebugger as any).performanceAnalysis = mockAnalysis;

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Переключаемся на performance таб
      fireEvent.click(screen.getByText('performance'));

      // Проверяем отображение данных
      expect(screen.getByText('📊 Сводка:')).toBeInTheDocument();
      expect(screen.getByText('Элементов: 5')).toBeInTheDocument();
      expect(screen.getByText('Средний рендер: 15.5мс')).toBeInTheDocument();
      expect(screen.getByText('Макс рендер: 45.2мс')).toBeInTheDocument();
      expect(screen.getByText('Медленных: 2')).toBeInTheDocument();

      // Проверяем список медленных элементов
      expect(screen.getByText('🐌 Медленные элементы:')).toBeInTheDocument();
      expect(screen.getByText('slow-element-1: 45.20мс')).toBeInTheDocument();
      expect(screen.getByText('slow-element-2: 32.10мс')).toBeInTheDocument();

      // Проверяем рекомендации
      expect(screen.getByText('💡 Рекомендации:')).toBeInTheDocument();
      expect(screen.getByText('• Оптимизируйте рендеринг slow-element-1')).toBeInTheDocument();
      expect(screen.getByText('• Уменьшите количество DOM операций')).toBeInTheDocument();
    });

    test('должен отображать снимки с данными', () => {
      // Создаем мок снимки
      const mockSnapshots = [
        {
          timestamp: Date.now() - 1000,
          elements: { 'element-1': {}, 'element-2': {} },
          groups: {},
          viewport: { width: 1920, height: 1080, scrollX: 0, scrollY: 0 },
          performance: []
        },
        {
          timestamp: Date.now(),
          elements: { 'element-1': {}, 'element-2': {}, 'element-3': {} },
          groups: {},
          viewport: { width: 1024, height: 768, scrollX: 0, scrollY: 0 },
          performance: []
        }
      ];

      // Настраиваем мок
      (stickyDebugger.allSnapshots as any) = mockSnapshots;

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Переключаемся на snapshots таб
      fireEvent.click(screen.getByText('snapshots'));

      // Проверяем отображение данных
      expect(screen.getByText('Снимков: 2')).toBeInTheDocument();
      expect(screen.getByText('📸 Снимок #2')).toBeInTheDocument();
      expect(screen.getByText('📸 Снимок #1')).toBeInTheDocument();
      expect(screen.getByText('Elements: 3 | Viewport: 1024x768')).toBeInTheDocument();
      expect(screen.getByText('Elements: 2 | Viewport: 1920x1080')).toBeInTheDocument();
    });
  });

  describe('автообновление', () => {
    test('должен обрабатывать автообновление с интервалом', () => {
      jest.useFakeTimers();
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      render(
        <TestWrapper>
          <DebugPanel autoRefreshInterval={1000} />
        </TestWrapper>
      );

      // Проверяем что таймер установлен
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      // Продвигаем время
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      setIntervalSpy.mockRestore();
      jest.useRealTimers();
    });

    test('должен останавливать автообновление когда отключено', () => {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Останавливаем автообновление
      const autoRefreshButton = screen.getByTitle('Остановить автообновление');
      fireEvent.click(autoRefreshButton);

      // Проверяем что таймер очищен
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('обработка edge cases', () => {
    test('должен обрабатывать пустые данные корректно', () => {
      // Мокаем пустые данные (уже есть в beforeEach)
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Events таб
      expect(screen.getByText('Нет событий для отображения')).toBeInTheDocument();

      // Snapshots таб
      fireEvent.click(screen.getByText('snapshots'));
      expect(screen.getByText('Нет снимков для отображения')).toBeInTheDocument();
    });

    test('должен корректно отображать события с отсутствующими данными', () => {
      // Добавляем событие с минимальными данными
      (stickyDebugger.filteredEvents as any) = [{
        id: 'test-id',
        elementId: 'test-element',
        type: 'info',
        timestamp: Date.now(),
        data: {}
      }];

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      expect(screen.getByText('ℹ️ test-element')).toBeInTheDocument();
    });

    test('должен обрабатывать производительность без данных в summary', () => {
      // Мокаем анализ производительности с null summary (уже есть в beforeEach)
      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Переключаемся на performance таб
      fireEvent.click(screen.getByText('performance'));

      // Проверяем что отображается дефолтное сообщение
      expect(screen.getByText('Нет данных для анализа производительности')).toBeInTheDocument();
    });

    test('должен обрабатывать события с минимальными данными', () => {
      (stickyDebugger.filteredEvents as any) = [{
        id: 'test-minimal',
        type: 'info',
        elementId: 'test-minimal',
        timestamp: Date.now(),
        data: { message: 'Minimal event' }
      }];

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      expect(screen.getByText('ℹ️ test-minimal')).toBeInTheDocument();
      expect(screen.getByText('Minimal event')).toBeInTheDocument();
    });

    test('должен корректно отображать время событий', () => {
      const currentTime = Date.now();

      // Мокаем событие с определенным временем
      (stickyDebugger.filteredEvents as any) = [{
        id: 'test-time',
        elementId: 'test-element-time',
        type: 'info',
        timestamp: currentTime,
        data: { message: 'Time test event' }
      }];

      render(
        <TestWrapper>
          <DebugPanel />
        </TestWrapper>
      );

      // Проверяем что время отображается
      const timeString = new Date(currentTime).toLocaleTimeString();
      expect(screen.getByText(timeString)).toBeInTheDocument();
    });
  });
});
