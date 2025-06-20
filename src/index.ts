/**
 * Главная точка входа в библиотеку
 * Принцип: экспортируем только публичное// Версия библиотеки
export const VERSION = '1.0.19';PI для tree-shaking
 */

// Основные компоненты
export { Sticky, StickyContainer, StickyGroup, DebugPanel } from './components';

// Хуки
export {
  useSticky,
  useStickyGroup,
  useStickyObserver,
  useResponsiveSticky,
  useSSRSticky,
  useDebugSticky,
  useStickyInContainer,
  useStickyGroupGroup
} from './hooks';

// Дополнительные типы для контейнеров
export type { UseStickyContainerOptions } from './hooks/useStickyInContainer';
export type { StickyContainerProps, StickyContainerRef } from './components/StickyContainer';
export type { StickyGroupProps, StickyGroupRef } from './components/StickyGroup';

// Контекст
export { StickyProvider, useStickyContext } from './context/StickyContext';

// Типы (полный набор для публичного API)
export type {
  // Базовые типы
  StickyConfig,
  StickyState,
  StickyDirection,
  StickyPosition,
  StickyElement,
  StickyBoundary,

  // Hook типы
  UseStickyOptions,
  UseStickyReturn,
  UseStickyGroupOptions,
  UseStickyGroupReturn,
  UseResponsiveStickyOptions,
  UseResponsiveStickyReturn,
  UseSSRStickyOptions,
  UseSSRStickyReturn,
  UseDebugStickyOptions,
  UseDebugStickyReturn,

  // Компонент типы
  StickyProps,
  StickyRef,

  // Responsive типы
  ResponsiveConfig,
  Breakpoint,

  // SSR типы
  SSRConfig,
  SSRStickyState,

  // Context типы
  StickyContextValue,

  // Advanced strategy типы
  ParallaxConfig,
  MagneticConfig,
  FollowScrollConfig,
  AnimatedConfig,
  StackingConfig
} from './types/sticky.types';

// Утилиты (только публичные)
export { responsiveManager, DEFAULT_BREAKPOINTS } from './utils/responsive';
export { performanceMonitor } from './utils/performance';
export { stickyDebugger } from './debug/StickyDebugger';

// Стили
import './styles/sticky.scss';

// Версия библиотеки
export const VERSION = '1.0.29';
