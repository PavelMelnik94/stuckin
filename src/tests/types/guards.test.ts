/**
 * Unit тесты для type guards
 */

import {
  isNotNullish,
  isString,
  isNumber,
  isPositiveNumber,
  isBoolean,
  isFunction,
  isObject,
  isHTMLElement,
  isStickyDirection,
  isStickyState,
  isStickyConfig,
  isElementInDOM,
  isElementVisible,
  isValidDOMRect,
  supportsIntersectionObserver,
  supportsResizeObserver,
  supportsStickyPosition,
  isBrowser,
  isServer,
  hasProperty,
  isArrayOf,
  combineGuards,
  isOneOf
} from '../../types/guards';
import type { StickyConfig } from '../../types/sticky.types';

describe('Type Guards', () => {
  describe('базовые Type Guards', () => {
    test('isNotNullish должен проверять не-null значения', () => {
      expect(isNotNullish('test')).toBe(true);
      expect(isNotNullish(123)).toBe(true);
      expect(isNotNullish(0)).toBe(true);
      expect(isNotNullish(false)).toBe(true);
      expect(isNotNullish(null)).toBe(false);
      expect(isNotNullish(undefined)).toBe(false);
    });

    test('isString должен корректно определять строки', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(`template`)).toBe(true);
      expect(isString(String('test'))).toBe(true);
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
    });

    test('isNumber должен корректно определять числа', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(NaN)).toBe(false); // NaN не считается валидным числом
      expect(isNumber(Infinity)).toBe(false); // Infinity не считается валидным числом
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });

    test('isPositiveNumber должен проверять положительные числа', () => {
      expect(isPositiveNumber(123)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-123)).toBe(false);
      expect(isPositiveNumber('123')).toBe(false);
    });

    test('isBoolean должен корректно определять булевые значения', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(Boolean(1))).toBe(true);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean(null)).toBe(false);
    });

    test('isFunction должен корректно определять функции', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction('string')).toBe(false);
      expect(isFunction(123)).toBe(false);
      expect(isFunction({})).toBe(false);
    });

    test('isObject должен корректно определять объекты', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject([])).toBe(false); // массивы не считаются простыми объектами
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
    });

    test('isHTMLElement должен проверять DOM элементы', () => {
      const div = document.createElement('div');
      expect(isHTMLElement(div)).toBe(true);
      expect(isHTMLElement(document.body)).toBe(true);
      expect(isHTMLElement(null)).toBe(false);
      expect(isHTMLElement({})).toBe(false);
      expect(isHTMLElement('div')).toBe(false);
    });
  });

  describe('Sticky специфичные type guards', () => {
    test('isStickyDirection должен проверять направления', () => {
      expect(isStickyDirection('top')).toBe(true);
      expect(isStickyDirection('bottom')).toBe(true);
      expect(isStickyDirection('left')).toBe(true);
      expect(isStickyDirection('right')).toBe(true);
      expect(isStickyDirection('invalid')).toBe(false);
      expect(isStickyDirection(null)).toBe(false);
      expect(isStickyDirection(123)).toBe(false);
    });

    test('isStickyState должен проверять состояния sticky', () => {
      expect(isStickyState('normal')).toBe(true);
      expect(isStickyState('sticky')).toBe(true);
      expect(isStickyState('bottom-reached')).toBe(true);
      expect(isStickyState('invalid')).toBe(false);
      expect(isStickyState(null)).toBe(false);
      expect(isStickyState(123)).toBe(false);
    });

    test('isStickyConfig должен проверять конфигурацию sticky', () => {
      const validConfig: StickyConfig = {
        id: 'test',
        direction: 'top',
        offset: { top: 0, bottom: 0, left: 0, right: 0 },
        priority: 1
      };

      expect(isStickyConfig(validConfig)).toBe(true);
      expect(isStickyConfig(null)).toBe(false);
      expect(isStickyConfig({})).toBe(false); // не хватает обязательных полей
      expect(isStickyConfig({ id: 123 })).toBe(false); // неправильный тип id
    });
  });

  describe('DOM type guards', () => {
    test('isElementInDOM должен проверять присутствие в DOM', () => {
      const div = document.createElement('div');
      expect(isElementInDOM(div)).toBe(false); // элемент не добавлен в DOM

      document.body.appendChild(div);
      expect(isElementInDOM(div)).toBe(true); // элемент в DOM

      document.body.removeChild(div);
    });

    test('isElementVisible должен проверять видимость элемента', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      expect(isElementVisible(div)).toBe(true); // по умолчанию видим

      div.style.display = 'none';
      expect(isElementVisible(div)).toBe(false);

      div.style.display = 'block';
      div.style.visibility = 'hidden';
      expect(isElementVisible(div)).toBe(false);

      div.style.visibility = 'visible';
      div.style.opacity = '0';
      expect(isElementVisible(div)).toBe(false);

      document.body.removeChild(div);
    });

    test('isValidDOMRect должен проверять DOMRect объекты', () => {
      const validRect = {
        width: 100,
        height: 50,
        top: 10,
        left: 20,
        bottom: 60,
        right: 120
      };

      expect(isValidDOMRect(validRect)).toBe(true);
      expect(isValidDOMRect({})).toBe(false);
      expect(isValidDOMRect({ width: 'invalid' })).toBe(false);
      expect(isValidDOMRect(null)).toBe(false);
    });
  });

  describe('browser API type guards', () => {
    test('supportsIntersectionObserver должен проверять поддержку API', () => {
      expect(typeof supportsIntersectionObserver()).toBe('boolean');
      // В тестовой среде с jsdom обычно поддерживается
      expect(supportsIntersectionObserver()).toBe(true);
    });

    test('supportsResizeObserver должен проверять поддержку API', () => {
      expect(typeof supportsResizeObserver()).toBe('boolean');
    });

    test('supportsStickyPosition должен проверять поддержку CSS sticky', () => {
      expect(typeof supportsStickyPosition()).toBe('boolean');
    });

    test('isBrowser должен определять браузерную среду', () => {
      expect(isBrowser()).toBe(true); // В тестах всегда true благодаря jsdom
    });

    test('isServer должен определять серверную среду', () => {
      expect(isServer()).toBe(false); // В тестах всегда false благодаря jsdom
    });
  });

  describe('продвинутые type guards', () => {
    test('hasProperty должен проверять наличие свойства', () => {
      const obj = { name: 'test', value: 123 };
      expect(hasProperty(obj, 'name')).toBe(true);
      expect(hasProperty(obj, 'value')).toBe(true);
      expect(hasProperty(obj, 'missing')).toBe(false);
      expect(hasProperty(null, 'name')).toBe(false);
      expect(hasProperty(undefined, 'name')).toBe(false);
    });

    test('isArrayOf должен проверять массивы определенного типа', () => {
      const strings = ['a', 'b', 'c'];
      const numbers = [1, 2, 3];
      const mixed = ['a', 1, 'b'];

      expect(isArrayOf(strings, isString)).toBe(true);
      expect(isArrayOf(numbers, isNumber)).toBe(true);
      expect(isArrayOf(mixed, isString)).toBe(false);
      expect(isArrayOf(mixed, isNumber)).toBe(false);
      expect(isArrayOf('not array', isString)).toBe(false);
    });

    test('combineGuards должен объединять type guards', () => {
      const isStringAndNotEmpty = combineGuards(isString, (v): v is string => v !== '');

      expect(isStringAndNotEmpty('hello')).toBe(true);
      expect(isStringAndNotEmpty('')).toBe(false);
      expect(isStringAndNotEmpty(123)).toBe(false);
    });

    test('isOneOf должен проверять принадлежность к union типу', () => {
      const validStates = ['loading', 'success', 'error'] as const;

      expect(isOneOf('loading', validStates)).toBe(true);
      expect(isOneOf('success', validStates)).toBe(true);
      expect(isOneOf('invalid', validStates)).toBe(false);
      expect(isOneOf(123, validStates)).toBe(false);
    });
  });
});
