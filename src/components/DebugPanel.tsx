/**
 * Визуальная панель отладки для sticky элементов
 * - Single Responsibility: только UI отладочной панели
 * - Interface Segregation: разделенные интерфейсы для разных частей
 * - Low Coupling: минимальная зависимость от StickyDebugger
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { observer } from 'mobx-react-lite';


import { ENV } from '@/utils/env';
import { stickyDebugger } from '@/debug/StickyDebugger';

interface DebugPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  collapsed?: boolean;
  className?: string;
  autoRefreshInterval?: number;
}

type TabType = 'events' | 'performance' | 'snapshots';

/**
 * Главный компонент панели отладки
 * Принцип Observer Pattern: реагирует на изменения в MobX store
 */
export const DebugPanel: React.FC<DebugPanelProps> = observer(({
  position = 'top-right',
  collapsed: initialCollapsed = false,
  className = '',
  autoRefreshInterval = 1000
}) => {
  // Локальное состояние компонента
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Получаем данные через публичные геттеры (принцип Encapsulation)
  const events = stickyDebugger.filteredEvents;
  const performance = stickyDebugger.performanceAnalysis;
  const snapshots = stickyDebugger.allSnapshots; // ← Используем публичный геттер

  /**
   * Автообновление данных
   * Принцип: контролируемые side effects
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // MobX автоматически обновит компонент при изменении observable данных
      // Дополнительная логика обновления при необходимости
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, autoRefreshInterval]);

  // Мемоизированные стили для оптимизации производительности
  const positionStyles = useMemo(() => {
    const styles = {
      'top-right': { top: '10px', right: '10px' },
      'top-left': { top: '10px', left: '10px' },
      'bottom-right': { bottom: '10px', right: '10px' },
      'bottom-left': { bottom: '10px', left: '10px' }
    };
    return styles[position];
  }, [position]);

  // Обработчики событий (принцип Controller)
  const handleToggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const handleToggleAutoRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoRefresh(prev => !prev);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleCreateSnapshot = useCallback(() => {
    stickyDebugger.captureSnapshot('manual');
  }, []);

  // Не показываем в production (принцип: безопасность)
  if (ENV.isProduction) {
    return null;
  }

  return (
    <div
      className={`sticky-debug-panel ${className}`.trim()}
      style={{
        position: 'fixed',
        ...positionStyles,
        width: collapsed ? '200px' : '400px',
        maxHeight: '500px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        zIndex: 999999,
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Заголовок панели */}
      <DebugPanelHeader
        collapsed={collapsed}
        autoRefresh={autoRefresh}
        onToggleCollapsed={handleToggleCollapsed}
        onToggleAutoRefresh={handleToggleAutoRefresh}
      />

      {!collapsed && (
        <>
          {/* Табы */}
          <DebugPanelTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Контент */}
          <div style={{
            padding: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {activeTab === 'events' && (
              <EventsTab events={events.slice(-20)} />
            )}

            {activeTab === 'performance' && (
              <PerformanceTab analysis={performance} />
            )}

            {activeTab === 'snapshots' && (
              <SnapshotsTab
                snapshots={snapshots.slice(-10)}
                onCreateSnapshot={handleCreateSnapshot}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
});

/**
 * Компонент заголовка панели
 * Принцип Single Responsibility: только логика заголовка
 */
interface DebugPanelHeaderProps {
  collapsed: boolean;
  autoRefresh: boolean;
  onToggleCollapsed: () => void;
  onToggleAutoRefresh: (e: React.MouseEvent) => void;
}

const DebugPanelHeader: React.FC<DebugPanelHeaderProps> = React.memo(({
  collapsed,
  autoRefresh,
  onToggleCollapsed,
  onToggleAutoRefresh
}) => (
  <div
    style={{
      padding: '8px 12px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer'
    }}
    onClick={onToggleCollapsed}
  >
    <span style={{ fontWeight: 'bold' }}>
      🔧 Sticky Debug {collapsed ? '(collapsed)' : ''}
    </span>
    <div style={{ display: 'flex', gap: '4px' }}>
      <button
        onClick={onToggleAutoRefresh}
        style={{
          background: autoRefresh ? '#4CAF50' : 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
        title={autoRefresh ? 'Остановить автообновление' : 'Запустить автообновление'}
      >
        {autoRefresh ? '⏸️' : '▶️'}
      </button>
      <span style={{ cursor: 'pointer' }}>
        {collapsed ? '📈' : '📉'}
      </span>
    </div>
  </div>
));

/**
 * Компонент табов
 * Принцип: переиспользуемый UI компонент
 */
interface DebugPanelTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const DebugPanelTabs: React.FC<DebugPanelTabsProps> = React.memo(({
  activeTab,
  onTabChange
}) => (
  <div style={{
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  }}>
    {(['events', 'performance', 'snapshots'] as const).map(tab => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        style={{
          flex: 1,
          padding: '6px 8px',
          background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'transparent',
          border: 'none',
          color: 'white',
          fontSize: '11px',
          cursor: 'pointer',
          textTransform: 'capitalize'
        }}
      >
        {tab}
      </button>
    ))}
  </div>
));

/**
 * Таб с событиями
 * Принцип Pure Component: только отображение данных
 */
interface EventsTabProps {
  events: readonly any[];
}

const EventsTab: React.FC<EventsTabProps> = React.memo(({ events }) => (
  <div>
    <div style={{ marginBottom: '8px', fontSize: '11px', opacity: 0.7 }}>
      Последние {events.length} событий:
    </div>

    {events.length === 0 ? (
      <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>
        Нет событий для отображения
      </div>
    ) : (
      events.map((event, index) => (
        <EventItem
          key={event.id}
          event={event}
          isLatest={index === 0}
        />
      ))
    )}
  </div>
));

/**
 * Отдельный компонент для события
 * Принцип: композиция мелких компонентов
 */
interface EventItemProps {
  event: any;
  isLatest: boolean;
}

const EventItem: React.FC<EventItemProps> = React.memo(({ event, isLatest }) => (
  <div
    style={{
      marginBottom: '4px',
      padding: '4px',
      backgroundColor: isLatest ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)',
      borderRadius: '4px',
      fontSize: '10px'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{getEventIcon(event.type)} {event.elementId}</span>
      <span style={{ opacity: 0.6 }}>
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </div>
    <div style={{ marginTop: '2px', opacity: 0.8 }}>
      {event.data.message}
    </div>
  </div>
));

/**
 * Таб с производительностью
 */
interface PerformanceTabProps {
  analysis: any;
}

const PerformanceTab: React.FC<PerformanceTabProps> = React.memo(({ analysis }) => (
  <div>
    {analysis.summary ? (
      <>
        <div style={{ marginBottom: '8px' }}>
          <strong>📊 Сводка:</strong>
        </div>

        <div style={{ fontSize: '10px', marginBottom: '8px' }}>
          <div>Элементов: {analysis.summary.totalElements}</div>
          <div>Средний рендер: {analysis.summary.avgRenderTime}мс</div>
          <div>Макс рендер: {analysis.summary.maxRenderTime}мс</div>
          <div>Медленных: {analysis.summary.slowElementsCount}</div>
        </div>

        {analysis.slowElements?.length > 0 && (
          <SlowElementsList elements={analysis.slowElements} />
        )}

        {analysis.recommendations?.length > 0 && (
          <RecommendationsList recommendations={analysis.recommendations} />
        )}
      </>
    ) : (
      <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>
        {analysis.summary}
      </div>
    )}
  </div>
));

/**
 * Список медленных элементов
 */
interface SlowElementsListProps {
  elements: any[];
}

const SlowElementsList: React.FC<SlowElementsListProps> = React.memo(({ elements }) => (
  <>
    <div style={{ marginBottom: '4px', fontSize: '11px' }}>
      <strong>🐌 Медленные элементы:</strong>
    </div>
    {elements.map((el: any) => (
      <div key={el.id} style={{ fontSize: '10px', marginBottom: '2px' }}>
        {el.id}: {el.renderTime.toFixed(2)}мс
      </div>
    ))}
  </>
));

/**
 * Список рекомендаций
 */
interface RecommendationsListProps {
  recommendations: string[];
}

const RecommendationsList: React.FC<RecommendationsListProps> = React.memo(({ recommendations }) => (
  <>
    <div style={{ marginTop: '8px', marginBottom: '4px', fontSize: '11px' }}>
      <strong>💡 Рекомендации:</strong>
    </div>
    {recommendations.map((rec: string, index: number) => (
      <div key={index} style={{ fontSize: '10px', marginBottom: '2px', opacity: 0.8 }}>
        • {rec}
      </div>
    ))}
  </>
));

/**
 * Таб со снимками
 */
interface SnapshotsTabProps {
  snapshots: readonly any[];
  onCreateSnapshot: () => void;
}

const SnapshotsTab: React.FC<SnapshotsTabProps> = React.memo(({
  snapshots,
  onCreateSnapshot
}) => (
  <div>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    }}>
      <span style={{ fontSize: '11px', opacity: 0.7 }}>
        Снимков: {snapshots.length}
      </span>
      <button
        onClick={onCreateSnapshot}
        style={{
          background: '#2196F3',
          border: 'none',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
        title="Создать снимок текущего состояния"
      >
        📸 Создать
      </button>
    </div>

    {snapshots.length === 0 ? (
      <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>
        Нет снимков для отображения
      </div>
    ) : (
      snapshots.map((snapshot, index) => (
        <SnapshotItem
          key={snapshot.timestamp}
          snapshot={snapshot}
          index={snapshots.length - index}
        />
      ))
    )}
  </div>
));

/**
 * Отдельный компонент для снимка
 */
interface SnapshotItemProps {
  snapshot: any;
  index: number;
}

const SnapshotItem: React.FC<SnapshotItemProps> = React.memo(({ snapshot, index }) => (
  <div
    style={{
      marginBottom: '4px',
      padding: '4px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '4px',
      fontSize: '10px'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>📸 Снимок #{index}</span>
      <span style={{ opacity: 0.6 }}>
        {new Date(snapshot.timestamp).toLocaleTimeString()}
      </span>
    </div>
    <div style={{ marginTop: '2px', opacity: 0.8 }}>
      Elements: {Object.keys(snapshot.elements || {}).length} |
      Viewport: {snapshot.viewport?.width || 0}x{snapshot.viewport?.height || 0}
    </div>
  </div>
));

/**
 * Утилитарная функция для получения иконки события
 * Принцип Pure Function: без побочных эффектов
 */
function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'debug': '🔍',
    'state-change': '🔄',
    'config-update': '⚙️',
    'registration': '📝',
    'unregistration': '🗑️'
  };

  return icons[type] || '📌';
}
