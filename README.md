## В консоли браузера
window.__STICKY_DEBUG__.enable({ visualDebug: true });
window.__STICKY_DEBUG__.captureSnapshot('test');
window.__STICKY_DEBUG__.exportData();


## Features
- 📌 **Sticky элементы** - поддержка sticky элементов с возможностью настройки
- 🚀 **Высокая производительность** - оптимизировано с Intersection Observer API
- 🎯 **Multi-directional sticky** - поддержка всех направлений (top/bottom/left/right)
- 👥 **Группы элементов** с автоматическим управлением z-index
- 📱 **Responsive дизайн** с breakpoints
- 🔧 **TypeScript support** из коробки
- 🌐 **SSR совместимость**
- 🐛 **Мощные debugging tools**
- 📦 **Tree-shakable** - импортируйте только то, что нужно
- ⚡ **Zero dependencies** (кроме React)


### 1. Базовое использование

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


# 📖 API Документация

## StickyProvider
Основной провайдер контекста для управления sticky элементами.

```tsx
interface StickyProviderProps {
  children: React.ReactNode;
  debug?: boolean; // Включение debug режима
}
```


## Sticky Component
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

## useSticky Hook
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

## useStickyGroup Hook
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

# 🎨 Продвинутые примеры

## Responsive Sticky

```tsx
import { useResponsiveSticky } from '@your-org/sticky-lib';

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
import { useSSRSticky } from '@your-org/sticky-lib';

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

## 🐛 Debugging
Библиотека включает мощные инструменты отладки:

```tsx
import { DebugPanel } from '@your-org/sticky-lib';

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

## Console API
В development режиме доступен глобальный API:
```js
// В консоли браузера
window.__STICKY_DEBUG__.enable({ visualDebug: true });
window.__STICKY_DEBUG__.captureSnapshot('my-test');
window.__STICKY_DEBUG__.getPerformance();
window.__STICKY_DEBUG__.exportData();
```

# ⚡ Производительность

## Bundle Size
- Full Library: ~25KB gzipped
- Hooks только: ~8KB gzipped
- Components только: ~12KB gzipped
- Utils только: ~5KB gzipped


## Tree Shaking
Импортируйте только необходимые части:

```tsx
// Импорт всей библиотеки
import { Sticky, useSticky } from '@your-org/sticky-lib';

// Импорт только хуков
import { useSticky } from '@your-org/sticky-lib/hooks';

// Импорт только компонентов
import { Sticky } from '@your-org/sticky-lib/components';

// Импорт только утилит
import { performanceMonitor } from '@your-org/sticky-lib/utils';
```

# CSS
Импортируйте стили если нужны базовые стили:
```tsx
@import '@your-org/sticky-lib/dist/sticky.css';

// Или кастомизируйте переменные
:root {
  --sticky-transition-duration: 0.3s;
  --sticky-transition-easing: ease-in-out;
  --sticky-z-index-base: 1000;
  --sticky-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}
```

useStickyGroup
Хук для управления группами sticky элементов.

useResponsiveSticky
Хук для создания responsive sticky элементов с breakpoints.

useSSRSticky
SSR-совместимый хук для sticky элементов.

useDebugSticky
Хук с расширенными возможностями отладки.
