import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildObjectType,
  buildInputType,
} from './schemaBuilder';
import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import type { OpenAPISchema } from '../../types/openapi';

// Mock the utils module
vi.mock('./utils', () => ({
  hasRef: vi.fn((schema) => !!schema?.$ref),
  resolveRef: vi.fn((ref, openApi) => {
    if (ref === '#/components/schemas/Pet') {
      return {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          name: { type: 'string' as const },
        },
      };
    }
    if (ref === '#/components/schemas/User') {
      return {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          email: { type: 'string' as const },
        },
      };
    }
    return null;
  }),
  getRefName: vi.fn((ref) => ref.replace('#/components/schemas/', '')),
  getPreferredName: vi.fn((schema) => schema && schema.preferredName ? schema.preferredName : undefined),
  singularizeAndCapitalize: vi.fn((typeName) => typeName.replace(/s$/, '').charAt(0).toUpperCase() + typeName.replace(/s$/, '').slice(1)),
  capitalizeTypeName: vi.fn((name) => name.charAt(0).toUpperCase() + name.slice(1)),
}));

const mockOpenApi = {
  paths: {},
  components: {
    schemas: {
      Pet: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const },
          name: { type: 'string' as const },
        },
      },
      User: {
        type: 'object' as const,
        properties: {
          id: { type: 'integer' as const },
          email: { type: 'string' as const },
        },
      },
    },
  },
};

const mockSelectedAttrs = {
  Pet: {
    'id': true,
    'name': true,
  },
  User: {
    'id': true,
    'email': false,
  },
};

const mockTypeMaps = {
  output: {},
  input: {},
};

describe('schemaBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildObjectType', () => {
    it('returns empty object type for undefined schema', () => {
      const result = buildObjectType(
        'TestType',
        undefined as unknown as OpenAPISchema,
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      expect((result as GraphQLObjectType).name).toBe('TestType_Empty');
    });

    it('handles schema references', () => {
      const result = buildObjectType(
        'Pet',
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
    });

    it('handles unresolved schema references', () => {
      const result = buildObjectType(
        'Unknown',
        { $ref: '#/components/schemas/Unknown' },
        mockOpenApi,
        mockSelectedAttrs,
        'Unknown',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      expect((result as GraphQLObjectType).name).toBe('Unknown_Unresolved');
    });

    it('builds object type with properties', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const result = buildObjectType(
        'Pet',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      const fields = (result as GraphQLObjectType).getFields();
      expect(Object.keys(fields)).toContain('id');
      expect(Object.keys(fields)).toContain('name');
    });

    it('builds object type with selected attributes only', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      };

      const selectedAttrs = {
        Pet: {
          'id': true,
          'name': false,
          'email': true,
        },
      };

      const result = buildObjectType(
        'Pet',
        schema,
        mockOpenApi,
        selectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      const fields = (result as GraphQLObjectType).getFields();
      expect(Object.keys(fields)).toContain('id');
      expect(Object.keys(fields)).toContain('email');
      expect(Object.keys(fields)).not.toContain('name');
    });

    it('handles array types', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { type: 'string' },
      };

      const result = buildObjectType(
        'Pets',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'Pets',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLList);
    });

    it('handles array types with object items', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
      };

      const result = buildObjectType(
        'Pets',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'Pets',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLList);
    });

    it('handles array types with schema references', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { $ref: '#/components/schemas/Pet' },
      };

      const result = buildObjectType(
        'Pets',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'Pets',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLList);
    });

    it('returns scalar type for non-object/array schemas', () => {
      const schema: OpenAPISchema = { type: 'string' };

      const result = buildObjectType(
        'TestType',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      expect((result as GraphQLObjectType).name).toBe('TestType_Scalar');
    });

    it('caches resolved types in typeMaps', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      // First call
      buildObjectType(
        'Pet',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      // Second call with same schema
      const result = buildObjectType(
        'Pet',
        schema,
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      expect(mockTypeMaps.output['Pet']).toBe(result);
    });
  });

  describe('buildInputType', () => {
    it('returns empty input type for undefined schema', () => {
      const result = buildInputType(
        'TestType',
        undefined as unknown as OpenAPISchema,
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      expect((result as GraphQLInputObjectType).name).toBe('TestType_Empty');
    });

    it('handles schema references', () => {
      const result = buildInputType(
        'Pet',
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      expect((result as GraphQLInputObjectType).name).toBe('PetInput');
    });

    it('handles unresolved schema references', () => {
      const result = buildInputType(
        'Unknown',
        { $ref: '#/components/schemas/Unknown' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      expect((result as GraphQLInputObjectType).name).toBe('UnknownInput_Unresolved');
    });

    it('builds input type with properties', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const result = buildInputType(
        'PetInput',
        schema,
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      const fields = (result as GraphQLInputObjectType).getFields();
      expect(Object.keys(fields)).toContain('id');
      expect(Object.keys(fields)).toContain('name');
    });

    it('returns scalar input type for non-object schemas', () => {
      const schema: OpenAPISchema = { type: 'string' };

      const result = buildInputType(
        'TestType',
        schema,
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      expect((result as GraphQLInputObjectType).name).toBe('TestType_ScalarInput');
    });

    it('caches resolved types in typeMaps', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      // First call
      buildInputType(
        'PetInput',
        schema,
        mockOpenApi,
        mockTypeMaps
      );

      // Second call with same schema
      const result = buildInputType(
        'PetInput',
        schema,
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      expect(mockTypeMaps.input['PetInput']).toBe(result);
    });

    it('handles array types for input', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { $ref: '#/components/schemas/Pet' },
      };

      const result = buildInputType(
        'PetsInput',
        schema,
        mockOpenApi,
        mockTypeMaps
      );
      expect(result).toBeInstanceOf(GraphQLList);
    });

    it('handles merged schema for input type', () => {
      const schema: OpenAPISchema = {
        $ref: '#/components/schemas/Pet',
        type: 'object',
        properties: {
          extra: { type: 'string' },
        },
      };

      const result = buildInputType('PetInput', schema, mockOpenApi, mockTypeMaps);
      expect(result).toBeInstanceOf(GraphQLInputObjectType);
      const fields = (result as GraphQLInputObjectType).getFields();
      expect(Object.keys(fields)).toContain('extra');
    });
  });

  describe('buildObjectType with allOf', () => {
    it('handles allOf correctly', () => {
      const schema: OpenAPISchema = {
        allOf: [
          { $ref: '#/components/schemas/Pet' },
          {
            type: 'object',
            properties: {
              extra: { type: 'string' },
            },
          },
        ],
      };

      const selectedAttrs = {
        ...mockSelectedAttrs,
        Pet: {
          ...mockSelectedAttrs.Pet,
          extra: true,
        },
      };

      const result = buildObjectType(
        'Pet',
        schema,
        mockOpenApi,
        selectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLObjectType);
      const fields = (result as GraphQLObjectType).getFields();
      expect(Object.keys(fields)).toContain('id');
      expect(Object.keys(fields)).toContain('name');
      expect(Object.keys(fields)).toContain('extra');
    });
  });

  describe('buildObjectType with complex array selections', () => {
    it('handles nested selections in arrays', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { $ref: '#/components/schemas/Pet' },
      };

      const selectedAttrs = {
        Pets: {
          '0.id': true,
        },
        Pet: {
          name: true,
        },
      };

      const result = buildObjectType(
        'Pets',
        schema,
        mockOpenApi,
        selectedAttrs,
        'Pets',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLList);
      const objectType = (result as GraphQLList<GraphQLObjectType>).ofType;
      const fields = objectType.getFields();
      expect(Object.keys(fields)).toContain('id');
      expect(Object.keys(fields)).toContain('name');
    });
  });

  describe('buildObjectType with merged schema', () => {
    it('handles merged schema correctly', () => {
      const schema: OpenAPISchema = {
        $ref: '#/components/schemas/Pet',
        type: 'object',
        properties: {
          extra: { type: 'string' },
        },
      };
      const selectedAttrs = {
        Pet: {
          id: true,
          name: true,
          extra: true,
        },
      };

      const result = buildObjectType('Pet', schema, mockOpenApi, selectedAttrs, 'Pet', [], mockTypeMaps);
      expect(result).toBeInstanceOf(GraphQLObjectType);
      const fields = (result as GraphQLObjectType).getFields();
      expect(Object.keys(fields)).toContain('id');
      expect(Object.keys(fields)).toContain('name');
      expect(Object.keys(fields)).toContain('extra');
    });
  });
});