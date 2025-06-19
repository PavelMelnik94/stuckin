# 🏷️ Stuckin

[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

Мощная, гибкая и оптимизированная библиотека для sticky элементов с TypeScript, React 18+, и продвинутой отладкой.

## 📚 Содержание

- [✨ Features](#-features)
- [📦 Установка](#-установка)
- [🚀 Быстрый старт](#-быстрый-старт)
  - [Базовое использование](#базовое-использование)
  - [Использование с хуком](#использование-с-хуком)
- [📖 API Документация](#-api-документация)
  - [StickyProvider](#stickyprovider)
  - [Sticky Component](#sticky-component)
  - [useSticky Hook](#usesticky-hook)
  - [useStickyGroup Hook](#usestickygroup-hook)
- [🎨 Продвинутые примеры](#-продвинутые-примеры)
  - [Responsive Sticky](#responsive-sticky)
  - [Группы с приоритетами](#-группы-с-приоритетами)
  - [SSR Support](#-ssr-support)
- [🎯 Стратегии позиционирования](#-стратегии-позиционирования)
  - [Follow Scroll](#follow-scroll)
  - [Magnetic](#magnetic)
  - [Parallax](#parallax)
  - [Adaptive](#adaptive)
  - [Animated](#animated)
  - [Stacking](#stacking)
  - [TypeScript интерфейсы](#-typescript-интерфейсы)
- [🐛 Debugging](#-debugging)
- [⚡ Производительность](#-производительность)
- [🎨 CSS стили](#-css-стили)
- [🔌 Дополнительные хуки](#-дополнительные-хуки)
- [🛠️ Разработка](#️-разработка)
- [📊 Статистика проекта](#-статистика-проекта)
- [📄 Лицензия](#-лицензия)
- [🤝 Вклад в проект](#-вклад-в-проект)
- [📋 Changelog](#-changelog)

## ✨ Features

- 📌 **Sticky элементы** - поддержка sticky элементов с возможностью настройки
- 🚀 **Высокая производительность** - оптимизировано с Intersection Observer API
- 🎯 **Multi-directional sticky** - поддержка всех направлений (top/bottom/left/right)
- 🎨 **Продвинутые стратегии позиционирования** - follow-scroll, magnetic, parallax, adaptive, animated, stacking
- 👥 **Группы элементов** с автоматическим управлением z-index
- 📱 **Responsive дизайн** с breakpoints
- 🔧 **TypeScript support** из коробки
- 🌐 **SSR совместимость**
- 🐛 **Мощные debugging tools**
- 📦 **Tree-shakable** - импортируйте только то, что нужно
- ⚡ **Оптимизирована для браузера** - решены проблемы с `process.env` и React JSX runtime
- 🔧 **Современная сборка** - ESM и CJS поддержка из коробки

## 📦 Установка

```bash
npm install stuckin
# или
yarn add stuckin
# или
pnpm add stuckin
```

> **Примечание**: Библиотека поддерживает как ES modules, так и CommonJS. Отдельные подмодули не могут быть импортированы индивидуально - используйте только основную точку входа.

## 🚀 Быстрый старт

### Базовое использование

```tsx
import React from 'react';
import { StickyProvider, Sticky } from 'stuckin';
import 'stuckin/styles'; // Импорт стилей

function App() {
  return (
    <StickyProvider>
      <div style={{ height: '200vh' }}>
        <Sticky
          id="header"
          direction="top"
          offset={{ top: 0 }}
        >
          <header style={{ background: 'white', padding: '1rem' }}>
            Я буду прилипать к верху!
          </header>
        </Sticky>

        <main>
          <p>Контент страницы...</p>
        </main>
      </div>
    </StickyProvider>
  );
}
```

### Использование с хуком

```tsx
import React from 'react';
import { StickyProvider, useSticky } from 'stuckin';

function StickyNavigation() {
  const { ref, isSticky, state } = useSticky({
    id: 'nav',
    direction: 'top',
    offset: { top: 20 },
    onStateChange: (newState) => {
      console.log('Navigation state:', newState);
    }
  });

  return (
    <nav
      ref={ref}
      className={`navigation ${isSticky ? 'is-sticky' : ''}`}
    >
      <ul>
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
  );
}
```

[↑ Вернуться к началу](#️-stuckin)

## 📖 API Документация

### StickyProvider

Основной провайдер контекста для управления sticky элементами.

```tsx
interface StickyProviderProps {
  children: React.ReactNode;
  debug?: boolean; // Включение debug режима
}
```

### Sticky Component

Декларативный компонент для создания sticky элементов.

```tsx
interface StickyProps {
  id: string;                           // Уникальный идентификатор
  direction: 'top' | 'bottom' | 'left' | 'right';
  offset: StickyPosition;               // Отступы от краев

  // Опциональные свойства
  priority?: number;                    // Приоритет для z-index
  boundary?: StickyBoundary;           // Границы для sticky
  zIndex?: number;                     // Кастомный z-index
  disabled?: boolean;                  // Отключение sticky
  smooth?: boolean;                    // Плавные переходы
  groupId?: string;                    // ID группы

  // Стилизация
  className?: string;
  activeClassName?: string;            // Класс для активного состояния
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;   // Стили для активного состояния

  // Callbacks
  onStateChange?: (state: StickyState) => void;
}
```

### useSticky Hook

Основной хук для работы со sticky элементами.

```tsx
const {
  ref,              // Ref для привязки к элементу
  state,            // Текущее состояние: 'normal' | 'sticky' | 'bottom-reached'
  isSticky,         // Булево значение sticky состояния
  isActive,         // Активен ли элемент
  updateConfig,     // Функция обновления конфигурации
  refresh,          // Принудительное обновление
  disable,          // Отключение sticky
  enable            // Включение sticky
} = useSticky(options);
```

### useStickyGroup Hook

Хук для управления группами элементов.

```tsx
const {
  elements,         // Все элементы в группе
  activeElements,   // Активные элементы в группе
  addElement,       // Добавить элемент в группу
  removeElement,    // Удалить элемент из группы
  refreshGroup,     // Обновить всю группу
  getTotalHeight,   // Общая высота активных элементов
  getGroupBounds    // Границы группы
} = useStickyGroup({
  groupId: 'my-group',
  priority: 10,
  autoCreate: true
});
```

[↑ Вернуться к началу](#️-stuckin)

## 🎨 Продвинутые примеры

### Responsive Sticky

```tsx
import { useResponsiveSticky } from 'stuckin';

function ResponsiveHeader() {
  const { ref, currentBreakpoint } = useResponsiveSticky({
    id: 'responsive-header',
    responsive: {
      mobile: {
        direction: 'top',
        offset: { top: 0 },
        disabled: true  // Отключаем на мобильных
      },
      tablet: {
        direction: 'top',
        offset: { top: 10 }
      },
      desktop: {
        direction: 'top',
        offset: { top: 20 },
        smooth: true
      }
    }
  });

  return (
    <header ref={ref}>
      <h1>Header for {currentBreakpoint}</h1>
    </header>
  );
}
```


## 👥 Группы с приоритетами

```tsx
function Navigation() {
  const { ref: topNavRef } = useSticky({
    id: 'top-nav',
    direction: 'top',
    offset: { top: 0 },
    priority: 10,
    groupId: 'navigation'
  });

  const { ref: subNavRef } = useSticky({
    id: 'sub-nav',
    direction: 'top',
    offset: { top: 60 }, // Отступ от топ навигации
    priority: 5,
    groupId: 'navigation'
  });

  return (
    <>
      <nav ref={topNavRef}>Основная навигация</nav>
      <nav ref={subNavRef}>Подменю</nav>
    </>
  );
}
```

## 🌐 SSR Support

```tsx
import { useSSRSticky } from 'stuckin';

function SSRCompatibleSticky() {
  const {
    ref,
    isSSR,
    isHydrated,
    shouldSuppressWarning
  } = useSSRSticky({
    id: 'ssr-sticky',
    direction: 'top',
    offset: { top: 0 },
    ssr: {
      enabled: true,
      hydrationDelay: 100,
      suppressHydrationWarning: true
    }
  });

  if (isSSR) {
    return <div>Loading...</div>;
  }

  return (
    <div ref={ref} suppressHydrationWarning={shouldSuppressWarning}>
      Content
    </div>
  );
}
```

## 🎯 Стратегии позиционирования

Библиотека поддерживает расширенные стратегии позиционирования для создания уникальных эффектов:

### Follow Scroll

Элемент следует за скроллом с настраиваемым лагом:

```tsx
<Sticky
  id="follow-scroll"
  direction="follow-scroll"
  followScroll={{
    lag: 0.1,        // Коэффициент лага (0-1)
    bounds: {        // Ограничения позиции
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    }
  }}
>
  <div>Следую за скроллом с лагом</div>
</Sticky>
```

### Magnetic

Магнитное притяжение к краям viewport:

```tsx
<Sticky
  id="magnetic"
  direction="magnetic"
  magnetic={{
    threshold: 50,                             // Расстояние активации
    strength: 0.8,                            // Сила притяжения (0-1)
    edges: ['top', 'bottom', 'left', 'right'] // Активные края
  }}
>
  <div>Притягиваюсь к краям!</div>
</Sticky>
```

### Parallax

Эффект параллакса при скролле:

```tsx
<Sticky
  id="parallax"
  direction="parallax"
  parallax={{
    speed: 0.5,      // Скорость параллакса (0-1)
    direction: 'y'   // Направление: 'x', 'y', 'both'
  }}
>
  <div>Параллакс эффект</div>
</Sticky>
```

### Adaptive

Адаптивное позиционирование основано на встроенной логике размера элемента:

```tsx
<Sticky
  id="adaptive"
  direction="adaptive"
>
  <div>Автоматическое адаптивное позиционирование</div>
</Sticky>
```

> **Примечание**: Adaptive стратегия использует встроенную логику без дополнительной конфигурации.

### Animated

Позиционирование с плавными CSS переходами:

```tsx
<Sticky
  id="animated"
  direction="animated"
  animated={{
    duration: '0.3s',
    easing: 'ease-in-out',
    properties: ['top', 'left', 'transform']
  }}
>
  <div>Плавные переходы</div>
</Sticky>
```

### Stacking

Элементы располагаются в стек с автоматическим spacing:

```tsx
<Sticky
  id="stacked-1"
  direction="stacking"
  groupId="stack-group"
  stacking={{
    direction: 'vertical',    // 'vertical' или 'horizontal'
    spacing: 10,             // Расстояние между элементами
    alignment: 'start'       // 'start', 'center', 'end'
  }}
>
  <div>Первый в стеке</div>
</Sticky>

<Sticky
  id="stacked-2"
  direction="stacking"
  groupId="stack-group"
  stacking={{
    direction: 'vertical',
    spacing: 10,
    alignment: 'start'
  }}
>
  <div>Второй в стеке</div>
</Sticky>
```

### Комбинирование стратегий

Можно также использовать стратегии через хуки:

```tsx
import { useSticky } from 'stuckin';

function AdvancedStickyComponent() {
  const { ref, isSticky } = useSticky({
    id: 'advanced',
    direction: 'magnetic',
    magnetic: {
      threshold: 30,
      strength: 0.9,
      edges: ['top', 'left']
    },
    onStateChange: (state) => {
      console.log('Advanced sticky state:', state);
    }
  });

  return (
    <div ref={ref} className={isSticky ? 'magnetic-active' : ''}>
      Продвинутый sticky элемент
    </div>
  );
}
```

### 📝 TypeScript интерфейсы

Все стратегии имеют строго типизированные интерфейсы:

```tsx
import type {
  FollowScrollConfig,
  MagneticConfig,
  ParallaxConfig,
  AnimatedConfig,
  StackingConfig,
  StickyConfig,
  StickyDirection
} from 'stuckin';

// Пример с полной типизацией
interface MyComponentProps {
  magneticConfig: MagneticConfig;
  parallaxConfig: ParallaxConfig;
}

function MyComponent({ magneticConfig, parallaxConfig }: MyComponentProps) {
  const { ref } = useSticky({
    id: 'typed-sticky',
    direction: 'magnetic' as StickyDirection,
    magnetic: magneticConfig,  // Полная поддержка автодополнения
  });

  return <div ref={ref}>Типизированный sticky</div>;
}
```

### 🎯 Доступные стратегии позиционирования

- `'top'` | `'bottom'` | `'left'` | `'right'` - стандартные направления
- `'center'` - центрированное позиционирование
- `'smart'` - умное позиционирование с выбором лучшей позиции
- `'follow-scroll'` - следование за скроллом с лагом
- `'magnetic'` - магнитное притяжение к краям
- `'parallax'` - параллакс эффект
- `'adaptive'` - адаптивное позиционирование
- `'animated'` - позиционирование с анимациями
- `'stacking'` - стекирование элементов

[↑ Вернуться к началу](#️-stuckin)

## 🐛 Debugging

Библиотека включает мощные инструменты отладки:

```tsx
import { DebugPanel } from 'stuckin';

function App() {
  return (
    <StickyProvider debug={true}>
      {/* Ваше приложение */}

      {/* Debug панель (только в development) */}
      <DebugPanel position="top-right" />
    </StickyProvider>
  );top-sticky-demo
}
```

### Console API

В development режиме доступен глобальный API:

```js
// В консоли браузера
window.__STICKY_DEBUG__.enable({ visualDebug: true });
window.__STICKY_DEBUG__.captureSnapshot('my-test');
window.__STICKY_DEBUG__.getPerformance();
window.__STICKY_DEBUG__.exportData();
```

## 🚨 Устранение неполадок

### Ошибка "process is not defined"

Если вы видите ошибку связанную с `process.env`, убедитесь что используете версию 1.0.12+, где эта проблема была исправлена.

### Ошибка "Cannot read properties of undefined (reading 'recentlyCreatedOwnerStacks')"

Эта ошибка связана с конфликтом React JSX runtime. Обновитесь до версии 1.0.16+ для исправления.

### Проблемы с импортом модулей

Начиная с версии 1.0.16+, поддерживается только импорт из основной точки входа:

```tsx
// ✅ Правильно
import { Sticky, useSticky } from 'stuckin';

// ❌ Неправильно (не поддерживается)
import { useSticky } from 'stuckin/hooks';
```

## ⚡ Производительность

### Bundle Size

- **ES modules**: ~95KB minified / ~28KB gzipped
- **CommonJS**: ~49KB minified / ~29KB gzipped
- **Поддержка tree-shaking**: Да (только с ES modules)
- **Форматы**: ESM, CJS, TypeScript definitions

> Размеры указаны для версии 1.0.16+. Tree-shaking работает только при использовании ES modules.

### Tree Shaking

Библиотека поддерживает tree shaking при импорте из основной точки входа:

```tsx
// ES modules (современный подход)
import { Sticky, useSticky, StickyProvider } from 'stuckin';
import 'stuckin/styles';

// CommonJS (для Node.js окружений)
const { Sticky, useSticky, StickyProvider } = require('stuckin');

// Импорт типов (только для TypeScript + ES modules)
import type { StickyConfig, UseStickyOptions } from 'stuckin';
```

> **Важно**: В отличие от предыдущих версий, теперь **нельзя** импортировать отдельные модули как `stuckin/hooks` или `stuckin/components`. Используйте только основной импорт из `stuckin`.

## 🎨 CSS стили

Импортируйте CSS стили для базовых стилей sticky элементов:

```tsx
// В вашем основном CSS файле или в компоненте
import 'stuckin/styles';
```

```css
/* Или кастомизируйте переменные */
:root {
  --sticky-transition-duration: 0.3s;
  --sticky-transition-easing: ease-in-out;
  --sticky-z-index-base: 1000;
  --sticky-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

## 🔌 Дополнительные хуки

### useResponsiveSticky

Хук для создания responsive sticky элементов с breakpoints.

### useSSRSticky

SSR-совместимый хук для sticky элементов.

### useDebugSticky

Хук с расширенными возможностями отладки.

### useStickyObserver

Хук для наблюдения за состоянием sticky элементов.

## 🛠️ Разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Запуск тестов
npm test

# Сборка проекта
npm run build

# Линтинг
npm run lint

# Проверка типов
npm run type-check

# Анализ покрытия тестами
npm run test:coverage
```

## 📊 Статистика проекта

- **Версия**: 1.0.16+
- **Tests**: 331+ тестов
- **Coverage**: 81%+ statements, 70%+ branches, 80%+ functions
- **TypeScript**: Полная поддержка типов
- **React**: 18.0.0+
- **Node.js**: ≥18.0.0
- **Bundle Size**: ~28KB gzipped с tree-shaking
- **Совместимость**: Современные браузеры, SSR

## 📄 Лицензия

MIT © [Pavel Melnik](https://github.com/PavelMelnik94)

## 🤝 Вклад в проект

Мы приветствуем вклад в проект! Пожалуйста, прочитайте [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о том, как внести свой вклад.

## 📋 Changelog

См. [CHANGELOG.md](CHANGELOG.md) для получения информации о изменениях в версиях.

---

[↑ Вернуться к началу](#️-stuckin)

## 🎯 Кастомные скролл-контейнеры

**НОВИНКА**: Начиная с версии 1.0.17+, библиотека поддерживает sticky элементы внутри кастомных скролл-контейнеров!

### Основные возможности

- ✅ **Прилипание к кастомным контейнерам** - sticky элементы работают внутри `div` с `overflow: auto|scroll`
- ✅ **Множественные контейнеры** - разные элементы могут использовать разные контейнеры
- ✅ **Группировка в контейнерах** - sticky группы работают внутри контейнеров
- ✅ **Горизонтальный и вертикальный скролл** - поддержка всех направлений
- ✅ **Автоматическое позиционирование** - элементы позиционируются относительно контейнера
- ✅ **Производительность** - оптимизированное отслеживание контейнеров

### Использование с хуком

```tsx
import { useStickyInContainer } from 'stuckin';

function MyComponent() {
  const { ref, isSticky } = useStickyInContainer({
    container: '.my-scroll-container', // Селектор или HTMLElement
    direction: 'top',
    offset: { top: 10 },
    containerOffset: { top: 20 }, // Дополнительные отступы от контейнера
    observeResize: true, // Отслеживать изменения размеров контейнера
    id: 'my-sticky'
  });

  return (
    <div className="my-scroll-container" style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: '200px' }}>Content before sticky</div>

      <div ref={ref} className={isSticky ? 'is-sticky' : ''}>
        Я прилипаю к контейнеру, а не к viewport!
      </div>

      <div style={{ height: '800px' }}>Long content...</div>
    </div>
  );
}
```

### Использование с компонентом

```tsx
import { StickyContainer } from 'stuckin';

function ScrollableCard() {
  return (
    <div className="card-container" style={{ height: '300px', overflow: 'auto' }}>
      <div style={{ height: '100px' }}>Header content</div>

      <StickyContainer
        container=".card-container"
        direction="top"
        offset={{ top: 0 }}
        containerOffset={{ top: 10 }}
        className="sticky-toolbar"
        activeClassName="toolbar-sticky"
      >
        <div className="toolbar">
          <button>Action 1</button>
          <button>Action 2</button>
        </div>
      </StickyContainer>

      <div style={{ height: '600px' }}>Main content...</div>
    </div>
  );
}
```

### Множественные sticky в одном контейнере

```tsx
function NavigationContainer() {
  return (
    <div className="nav-container" style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: '100px' }}>Top content</div>

      {/* Основной header */}
      <StickyContainer
        container=".nav-container"
        direction="top"
        offset={{ top: 0 }}
        groupId="nav-group"
        priority={10}
      >
        <header>Main Navigation</header>
      </StickyContainer>

      <div style={{ height: '150px' }}>Some content</div>

      {/* Sub-navigation */}
      <StickyContainer
        container=".nav-container"
        direction="top"
        offset={{ top: 60 }} // Отступ от главного header
        groupId="nav-group"
        priority={8}
      >
        <nav>Sub Navigation</nav>
      </StickyContainer>

      <div style={{ height: '1000px' }}>Long content...</div>
    </div>
  );
}
```

### Горизонтальный скролл

```tsx
function HorizontalSticky() {
  return (
    <div style={{ width: '400px', height: '200px', overflowX: 'auto' }}>
      <div style={{ width: '1000px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '200px' }}>Scroll right →</div>

        <StickyContainer
          container={containerRef.current}
          direction="left"
          offset={{ left: 10 }}
        >
          ← Sticky to left edge
        </StickyContainer>

        <div style={{ width: '600px' }}>Wide content...</div>
      </div>
    </div>
  );
}
```

### Конфигурация контейнера

```tsx
interface UseStickyContainerOptions {
  /** Контейнер: HTMLElement, селектор или ref */
  container: HTMLElement | string | null;

  /** Отступы от границ контейнера */
  containerOffset?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };

  /** Отслеживать изменения размеров контейнера */
  observeResize?: boolean; // по умолчанию true

  /** Все остальные опции из useSticky */
  direction: 'top' | 'bottom' | 'left' | 'right';
  offset: StickyPosition;
  // ... другие опции
}
```

### Группы в контейнерах

```tsx
import { useStickyInContainerGroup } from 'stuckin';

function GroupedSticky() {
  const { createStickyElement } = useStickyInContainerGroup({
    container: '.grouped-container',
    groupId: 'my-group',
    baseOptions: {
      direction: 'top',
      containerOffset: { top: 5 }
    }
  });

  const header = createStickyElement({
    offset: { top: 0 },
    priority: 10,
    id: 'header'
  });

  const subheader = createStickyElement({
    offset: { top: 50 },
    priority: 8,
    id: 'subheader'
  });

  return (
    <div className="grouped-container" style={{ height: '400px', overflow: 'auto' }}>
      <div ref={header.ref}>Header</div>
      <div ref={subheader.ref}>Subheader</div>
      {/* контент */}
    </div>
  );
}
```

### Миграция с viewport на контейнеры

Если у вас есть существующие sticky элементы, привязанные к viewport, вы можете легко мигрировать их:

```tsx
// До: прилипание к viewport
<Sticky direction="top" offset={{ top: 20 }}>
  Content
</Sticky>

// После: прилипание к контейнеру
<StickyContainer
  container=".my-container"
  direction="top"
  offset={{ top: 20 }}
>
  Content
</StickyContainer>

// Или с хуком
const { ref } = useStickyInContainer({
  container: '.my-container',
  direction: 'top',
  offset: { top: 20 }
});
```

### Совместимость

- ✅ **Обратная совместимость** - существующий код продолжает работать
- ✅ **Все стратегии** - follow-scroll, magnetic, parallax работают в контейнерах
- ✅ **SSR поддержка** - работает с server-side rendering
- ✅ **TypeScript** - полная типизация для всех новых API
