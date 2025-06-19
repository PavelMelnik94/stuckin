/**
 * Типы для sticky функциональности
 * Принцип Interface Segregation: разделяем интерфейсы по назначению
 */

import React from 'react';

// === БАЗОВЫЕ ТИПЫ ===

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

// === ОСНОВНЫЕ ИНТЕРФЕЙСЫ ===

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
  positionStrategy?: string; // Для custom positioning strategies
}

export interface StickyElement {
  id: string;
  element: HTMLElement;
  config: StickyConfig;
  state: StickyState;
  previousState: StickyState | null;
  originalPosition: DOMRect;
  currentZIndex: number;
  isActive: boolean;
  lastUpdate: number;
  transitionCount: number;
}

export interface StickyGroup {
  id: string;
  elements: Map<string, StickyElement>;
  priority: number;
  maxZIndex: number;
}

// === HOOK ТИПЫ (добавляем недостающие) ===

/**
 * Опции для useSticky хука
 */
export interface UseStickyOptions extends Omit<StickyConfig, 'id' | 'priority'> {
  id?: string;
  priority?: number;
  enabled?: boolean;
  onStateChange?: (state: StickyState) => void;
  groupId?: string;
}

/**
 * Возвращаемые значения useSticky хука
 */
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
 * Опции для useStickyGroup хука
 */
export interface UseStickyGroupOptions {
  groupId: string;
  priority?: number;
  autoCreate?: boolean;
}

/**
 * Возвращаемые значения useStickyGroup хука
 */
export interface UseStickyGroupReturn {
  elements: StickyElement[];
  activeElements: StickyElement[];
  addElement: (elementId: string) => void;
  removeElement: (elementId: string) => void;
  refreshGroup: () => void;
  getTotalHeight: () => number;
  getGroupBounds: () => DOMRect | null;
}

/**
 * Опции для useResponsiveSticky хука
 */
export interface UseResponsiveStickyOptions extends Omit<UseStickyOptions, 'direction' | 'offset'> {
  responsive: ResponsiveConfig;
  fallback?: Partial<StickyConfig>;
}

/**
 * Возвращаемые значения useResponsiveSticky хука
 */
export interface UseResponsiveStickyReturn extends UseStickyReturn {
  currentBreakpoint: string | null;
  responsiveConfig: Partial<StickyConfig>;
  isResponsiveDisabled: boolean;
}

/**
 * Опции для useSSRSticky хука
 */
export interface UseSSRStickyOptions extends UseStickyOptions {
  ssr?: SSRConfig;
}

/**
 * Возвращаемые значения useSSRSticky хука
 */
export interface UseSSRStickyReturn extends UseStickyReturn {
  isSSR: boolean;
  isHydrated: boolean;
  shouldSuppressWarning: boolean;
}

/**
 * Опции для useDebugSticky хука
 */
export interface UseDebugStickyOptions extends UseStickyOptions {
  debugLabel?: string;
  debugConfig?: {
    logStateChanges?: boolean;
    logConfigUpdates?: boolean;
    captureSnapshots?: boolean;
    trackPerformance?: boolean;
  };
}

/**
 * Возвращаемые значения useDebugSticky хука
 */
export interface UseDebugStickyReturn extends UseStickyReturn {
  debugRender: <T>(fn: () => T) => T;
  captureSnapshot: (label?: string) => unknown;
  logDebug: (message: string, data?: unknown) => void;
  debugLabel: string;
  debugHistory: unknown[];
}

// === RESPONSIVE ТИПЫ ===

export interface ResponsiveConfig {
  mobile: Partial<StickyConfig>;
  tablet: Partial<StickyConfig>;
  desktop: Partial<StickyConfig>;
  largeDesktop?: Partial<StickyConfig>;
}

export interface Breakpoint {
  name: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  orientation?: 'portrait' | 'landscape';
}

// === SSR ТИПЫ ===

export interface SSRConfig {
  enabled: boolean;
  fallbackHeight?: number;
  hydrationDelay?: number;
  suppressHydrationWarning?: boolean;
}

export interface SSRStickyState {
  isSSR: boolean;
  isHydrated: boolean;
  shouldSuppressWarning: boolean;
}

// === CONTEXT ТИПЫ ===

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

// === КОМПОНЕНТ ТИПЫ ===

/**
 * Props для Sticky компонента
 */
export interface StickyProps extends UseStickyOptions {
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  tag?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
}

/**
 * Ref для Sticky компонента
 */
export interface StickyRef {
  element: HTMLElement | null;
  state: StickyState | null;
  isSticky: boolean;
  refresh: () => void;
  disable: () => void;
  enable: () => void;
}

/**
 * Props для StickyContainer компонента
 */
export interface StickyContainerProps {
  children: React.ReactNode;
  groupId: string;
  priority?: number;
  className?: string;
  style?: React.CSSProperties;
  onGroupChange?: (elements: StickyElement[]) => void;
}

/**
 * Ref для StickyContainer компонента
 */
export interface StickyContainerRef {
  elements: StickyElement[];
  activeElements: StickyElement[];
  totalHeight: number;
  refreshGroup: () => void;
}
