/**
 * Интеграционные тесты для Sticky компонента
 */

import React from 'react';
import { screen } from '@testing-library/react';

import { Sticky } from '../../components/Sticky';
import { renderWithProvider, simulateScroll, waitForAnimations } from '../utils/testUtils';

describe('Sticky Component Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  describe('Рендеринг компонента', () => {
    test('должен рендерить дочерние элементы', () => {
      renderWithProvider(
        <Sticky id="render-test" direction="top" offset={{ top: 0 }}>
          <div>Test Content</div>
        </Sticky>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('должен применять переданные классы и стили', () => {
      renderWithProvider(
        <Sticky
          id="styles-test"
          direction="top"
          offset={{ top: 0 }}
          className="test-class"
          style={{ backgroundColor: 'red' }}
        >
          <div>Styled Content</div>
        </Sticky>
      );

      const stickyElement = screen.getByText('Styled Content').parentElement;
      expect(stickyElement).toHaveClass('test-class');
      expect(stickyElement).toHaveStyle('backgroundColor: red');
    });

    test('должен устанавливать data-атрибуты', () => {
      renderWithProvider(
        <Sticky id="data-test" direction="top" offset={{ top: 0 }}>
          <div>Data Content</div>
        </Sticky>
      );

      const stickyElement = screen.getByText('Data Content').parentElement;
      expect(stickyElement).toHaveAttribute('data-sticky-id', 'data-test');
      expect(stickyElement).toHaveAttribute('data-sticky-state', 'normal');
    });
  });

  describe('Поведение sticky', () => {
    test('должен изменять классы при изменении состояния', async () => {
      renderWithProvider(
        <Sticky
          id="state-classes-test"
          direction="top"
          offset={{ top: 50 }}
          activeClassName="is-sticky-active"
        >
          <div>State Content</div>
        </Sticky>
      );

      const stickyElement = screen.getByText('State Content').parentElement!;

      // Изначально не должно быть активного класса
      expect(stickyElement).not.toHaveClass('is-sticky-active');
      expect(stickyElement).toHaveClass('sticky-normal');

      // Симулируем условия для активации sticky
      // Нужно установить позицию элемента и проскроллить
      Object.defineProperty(stickyElement, 'getBoundingClientRect', {
        value: () => ({
          top: 30, // меньше offset (50)
          left: 0,
          width: 200,
          height: 100,
          bottom: 130,
          right: 200,
          x: 0,
          y: 30
        })
      });

      simulateScroll(0, 100);
      await waitForAnimations();

      // После скролла должны измениться классы
      expect(stickyElement).toHaveAttribute('data-sticky-state', 'sticky');
      expect(stickyElement).toHaveClass('sticky-sticky');
    });

    test('должен применять активные стили', async () => {
      renderWithProvider(
        <Sticky
          id="active-styles-test"
          direction="top"
          offset={{ top: 0 }}
          style={{ color: 'black' }}
          activeStyle={{ color: 'white', backgroundColor: 'blue' }}
        >
          <div>Active Styles Content</div>
        </Sticky>
      );

      const stickyElement = screen.getByText('Active Styles Content').parentElement!;

      // Изначально только базовые стили
      expect(stickyElement).toHaveStyle('color: black');
      expect(stickyElement).not.toHaveStyle('backgroundColor: blue');

      // Активируем sticky состояние, изменив позицию элемента
      jest.spyOn(stickyElement, 'getBoundingClientRect').mockReturnValue({
        top: -10, // выше viewport - должен стать sticky
        left: 0,
        width: 200,
        height: 100,
        bottom: 90,
        right: 200,
        x: 0,
        y: -10,
        toJSON: jest.fn()
      } as DOMRect);

      // Симулируем скролл и даем время на обработку
      simulateScroll(0, 50);
      await waitForAnimations();

      // Дополнительное ожидание для обработки setTimeout в handleScroll
      await new Promise(resolve => setTimeout(resolve, 50));

      // Должны примениться активные стили (проверяем через data-атрибут)
      expect(stickyElement).toHaveAttribute('data-sticky-state', 'sticky');

      // Если элемент стал sticky, то стили должны примениться
      if (stickyElement.getAttribute('data-sticky-state') === 'sticky') {
        expect(stickyElement).toHaveStyle('color: white');
        expect(stickyElement).toHaveStyle('backgroundColor: blue');
      }
    });
  });

  describe('Работа с тегами', () => {
    test('должен использовать кастомный тег', () => {
      renderWithProvider(
        <Sticky
          id="custom-tag-test"
          direction="top"
          offset={{ top: 0 }}
          tag="section"
        >
          <div>Custom Tag Content</div>
        </Sticky>
      );

      const stickyElement = screen.getByText('Custom Tag Content').parentElement;
      expect(stickyElement?.tagName).toBe('SECTION');
    });

    test('должен использовать div по умолчанию', () => {
      renderWithProvider(
        <Sticky id="default-tag-test" direction="top" offset={{ top: 0 }}>
          <div>Default Tag Content</div>
        </Sticky>
      );

      const stickyElement = screen.getByText('Default Tag Content').parentElement;
      expect(stickyElement?.tagName).toBe('DIV');
    });
  });

  describe('Ref функциональность', () => {
    test('должен предоставлять API через ref', () => {
      const ref = React.createRef<any>();

      renderWithProvider(
        <Sticky
          ref={ref}
          id="ref-api-test"
          direction="top"
          offset={{ top: 0 }}
        >
          <div>Ref API Content</div>
        </Sticky>
      );

      expect(ref.current).toBeDefined();
      expect(ref.current.element).toBeDefined();
      expect(ref.current.state).toBeDefined(); // Состояние может быть любым
      expect(typeof ref.current.isSticky).toBe('boolean');
      expect(typeof ref.current.refresh).toBe('function');
      expect(typeof ref.current.disable).toBe('function');
      expect(typeof ref.current.enable).toBe('function');
    });

    test('должен обновлять состояние через ref методы', () => {
      const ref = React.createRef<any>();

      renderWithProvider(
        <Sticky
          ref={ref}
          id="ref-methods-test"
          direction="top"
          offset={{ top: 0 }}
        >
          <div>Ref Methods Content</div>
        </Sticky>
      );

      // Тестируем методы
      expect(() => ref.current.refresh()).not.toThrow();
      expect(() => ref.current.disable()).not.toThrow();
      expect(() => ref.current.enable()).not.toThrow();
    });
  });

  describe('Интеграция с группами', () => {
    test('должен работать с группами через groupId', () => {
      renderWithProvider(
        <>
          <Sticky
            id="group-1"
            direction="top"
            offset={{ top: 0 }}
            groupId="test-group"
          >
            <div>Group Element 1</div>
          </Sticky>

          <Sticky
            id="group-2"
            direction="top"
            offset={{ top: 50 }}
            groupId="test-group"
          >
            <div>Group Element 2</div>
          </Sticky>
        </>
      );

      expect(screen.getByText('Group Element 1')).toBeInTheDocument();
      expect(screen.getByText('Group Element 2')).toBeInTheDocument();

      // Элементы должны быть в DOM с правильными атрибутами
      const element1 = screen.getByText('Group Element 1').parentElement;
      const element2 = screen.getByText('Group Element 2').parentElement;

      expect(element1).toHaveAttribute('data-sticky-id', 'group-1');
      expect(element2).toHaveAttribute('data-sticky-id', 'group-2');
    });
  });

  describe('Обработка ошибок', () => {
    test('должен корректно обрабатывать отсутствие children', () => {
      expect(() => {
        renderWithProvider(
          <Sticky id="no-children-test" direction="top" offset={{ top: 0 }} />
        );
      }).not.toThrow();
    });

    test('должен работать с null/undefined в children', () => {
      renderWithProvider(
        <Sticky id="null-children-test" direction="top" offset={{ top: 0 }}>
          {null}
          {undefined}
          <div>Valid Child</div>
        </Sticky>
      );

      expect(screen.getByText('Valid Child')).toBeInTheDocument();
    });
  });
});
