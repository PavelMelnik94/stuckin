/**
 * Типы для sticky функциональности
 */

export type StickyDirection = 'top' | 'bottom' | 'left' | 'right';

export type StickyState = 'normal' | 'sticky' | 'bottom-reached';

export interface StickyPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface StickyBoundary {
  element: HTMLElement;
  offset?: number;
}

export interface StickyConfig {
  id: string;
  direction: StickyDirection;
  offset: StickyPosition;
  priority: number;
  boundary?: StickyBoundary;
  zIndex?: number;
  disabled?: boolean;
  smooth?: boolean;
  breakpoints?: Record<string, Partial<StickyConfig>>;
}

export interface StickyElement {
  id: string;
  element: HTMLElement;
  config: StickyConfig;
  state: StickyState;
  originalPosition: DOMRect;
  currentZIndex: number;
  isActive: boolean;
}

export interface StickyGroup {
  id: string;
  elements: Map<string, StickyElement>;
  priority: number;
  maxZIndex: number;
}

export interface StickyContextValue {
  // Основные методы
  registerSticky: (element: HTMLElement, config: StickyConfig) => void;
  unregisterSticky: (id: string) => void;
  updateConfig: (id: string, config: Partial<StickyConfig>) => void;

  // Группы
  createGroup: (groupId: string, priority: number) => void;
  addToGroup: (elementId: string, groupId: string) => void;
  removeFromGroup: (elementId: string, groupId: string) => void;

  // Состояние
  elements: Map<string, StickyElement>;
  groups: Map<string, StickyGroup>;
  isSSR: boolean;

  // Утилиты
  getElementState: (id: string) => StickyState | null;
  getActiveElements: () => StickyElement[];
  refreshAll: () => void;
}
