import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonWithCheckboxes } from './JsonWithCheckboxes';
import { TestWrapper } from '../test/TestWrapper';

describe('JsonWithCheckboxes', () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('object rendering', () => {
    it('should render object properties with checkboxes', () => {
      const value = {
        id: '123',
        name: 'John Doe',
        active: true
      };

      render(<TestWrapper>
        <TestWrapper>
          <JsonWithCheckboxes
            value={value}
            path={[]}
            selected={{}}
            onToggle={mockOnToggle}
            darkMode={false}
          /></TestWrapper>
        </TestWrapper>
      );

      expect(screen.getByText(/id/)).toBeInTheDocument();
      expect(screen.getByText(/name/)).toBeInTheDocument();
      expect(screen.getByText(/active/)).toBeInTheDocument();
      expect(screen.getByText(/"123"/)).toBeInTheDocument();
      expect(screen.getByText(/"John Doe"/)).toBeInTheDocument();
      expect(screen.getByText(/true/)).toBeInTheDocument();
    });

    it('should render checkboxes in checked state when selected', () => {
      const value = { id: '123', name: 'John' };
      const selected = { id: true, name: false };

      render(<TestWrapper>
        <JsonWithCheckboxes
          value={value}
          path={[]}
          selected={selected}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // id
      expect(checkboxes[1]).not.toBeChecked(); // name
    });

    it('should call onToggle when checkbox is clicked', () => {
      const value = { id: '123' };

      render(<TestWrapper>
        <JsonWithCheckboxes
          value={value}
          path={['user']}
          selected={{}}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnToggle).toHaveBeenCalledWith(['user', 'id']);
    });
  });

  describe('nested object rendering', () => {
    it('should render nested objects recursively', () => {
      const value = {
        user: {
          profile: {
            email: 'john@example.com'
          }
        }
      };

      render(<TestWrapper>
        <TestWrapper>
          <JsonWithCheckboxes
            value={value}
            path={[]}
            selected={{}}
            onToggle={mockOnToggle}
            darkMode={false}
          /></TestWrapper>
        </TestWrapper>
      );

      expect(screen.getByText(/user/)).toBeInTheDocument();
      expect(screen.getByText(/profile/)).toBeInTheDocument();
      expect(screen.getByText(/email/)).toBeInTheDocument();
      expect(screen.getByText(/"john@example.com"/)).toBeInTheDocument();
    });

    it('should handle nested selections correctly', () => {
      const value = {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      };
      const selected = {
        'user': true,
        'user.name': true,
        'user.email': false
      };

      render(<TestWrapper>
        <JsonWithCheckboxes
          value={value}
          path={[]}
          selected={selected}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // user
      expect(checkboxes[1]).toBeChecked(); // user.name
      expect(checkboxes[2]).not.toBeChecked(); // user.email
    });
  });

  describe('array rendering', () => {
    it('should render arrays with index 0', () => {
      const value = {
        items: [
          { id: 1, name: 'Item 1' }
        ]
      };

      render(<TestWrapper>
        <TestWrapper>
          <JsonWithCheckboxes
            value={value}
            path={[]}
            selected={{}}
            onToggle={mockOnToggle}
            darkMode={false}
          /></TestWrapper>
        </TestWrapper>
      );

      expect(screen.getByText(/items/)).toBeInTheDocument();
      expect(screen.getByText(/\[/)).toBeInTheDocument();
      expect(screen.getByText(/\]/)).toBeInTheDocument();
      expect(screen.getByText(/id/)).toBeInTheDocument();
      expect(screen.getByText(/name/)).toBeInTheDocument();
    });

    it('should handle array selections with path indexing', () => {
      const value = {
        items: [
          { id: 1, name: 'Item 1' }
        ]
      };
      const selected = {
        'items': true,
        'items.0': true,
        'items.0.id': true,
        'items.0.name': false
      };

      render(<TestWrapper>
        <JsonWithCheckboxes
          value={value}
          path={[]}
          selected={selected}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // items
      expect(checkboxes[1]).toBeChecked(); // items.0.id
      expect(checkboxes[2]).not.toBeChecked(); // items.0.name
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const value = { data: null };

      render(<TestWrapper>
        <TestWrapper>
          <JsonWithCheckboxes
            value={value}
            path={[]}
            selected={{}}
            onToggle={mockOnToggle}
            darkMode={false}
          /></TestWrapper>
        </TestWrapper>
      );

      expect(screen.getByText(/data/)).toBeInTheDocument();
      expect(screen.getByText(/null/)).toBeInTheDocument();
    });

    it('should handle empty objects', () => {
      const value = {};

      render(<TestWrapper>
        <TestWrapper>
          <JsonWithCheckboxes
            value={value}
            path={[]}
            selected={{}}
            onToggle={mockOnToggle}
            darkMode={false}
          /></TestWrapper>
        </TestWrapper>
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should handle empty arrays', () => {
      const value = { items: [] };

      render(<TestWrapper>
        <TestWrapper>
          <JsonWithCheckboxes
            value={value}
            path={[]}
            selected={{}}
            onToggle={mockOnToggle}
            darkMode={false}
          /></TestWrapper>
        </TestWrapper>
      );

      expect(screen.getByText(/items/)).toBeInTheDocument();
      expect(screen.getByText(/\[/)).toBeInTheDocument();
      expect(screen.getByText(/\]/)).toBeInTheDocument();
    });

    it('should return null for primitive values at root', () => {
      const { container } = render(<TestWrapper>
        <JsonWithCheckboxes
          value="primitive"
          path={[]}
          selected={{}}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null for null value at root', () => {
      const { container } = render(<TestWrapper>
        <JsonWithCheckboxes
          value={null}
          path={[]}
          selected={{}}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('complex nested structures', () => {
    it('should handle deeply nested objects and arrays', () => {
      const value = {
        user: {
          posts: [
            {
              title: 'Post 1',
              comments: [
                { id: 1, text: 'Comment 1' }
              ]
            }
          ]
        }
      };

      render(<TestWrapper>
        <JsonWithCheckboxes
          value={value}
          path={[]}
          selected={{
            'user': true,
            'user.posts.0.title': true,
            'user.posts.0.comments.0.id': true
          }}
          onToggle={mockOnToggle}
          darkMode={false}
        /></TestWrapper>
      );

      expect(screen.getByText(/user/)).toBeInTheDocument();
      expect(screen.getByText(/posts/)).toBeInTheDocument();
      expect(screen.getByText(/title/)).toBeInTheDocument();
      expect(screen.getByText(/comments/)).toBeInTheDocument();
      expect(screen.getByText(/id/)).toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.some(cb => (cb as HTMLInputElement).checked)).toBe(true);
    });
  });
});