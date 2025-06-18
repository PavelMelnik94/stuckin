// Дополнения к существующему StickyManager для интеграции с отладкой

import { stickyDebugger } from '../debug/StickyDebugger';
import { performanceMonitor } from '../utils/performance';

// Добавляем в класс StickyManager следующие методы:

/**
 * Расширенная регистрация с отладкой
 */
@action
registerStickyWithDebug(htmlElement: HTMLElement, config: StickyConfig): void {
  try {
    // Замеряем производительность
    performanceMonitor.measureRenderTime(config.id, () => {
      this.registerSticky(htmlElement, config);
    });

    stickyDebugger.log(
      'registration',
      config.id,
      'Элемент успешно зарегистрирован',
      { config, elementTag: htmlElement.tagName }
    );

    // Проверяем конфигурацию на потенциальные проблемы
    this.validateElementConfig(config);

  } catch (error) {
    stickyDebugger.log(
      'error',
      config.id,
      'Ошибка при регистрации элемента',
      { error: error.message, config }
    );
    throw error;
  }
}

/**
 * Валидация конфигурации элемента
 */
private validateElementConfig(config: StickyConfig): void {
  const warnings: string[] = [];

  // Проверка z-index конфликтов
  const conflictingElements = Array.from(this.elements.values()).filter(
    el => el.currentZIndex === (config.zIndex || 1000) && el.id !== config.id
  );

  if (conflictingElements.length > 0) {
    warnings.push(
      `Возможный конфликт z-index с элементами: ${conflictingElements.map(el => el.id).join(', ')}`
    );
  }

  // Проверка производительности
  if (this.elements.size > 10) {
    warnings.push('Большое количество sticky элементов может повлиять на производительность');
  }

  // Проверка корректности offset
  if (config.offset && Object.keys(config.offset).length === 0) {
    warnings.push('Пустой объект offset может привести к неожиданному поведению');
  }

  // Логируем предупреждения
  warnings.forEach(warning => {
    stickyDebugger.log('warning', config.id, warning);
  });
}

/**
 * Обновление состояния с отладкой
 */
@action
private updateStickyStateWithDebug(element: StickyElement): void {
  const prevState = element.state;

  // Замеряем производительность обновления
  const updateTime = performanceMonitor.measureRenderTime(element.id, () => {
    this.updateStickyState(element);
  });

  // Отслеживаем пересчеты
  performanceMonitor.trackRecomputation(element.id);

  // Логируем изменения состояния
  if (element.state !== prevState) {
    stickyDebugger.log(
      'state-change',
      element.id,
      `Состояние изменилось: ${prevState} → ${element.state}`,
      {
        previousState: prevState,
        currentState: element.state,
        updateTime,
        elementRect: element.element.getBoundingClientRect()
      }
    );

    // Автоматическое создание снимка при критических изменениях
    if (stickyDebugger.config.autoCapture && element.state === 'sticky') {
      stickyDebugger.captureSnapshot(`${element.id}-became-sticky`);
    }
  }
}

/**
 * Получение debug информации для интеграции с debugger
 */
getDebugInfo() {
  return {
    elements: Array.from(this.elements.entries()).reduce((acc, [id, element]) => {
      acc[id] = {
        id: element.id,
        state: element.state,
        isActive: element.isActive,
        config: element.config,
        currentZIndex: element.currentZIndex,
        elementRect: element.element.getBoundingClientRect()
      };
      return acc;
    }, {} as Record<string, any>),

    groups: Array.from(this.groups.entries()).reduce((acc, [id, group]) => {
      acc[id] = {
        id: group.id,
        priority: group.priority,
        maxZIndex: group.maxZIndex,
        elementCount: group.elements.size
      };
      return acc;
    }, {} as Record<string, any>),

    performance: {
      totalElements: this.elements.size,
      activeElements: this.activeElements.length,
      totalGroups: this.groups.size
    }
  };
}
