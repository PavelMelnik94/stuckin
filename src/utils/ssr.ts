/**
 * Утилиты для поддержки Server-Side Rendering
 * Принцип Interface Segregation: отдельные интерфейсы для server и client
 */

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

class SSRManager {
  private isSSR: boolean;
  private isHydrated = false;
  private hydrationCallbacks = new Set<() => void>();

  constructor() {
    this.isSSR = typeof window === 'undefined';

    if (!this.isSSR) {
      // Ждем hydration React
      this.waitForHydration();
    }
  }

  /**
   * Проверка SSR окружения
   */
  getSSRState(): SSRStickyState {
    return {
      isSSR: this.isSSR,
      isHydrated: this.isHydrated,
      shouldSuppressWarning: !this.isHydrated
    };
  }

  /**
   * Безопасное выполнение кода только на клиенте
   */
  onClient<T>(callback: () => T, fallback?: T): T | undefined {
    if (this.isSSR) {
      return fallback;
    }

    if (!this.isHydrated) {
      // Откладываем выполнение до hydration
      return new Promise<T>((resolve) => {
        this.hydrationCallbacks.add(() => {
          resolve(callback());
        });
      }) as any;
    }

    return callback();
  }

  /**
   * Регистрация callback для выполнения после hydration
   */
  onHydrated(callback: () => void): () => void {
    if (this.isHydrated) {
      callback();
      return () => {}; // noop cleanup
    }

    this.hydrationCallbacks.add(callback);

    return () => {
      this.hydrationCallbacks.delete(callback);
    };
  }

  /**
   * Получение безопасных значений для SSR
   */
  getSafeValue<T>(clientValue: () => T, serverValue: T): T {
    return this.isSSR ? serverValue : clientValue();
  }

  /**
   * Ожидание завершения hydration
   */
  private waitForHydration(): void {
    // Используем различные стратегии определения hydration
    const checkHydration = () => {
      // Метод 1: проверяем наличие React Fiber
      if (document.querySelector('[data-reactroot]') ||
          document.querySelector('#__next') ||
          document.querySelector('#root')) {
        this.markAsHydrated();
        return;
      }

      // Метод 2: ждем DOMContentLoaded
      if (document.readyState === 'complete') {
        setTimeout(() => this.markAsHydrated(), 100);
        return;
      }

      // Метод 3: используем MutationObserver
      const observer = new MutationObserver(() => {
        if (document.body.children.length > 0) {
          observer.disconnect();
          setTimeout(() => this.markAsHydrated(), 50);
        }
      });

      observer.observe(document.body, { childList: true });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkHydration);
    } else {
      checkHydration();
    }
  }

  /**
   * Отметка о завершении hydration
   */
  private markAsHydrated(): void {
    this.isHydrated = true;

    // Выполняем отложенные callback'и
    this.hydrationCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Ошибка в hydration callback:', error);
      }
    });

    this.hydrationCallbacks.clear();
  }
}

// Глобальный SSR manager
export const ssrManager = new SSRManager();

/**
 * HOC для поддержки SSR в sticky компонентах
 */
export function withSSR<P extends object>(
  Component: React.ComponentType<P>,
  ssrConfig: SSRConfig = { enabled: true }
) {
  return React.forwardRef<any, P>((props, ref) => {
    const [isClient, setIsClient] = useState(false);
    const ssrState = ssrManager.getSSRState();

    useEffect(() => {
      const cleanup = ssrManager.onHydrated(() => {
        setIsClient(true);
      });

      return cleanup;
    }, []);

    // Во время SSR или до hydration возвращаем placeholder
    if (ssrState.isSSR || (!isClient && ssrConfig.enabled)) {
      return (
        <div
          style={{
            minHeight: ssrConfig.fallbackHeight || 'auto',
            visibility: 'hidden'
          }}
          suppressHydrationWarning={ssrConfig.suppressHydrationWarning}
        >
          {/* Placeholder контент */}
        </div>
      );
    }

    return <Component {...props} ref={ref} />;
  });
}
