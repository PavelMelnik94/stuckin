/**
 * Основной хук для работы со sticky элементами
 * - SRP: отвечает только за управление одним sticky элементом
 * - Information Expert: знает о своем lifecycle
 * - Low Coupling: минимальная зависимость от контекста
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';


// Реэкспорт типов для удобства
export type { UseStickyOptions, UseStickyReturn } from '@/types/sticky.types';

import { generateId } from '@/utils/id';
import type { StickyConfig, UseStickyOptions, UseStickyReturn } from '@/types/sticky.types';
import { useStickyContext } from '@/context/StickyContext';
import { debugLogger } from '@/debug/debugLogger';

// Используем интерфейсы из общих типов

/**
 * Основной хук для работы со sticky элементами
 * Принцип SRP: отвечает только за управление одним sticky элементом
 */
export const useSticky = (options: UseStickyOptions): UseStickyReturn => {
  const context = useStickyContext();
  const elementRef = useRef<HTMLElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Генерируем уникальный ID если не передан
  const stickyId = useMemo(() => {
    const id = options.id || `${generateId()}`;

    // 🔧 Логирование создания ID
    debugLogger.debug(id, 'Sticky ID создан', {
      providedId: options.id,
      generatedId: id,
      isGenerated: !options.id
    });

    return id;
  }, [options.id]);

  // === РЕШЕНИЕ ПРОБЛЕМЫ exactOptionalPropertyTypes ===

  /**
   * Создание типобезопасной конфигурации
   * Решение 1: Условное добавление свойств (рекомендуемое)
   */
  const config = useMemo((): StickyConfig => {
    // Создаем базовую конфигурацию
    const baseConfig: StickyConfig = {
      id: stickyId,
      direction: options.direction || 'top',
      offset: options.offset || { top: 0 },
      priority: options.priority || 0,
      disabled: options.enabled === false,
      smooth: options.smooth ?? true
    };

    // Условно добавляем опциональные свойства только если они определены
    const configWithOptionals = {
      ...baseConfig,
      ...(options.boundary !== undefined && { boundary: options.boundary }),
      ...(options.zIndex !== undefined && { zIndex: options.zIndex }),
      ...(options.breakpoints !== undefined && { breakpoints: options.breakpoints })
    };

    // 🔧 Логирование создания конфигурации
    debugLogger.debug(stickyId, 'Конфигурация создана', {
      config: configWithOptionals,
      hasOptionalBoundary: options.boundary !== undefined,
      hasOptionalZIndex: options.zIndex !== undefined,
      hasOptionalBreakpoints: options.breakpoints !== undefined
    });

    return configWithOptionals;
  }, [
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
   * Принцип Information Expert: хук знает когда элемент готов к регистрации
   */
  useEffect(() => {
    if (!elementRef.current || context.isSSR) {
      // 🔧 Логирование пропуска регистрации
      debugLogger.debug(stickyId, 'Регистрация пропущена', {
        hasElement: !!elementRef.current,
        isSSR: context.isSSR,
        reason: !elementRef.current ? 'no element' : 'SSR mode'
      });
      return;
    }

    try {
      // 🔧 Логирование начала регистрации
      debugLogger.registration(stickyId, {
        config,
        elementInfo: {
          tagName: elementRef.current.tagName,
          className: elementRef.current.className,
          bounds: elementRef.current.getBoundingClientRect()
        },
        contextStats: {
          totalElements: context.elements.size,
          totalGroups: context.groups.size
        }
      });

      // Регистрируем элемент
      context.registerSticky(elementRef.current, config);

      // Добавляем в группу если указана
      if (options.groupId) {
        context.addToGroup(stickyId, options.groupId);

        // 🔧 Логирование добавления в группу
        debugLogger.info(stickyId, `Элемент добавлен в группу: ${options.groupId}`, {
          groupId: options.groupId
        });
      }

      setIsInitialized(true);

      // 🔧 Логирование успешной регистрации
      debugLogger.info(stickyId, 'Элемент успешно зарегистрирован', {
        hasGroup: !!options.groupId,
        initializationTime: Date.now()
      });

    } catch (error) {
      // 🔧 Логирование ошибки регистрации
      debugLogger.error(stickyId, 'Ошибка при регистрации элемента', {
        error: error instanceof Error ? error.message : 'Unknown error',
        config,
        elementInfo: elementRef.current ? {
          tagName: elementRef.current.tagName,
          className: elementRef.current.className
        } : null
      });

      // Повторно выбрасываем ошибку для обработки выше по стеку
      throw error;
    }

    // Cleanup функция
    return () => {
      try {
        // 🔧 Логирование начала очистки
        debugLogger.info(stickyId, 'Начало очистки элемента', {
          wasInitialized: isInitialized,
          hasGroup: !!options.groupId
        });

        context.unregisterSticky(stickyId);

        // 🔧 Логирование успешной очистки
        debugLogger.unregistration(stickyId, 'component unmount');

      } catch (error) {
        // 🔧 Логирование ошибки очистки
        debugLogger.error(stickyId, 'Ошибка при очистке элемента', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  }, [context, config, stickyId, options.groupId]);

  /**
   * Обновление конфигурации при изменении опций
   * Принцип DRY: избегаем дублирования логики обновления
   */
  useEffect(() => {
    if (!context.elements.has(stickyId)) {
      // 🔧 Логирование попытки обновления несуществующего элемента
      debugLogger.warning(stickyId, 'Попытка обновить конфигурацию несуществующего элемента', {
        availableElements: Array.from(context.elements.keys()),
        isInitialized
      });
      return;
    }

    try {
      // 🔧 Логирование обновления конфигурации
      debugLogger.configUpdate(stickyId, {
        newConfig: config,
        timestamp: Date.now()
      });

      context.updateConfig(stickyId, config);

    } catch (error) {
      // 🔧 Логирование ошибки обновления конфигурации
      debugLogger.error(stickyId, 'Ошибка при обновлении конфигурации', {
        error: error instanceof Error ? error.message : 'Unknown error',
        config
      });
    }
  }, [context, stickyId, config, isInitialized]);

  /**
   * Получаем текущее состояние элемента (реактивно через MobX)
   * Принцип Observer Pattern: реагируем на изменения состояния
   */
  const element = context.elements.get(stickyId);
  const state = element?.state || 'normal';
  const isSticky = state === 'sticky';
  const isActive = element?.isActive || false;

  /**
   * Callback для уведомления о смене состояния
   * Принцип Low Coupling: слабая связь с внешними callback'ами
   */
  useEffect(() => {
    if (!options.onStateChange || !state) return;

    try {
      // 🔧 Логирование вызова callback
      debugLogger.debug(stickyId, 'Вызов onStateChange callback', {
        oldState: element?.previousState || null,
        newState: state,
        isSticky,
        isActive,
        callbackType: typeof options.onStateChange
      });

      options.onStateChange(state);

      // 🔧 Логирование успешного callback
      debugLogger.debug(stickyId, 'onStateChange callback выполнен успешно');

    } catch (error) {
      // 🔧 Логирование ошибки в callback
      debugLogger.error(stickyId, 'Ошибка в onStateChange callback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        state,
        callbackSource: 'user provided'
      });

      // Не выбрасываем ошибку дальше, чтобы не сломать работу хука
    }
  }, [state, isSticky, isActive, options.onStateChange, stickyId, element]);

  /**
   * Методы для управления элементом
   * Принцип Command Pattern: инкапсулируем команды в функции
   */
  const updateConfig = useCallback((newConfig: Partial<StickyConfig>) => {
    try {
      // 🔧 Логирование программного обновления конфигурации
      debugLogger.configUpdate(stickyId, {
        currentConfig: config,
        updates: newConfig,
        source: 'updateConfig method'
      });

      context.updateConfig(stickyId, newConfig);

    } catch (error) {
      // 🔧 Логирование ошибки программного обновления
      debugLogger.error(stickyId, 'Ошибка в updateConfig', {
        error: error instanceof Error ? error.message : 'Unknown error',
        newConfig
      });

      throw error; // Выбрасываем дальше для обработки в UI
    }
  }, [context, stickyId, config]);

  const refresh = useCallback(() => {
    try {
      // 🔧 Логирование программного обновления
      debugLogger.info(stickyId, 'Программное обновление через refresh()', {
        contextStats: {
          totalElements: context.elements.size,
          activeElements: context.getActiveElements().length
        }
      });

      context.refreshAll();

    } catch (error) {
      // 🔧 Логирование ошибки обновления
      debugLogger.error(stickyId, 'Ошибка в refresh()', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }, [context, stickyId]);

  const disable = useCallback(() => {
    try {
      // 🔧 Логирование отключения
      debugLogger.info(stickyId, 'Элемент отключается через disable()', {
        wasActive: isActive,
        currentState: state
      });

      updateConfig({ disabled: true });

    } catch (error) {
      // 🔧 Логирование ошибки отключения
      debugLogger.error(stickyId, 'Ошибка в disable()', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }, [updateConfig, stickyId, isActive, state]);

  const enable = useCallback(() => {
    try {
      // 🔧 Логирование включения
      debugLogger.info(stickyId, 'Элемент включается через enable()', {
        wasDisabled: config.disabled,
        currentState: state
      });

      updateConfig({ disabled: false });

    } catch (error) {
      // 🔧 Логирование ошибки включения
      debugLogger.error(stickyId, 'Ошибка в enable()', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }, [updateConfig, stickyId, config.disabled, state]);

  // 🔧 Логирование каждого рендера (только в debug режиме)
  useEffect(() => {
    debugLogger.debug(stickyId, 'Hook рендер', {
      state,
      isSticky,
      isActive,
      isInitialized,
      configHash: JSON.stringify(config).length // Простой хеш для отслеживания изменений
    });
  });

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
