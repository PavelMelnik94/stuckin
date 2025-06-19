# 🏷️ Sticky Lib

[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

Мощная, гибкая и оптимизированная библиотека для sticky элементов с TypeScript, React 18+, и продвинутой отладкой.

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
- ⚡ **Zero dependencies** (кроме React)

## 📦 Установка

```bash
npm install @pavelmelnik94/sticky-lib
# или
yarn add @pavelmelnik94/sticky-lib
# или
pnpm add @pavelmelnik94/sticky-lib
```

## 🚀 Быстрый старт

### Базовое использование

```tsx
import React from 'react';
import { StickyProvider, Sticky } from '@your-org/sticky-lib';

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

### 2. Использование с хуком

```tsx
import React from 'react';
import { StickyProvider, useSticky } from '@your-org/sticky-lib';

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

## 🎨 Продвинутые примеры

### Responsive Sticky

```tsx
import { useResponsiveSticky } from '@pavelmelnik94/sticky-lib';

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


## Группы с приоритетами

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

## SSR Support

```tsx
import { useSSRSticky } from '@pavelmelnik94/sticky-lib';

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

Адаптивное позиционирование в зависимости от размера элемента:

```tsx
<Sticky
  id="adaptive"
  direction="adaptive"
  adaptive={{
    sizeBoundary: 0.3,  // Граница для больших элементов (0-1)
    mobileBreakpoint: 768
  }}
>
  <div>Адаптивное позиционирование</div>
</Sticky>
```

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
import { useSticky } from '@pavelmelnik94/sticky-lib';

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
  AdaptiveConfig,
  AnimatedConfig,
  StackingConfig
} from '@pavelmelnik94/sticky-lib';

// Пример с полной типизацией
interface MyComponentProps {
  magneticConfig: MagneticConfig;
  parallaxConfig: ParallaxConfig;
}

function MyComponent({ magneticConfig, parallaxConfig }: MyComponentProps) {
  const { ref } = useSticky({
    id: 'typed-sticky',
    direction: 'magnetic',
    magnetic: magneticConfig,  // Полная поддержка автодополнения
  });

  return <div ref={ref}>Типизированный sticky</div>;
}
```

## 🐛 Debugging

Библиотека включает мощные инструменты отладки:

```tsx
import { DebugPanel } from '@pavelmelnik94/sticky-lib';

function App() {
  return (
    <StickyProvider debug={true}>
      {/* Ваше приложение */}

      {/* Debug панель (только в development) */}
      <DebugPanel position="top-right" />
    </StickyProvider>
  );
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

## ⚡ Производительность

### Bundle Size

- Full Library: ~30KB gzipped
- Hooks только: ~28KB gzipped
- Components только: ~28KB gzipped
- Utils только: ~22KB gzipped
- Debug только: ~20KB gzipped

### Tree Shaking

Импортируйте только необходимые части:

```tsx
// Импорт всей библиотеки
import { Sticky, useSticky } from '@pavelmelnik94/sticky-lib';

// Импорт только хуков
import { useSticky } from '@pavelmelnik94/sticky-lib/hooks';

// Импорт только компонентов
import { Sticky } from '@pavelmelnik94/sticky-lib/components';

// Импорт только утилит
import { performanceMonitor } from '@pavelmelnik94/sticky-lib/utils';
```

## 🎨 CSS стили

Импортируйте стили если нужны базовые стили:

```css
@import '@pavelmelnik94/sticky-lib/styles';

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

- **Tests**: 325+ тестов
- **Coverage**: 82%+ statements, 83%+ lines, 80%+ functions
- **TypeScript**: Полная поддержка типов
- **React**: 18.0.0+
- **Bundle Size**: Оптимизированный размер с tree-shaking

## 📄 Лицензия

MIT © [Pavel Melnik](https://github.com/PavelMelnik94)

## 🤝 Вклад в проект

Мы приветствуем вклад в проект! Пожалуйста, прочитайте [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о том, как внести свой вклад.

## 📋 Changelog

См. [CHANGELOG.md](CHANGELOG.md) для получения информации о изменениях в версиях.
