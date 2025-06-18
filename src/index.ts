/**
 * Главная точка входа в библиотеку
 * Принцип: экспортируем только публичное API для tree-shaking
 */

// Основные компоненты
export { Sticky } from './components/Sticky';
export { StickyContainer } from './components/StickyContainer';
export { DebugPanel } from './components/DebugPanel';

// Хуки
export { useSticky } from './hooks/useSticky';
export { useStickyGroup } from './hooks/useStickyGroup';
export { useStickyObserver } from './hooks/useStickyObserver';
export { useResponsiveSticky } from './hooks/useResponsiveSticky';
export { useSSRSticky } from './hooks/useSSRSticky';
export { useDebugSticky } from './hooks/useDebugSticky';

// Контекст
export { StickyProvider, useStickyContext } from './context/StickyContext';

// Типы (только самые важные для публичного API)
export type {
  StickyConfig,
  StickyState,
  StickyDirection,
  StickyPosition,
  StickyElement,
  StickyGroup,
  UseStickyOptions,
  UseStickyReturn
} from './types/sticky.types';

// Утилиты (только публичные)
export { responsiveManager, DEFAULT_BREAKPOINTS } from './utils/responsive';
export { performanceMonitor } from './utils/performance';
export { stickyDebugger } from './debug/StickyDebugger';

// Стили
import './styles/sticky.scss';

// Версия библиотеки
export const VERSION = '1.0.0';
