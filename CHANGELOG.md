# Changelog

Все важные изменения в этом проекте будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
и этот проект следует [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-19

### Added

- 🚀 Первый релиз sticky-lib
- 📌 Поддержка sticky элементов во всех направлениях (top/bottom/left/right)
- 👥 Система групп элементов с автоматическим управлением z-index
- 📱 Responsive дизайн с breakpoints
- 🌐 Полная SSR совместимость
- 🐛 Мощные инструменты отладки с DebugPanel
- ⚡ Высокая производительность с Intersection Observer API
- 🔧 Полная поддержка TypeScript из коробки
- 📦 Tree-shakable экспорты для оптимизации размера bundle

### Components

- `Sticky` - Декларативный компонент для создания sticky элементов
- `StickyContainer` - Контейнер для группировки sticky элементов
- `DebugPanel` - Панель отладки (только в development)
- `StickyProvider` - Провайдер контекста

### Hooks

- `useSticky` - Основной хук для работы со sticky элементами
- `useStickyGroup` - Управление группами элементов
- `useResponsiveSticky` - Responsive sticky с breakpoints
- `useSSRSticky` - SSR-совместимый sticky хук
- `useDebugSticky` - Расширенные возможности отладки
- `useStickyObserver` - Intersection Observer управление

### Utils

- Debug система с логированием и снимками состояния
- Performance мониторинг и оптимизации
- Responsive утилиты для breakpoints
- SSR утилиты для серверного рендеринга
- Environment проверки

### Technical Details

- **Test Coverage**: 325+ тестов, 82%+ покрытие
- **Bundle Size**: ~30KB полная библиотека (gzipped)
- **Dependencies**: Zero runtime dependencies (кроме React)
- **React Version**: 18.0.0+
- **TypeScript**: Полная поддержка типов

### Breaking Changes

- Нет breaking changes - это первый релиз

## [Unreleased]

### В разработке

- Дополнительные стратегии позиционирования
- Расширенные возможности анимации
- Интеграция с популярными CSS-in-JS библиотеками
