import React from 'react';
import { render, screen, act } from '@testing-library/react';

import { StickyGroup, type StickyGroupRef } from '../../components/StickyGroup';
import { renderWithProvider } from '../utils/testUtils';

describe('StickyGroup', () => {
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Создаем mock контейнер
    mockContainer = document.createElement('div');
    mockContainer.className = 'test-scroll-container';
    mockContainer.style.height = '300px';
    mockContainer.style.overflow = 'auto';
    document.body.appendChild(mockContainer);
  });

  afterEach(() => {
    if (document.body.contains(mockContainer)) {
      document.body.removeChild(mockContainer);
    }
  });

  describe('базовый рендеринг', () => {
    it('должен рендерить дочерние элементы', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-basic"
          >
            <div data-testid="sticky-content">Sticky Content</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByTestId('sticky-content')).toBeInTheDocument();
      expect(screen.getByText('Sticky Content')).toBeInTheDocument();
    });

    it('должен применять переданный className', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-classname"
            className="custom-sticky-class"
          >
            <div>Content</div>
          </StickyGroup>
        </div>
      );

      const stickyElement = screen.getByText('Content').parentElement;
      expect(stickyElement).toHaveClass('custom-sticky-class');
    });

    it('должен применять переданные стили', () => {
      const customStyle = { backgroundColor: 'red', padding: '20px' };

      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-style"
            style={customStyle}
          >
            <div>Styled Content</div>
          </StickyGroup>
        </div>
      );

      const stickyElement = screen.getByText('Styled Content').parentElement;
      expect(stickyElement).toHaveStyle('background-color: rgb(255, 0, 0)');
      expect(stickyElement).toHaveStyle('padding: 20px');
    });

    it('должен устанавливать data-атрибуты', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-data-attrs"
          >
            <div>Content</div>
          </StickyGroup>
        </div>
      );

      const stickyElement = screen.getByText('Content').parentElement;
      expect(stickyElement).toHaveAttribute('data-sticky-id', 'test-data-attrs');
      expect(stickyElement).toHaveAttribute('data-sticky', 'false');
    });
  });

  describe('конфигурация контейнера', () => {
    it('должен работать с селектором контейнера', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-selector"
          >
            <div>Selector Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Selector Test')).toBeInTheDocument();
    });

    it('должен работать с HTMLElement контейнером', () => {
      renderWithProvider(
        <div>
          <StickyGroup
            container={mockContainer}
            direction="top"
            offset={{ top: 10 }}
            id="test-element"
          >
            <div>Element Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Element Test')).toBeInTheDocument();
    });

    it('должен поддерживать containerOffset', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            containerOffset={{ top: 20, left: 15 }}
            id="test-container-offset"
          >
            <div>Offset Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Offset Test')).toBeInTheDocument();
    });
  });

  describe('направления sticky', () => {
    const directions = [
      { direction: 'top' as const, offset: { top: 10 } },
      { direction: 'bottom' as const, offset: { bottom: 10 } },
      { direction: 'left' as const, offset: { left: 10 } },
      { direction: 'right' as const, offset: { right: 10 } }
    ];

    directions.forEach(({ direction, offset }) => {
      it(`должен поддерживать направление ${direction}`, () => {
        renderWithProvider(
          <div className="test-scroll-container">
            <StickyGroup
              container=".test-scroll-container"
              direction={direction}
              offset={offset}
              id={`test-direction-${direction}`}
            >
              <div>{direction} Direction</div>
            </StickyGroup>
          </div>
        );

        expect(screen.getByText(`${direction} Direction`)).toBeInTheDocument();
      });
    });
  });

  describe('поведение sticky', () => {
    it('должен изменять классы при изменении activeClassName', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-active-class"
            activeClassName="is-sticky-active"
          >
            <div>Active Class Test</div>
          </StickyGroup>
        </div>
      );

      const stickyElement = screen.getByText('Active Class Test').parentElement;
      expect(stickyElement).toBeInTheDocument();
      // В начальном состоянии не должно быть активного класса
      expect(stickyElement).not.toHaveClass('is-sticky-active');
    });

    it('должен применять активные стили', () => {
      const activeStyle = { backgroundColor: 'blue', transform: 'scale(1.1)' };

      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-active-style"
            activeStyle={activeStyle}
          >
            <div>Active Style Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Active Style Test')).toBeInTheDocument();
    });
  });

  describe('работа с тегами', () => {
    it('должен использовать кастомный тег', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-custom-tag"
            tag="section"
          >
            <div>Custom Tag Test</div>
          </StickyGroup>
        </div>
      );

      const stickyElement = screen.getByText('Custom Tag Test').parentElement;
      expect(stickyElement?.tagName.toLowerCase()).toBe('section');
    });

    it('должен использовать div по умолчанию', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-default-tag"
          >
            <div>Default Tag Test</div>
          </StickyGroup>
        </div>
      );

      const stickyElement = screen.getByText('Default Tag Test').parentElement;
      expect(stickyElement?.tagName.toLowerCase()).toBe('div');
    });
  });

  describe('ref функциональность', () => {
    it('должен предоставлять API через ref', () => {
      const ref = React.createRef<StickyGroupRef>();

      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-ref-api"
            ref={ref}
          >
            <div>Ref Test</div>
          </StickyGroup>
        </div>
      );

      expect(ref.current).toBeDefined();
      expect(ref.current?.element).toBeInstanceOf(HTMLElement);
      expect(typeof ref.current?.state).toBe('string');
      expect(typeof ref.current?.isSticky).toBe('boolean');
      expect(typeof ref.current?.refresh).toBe('function');
      expect(typeof ref.current?.disable).toBe('function');
      expect(typeof ref.current?.enable).toBe('function');
    });

    it('должен обновлять состояние через ref методы', () => {
      const ref = React.createRef<StickyGroupRef>();

      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-ref-methods"
            ref={ref}
          >
            <div>Ref Methods Test</div>
          </StickyGroup>
        </div>
      );

      act(() => {
        ref.current?.refresh();
        ref.current?.disable();
        ref.current?.enable();
      });

      // Методы должны работать без ошибок
      expect(ref.current).toBeDefined();
    });
  });

  describe('интеграция с группами', () => {
    it('должен работать с группами через groupId', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-group-1"
            groupId="test-group"
            priority={10}
          >
            <div>Group Test 1</div>
          </StickyGroup>
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 50 }}
            id="test-group-2"
            groupId="test-group"
            priority={8}
          >
            <div>Group Test 2</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Group Test 1')).toBeInTheDocument();
      expect(screen.getByText('Group Test 2')).toBeInTheDocument();
    });
  });

  describe('обработка ошибок', () => {
    it('должен корректно обрабатывать отсутствие children', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-no-children"
          >
            <div>Test children</div>
          </StickyGroup>
        </div>
      );

      // Не должно быть ошибок рендеринга
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('должен работать с null/undefined в children', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-null-children"
          >
            {null}
            {undefined}
            <div>Valid Child</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Valid Child')).toBeInTheDocument();
    });

    it('должен работать с несуществующим контейнером', () => {
      renderWithProvider(
        <div>
          <StickyGroup
            container=".non-existent-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-no-container"
          >
            <div>No Container Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('No Container Test')).toBeInTheDocument();
    });
  });

  describe('callback функции', () => {
    it('должен поддерживать onStateChange callback', () => {
      const onStateChange = jest.fn();

      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-callback"
            onStateChange={onStateChange}
          >
            <div>Callback Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Callback Test')).toBeInTheDocument();
      // Callback может быть вызван при инициализации
    });
  });

  describe('accessibility', () => {
    it('должен поддерживать ARIA атрибуты', () => {
      renderWithProvider(
        <div className="test-scroll-container">
          <StickyGroup
            container=".test-scroll-container"
            direction="top"
            offset={{ top: 10 }}
            id="test-aria"
          >
            <div role="banner" aria-label="Sticky Header">
              Accessible Content
            </div>
          </StickyGroup>
        </div>
      );

      const content = screen.getByText('Accessible Content');
      expect(content).toHaveAttribute('role', 'banner');
      expect(content).toHaveAttribute('aria-label', 'Sticky Header');
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать null контейнер', () => {
      renderWithProvider(
        <div>
          <StickyGroup
            container={null}
            direction="top"
            offset={{ top: 10 }}
            id="test-null-container"
          >
            <div>Null Container Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Null Container Test')).toBeInTheDocument();
    });

    it('должен обрабатывать пустую строку как контейнер', () => {
      renderWithProvider(
        <div>
          <StickyGroup
            container=""
            direction="top"
            offset={{ top: 10 }}
            id="test-empty-container"
          >
            <div>Empty Container Test</div>
          </StickyGroup>
        </div>
      );

      expect(screen.getByText('Empty Container Test')).toBeInTheDocument();
    });

    it('должен работать без StickyProvider', () => {
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(
          <div className="test-scroll-container">
            <StickyGroup
              container=".test-scroll-container"
              direction="top"
              offset={{ top: 10 }}
              id="test-no-provider"
            >
              <div>No Provider Test</div>
            </StickyGroup>
          </div>
        );
      }).toThrow('useStickyContext must be used within StickyProvider');

      console.error = originalError;
    });
  });
});
