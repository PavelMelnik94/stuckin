# 🏷️ Stuckin

[![npm version](https://img.shields.io/npm/v/stuckin.svg)](https://www.npmjs.com/package/stuckin)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/stuckin.svg)](https://www.npmjs.com/package/stuckin)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/stuckin)](https://bundlephobia.com/package/stuckin)

> Мощная, гибкая и оптимизированная библиотека для sticky элементов с TypeScript, React 18+, MobX и продвинутой отладкой

## 🌟 Особенности

- 🚀 **Высокая производительность** - оптимизирована для 60fps с throttling и debouncing
- 🔍 **TypeScript First** - полная типизация из коробки
- ⚡ **React 18+** - поддержка современных возможностей React (Concurrent Features)
- 🧩 **MobX интеграция** - реактивное управление состоянием
- 🎯 **Продвинутая отладка** - встроенные инструменты диагностики и DebugPanel
- 📱 **Responsive дизайн** - адаптивность на всех устройствах с breakpoints
- 🌐 **SSR поддержка** - полная совместимость с server-side rendering
- 🔧 **Гибкая настройка** - множество опций конфигурации и стратегий
- 🎨 **Богатый API** - компоненты и хуки для любых задач
- 📦 **Tree-shakable** - только нужный код попадает в bundle
- 🏗️ **Контейнеры** - sticky элементы в любых скролл-контейнерах

## 📦 Установка

```bash
npm install stuckin
# или
yarn add stuckin
# или
pnpm add stuckin
```

> **Peer Dependencies**: React >=18.0.0, React-DOM >=18.0.0

## 🚀 Быстрый старт

### Базовое использование

```tsx
import React from 'react';
import { StickyProvider, Sticky } from 'stuckin';

function App() {
  return (
    <StickyProvider>
      <div style={{ height: '200vh' }}>
        <Sticky direction="top" offset={{ top: 0 }}>
          <nav style={{ background: 'white', padding: '1rem' }}>
            Я буду прилипать к верху!
          </nav>
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
    offset: { top: 10 }
  });

  return (
    <nav
      ref={ref}
      className={isSticky ? 'sticky-active' : ''}
      style={{
        background: isSticky ? '#fff' : 'transparent',
        boxShadow: isSticky ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
      }}
    >
      Навигация (состояние: {state})
    </nav>
  );
}
```

## 📋 Содержание

- [🔧 API Документация](#-api-документация)
  - [StickyProvider](#stickyprovider)
  - [Sticky Component](#sticky-component)
  - [StickyGroup Component](#stickygroup-component)
  - [StickyContainer Component](#stickycontainer-component-новый)
  - [useSticky Hook](#usesticky-hook)
  - [useStickyInContainer Hook](#usestickyincontainer-hook-новый)
  - [Специализированные хуки](#специализированные-хуки)
- [📖 Примеры использования](#-примеры-использования)
  - [Sticky группы](#sticky-группы)
  - [Sticky в контейнерах](#sticky-в-контейнерах)
  - [Responsive sticky](#responsive-sticky)
  - [Анимации и переходы](#анимации-и-переходы)
- [⚙️ Конфигурация](#️-конфигурация)
- [🔍 Отладка](#-отладка)
- [⚡ Производительность](#-производительность)
- [🔄 Миграция](#-миграция)
- [📄 Лицензия](#-лицензия)

## 🔧 API Документация

### StickyProvider

Корневой провайдер для управления всеми sticky элементами в приложении.

```tsx
interface StickyProviderProps {
  children: React.ReactNode;
  debug?: boolean;                    // Включить режим отладки
  performanceMode?: 'normal' | 'high' | 'low';  // Режим производительности
}

function App() {
  return (
    <StickyProvider
      debug={process.env.NODE_ENV === 'development'}
      performanceMode="high"
    >
      {/* Ваши компоненты */}
    </StickyProvider>
  );
}
```

### Sticky Component

Основной компонент для создания sticky элементов.

```tsx
interface StickyProps {
  children: React.ReactNode;
  direction: 'top' | 'bottom' | 'left' | 'right'; // Обязательно!
  id?: string;                        // Уникальный идентификатор
  offset?: StickyPosition;            // Отступы для позиционирования
  priority?: number;                  // Приоритет z-index
  disabled?: boolean;                 // Отключить sticky поведение
  className?: string;
  activeClassName?: string;           // Класс в sticky состоянии
  tag?: keyof JSX.IntrinsicElements;  // HTML тег (по умолчанию 'div')
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;  // Стили в sticky состоянии
  groupId?: string;                   // ID группы для управления
  onStateChange?: (state: StickyState) => void;
}

// Пример с полной конфигурацией
<Sticky
  direction="top"
  offset={{ top: 10 }}
  priority={100}
  activeClassName="is-sticky"
  activeStyle={{
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    backgroundColor: 'white'
  }}
  groupId="header-group"
  onStateChange={(state) => console.log('State:', state)}
>
  <header>Мой заголовок</header>
</Sticky>
```

### StickyGroup Component

Компонент-контейнер для управления группой sticky элементов с автоматическим z-index менеджментом.

```tsx
interface StickyGroupProps {
  groupId: string;                     // Уникальный ID группы - ОБЯЗАТЕЛЬНО!
  priority?: number;                   // Приоритет группы (влияет на z-index)
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onGroupChange?: (groupInfo: GroupInfo) => void;
}

// Пример: организованная группа элементов навигации
function NavigationLayout() {
  return (
    <StickyProvider>
      <StickyGroup groupId="navigation" priority={100}>
        <Sticky id="main-header" direction="top" offset={{ top: 0 }}>
          <header>Главное меню</header>
        </Sticky>

        <Sticky id="breadcrumbs" direction="top" offset={{ top: 60 }}>
          <nav>Хлебные крошки</nav>
        </Sticky>

        <Sticky id="sidebar" direction="left" offset={{ left: 0 }}>
          <aside>Боковая панель</aside>
        </Sticky>
      </StickyGroup>

      <main>
        <p>Основной контент</p>
      </main>
    </StickyProvider>
  );
}
```

### StickyContainer Component **[НОВЫЙ]**

Компонент для создания sticky элементов внутри кастомных скролл-контейнеров. Идеально подходит для модальных окон, выпадающих меню и других контейнеров с собственной прокруткой.

```tsx
interface StickyContainerProps {
  container: HTMLElement | string;    // Скролл-контейнер или селектор - ОБЯЗАТЕЛЬНО!
  direction: 'top' | 'bottom' | 'left' | 'right'; // ОБЯЗАТЕЛЬНО!
  children: React.ReactNode;

  // Специфичные опции для контейнера
  containerOffset?: {                 // Отступы от границ контейнера
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  observeResize?: boolean;            // Отслеживание изменения размеров (по умолчанию true)

  // Стандартные sticky опции
  id?: string;
  offset?: StickyPosition;
  priority?: number;
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  tag?: keyof JSX.IntrinsicElements;   // По умолчанию 'div'
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  groupId?: string;
  onStateChange?: (state: StickyState) => void;
}

// Пример: Sticky элемент в модальном окне
function ScrollableModal() {
  return (
    <div
      className="modal-container"
      style={{
        height: '400px',
        overflow: 'auto',
        border: '1px solid #ccc',
        position: 'relative'
      }}
    >
      <div style={{ height: '100px' }}>Контент до sticky</div>

      <StickyContainer
        container=".modal-container"
        direction="top"
        offset={{ top: 10 }}
        containerOffset={{ top: 20 }}
        className="sticky-toolbar"
        activeClassName="is-sticky"
        activeStyle={{ backgroundColor: '#f8f9fa' }}
      >
        <div style={{ padding: '10px' }}>
          Я прилипаю к верху модального окна!
        </div>
      </StickyContainer>

      <div style={{ height: '800px' }}>Длинный контент...</div>
    </div>
  );
}
```

### useSticky Hook

Основной хук для создания sticky элементов с полным контролем.

```tsx
interface UseStickyOptions {
  id?: string;
  direction: 'top' | 'bottom' | 'left' | 'right';
  offset?: StickyPosition;
  priority?: number;
  disabled?: boolean;
  groupId?: string;
  strategy?: 'standard' | 'follow-scroll' | 'magnetic' | 'parallax';
  onStateChange?: (state: StickyState) => void;
}

interface UseStickyReturn {
  ref: RefObject<HTMLElement>;        // Ref для привязки к элементу
  state: StickyState;                 // Текущее состояние
  isSticky: boolean;                  // Булево значение sticky состояния
  isActive: boolean;                  // Активен ли элемент
  position: StickyPosition;           // Текущая позиция
  refresh: () => void;                // Принудительное обновление
  disable: () => void;                // Отключение
  enable: () => void;                 // Включение
  updateConfig: (config: Partial<UseStickyOptions>) => void;
}

// Пример с полным API
function AdvancedStickyComponent() {
  const {
    ref,
    state,
    isSticky,
    position,
    refresh,
    disable,
    enable,
    updateConfig
  } = useSticky({
    id: 'advanced-sticky',
    direction: 'top',
    offset: { top: 20 },
    strategy: 'follow-scroll',
    onStateChange: (newState) => {
      console.log(`State changed to: ${newState}`);
    }
  });

  return (
    <>
      <div
        ref={ref}
        className={`sticky-element ${isSticky ? 'active' : ''}`}
        style={{
          transform: `translateY(${position.top || 0}px)`,
          transition: 'transform 0.2s ease'
        }}
      >
        <h3>Advanced Sticky (состояние: {state})</h3>

        <button onClick={refresh}>Обновить</button>
        <button onClick={disable}>Отключить</button>
        <button onClick={enable}>Включить</button>
      </div>
    </>
  );
}
```

### useStickyInContainer Hook **[НОВЫЙ]**

Хук для создания sticky элементов внутри кастомных скролл-контейнеров.

```tsx
interface UseStickyInContainerOptions extends UseStickyOptions {
  container: HTMLElement | string | null;    // Скролл-контейнер - ОБЯЗАТЕЛЬНО!
  containerOffset?: {                         // Отступы от границ контейнера
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  observeResize?: boolean;                    // Отслеживание ресайза (по умолчанию true)
}

// Пример: sticky элемент внутри скролл-контейнера
function ContainerStickyExample() {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    ref: stickyRef,
    isSticky,
    state,
    refresh
  } = useStickyInContainer({
    container: containerRef.current,
    direction: 'top',
    offset: { top: 15 },
    containerOffset: { top: 10 },
    id: 'container-sticky'
  });

  return (
    <div
      ref={containerRef}
      style={{ height: '300px', overflow: 'auto', border: '1px solid #ddd' }}
    >
      <div style={{ height: '100px', background: '#f0f0f0' }}>
        Контент до sticky элемента
      </div>

      <div
        ref={stickyRef}
        className={isSticky ? 'sticky-active' : ''}
        style={{
          padding: '10px',
          backgroundColor: isSticky ? '#e3f2fd' : '#ffffff',
          border: isSticky ? '2px solid #2196f3' : '1px solid #ddd',
          transition: 'all 0.2s ease'
        }}
      >
        <p>Sticky элемент в контейнере!</p>
        <p>Состояние: {state}</p>
        <button onClick={refresh}>Обновить позицию</button>
      </div>

      <div style={{ height: '600px', background: '#fafafa' }}>
        Длинный контент для прокрутки...
      </div>
    </div>
  );
}
```

### Специализированные хуки

#### useResponsiveSticky

Хук для создания responsive sticky элементов с breakpoints.

```tsx
interface ResponsiveConfig {
  [breakpoint: string]: Partial<UseStickyOptions>;
}

const { ref, isSticky, currentBreakpoint } = useResponsiveSticky({
  id: 'responsive-header',
  fallback: {
    direction: 'top',
    offset: { top: 0 }
  },
  responsive: {
    mobile: {
      direction: 'top',
      offset: { top: 0 },
      disabled: false
    },
    tablet: {
      direction: 'top',
      offset: { top: 20 }
    },
    desktop: {
      direction: 'top',
      offset: { top: 40 },
      strategy: 'follow-scroll'
    }
  }
});
```

#### useDebugSticky

Хук с расширенными возможностями отладки.

```tsx
const {
  ref,
  isSticky,
  captureSnapshot,
  logDebug,
  debugHistory
} = useDebugSticky({
  id: 'debug-sticky',
  direction: 'top',
  debugConfig: {
    logLevel: 'debug',
    captureSnapshots: true,
    performanceTracking: true
  }
});
```

#### useSSRSticky

Хук с поддержкой server-side rendering.

```tsx
const { ref, isSticky, isHydrated } = useSSRSticky({
  id: 'ssr-sticky',
  direction: 'top',
  ssr: {
    hydrationDelay: 100,
    fallbackEnabled: true
  }
});
```

## 📖 Примеры использования

### Sticky группы

Создание организованных групп sticky элементов с автоматическим управлением z-index.

```tsx
function ComplexLayout() {
  return (
    <StickyProvider>
      {/* Основная навигация - высший приоритет */}
      <StickyGroup groupId="main-navigation" priority={1000}>
        <Sticky direction="top" offset={{ top: 0 }}>
          <header className="main-header">
            Главное меню
          </header>
        </Sticky>
      </StickyGroup>

      {/* Боковая панель - средний приоритет */}
      <StickyGroup groupId="sidebar" priority={500}>
        <Sticky direction="left" offset={{ left: 0 }}>
          <aside className="sidebar">
            Боковая панель
          </aside>
        </Sticky>

        <Sticky direction="left" offset={{ left: 0, top: 100 }}>
          <nav className="sidebar-nav">
            Вторичная навигация
          </nav>
        </Sticky>
      </StickyGroup>

      {/* Контентная область */}
      <main>
        {/* Хлебные крошки - низкий приоритет */}
        <StickyGroup groupId="content-navigation" priority={100}>
          <Sticky direction="top" offset={{ top: 80 }}>
            <nav className="breadcrumbs">
              Хлебные крошки
            </nav>
          </Sticky>
        </StickyGroup>

        <div style={{ height: '2000px' }}>
          Основной контент
        </div>
      </main>
    </StickyProvider>
  );
}
```

### Sticky в контейнерах

Примеры использования sticky элементов в различных типах контейнеров.

#### Модальное окно с sticky заголовком

```tsx
function ModalWithStickyHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Открыть модальное окно
      </button>

      {isOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{
            width: '600px',
            height: '500px',
            overflow: 'auto',
            backgroundColor: 'white',
            borderRadius: '8px'
          }}>
            <StickyContainer
              container=".modal"
              direction="top"
              offset={{ top: 0 }}
              activeStyle={{
                borderBottom: '1px solid #ddd',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2>Заголовок модального окна</h2>
                <button onClick={() => setIsOpen(false)}>×</button>
              </div>
            </StickyContainer>

            <div style={{ padding: '20px', height: '1500px' }}>
              <p>Длинный контент модального окна...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### Responsive sticky

Создание адаптивных sticky элементов с различным поведением на разных экранах.

```tsx
function ResponsiveNavigation() {
  const {
    ref,
    isSticky,
    currentBreakpoint
  } = useResponsiveSticky({
    id: 'responsive-nav',
    fallback: {
      direction: 'top',
      offset: { top: 0 }
    },
    responsive: {
      mobile: {
        direction: 'top',
        offset: { top: 0 },
        strategy: 'standard'
      },
      tablet: {
        direction: 'top',
        offset: { top: 20 },
        strategy: 'follow-scroll'
      },
      desktop: {
        direction: 'top',
        offset: { top: 40 },
        strategy: 'magnetic'
      }
    }
  });

  return (
    <nav
      ref={ref}
      className={`responsive-nav ${isSticky ? 'sticky-active' : ''}`}
      style={{
        padding: '1rem',
        backgroundColor: isSticky ? '#2196f3' : 'transparent',
        transition: 'all 0.3s ease'
      }}
    >
      <div>
        Responsive Navigation (текущий: {currentBreakpoint})
      </div>
      <div>
        {isSticky ? 'Прилипла!' : 'Не прилипла'}
      </div>
    </nav>
  );
}
```

### Анимации и переходы

Примеры создания плавных анимаций и переходов для sticky элементов.

```tsx
function AnimatedSticky() {
  const { ref, isSticky, state, position } = useSticky({
    id: 'animated-sticky',
    direction: 'top',
    offset: { top: 20 },
    strategy: 'follow-scroll'
  });

  return (
    <div
      ref={ref}
      className={`animated-sticky ${isSticky ? 'sticky-active' : ''}`}
      style={{
        padding: '20px',
        backgroundColor: isSticky ? '#e8f5e8' : '#f5f5f5',
        transform: `translateY(${position.top || 0}px) scale(${isSticky ? 1.02 : 1})`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: isSticky ? '12px' : '0px',
        boxShadow: isSticky
          ? '0 8px 32px rgba(0, 0, 0, 0.12)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: isSticky ? '2px solid #4caf50' : '1px solid #e0e0e0',
        zIndex: isSticky ? 1000 : 1
      }}
    >
      <h3 style={{
        margin: 0,
        color: isSticky ? '#2e7d32' : '#424242',
        transition: 'color 0.3s ease'
      }}>
        Анимированный Sticky элемент
      </h3>
      <p style={{ margin: '8px 0 0', opacity: isSticky ? 1 : 0.7 }}>
        Состояние: {state}
      </p>
    </div>
  );
}
```

## ⚙️ Конфигурация

### Типы конфигурации

```tsx
// Позиция sticky элемента
interface StickyPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

// Состояния sticky элемента
type StickyState = 'normal' | 'sticky' | 'disabled';

// Стратегии позиционирования
type StickyStrategy =
  | 'standard'        // Стандартное sticky поведение
  | 'follow-scroll'   // Следует за скроллом с задержкой
  | 'magnetic'        // Притягивается к ближайшему краю
  | 'parallax'        // Parallax эффект
  | 'centered'        // Центрированное позиционирование
  | 'smart';          // Умное позиционирование на основе доступного места

// Режимы производительности
type PerformanceMode = 'low' | 'normal' | 'high';
```

## 🔍 Отладка

### DebugPanel компонент

Встроенная панель для отладки sticky элементов в development режиме.

```tsx
import { DebugPanel } from 'stuckin';

function App() {
  return (
    <StickyProvider debug>
      {/* Ваши компоненты */}

      {process.env.NODE_ENV === 'development' && (
        <DebugPanel
          position="bottom-right"
          collapsed={false}
          autoRefresh={true}
          refreshInterval={1000}
        />
      )}
    </StickyProvider>
  );
}
```

## ⚡ Производительность

### Оптимизация производительности

```tsx
// Высокопроизводительная конфигурация
<StickyProvider performanceMode="high">
  <Sticky
    direction="top"
    offset={{ top: 0 }}
    strategy="standard"        // Самая быстрая стратегия
    priority={1}               // Минимальная сложность z-index
  >
    High-performance sticky
  </Sticky>
</StickyProvider>
```

## 🔄 Миграция

### Миграция с версии 1.0.16 на 1.0.17

В версии 1.0.17 произошли значительные изменения в именовании компонентов для улучшения семантики:

#### ⚠️ Breaking Changes

1. **StickyContainer → StickyGroup**
2. **StickyInContainer → StickyContainer**
3. **useStickyContainer → useStickyInContainer**

#### Автоматическая миграция

```bash
# Используйте этот скрипт для автоматической замены в вашем проекте
find . -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | \
xargs sed -i '' \
  -e 's/StickyContainer/StickyGroup/g' \
  -e 's/StickyInContainer/StickyContainer/g' \
  -e 's/useStickyContainer/useStickyInContainer/g'
```

#### Ручная миграция

**До (v1.0.16):**
```tsx
import {
  StickyProvider,
  Sticky,
  StickyContainer,      // Это была группа
  StickyInContainer,    // Это был sticky в контейнере
  useStickyContainer    // Это был хук для контейнеров
} from 'stuckin';

// Группа sticky элементов
<StickyContainer groupId="nav">
  <Sticky direction="top">Header</Sticky>
</StickyContainer>

// Sticky в скролл-контейнере
<StickyInContainer
  container=".scroll-container"
  direction="top"
>
  Content
</StickyInContainer>

// Хук для контейнеров
const { ref } = useStickyContainer({
  container: '.my-container',
  direction: 'top'
});
```

**После (v1.0.17):**
```tsx
import {
  StickyProvider,
  Sticky,
  StickyGroup,          // Переименовано из StickyContainer
  StickyContainer,      // Переименовано из StickyInContainer
  useStickyInContainer  // Переименовано из useStickyContainer
} from 'stuckin';

// Группа sticky элементов
<StickyGroup groupId="nav">
  <Sticky direction="top">Header</Sticky>
</StickyGroup>

// Sticky в скролл-контейнере
<StickyContainer
  container=".scroll-container"
  direction="top"
>
  Content
</StickyContainer>

// Хук для контейнеров
const { ref } = useStickyInContainer({
  container: '.my-container',
  direction: 'top'
});
```

## 📄 Лицензия

MIT © [Pavel Melnik](https://github.com/PavelMelnik94)

---

## 🤝 Содействие

Приветствуются вклады в развитие проекта! Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](./CONTRIBUTING.md) для получения подробной информации.

## 📮 Обратная связь

- 🐛 [Сообщить об ошибке](https://github.com/PavelMelnik94/stuckin/issues)
- 💡 [Предложить улучшение](https://github.com/PavelMelnik94/stuckin/issues)
- 📧 [Связаться с автором](mailto:pavelmelnik94@gmail.com)

## ⭐ Поддержка

Если библиотека оказалась полезной, поставьте ⭐ на [GitHub](https://github.com/PavelMelnik94/stuckin)!
