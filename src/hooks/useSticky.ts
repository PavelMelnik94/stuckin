import { useEffect, useRef, useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStickyContext } from '../context/StickyContext';
import { StickyConfig, StickyState } from '../types/sticky.types';

export interface UseStickyOptions extends Omit<StickyConfig, 'id'> {
  id?: string;
  enabled?: boolean;
  onStateChange?: (state: StickyState) => void;
  groupId?: string;
}

export interface UseStickyReturn {
  ref: React.RefObject<HTMLElement>;
  state: StickyState | null;
  isSticky: boolean;
  isActive: boolean;
  updateConfig: (config: Partial<StickyConfig>) => void;
  refresh: () => void;
  disable: () => void;
  enable: () => void;
}

/**
 * Основной хук для работы со sticky элементами
 * Принцип SRP: отвечает только за управление одним sticky элементом
 */
export const useSticky = (options: UseStickyOptions): UseStickyReturn => {
  const context = useStickyContext();
  const elementRef = useRef<HTMLElement>(null);

  // Генерируем уникальный ID если не передан
  const stickyId = useMemo(() =>
    options.id || `sticky-${Math.random().toString(36).substr(2, 9)}`,
    [options.id]
  );

  // Мемоизируем конфигурацию для предотвращения лишних перерендеров
  const config = useMemo((): StickyConfig => ({
    id: stickyId,
    direction: options.direction || 'top',
    offset: options.offset || { top: 0 },
    priority: options.priority || 0,
    boundary: options.boundary,
    zIndex: options.zIndex,
    disabled: options.enabled === false,
    smooth: options.smooth ?? true,
    breakpoints: options.breakpoints
  }), [
    stickyId,
    options.direction,
    options.offset,
    options.priority,
    options.boundary,
    options.zIndex,
    options.enabled,
    options.smooth,
    options.breakpoints
  ]);

  /**
   * Регистрация элемента при монтировании
   */
  useEffect(() => {
    if (!elementRef.current || context.isSSR) return;

    context.registerSticky(elementRef.current, config);

    // Добавляем в группу если указана
    if (options.groupId) {
      context.addToGroup(stickyId, options.groupId);
    }

    return () => {
      context.unregisterSticky(stickyId);
    };
  }, [context, config, stickyId, options.groupId]);

  /**
   * Обновление конфигурации при изменении опций
   */
  useEffect(() => {
    if (context.elements.has(stickyId)) {
      context.updateConfig(stickyId, config);
    }
  }, [context, stickyId, config]);

  /**
   * Получаем текущее состояние элемента (реактивно через MobX)
   */
  const element = context.elements.get(stickyId);
  const state = element?.state || null;
  const isSticky = state === 'sticky';
  const isActive = element?.isActive || false;

  /**
   * Callback для уведомления о смене состояния
   */
  useEffect(() => {
    if (options.onStateChange && state) {
      options.onStateChange(state);
    }
  }, [state, options.onStateChange]);

  /**
   * Методы для управления элементом
   */
  const updateConfig = useCallback((newConfig: Partial<StickyConfig>) => {
    context.updateConfig(stickyId, newConfig);
  }, [context, stickyId]);

  const refresh = useCallback(() => {
    context.refreshAll();
  }, [context]);

  const disable = useCallback(() => {
    updateConfig({ disabled: true });
  }, [updateConfig]);

  const enable = useCallback(() => {
    updateConfig({ disabled: false });
  }, [updateConfig]);

  return {
    ref: elementRef,
    state,
    isSticky,
    isActive,
    updateConfig,
    refresh,
    disable,
    enable
  };
};
