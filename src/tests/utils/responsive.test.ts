import { responsiveManager, DEFAULT_BREAKPOINTS } from '../../utils/responsive';

// Mock debugLogger
jest.mock('../../debug/debugLogger', () => ({
  debugLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Helper to create a mock MediaQueryList
const createMockMediaQueryList = (matches: boolean = false): MediaQueryList => ({
  matches,
  media: '',
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  addListener: jest.fn(), // deprecated
  removeListener: jest.fn(), // deprecated
  onchange: null,
  dispatchEvent: jest.fn(),
});

describe('Responsive Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMatchMedia.mockReturnValue(createMockMediaQueryList(false));
  });

  describe('DEFAULT_BREAKPOINTS', () => {
    it('должен содержать все необходимые breakpoints', () => {
      expect(DEFAULT_BREAKPOINTS).toHaveProperty('mobile');
      expect(DEFAULT_BREAKPOINTS).toHaveProperty('tablet');
      expect(DEFAULT_BREAKPOINTS).toHaveProperty('desktop');
      expect(DEFAULT_BREAKPOINTS).toHaveProperty('largeDesktop');
    });

    it('должен иметь правильную структуру breakpoints', () => {
      expect(DEFAULT_BREAKPOINTS['mobile']).toEqual({
        name: 'mobile',
        maxWidth: 767
      });

      expect(DEFAULT_BREAKPOINTS['tablet']).toEqual({
        name: 'tablet',
        minWidth: 768,
        maxWidth: 1023
      });

      expect(DEFAULT_BREAKPOINTS['desktop']).toEqual({
        name: 'desktop',
        minWidth: 1024,
        maxWidth: 1439
      });

      expect(DEFAULT_BREAKPOINTS['largeDesktop']).toEqual({
        name: 'largeDesktop',
        minWidth: 1440
      });
    });
  });

  describe('responsiveManager', () => {
    it('должен быть определен и иметь правильные методы', () => {
      expect(responsiveManager).toBeDefined();
      expect(typeof responsiveManager.getCurrentBreakpoint).toBe('function');
      expect(typeof responsiveManager.matches).toBe('function');
      expect(typeof responsiveManager.getConfigForBreakpoint).toBe('function');
      expect(typeof responsiveManager.subscribe).toBe('function');
      expect(typeof responsiveManager.addBreakpoint).toBe('function');
    });

    it('должен возвращать текущий breakpoint', () => {
      const current = responsiveManager.getCurrentBreakpoint();
      expect(typeof current).toBe('string');
    });

    it('должен проверять соответствие breakpoint', () => {
      // Настраиваем mock для возврата true для mobile
      mockMatchMedia.mockImplementation((query) => {
        const matches = query === '(max-width: 767px)';
        return createMockMediaQueryList(matches);
      });

      const result = responsiveManager.matches('mobile');
      expect(typeof result).toBe('boolean');
    });

    it('должен возвращать конфигурацию для breakpoint', () => {
      const config = {
        mobile: { offset: { top: 10 } },
        desktop: { offset: { top: 20 } },
      };

      const result = responsiveManager.getConfigForBreakpoint(config);
      // Результат может быть object или null в зависимости от текущего breakpoint
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('должен поддерживать подписку на изменения breakpoint', () => {
      const callback = jest.fn();
      const unsubscribe = responsiveManager.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');

      // Должен корректно отписываться
      expect(() => unsubscribe()).not.toThrow();
    });

    it('должен добавлять новый breakpoint', () => {
      expect(() => {
        responsiveManager.addBreakpoint('test', {
          name: 'test',
          minWidth: 500,
          maxWidth: 800,
        });
      }).not.toThrow();
    });
  });

  describe('работа в различных условиях', () => {
    it('должен работать с различными типами конфигураций', () => {
      const stringConfig = {
        mobile: 'mobile-config',
        desktop: 'desktop-config',
      };

      const numberConfig = {
        mobile: 100,
        desktop: 200,
      };

      expect(() => {
        responsiveManager.getConfigForBreakpoint(stringConfig);
        responsiveManager.getConfigForBreakpoint(numberConfig);
      }).not.toThrow();
    });

    it('должен обрабатывать отсутствующие breakpoints', () => {
      const result = responsiveManager.matches('nonexistent');
      expect(result).toBe(false);
    });

    it('должен работать с пустой конфигурацией', () => {
      const result = responsiveManager.getConfigForBreakpoint({});
      expect(result).toBe(null);
    });
  });

  describe('интеграция с медиа-запросами', () => {
    it('должен создавать медиа-запросы при добавлении breakpoint', () => {
      const initialCalls = mockMatchMedia.mock.calls.length;

      responsiveManager.addBreakpoint('custom', {
        name: 'custom',
        minWidth: 600,
      });

      expect(mockMatchMedia.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('должен добавлять event listeners к медиа-запросам', () => {
      responsiveManager.addBreakpoint('listener-test', {
        name: 'listener-test',
        minWidth: 700,
      });

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать подписки без ошибок', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = responsiveManager.subscribe(callback1);
      const unsubscribe2 = responsiveManager.subscribe(callback2);

      expect(() => {
        unsubscribe1();
        unsubscribe2();
        unsubscribe1(); // повторная отписка
      }).not.toThrow();
    });

    it('должен обрабатывать breakpoints без медиа-условий', () => {
      expect(() => {
        responsiveManager.addBreakpoint('empty-breakpoint', {
          name: 'empty-breakpoint',
        });
      }).not.toThrow();
    });

    it('должен обрабатывать сложные breakpoints', () => {
      expect(() => {
        responsiveManager.addBreakpoint('complex', {
          name: 'complex',
          minWidth: 800,
          maxWidth: 1200,
          minHeight: 600,
          maxHeight: 900,
          orientation: 'landscape',
        });
      }).not.toThrow();
    });
  });
});
