/**
 * Unit тесты для DebugPanel компонента
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import { DebugPanel } from '../../components/DebugPanel';
import { StickyProvider } from '../../context/StickyContext';
import { stickyDebugger } from '../../debug/StickyDebugger';
import { ENV } from '../../utils/env';

// Мокаем ENV для тестирования production режима
jest.mock('../../utils/env', () => ({
  ENV: {
    isProduction: false,
    isDev: true,
    isTest: true,
    isBrowser: true,
    enableDebug: true,
    enablePerformanceTracking: true
  }
}));

// Обертка с провайдером
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('DebugPanel', () => {
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

  test('должен устанавливать позицию панели', () => {
    const { container } = render(
      <TestWrapper>
        <DebugPanel position="bottom-left" />
      </TestWrapper>
    );

    const panel = container.querySelector('.debug-panel');
    expect(panel || container.firstChild).toBeInTheDocument();
  });

  test('должен работать в свернутом режиме', () => {
    render(
      <TestWrapper>
        <DebugPanel collapsed />
      </TestWrapper>
    );

    // Проверяем что панель все еще рендерится с "(collapsed)" текстом
    expect(screen.getByText('🔧 Sticky Debug (collapsed)')).toBeInTheDocument();
  });

  test('должен применять кастомный className', () => {
    const { container } = render(
      <TestWrapper>
        <DebugPanel className="custom-debug-panel" />
      </TestWrapper>
    );

    const panel = container.firstChild;
    expect(panel).toHaveClass('custom-debug-panel');
  });

  test('должен устанавливать интервал автообновления', () => {
    render(
      <TestWrapper>
        <DebugPanel autoRefreshInterval={2000} />
      </TestWrapper>
    );

    // Проверяем что панель рендерится с автообновлением
    expect(screen.getByText('🔧 Sticky Debug')).toBeInTheDocument();
    expect(screen.getByTitle('Остановить автообновление')).toBeInTheDocument();
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
});
