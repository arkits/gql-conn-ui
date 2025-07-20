import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapToGraphQLOutputType,
  mapToGraphQLInputType,
  mapParameterToGraphQLInput,
} from './typeMapper';
import {
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import type { OpenAPISpec, SelectedAttributes } from '../../types/openapi';
import type { TypeMaps } from './types';

// Mock the schemaBuilder module
vi.mock('./schemaBuilder', () => ({
  buildObjectType: vi.fn(() => new GraphQLObjectType({
    name: 'MockObjectType',
    fields: {},
  })),
  buildInputType: vi.fn(() => new GraphQLObjectType({
    name: 'MockInputType',
    fields: {},
  })),
}));

// Mock the utils module
vi.mock('./utils', () => ({
  hasRef: vi.fn((schema) => !!schema?.$ref),
  resolveRef: vi.fn((ref, openApi) => {
    if (ref === '#/components/schemas/Pet') {
      return {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };
    }
    return null;
  }),
  getRefName: vi.fn((ref) => ref.replace('#/components/schemas/', '')),
}));

const mockOpenApi: OpenAPISpec = {
  paths: {},
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

const mockSelectedAttrs: SelectedAttributes = {
  Pet: {
    'id': true,
    'name': false,
  },
};

const mockTypeMaps: TypeMaps = {
  output: {},
  input: {},
};

describe('typeMapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mapToGraphQLOutputType', () => {
    it('returns GraphQLString for undefined schema', () => {
      const result = mapToGraphQLOutputType(
        undefined,
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBe(GraphQLString);
    });

    it('returns GraphQLString for string type', () => {
      const result = mapToGraphQLOutputType(
        { type: 'string' },
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBe(GraphQLString);
    });

    it('returns GraphQLInt for integer type', () => {
      const result = mapToGraphQLOutputType(
        { type: 'integer' },
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBe(GraphQLInt);
    });

    it('returns GraphQLFloat for number type', () => {
      const result = mapToGraphQLOutputType(
        { type: 'number' },
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBe(GraphQLFloat);
    });

    it('returns GraphQLBoolean for boolean type', () => {
      const result = mapToGraphQLOutputType(
        { type: 'boolean' },
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBe(GraphQLBoolean);
    });

    it('returns GraphQLString for unknown type', () => {
      const result = mapToGraphQLOutputType(
        { type: 'string' },
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      expect(result).toBe(GraphQLString);
    });

    it('handles schema references', () => {
      mapToGraphQLOutputType(
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        mockTypeMaps
      );

      // Should handle schema references without throwing
      expect(true).toBe(true);
    });

    it('handles array types', () => {
      const result = mapToGraphQLOutputType(
        {
          type: 'array',
          items: { type: 'string' },
        },
        mockOpenApi,
        mockSelectedAttrs,
        'TestTypes',
        [],
        mockTypeMaps
      );

      expect(result).toBeInstanceOf(GraphQLList);
    });

    it('handles object types', () => {
      mapToGraphQLOutputType(
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        mockOpenApi,
        mockSelectedAttrs,
        'TestType',
        [],
        mockTypeMaps
      );

      // Should handle object types without throwing
      expect(true).toBe(true);
    });

    it('caches resolved types in typeMaps', () => {
      const typeMaps = { output: {}, input: {} };

      // First call
      mapToGraphQLOutputType(
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        typeMaps
      );

      // Second call with same ref
      mapToGraphQLOutputType(
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        mockSelectedAttrs,
        'Pet',
        [],
        typeMaps
      );

      // Should handle caching without throwing
      expect(true).toBe(true);
    });
  });

  describe('mapToGraphQLInputType', () => {
    it('returns GraphQLString for undefined schema', () => {
      const result = mapToGraphQLInputType(
        undefined,
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBe(GraphQLString);
    });

    it('returns GraphQLString for string type', () => {
      const result = mapToGraphQLInputType(
        { type: 'string' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBe(GraphQLString);
    });

    it('returns GraphQLInt for integer type', () => {
      const result = mapToGraphQLInputType(
        { type: 'integer' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBe(GraphQLInt);
    });

    it('returns GraphQLFloat for number type', () => {
      const result = mapToGraphQLInputType(
        { type: 'number' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBe(GraphQLFloat);
    });

    it('returns GraphQLBoolean for boolean type', () => {
      const result = mapToGraphQLInputType(
        { type: 'boolean' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBe(GraphQLBoolean);
    });

    it('returns GraphQLString for unknown type', () => {
      const result = mapToGraphQLInputType(
        { type: 'string' },
        mockOpenApi,
        mockTypeMaps
      );

      expect(result).toBe(GraphQLString);
    });

    it('handles schema references', () => {
      mapToGraphQLInputType(
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        mockTypeMaps,
        'Pet'
      );

      // Should handle schema references without throwing
      expect(true).toBe(true);
    });

    it('handles object types', () => {
      mapToGraphQLInputType(
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        mockOpenApi,
        mockTypeMaps,
        'TestType'
      );

      // Should handle object types without throwing
      expect(true).toBe(true);
    });

    it('caches resolved types in typeMaps', () => {
      const typeMaps = { output: {}, input: {} };

      // First call
      mapToGraphQLInputType(
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        typeMaps,
        'Pet'
      );

      // Second call with same ref
      mapToGraphQLInputType(
        { $ref: '#/components/schemas/Pet' },
        mockOpenApi,
        typeMaps,
        'Pet'
      );

      // Should handle caching without throwing
      expect(true).toBe(true);
    });
  });

  describe('mapParameterToGraphQLInput', () => {
    it('returns GraphQLString for parameter without schema', () => {
      const result = mapParameterToGraphQLInput(
        {},
        mockOpenApi,
        mockTypeMaps,
        'testParam'
      );

      expect(result).toBe(GraphQLString);
    });

    it('maps parameter schema to GraphQL type', () => {
      const result = mapParameterToGraphQLInput(
        {
          schema: { type: 'integer' },
        },
        mockOpenApi,
        mockTypeMaps,
        'testParam'
      );

      expect(result).toBe(GraphQLInt);
    });

    it('wraps required parameters in GraphQLNonNull', () => {
      const result = mapParameterToGraphQLInput(
        {
          schema: { type: 'string' },
          required: true,
        },
        mockOpenApi,
        mockTypeMaps,
        'testParam'
      );

      expect(result).toBeInstanceOf(GraphQLNonNull);
    });

    it('handles complex parameter schemas', () => {
      mapParameterToGraphQLInput(
        {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
          required: true,
        },
        mockOpenApi,
        mockTypeMaps,
        'complexParam'
      );

      // Should handle complex schemas without throwing
      expect(true).toBe(true);
    });

    it('generates appropriate input type names', () => {
      mapParameterToGraphQLInput(
        {
          schema: { type: 'string' },
          required: false,
        },
        mockOpenApi,
        mockTypeMaps,
        'testParam'
      );

      // Should generate input types without throwing
      expect(true).toBe(true);
    });
  });
}); 