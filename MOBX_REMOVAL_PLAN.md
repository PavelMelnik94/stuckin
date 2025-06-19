# План удаления MobX из stuckin

## 🎯 Цель
Удалить зависимость от MobX, заменив на встроенные React механизмы без потери функционала.

## 📊 Текущее использование MobX

### 1. StickyManager (`src/core/StickyManager.ts`)
- `@observable` для Map'ов: elements, groups, scrollContainers
- `@action` для методов изменения состояния
- `@computed` для вычисляемых свойств

### 2. StickyDebugger (`src/debug/StickyDebugger.ts`)
- `@observable` для отладочных данных
- `@action` для логирования событий

### 3. Компоненты
- `observer()` wrapper для автоматического ререндера
- Используют реактивные данные из Manager'а

## ✅ План замены

### Этап 1: Context + useReducer
Заменим MobX State Management на:
```tsx
// StickyContext с useReducer для глобального состояния
const StickyContext = createContext<{
  state: StickyState;
  dispatch: Dispatch<StickyAction>;
}>();
```

### Этап 2: Event System
Заменим MobX реактивность на:
```tsx
// Custom hook для подписок на изменения
const useSubscription = (manager: StickyManager, selector: (state) => any) => {
  const [value, setValue] = useState(() => selector(manager.getState()));
  
  useEffect(() => {
    return manager.subscribe((state) => setValue(selector(state)));
  }, []);
  
  return value;
};
```

### Этап 3: Миграция StickyManager
```typescript
class StickyManager extends EventTarget {
  private elements = new Map<string, StickyElement>();
  private groups = new Map<string, StickyGroup>();
  
  // Вместо @action используем notify pattern
  registerSticky(element: HTMLElement, config: StickyConfig) {
    this.elements.set(config.id, stickyElement);
    this.notify('element-registered', { id: config.id });
  }
  
  private notify(type: string, data: any) {
    this.dispatchEvent(new CustomEvent(type, { detail: data }));
  }
}
```

### Этап 4: Миграция компонентов
```tsx
// Вместо observer - обычные React компоненты с подписками
export const Sticky: React.FC<StickyProps> = (props) => {
  const { state, dispatch } = useContext(StickyContext);
  const element = useSubscription(manager, s => s.elements.get(props.id));
  
  // обычная логика без observer
};
```

## 🚀 Преимущества

1. **Размер bundle**: -15-20KB (mobx + mobx-react-lite)
2. **Упрощение**: нет дополнительных концепций MobX
3. **React 18+**: лучшая совместимость с Concurrent Features
4. **Меньше зависимостей**: только React

## 📋 TODO

- [ ] Создать новый StickyManager без MobX
- [ ] Заменить Context на useReducer
- [ ] Создать систему подписок/событий
- [ ] Обновить компоненты (убрать observer)
- [ ] Обновить StickyDebugger
- [ ] Обновить тесты
- [ ] Обновить документацию
- [ ] Провести performance тесты

## ⚠️ Риски

1. **Performance**: нужно тщательно оптимизировать ререндеры
2. **Сложность**: больше boilerplate кода
3. **Тестирование**: нужно убедиться что все работает идентично

## 🧪 Тестирование

1. Все существующие тесты должны проходить
2. Performance не должен ухудшиться > 10%
3. Bundle size должен уменьшиться > 15KB
