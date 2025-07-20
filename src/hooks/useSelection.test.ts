import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSelection } from './useSelection';

// Mock the openapi utils
vi.mock('../utils/openapi', () => ({
  collectPaths: vi.fn((sample) => {
    if (sample && typeof sample === 'object') {
      return Object.keys(sample);
    }
    return [];
  }),
}));

describe('useSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAttrToggle', () => {
    it('toggles attribute selection', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['id']);
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(true);

      act(() => {
        result.current.handleAttrToggle('Pet', ['id']);
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(false);
    });

    it('handles nested attribute paths', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['owner', 'id']);
      });

      expect(result.current.selectedAttrs.Pet['owner.id']).toBe(true);
    });

    it('updates selectedEndpoints when endpoint info is provided', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'get');
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(true);
      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeDefined();
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].typeName).toBe('Pet');
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].selectedAttrs['id']).toBe(true);
    });

    it('removes endpoint when no attributes are selected', () => {
      const { result } = renderHook(() => useSelection());

      // First, select an attribute
      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'get');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeDefined();

      // Then, deselect the attribute
      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'get');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeUndefined();
    });

    it('handles multiple attributes for the same type', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'get');
        result.current.handleAttrToggle('Pet', ['name'], '/pets/{id}', 'get');
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(true);
      expect(result.current.selectedAttrs.Pet['name']).toBe(true);
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].selectedAttrs['id']).toBe(true);
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].selectedAttrs['name']).toBe(true);
    });

    it('preserves other types when toggling attributes', () => {
      const { result } = renderHook(() => useSelection());

      // First, select an attribute for one type
      act(() => {
        result.current.handleAttrToggle('Pet', ['id']);
      });

      // Then, select an attribute for another type
      act(() => {
        result.current.handleAttrToggle('User', ['email']);
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(true);
      expect(result.current.selectedAttrs.User['email']).toBe(true);
    });
  });

  describe('handleSelectAllAttrs', () => {
    it('selects all attributes when none are selected', () => {
      const { result } = renderHook(() => useSelection());
      const sample = { id: '1', name: 'Fluffy', age: 3 };

      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample);
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(true);
      expect(result.current.selectedAttrs.Pet['name']).toBe(true);
      expect(result.current.selectedAttrs.Pet['age']).toBe(true);
    });

    it('deselects all attributes when all are selected', () => {
      const { result } = renderHook(() => useSelection());
      const sample = { id: '1', name: 'Fluffy' };

      // First, select all attributes
      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample);
      });

      expect(result.current.selectedAttrs.Pet['id']).toBe(true);
      expect(result.current.selectedAttrs.Pet['name']).toBe(true);

      // Then, deselect all attributes
      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample);
      });

      expect(result.current.selectedAttrs.Pet['id']).toBeUndefined();
      expect(result.current.selectedAttrs.Pet['name']).toBeUndefined();
    });

    it('updates selectedEndpoints when endpoint info is provided', () => {
      const { result } = renderHook(() => useSelection());
      const sample = { id: '1', name: 'Fluffy' };

      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample, '/pets/{id}', 'get');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeDefined();
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].selectedAttrs['id']).toBe(true);
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].selectedAttrs['name']).toBe(true);
    });

    it('removes endpoint when deselecting all attributes', () => {
      const { result } = renderHook(() => useSelection());
      const sample = { id: '1', name: 'Fluffy' };

      // First, select all attributes
      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample, '/pets/{id}', 'get');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeDefined();

      // Then, deselect all attributes
      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample, '/pets/{id}', 'get');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeUndefined();
    });

    it('handles empty sample object', () => {
      const { result } = renderHook(() => useSelection());
      const sample = {};

      act(() => {
        result.current.handleSelectAllAttrs('Pet', sample);
      });

      expect(result.current.selectedAttrs.Pet).toEqual({});
    });

    it('handles null or undefined sample', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleSelectAllAttrs('Pet', null);
      });

      expect(result.current.selectedAttrs.Pet).toEqual({});
    });
  });

  describe('clearSelection', () => {
    it('clears all selected attributes and endpoints', () => {
      const { result } = renderHook(() => useSelection());

      // First, add some selections
      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'get');
        result.current.handleAttrToggle('User', ['email'], '/users/{id}', 'get');
      });

      expect(Object.keys(result.current.selectedAttrs).length).toBeGreaterThan(0);
      expect(Object.keys(result.current.selectedEndpoints).length).toBeGreaterThan(0);

      // Then, clear all selections
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedAttrs).toEqual({});
      expect(result.current.selectedEndpoints).toEqual({});
    });
  });

  describe('initial state', () => {
    it('starts with empty selections', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.selectedAttrs).toEqual({});
      expect(result.current.selectedEndpoints).toEqual({});
    });
  });

  describe('complex scenarios', () => {
    it('handles multiple endpoints for the same type', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'get');
        result.current.handleAttrToggle('Pet', ['name'], '/pets', 'get');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeDefined();
      expect(result.current.selectedEndpoints['GET_/pets']).toBeDefined();
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].selectedAttrs['id']).toBe(true);
      expect(result.current.selectedEndpoints['GET_/pets'].selectedAttrs['name']).toBe(true);
    });

    it('handles case-insensitive method names', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['id'], '/pets/{id}', 'GET');
      });

      expect(result.current.selectedEndpoints['GET_/pets/{id}']).toBeDefined();
      expect(result.current.selectedEndpoints['GET_/pets/{id}'].method).toBe('GET');
    });

    it('handles deeply nested attribute paths', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.handleAttrToggle('Pet', ['owner', 'profile', 'email']);
      });

      expect(result.current.selectedAttrs.Pet['owner.profile.email']).toBe(true);
    });
  });
});