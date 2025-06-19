import React from 'react';
import { screen, act } from '@testing-library/react';

import { StickyContainer, type StickyContainerRef } from '../../components/StickyContainer';
import { renderWithProvider } from '../utils/testUtils';

describe('StickyContainer', () => {
  describe('базовый рендеринг', () => {
    it('должен рендерить дочерние элементы', () => {
      renderWithProvider(
        <StickyContainer
          direction="top"
          offset={{ top: 10 }}
          id="test-basic"
        >
          <div data-testid="sticky-content">Sticky Content</div>
        </StickyContainer>
      );

      expect(screen.getByTestId('sticky-content')).toBeInTheDocument();
      expect(screen.getByText('Sticky Content')).toBeInTheDocument();
    });

    it('должен применять переданный className', () => {
      renderWithProvider(
        <StickyContainer
          direction="top"
          offset={{ top: 10 }}
          id="test-className"
          className="custom-class"
        >
          <div>Styled Content</div>
        </StickyContainer>
      );

      const stickyElement = screen.getByText('Styled Content').parentElement;
      expect(stickyElement).toHaveClass('custom-class');
    });

    it('должен применять переданные стили', () => {
      renderWithProvider(
        <StickyContainer
          direction="top"
          offset={{ top: 10 }}
          id="test-styles"
          style={{ backgroundColor: 'red', padding: '20px' }}
        >
          <div>Styled Content</div>
        </StickyContainer>
      );

      const stickyElement = screen.getByText('Styled Content').parentElement;
      expect(stickyElement).toHaveStyle('background-color: rgb(255, 0, 0)');
      expect(stickyElement).toHaveStyle('padding: 20px');
    });

    it('должен устанавливать data-атрибуты', () => {
      renderWithProvider(
        <StickyContainer
          direction="top"
          offset={{ top: 10 }}
          id="test-data-attrs"
        >
          <div>Content</div>
        </StickyContainer>
      );

      const stickyElement = screen.getByText('Content').parentElement;
      expect(stickyElement).toHaveAttribute('data-sticky-id', 'test-data-attrs');
      expect(stickyElement).toHaveAttribute('data-sticky-state');
    });
  });

  describe('работа с тегами', () => {
    it('должен использовать кастомный тег', () => {
      renderWithProvider(
        <StickyContainer
          direction="top"
          offset={{ top: 10 }}
          id="test-custom-tag"
          tag="section"
        >
          <div>Custom Tag Test</div>
        </StickyContainer>
      );

      const stickyElement = screen.getByText('Custom Tag Test').parentElement;
      expect(stickyElement?.tagName.toLowerCase()).toBe('section');
    });

    it('должен использовать div по умолчанию', () => {
      renderWithProvider(
        <StickyContainer
          direction="top"
          offset={{ top: 10 }}
          id="test-default-tag"
        >
          <div>Default Tag Test</div>
        </StickyContainer>
      );

      const stickyElement = screen.getByText('Default Tag Test').parentElement;
      expect(stickyElement?.tagName.toLowerCase()).toBe('div');
    });
  });

  describe('ref функциональность', () => {
    it('должен предоставлять API через ref', () => {
      const ref = React.createRef<StickyContainerRef>();

      renderWithProvider(
        <StickyContainer
          ref={ref}
          direction="top"
          offset={{ top: 10 }}
          id="test-ref-api"
        >
          <div>Ref API Test</div>
        </StickyContainer>
      );

      expect(ref.current).toBeDefined();
      expect(ref.current?.element).toBeInstanceOf(HTMLElement);
      expect(typeof ref.current?.refresh).toBe('function');
      expect(typeof ref.current?.disable).toBe('function');
      expect(typeof ref.current?.enable).toBe('function');
    });

    it('должен обновлять состояние через ref методы', () => {
      const ref = React.createRef<StickyContainerRef>();

      renderWithProvider(
        <StickyContainer
          ref={ref}
          direction="top"
          offset={{ top: 10 }}
          id="test-ref-methods"
        >
          <div>Ref Methods Test</div>
        </StickyContainer>
      );

      act(() => {
        ref.current?.refresh();
        ref.current?.disable();
        ref.current?.enable();
      });

      // Тест прошел, если не было ошибок
      expect(ref.current).toBeDefined();
    });
  });

  describe('обработка ошибок', () => {
    it('должен корректно обрабатывать компонент без контейнера', () => {
      expect(() => {
        renderWithProvider(
          <StickyContainer
            direction="top"
            offset={{ top: 10 }}
            id="test-no-container"
          >
            <div>Test Content</div>
          </StickyContainer>
        );
      }).not.toThrow();    });
  });
});
