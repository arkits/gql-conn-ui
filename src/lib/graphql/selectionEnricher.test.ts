import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrichSelectedAttributes } from './selectionEnricher';
import type { OpenAPISpec } from '../../types/openapi';

// Mock the utils module
vi.mock('./utils', () => ({
  hasRef: vi.fn((schema) => !!schema?.$ref),
  getRefName: vi.fn((ref) => ref.replace('#/components/schemas/', '')),
}));

const mockOpenApi: OpenAPISpec = {
  paths: {},
  components: {
    schemas: {
      Pet: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          name: { type: 'string' as const },
          owner: { $ref: '#/components/schemas/User' },
          tags: {
            type: 'array' as const,
            items: { $ref: '#/components/schemas/Tag' },
          },
        },
      },
      User: {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          email: { type: 'string' as const },
          name: { type: 'string' as const },
        },
      },
      Tag: {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          name: { type: 'string' as const },
        },
      },
      Pets: {
        type: 'array' as const,
        items: { $ref: '#/components/schemas/Pet' },
      },
    },
  },
};

describe('selectionEnricher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enrichSelectedAttributes', () => {
    it('returns enriched attributes for nested object properties', () => {
      const selectedAttrs = {
        Pet: {
          'owner.id': true,
          'owner.email': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'owner.id': true,
          'owner.email': true,
        },
        User: {
          'id': true,
          'email': true,
        },
      });
    });

    it('handles array properties with references', () => {
      const selectedAttrs = {
        Pet: {
          'tags.0.id': true,
          'tags.0.name': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'tags.0.id': true,
          'tags.0.name': true,
        },
        Tag: {
          'id': true,
          'name': true,
        },
      });
    });

    it('handles deeply nested properties', () => {
      const selectedAttrs = {
        Pet: {
          'owner.name': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'owner.name': true,
        },
        User: {
          'name': true,
        },
      });
    });

    it('handles root array types', () => {
      const selectedAttrs = {
        Pets: {
          '0.id': true,
          '0.name': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pets: {
          '0.id': true,
          '0.name': true,
        },
        Pet: {
          'id': true,
          'name': true,
        },
      });
    });

    it('handles array properties with nested references', () => {
      const selectedAttrs = {
        Pet: {
          'tags.0.id': true,
          'owner.id': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'tags.0.id': true,
          'owner.id': true,
        },
        Tag: {
          'id': true,
        },
        User: {
          'id': true,
        },
      });
    });

    it('preserves original selection state', () => {
      const selectedAttrs = {
        Pet: {
          'id': true,
          'name': false,
          'owner.id': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result.Pet['id']).toBe(true);
      expect(result.Pet['name']).toBe(false);
      expect(result.Pet['owner.id']).toBe(true);
    });

    it('handles multiple types with overlapping references', () => {
      const selectedAttrs = {
        Pet: {
          'owner.id': true,
        },
        User: {
          'id': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'owner.id': true,
        },
        User: {
          'id': true,
        },
      });
    });

    it('handles non-existent schema gracefully', () => {
      const selectedAttrs = {
        NonExistent: {
          'some.property': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        NonExistent: {
          'some.property': true,
        },
      });
    });

    it('handles empty selected attributes', () => {
      const selectedAttrs = {};

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({});
    });

    it('handles attributes without dots (not nested)', () => {
      const selectedAttrs = {
        Pet: {
          'id': true,
          'name': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'id': true,
          'name': true,
        },
      });
    });

    it('handles complex nested array scenarios', () => {
      const selectedAttrs = {
        Pet: {
          'tags.0.id': true,
          'tags.0.name': true,
          'owner.name': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'tags.0.id': true,
          'tags.0.name': true,
          'owner.name': true,
        },
        Tag: {
          'id': true,
          'name': true,
        },
        User: {
          'name': true,
        },
      });
    });

    it('handles array index zero with nested properties', () => {
      const selectedAttrs = {
        Pet: {
          'tags.0.id': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pet: {
          'tags.0.id': true,
        },
        Tag: {
          'id': true,
        },
      });
    });

    it('handles root array with nested properties', () => {
      const selectedAttrs = {
        Pets: {
          '0.owner.id': true,
        },
      };

      const result = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(result).toEqual({
        Pets: {
          '0.owner.id': true,
        },
        Pet: {},
        User: {
          'id': true,
        },
      });
    });
  });
});