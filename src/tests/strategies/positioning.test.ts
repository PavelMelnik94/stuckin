import {
  standardStrategy,
  centeredStrategy,
  smartStrategy,
  followScrollStrategy,
  magneticStrategy,
  parallaxStrategy,
  adaptiveStrategy,
  animatedStrategy,
  stackingStrategy,
  positionStrategyManager,
  type PositionStrategy,
  type ViewportInfo
} from '../../strategies/positioning';
import type { StickyConfig, StickyDirection } from '../../types/sticky.types';

describe('Positioning Strategies', () => {
  // Mock элемент с настраиваемыми размерами и позицией
  const createMockElement = (
    x = 100,
    y = 100,
    width = 200,
    height = 50
  ): HTMLElement => {
    const element = document.createElement('div');

    // Мокаем getBoundingClientRect
    jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      x,
      y,
      width,
      height,
      top: y,
      left: x,
      bottom: y + height,
      right: x + width,
      toJSON: () => ({})
    } as DOMRect);

    return element;
  };

  const mockViewport: ViewportInfo = {
    width: 1920,
    height: 1080,
    scrollX: 0,
    scrollY: 0
  };

  const createBaseConfig = (direction: StickyDirection, overrides: Partial<StickyConfig> = {}): StickyConfig => ({
    id: 'test-element',
    direction,
    offset: { top: 10, left: 20, right: 30, bottom: 40 },
    priority: 1,
    zIndex: 999,
    disabled: false,
    ...overrides
  });

  describe('standardStrategy', () => {
    it('должен корректно определять совместимость', () => {
      expect(standardStrategy.canHandle(createBaseConfig('top'))).toBe(true);
      expect(standardStrategy.canHandle(createBaseConfig('bottom'))).toBe(true);
      expect(standardStrategy.canHandle(createBaseConfig('left'))).toBe(true);
      expect(standardStrategy.canHandle(createBaseConfig('right'))).toBe(true);
    });

    it('должен рассчитывать позицию для top direction', () => {
      const element = createMockElement(100, 200, 300, 50);
      const config = createBaseConfig('top');
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        top: 10,
        left: 100,
        zIndex: 999
      });
    });

    it('должен рассчитывать позицию для bottom direction', () => {
      const element = createMockElement(100, 200, 300, 50);
      const config = createBaseConfig('bottom');
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        bottom: 40,
        left: 100,
        zIndex: 999
      });
    });

    it('должен рассчитывать позицию для left direction', () => {
      const element = createMockElement(100, 200, 300, 50);
      const config = createBaseConfig('left');
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        left: 20,
        top: 200,
        zIndex: 999
      });
    });

    it('должен рассчитывать позицию для right direction', () => {
      const element = createMockElement(100, 200, 300, 50);
      const config = createBaseConfig('right');
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        right: 30,
        top: 200,
        zIndex: 999
      });
    });

    it('должен использовать дефолтные offset значения', () => {
      const element = createMockElement();
      const config = createBaseConfig('top', { offset: {} });
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result.top).toBe(0);
    });

    it('должен использовать дефолтный zIndex', () => {
      const element = createMockElement();
      const config = createBaseConfig('top', { zIndex: undefined });
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result.zIndex).toBe(1000);
    });
  });

  describe('centeredStrategy', () => {
    it('должен определять совместимость только для center направления', () => {
      const centerConfig = createBaseConfig('top', { direction: 'center' as StickyDirection });
      expect(centeredStrategy.canHandle(centerConfig)).toBe(true);

      expect(centeredStrategy.canHandle(createBaseConfig('top'))).toBe(false);
      expect(centeredStrategy.canHandle(createBaseConfig('bottom'))).toBe(false);
    });

    it('должен рассчитывать центрированную позицию', () => {
      const element = createMockElement(0, 0, 400, 200);
      const config = createBaseConfig('top', { direction: 'center' as StickyDirection, zIndex: 500 });
      const result = centeredStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        top: (mockViewport.height - 200) / 2, // (1080 - 200) / 2 = 440
        left: (mockViewport.width - 400) / 2, // (1920 - 400) / 2 = 760
        zIndex: 500
      });
    });

    it('должен использовать дефолтный zIndex для центрированной позиции', () => {
      const element = createMockElement(0, 0, 100, 100);
      const config = createBaseConfig('top', { direction: 'center' as StickyDirection, zIndex: undefined });
      const result = centeredStrategy.calculate(element, config, mockViewport);

      expect(result.zIndex).toBe(1000);
    });
  });

  describe('smartStrategy', () => {
    it('должен определять совместимость только для smart направления', () => {
      const smartConfig = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      expect(smartStrategy.canHandle(smartConfig)).toBe(true);

      expect(smartStrategy.canHandle(createBaseConfig('top'))).toBe(false);
    });

    it('должен позиционировать сверху при наибольшем пространстве сверху', () => {
      // Элемент ближе к низу экрана - больше места сверху
      // spaceTop = 800, spaceBottom = 1080-850=230, spaceLeft = 400, spaceRight = 1920-600=1320
      // Максимальное пространство справа (1320), но проверим что достаточно места для элемента (width=200)
      const element = createMockElement(400, 800, 200, 50);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection, zIndex: 777 });
      const result = smartStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        right: 0,
        zIndex: 777
      });
    });

    it('должен позиционировать снизу при наибольшем пространстве снизу', () => {
      // Элемент близко к верху экрана: top=50, bottom=100, left=400, right=1520
      // spaceTop = 50, spaceBottom = 1080-100=980, spaceLeft = 400, spaceRight = 1920-600=1320
      // Максимальное пространство справа (1320)
      const element = createMockElement(400, 50, 200, 50);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      const result = smartStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        right: 0,
        zIndex: 999
      });
    });

    it('должен позиционировать слева при наибольшем пространстве слева', () => {
      // Элемент ближе к правому краю - больше места слева
      // spaceTop = 400, spaceBottom = 1080-450=630, spaceLeft = 1700, spaceRight = 1920-1800=120
      // Максимальное пространство слева (1700) и достаточно места для элемента (width=100)
      const element = createMockElement(1700, 400, 100, 50);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      const result = smartStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        left: 0,
        zIndex: 999
      });
    });

    it('должен позиционировать справа при наибольшем пространстве справа', () => {
      // Элемент ближе к левому краю - больше места справа
      // spaceTop = 400, spaceBottom = 1080-450=630, spaceLeft = 50, spaceRight = 1920-150=1770
      // Максимальное пространство справа (1770) и достаточно места для элемента (width=100)
      const element = createMockElement(50, 400, 100, 50);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      const result = smartStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        right: 0,
        zIndex: 999
      });
    });

    it('должен использовать fallback к верхней позиции при недостатке места', () => {
      // Элемент в центре, но с большими размерами - не хватает места ни в одном направлении
      const element = createMockElement(800, 500, 1000, 600);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      const result = smartStrategy.calculate(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        top: 0,
        zIndex: 999
      });
    });

    it('должен проверять достаточность пространства для элемента', () => {
      // Создаем ситуацию где сверху недостаточно места, но достаточно снизу
      // spaceTop = 50 (< elementHeight=100), spaceBottom = 1080-150=930 (> elementHeight=100)
      // spaceLeft = 400, spaceRight = 1920-600=1320
      // Максимальное пространство справа (1320) и достаточно места для элемента (width=200)
      const element = createMockElement(400, 50, 200, 100);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      const result = smartStrategy.calculate(element, config, mockViewport);

      // Должен выбрать right, так как там больше всего места
      expect(result.right).toBe(0);
    });
  });

  describe('PositionStrategyManager', () => {
    let originalStrategies: Map<string, PositionStrategy>;

    beforeEach(() => {
      // Сохраняем оригинальные стратегии для восстановления
      originalStrategies = new Map(positionStrategyManager['strategies']);
    });

    afterEach(() => {
      // Восстанавливаем оригинальные стратегии
      positionStrategyManager['strategies'] = originalStrategies;
    });

    it('должен содержать встроенные стратегии', () => {
      expect(positionStrategyManager.getStrategy('standard')).toBe(standardStrategy);
      expect(positionStrategyManager.getStrategy('centered')).toBe(centeredStrategy);
      expect(positionStrategyManager.getStrategy('smart')).toBe(smartStrategy);
    });

    it('должен добавлять новые стратегии', () => {
      const customStrategy: PositionStrategy = {
        name: 'custom',
        canHandle: () => true,
        calculate: () => ({ position: 'fixed', zIndex: 1000 })
      };

      positionStrategyManager.addStrategy(customStrategy);
      expect(positionStrategyManager.getStrategy('custom')).toBe(customStrategy);
    });

    it('должен возвращать null для несуществующей стратегии', () => {
      expect(positionStrategyManager.getStrategy('nonexistent')).toBeNull();
    });

    it('должен находить стратегию по explicit указанию', () => {
      const config = createBaseConfig('top', { positionStrategy: 'centered' });

      // Мокаем canHandle для центрованной стратегии
      const originalCanHandle = centeredStrategy.canHandle;
      centeredStrategy.canHandle = jest.fn().mockReturnValue(true);

      const strategy = positionStrategyManager.findStrategy(config);
      expect(strategy).toBe(centeredStrategy);

      // Восстанавливаем оригинальную функцию
      centeredStrategy.canHandle = originalCanHandle;
    });

    it('должен находить подходящую стратегию автоматически', () => {
      const config = createBaseConfig('top');
      const strategy = positionStrategyManager.findStrategy(config);
      expect(strategy).toBe(standardStrategy);
    });

    it('должен возвращать стандартную стратегию как fallback', () => {
      const config = createBaseConfig('top', { direction: 'unknown' as StickyDirection });
      const strategy = positionStrategyManager.findStrategy(config);
      expect(strategy).toBe(standardStrategy);
    });

    it('должен вычислять позицию используя найденную стратегию', () => {
      const element = createMockElement();
      const config = createBaseConfig('top');
      const result = positionStrategyManager.calculatePosition(element, config, mockViewport);

      expect(result).toEqual({
        position: 'fixed',
        top: 10,
        left: 100,
        zIndex: 999
      });
    });

    it('должен игнорировать explicit стратегию если она не может обработать конфигурацию', () => {
      const config = createBaseConfig('top', { positionStrategy: 'centered' });
      const strategy = positionStrategyManager.findStrategy(config);
      expect(strategy).toBe(standardStrategy); // Fallback к standard
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать элементы с нулевыми размерами', () => {
      const element = createMockElement(100, 100, 0, 0);
      const config = createBaseConfig('top');
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result.position).toBe('fixed');
      expect(result.top).toBe(10);
    });

    it('должен обрабатывать отрицательные позиции элементов', () => {
      const element = createMockElement(-50, -30, 100, 50);
      const config = createBaseConfig('left');
      const result = standardStrategy.calculate(element, config, mockViewport);

      expect(result.left).toBe(20);
      expect(result.top).toBe(-30);
    });

    it('должен обрабатывать элементы за пределами viewport', () => {
      const element = createMockElement(2000, 1200, 100, 50);
      const config = createBaseConfig('top', { direction: 'smart' as StickyDirection });
      const result = smartStrategy.calculate(element, config, mockViewport);

      expect(result.position).toBe('fixed');
      expect(result.zIndex).toBe(999);
    });

    it('должен обрабатывать малые viewport размеры', () => {
      const smallViewport: ViewportInfo = {
        width: 320,
        height: 568,
        scrollX: 0,
        scrollY: 0
      };

      const element = createMockElement(160, 284, 100, 50);
      const config = createBaseConfig('top', { direction: 'center' as StickyDirection });
      const result = centeredStrategy.calculate(element, config, smallViewport);

      expect(result.left).toBe((320 - 100) / 2);
      expect(result.top).toBe((568 - 50) / 2);
    });
  });

  describe('новые стратегии позиционирования', () => {
    test('followScrollStrategy должен корректно вычислять позицию с лагом', () => {
      const config: StickyConfig = {
        id: 'test',
        direction: 'follow-scroll',
        offset: { top: 0 },
        priority: 1,
        followScroll: { lag: 0.2, bounds: { top: 10, bottom: 20 } }
      } as any;

      const element = createMockElement(100, 50);
      const viewport = { width: 1200, height: 800, scrollX: 0, scrollY: 100 };

      const result = followScrollStrategy.calculate(element, config, viewport);

      expect(result.position).toBe('fixed');
      expect(result.top).toBe(90); // 100 * (1 - 0.2) + 10
      expect(result.transform).toContain('translate3d');
    });

    test('magneticStrategy должен притягивать элемент к ближайшему краю', () => {
      const config: StickyConfig = {
        id: 'test',
        direction: 'magnetic',
        offset: { top: 0 },
        priority: 1,
        magnetic: { threshold: 50, strength: 0.8, edges: ['top', 'left'] }
      } as any;

      // Элемент близко к верхнему краю (30px)
      const element = createMockElement(100, 30, 100, 50);
      const viewport = { width: 1200, height: 800, scrollX: 0, scrollY: 0 };

      const result = magneticStrategy.calculate(element, config, viewport);

      expect(result.position).toBe('fixed');
      expect(result.top).toBeLessThan(30); // Должен притянуться к верху
    });

    test('parallaxStrategy должен применять parallax эффект', () => {
      const config: StickyConfig = {
        id: 'test',
        direction: 'parallax',
        offset: { top: 0 },
        priority: 1,
        parallax: { speed: 0.5, direction: 'vertical', reverse: false }
      } as any;

      const element = createMockElement(100, 50);
      const viewport = { width: 1200, height: 800, scrollX: 0, scrollY: 200 };

      const result = parallaxStrategy.calculate(element, config, viewport);

      expect(result.position).toBe('fixed');
      expect(result.transform).toContain('translateY(100px)'); // 200 * 0.5
    });

    test('adaptiveStrategy должен адаптироваться к размеру элемента', () => {
      const config: StickyConfig = {
        id: 'test',
        direction: 'adaptive',
        offset: { top: 0 },
        priority: 1
      };

      // Большой элемент (более 30% от viewport)
      const largeElement = createMockElement(0, 0, 600, 400); // 240000px² vs 960000px² viewport
      const viewport = { width: 1200, height: 800, scrollX: 0, scrollY: 0 };

      const result = adaptiveStrategy.calculate(largeElement, config, viewport);

      expect(result.position).toBe('fixed');
      // Большой элемент должен быть центрирован
      expect(result.top).toBe((800 - 400) / 2);
      expect(result.left).toBe((1200 - 600) / 2);
    });

    test('animatedStrategy должен добавлять CSS transitions', () => {
      const config: StickyConfig = {
        id: 'test',
        direction: 'animated',
        offset: { top: 0 },
        priority: 1,
        animated: { duration: 500, easing: 'ease-in-out' }
      } as any;

      const element = createMockElement(100, 50);
      const viewport = { width: 1200, height: 800, scrollX: 0, scrollY: 0 };

      const result = animatedStrategy.calculate(element, config, viewport);

      expect(result.position).toBe('fixed');
      expect(result.transform).toContain('translate3d');
      expect(element.style.transition).toBe('all 500ms ease-in-out');
    });

    test('stackingStrategy должен позиционировать элементы в стеке', () => {
      // Создаем мок группы элементов
      const mockGroup = document.createElement('div');
      mockGroup.setAttribute('data-sticky-group', 'test-group');
      mockGroup.style.height = '60px';
      document.body.appendChild(mockGroup);

      const config: StickyConfig = {
        id: 'test',
        direction: 'stacking',
        offset: { top: 0 },
        priority: 1,
        stacking: { spacing: 10, direction: 'vertical', alignment: 'start' }
      } as any;

      const element = createMockElement(100, 50);
      element.setAttribute('data-sticky-group', 'test-group');
      document.body.appendChild(element);

      const viewport = { width: 1200, height: 800, scrollX: 0, scrollY: 0 };

      const result = stackingStrategy.calculate(element, config, viewport);

      expect(result.position).toBe('fixed');
      expect(result.top).toBeGreaterThanOrEqual(0);
      expect(result.zIndex).toBeGreaterThanOrEqual(1000);

      // Cleanup
      document.body.removeChild(mockGroup);
      document.body.removeChild(element);
    });
  });
});
