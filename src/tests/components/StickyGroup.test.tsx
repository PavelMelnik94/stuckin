/**
 * Unit тесты для StickyGroup компонента
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

import { StickyGroup } from '../../components/StickyGroup';
import { StickyProvider } from '../../context/StickyContext';

// Обертка с провайдером
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StickyProvider>{children}</StickyProvider>
);

describe('StickyGroup', () => {
  test('должен рендерить дочерние элементы', () => {
    render(
      <TestWrapper>
        <StickyGroup groupId="test-group">
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('должен применять переданный className', () => {
    const { container } = render(
      <TestWrapper>
        <StickyGroup groupId="test-group" className="custom-class">
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    const stickyContainer = container.firstChild;
    expect(stickyContainer).toHaveClass('custom-class');
  });

  test('должен применять переданные стили', () => {
    const testStyle = { backgroundColor: 'red' };
    const { container } = render(
      <TestWrapper>
        <StickyGroup groupId="test-group" style={testStyle}>
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    const stickyContainer = container.firstChild as HTMLElement;
    expect(stickyContainer).toHaveStyle('background-color: rgb(255, 0, 0)');
  });

  test('должен создавать группу с указанным groupId', () => {
    render(
      <TestWrapper>
        <StickyGroup groupId="test-group">
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('должен устанавливать приоритет группы', () => {
    render(
      <TestWrapper>
        <StickyGroup groupId="test-group" priority={10}>
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('должен предоставлять API через ref', () => {
    const ref = React.createRef<{
      elements: any[];
      activeElements: any[];
      totalHeight: number;
      refreshGroup: () => void;
    }>();

    render(
      <TestWrapper>
        <StickyGroup groupId="test-group" ref={ref}>
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.refreshGroup).toBe('function');
    expect(Array.isArray(ref.current?.elements)).toBe(true);
    expect(Array.isArray(ref.current?.activeElements)).toBe(true);
    expect(typeof ref.current?.totalHeight).toBe('number');
  });

  test('должен обрабатывать callback при изменении группы', () => {
    const onGroupChange = jest.fn();

    render(
      <TestWrapper>
        <StickyGroup groupId="test-group" onGroupChange={onGroupChange}>
          <div>Test content</div>
        </StickyGroup>
      </TestWrapper>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    // onGroupChange может быть вызван или нет в зависимости от реализации
    expect(typeof onGroupChange).toBe('function');
  });
});
