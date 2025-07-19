import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from './useSelection';

describe('useSelection', () => {
  describe('initial state', () => {
    it('should initialize with empty selected attributes', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.selectedAttrs).toEqual({});
    });
  });

  describe('handleAttrToggle', () => {
    it('should add attribute selection', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('User', ['id']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: {
          id: true
        }
      });
    });

    it('should toggle existing attribute selection off', () => {
      const { result } = renderHook(() => useSelection());

      // First, add the selection
      act(() => {
        result.current.handleAttrToggle('User', ['id']);
      });

      expect(result.current.selectedAttrs.User.id).toBe(true);

      // Then toggle it off
      act(() => {
        result.current.handleAttrToggle('User', ['id']);
      });

      expect(result.current.selectedAttrs.User.id).toBe(false);
    });

    it('should handle nested attribute paths', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('User', ['profile', 'email']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: {
          'profile.email': true
        }
      });
    });

    it('should handle multiple attributes for same type', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('User', ['id']);
        result.current.handleAttrToggle('User', ['name']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: {
          id: true,
          name: true
        }
      });
    });

    it('should handle multiple types', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('User', ['id']);
        result.current.handleAttrToggle('Post', ['title']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: {
          id: true
        },
        Post: {
          title: true
        }
      });
    });

    it('should preserve existing selections when adding new ones', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('User', ['id']);
        result.current.handleAttrToggle('User', ['name']);
        result.current.handleAttrToggle('Post', ['title']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: {
          id: true,
          name: true
        },
        Post: {
          title: true
        }
      });

      // Add another attribute to User
      act(() => {
        result.current.handleAttrToggle('User', ['email']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: {
          id: true,
          name: true,
          email: true
        },
        Post: {
          title: true
        }
      });
    });
  });

  describe('handleSelectAllAttrs', () => {
    const sampleData = {
      id: 'string',
      name: 'John Doe',
      profile: {
        email: 'john@example.com',
        bio: 'Software Developer'
      }
    };

    it('should select all attributes when none are selected', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleSelectAllAttrs('User', sampleData);
      });

      expect(result.current.selectedAttrs.User).toEqual({
        id: true,
        name: true,
        profile: true,
        'profile.email': true,
        'profile.bio': true
      });
    });

    it('should deselect all attributes when all are selected', () => {
      const { result } = renderHook(() => useSelection());

      // First, select all
      act(() => {
        result.current.handleSelectAllAttrs('User', sampleData);
      });

      expect(Object.keys(result.current.selectedAttrs.User)).toHaveLength(5);

      // Then deselect all
      act(() => {
        result.current.handleSelectAllAttrs('User', sampleData);
      });

      expect(result.current.selectedAttrs.User).toEqual({});
    });

    it('should select all when some attributes are selected', () => {
      const { result } = renderHook(() => useSelection());

      // Select only some attributes
      act(() => {
        result.current.handleAttrToggle('User', ['id']);
        result.current.handleAttrToggle('User', ['name']);
      });

      expect(result.current.selectedAttrs.User).toEqual({
        id: true,
        name: true
      });

      // Select all should fill in the rest
      act(() => {
        result.current.handleSelectAllAttrs('User', sampleData);
      });

      expect(result.current.selectedAttrs.User).toEqual({
        id: true,
        name: true,
        profile: true,
        'profile.email': true,
        'profile.bio': true
      });
    });

    it('should handle array data', () => {
      const arrayData = {
        items: [
          { id: 1, name: 'Item 1' }
        ]
      };

      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleSelectAllAttrs('List', arrayData);
      });

      expect(result.current.selectedAttrs.List).toEqual({
        items: true,
        'items.0': true,
        'items.0.id': true,
        'items.0.name': true
      });
    });

    it('should handle empty objects', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleSelectAllAttrs('Empty', {});
      });

      expect(result.current.selectedAttrs.Empty).toEqual({});
    });

    it('should preserve selections for other types', () => {
      const { result } = renderHook(() => useSelection());

      // Select some attributes for different type
      act(() => {
        result.current.handleAttrToggle('Post', ['title']);
      });

      // Select all for User
      act(() => {
        result.current.handleSelectAllAttrs('User', sampleData);
      });

      expect(result.current.selectedAttrs.Post).toEqual({
        title: true
      });
      expect(result.current.selectedAttrs.User).toEqual({
        id: true,
        name: true,
        profile: true,
        'profile.email': true,
        'profile.bio': true
      });
    });

    it('should handle deeply nested objects', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              value: 'deep'
            }
          }
        }
      };

      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleSelectAllAttrs('Deep', deepData);
      });

      expect(result.current.selectedAttrs.Deep).toEqual({
        level1: true,
        'level1.level2': true,
        'level1.level2.level3': true,
        'level1.level2.level3.value': true
      });
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      const { result } = renderHook(() => useSelection());

      // Add some selections
      act(() => {
        result.current.handleAttrToggle('User', ['id']);
        result.current.handleAttrToggle('Post', ['title']);
      });

      expect(result.current.selectedAttrs).toEqual({
        User: { id: true },
        Post: { title: true }
      });

      // Clear all
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedAttrs).toEqual({});
    });

    it('should work when no selections exist', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedAttrs).toEqual({});
    });
  });

  describe('callback stability', () => {
    it('should maintain callback references across renders', () => {
      const { result, rerender } = renderHook(() => useSelection());

      const initialHandleAttrToggle = result.current.handleAttrToggle;
      const initialHandleSelectAllAttrs = result.current.handleSelectAllAttrs;
      const initialClearSelection = result.current.clearSelection;

      rerender();

      expect(result.current.handleAttrToggle).toBe(initialHandleAttrToggle);
      expect(result.current.handleSelectAllAttrs).toBe(initialHandleSelectAllAttrs);
      expect(result.current.clearSelection).toBe(initialClearSelection);
    });
  });
});