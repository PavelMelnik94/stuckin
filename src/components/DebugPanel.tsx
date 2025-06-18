import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { stickyDebugger } from '../debug/StickyDebugger';

interface DebugPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  collapsed?: boolean;
  className?: string;
}

/**
 * Визуальная панель отладки для sticky элементов
 * Принцип Interface Segregation: отдельный интерфейс для UI компонента
 */
export const DebugPanel: React.FC<DebugPanelProps> = observer(({
  position = 'top-right',
  collapsed: initialCollapsed = false,
  className = ''
}) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<'events' | 'performance' | 'snapshots'>('events');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const events = stickyDebugger.filteredEvents;
  const performance = stickyDebugger.performanceAnalysis;
  const snapshots = stickyDebugger.snapshots;

  /**
   * Автообновление данных
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Принудительное обновление компонента
      // MobX автоматически обновит при изменении observable данных
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  /**
   * Стили позиционирования
   */
  const positionStyles = {
    'top-right': { top: '10px', right: '10px' },
    'top-left': { top: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Не показываем в production
  }

  return (
    <div
      className={`sticky-debug-panel ${className}`}
      style={{
        position: 'fixed',
        ...positionStyles[position],
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
        onClick={() => setCollapsed(!collapsed)}
      >
        <span style={{ fontWeight: 'bold' }}>
          🔧 Sticky Debug {collapsed ? '(collapsed)' : ''}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAutoRefresh(!autoRefresh);
            }}
            style={{
              background: autoRefresh ? '#4CAF50' : 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
          >
            {autoRefresh ? '⏸️' : '▶️'}
          </button>
          <span style={{ cursor: 'pointer' }}>
            {collapsed ? '📈' : '📉'}
          </span>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Табы */}
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            {(['events', 'performance', 'snapshots'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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
              <SnapshotsTab snapshots={snapshots.slice(-10)} />
            )}
          </div>
        </>
      )}
    </div>
  );
});

/**
 * Таб с событиями
 */
const EventsTab: React.FC<{ events: any[] }> = ({ events }) => (
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
        <div
          key={event.id}
          style={{
            marginBottom: '4px',
            padding: '4px',
            backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)',
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
      ))
    )}
  </div>
);

/**
 * Таб с производительностью
 */
const PerformanceTab: React.FC<{ analysis: any }> = ({ analysis }) => (
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
          <>
            <div style={{ marginBottom: '4px', fontSize: '11px' }}>
              <strong>🐌 Медленные элементы:</strong>
            </div>
            {analysis.slowElements.map((el: any) => (
              <div key={el.id} style={{ fontSize: '10px', marginBottom: '2px' }}>
                {el.id}: {el.renderTime.toFixed(2)}мс
              </div>
            ))}
          </>
        )}

        {analysis.recommendations?.length > 0 && (
          <>
            <div style={{ marginTop: '8px', marginBottom: '4px', fontSize: '11px' }}>
              <strong>💡 Рекомендации:</strong>
            </div>
            {analysis.recommendations.map((rec: string, index: number) => (
              <div key={index} style={{ fontSize: '10px', marginBottom: '2px', opacity: 0.8 }}>
                • {rec}
              </div>
            ))}
          </>
        )}
      </>
    ) : (
      <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>
        {analysis.summary}
      </div>
    )}
  </div>
);

/**
 * Таб со снимками
 */
const SnapshotsTab: React.FC<{ snapshots: any[] }> = ({ snapshots }) => (
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
        onClick={() => stickyDebugger.captureSnapshot('manual')}
        style={{
          background: '#2196F3',
          border: 'none',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        📸 Создать
      </button>
    </div>

    {snapshots.map((snapshot, index) => (
      <div
        key={snapshot.timestamp}
        style={{
          marginBottom: '4px',
          padding: '4px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
          fontSize: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>📸 Снимок #{snapshots.length - index}</span>
          <span style={{ opacity: 0.6 }}>
            {new Date(snapshot.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div style={{ marginTop: '2px', opacity: 0.8 }}>
          Elements: {Object.keys(snapshot.elements).length} |
          Viewport: {snapshot.viewport.width}x{snapshot.viewport.height}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Утилитарная функция для получения иконки события
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
