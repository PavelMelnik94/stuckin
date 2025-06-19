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
- `StickyGroup` - Контейнер для группировки sticky элементов (ранее `StickyContainer`)
- `StickyContainer` - Sticky элементы внутри кастомных скролл-контейнеров (ранее `StickyInContainer`)
- `DebugPanel` - Панель отладки (только в development)
- `StickyProvider` - Провайдер контекста

### Hooks

- `useSticky` - Основной хук для работы со sticky элементами
- `useStickyInContainer` - Sticky элементы в контейнерах (ранее `useStickyContainer`)
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

### Changed - 2025-06-19

#### 🔧 Semantic Renaming - Better Developer Experience

**BREAKING CHANGES**: Компоненты и хуки переименованы для лучшей семантики и понимания:

- `StickyContainer` (групповой контейнер) → `StickyGroup`
- `StickyInContainer` (sticky внутри контейнера) → `StickyContainer`
- `useStickyContainer` → `useStickyInContainer`

**Обоснование изменений:**
- `StickyGroup` - четко указывает на контейнер для управления группой sticky элементов
- `StickyContainer` - четко указывает на sticky элемент, работающий внутри кастомного скролл-контейнера
- `useStickyInContainer` - четко указывает на хук для sticky поведения внутри контейнеров

#### 🔄 Migration Guide

**Компоненты:**
```tsx
// Было:
import { StickyContainer, StickyInContainer } from 'stuckin';

// Стало:
import { StickyGroup, StickyContainer } from 'stuckin';
```

**Хуки:**
```tsx
// Было:
import { useStickyContainer } from 'stuckin';

// Стало:
import { useStickyInContainer } from 'stuckin';
```

#### ✅ Что осталось без изменений

- Вся функциональность сохранена без изменений
- API полностью совместимо, изменились только названия
- Все типы TypeScript обновлены автоматически
- Производительность и тесты не затронуты

#### 🧪 Testing

- Добавлены новые unit-тесты для `StickyContainer` компонента
- Добавлены новые unit-тесты для `useStickyInContainer` хука
- Обновлены существующие тесты для `StickyGroup`
- Все 376 тестов проходят успешно

### В разработке

- Дополнительные стратегии позиционирования
- Расширенные возможности анимации
- Интеграция с популярными CSS-in-JS библиотеками
