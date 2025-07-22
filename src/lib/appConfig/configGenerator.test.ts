import { describe, it, expect } from 'vitest';
import { generateAppConfigYaml } from './configGenerator';
import type { OpenAPISpec, SelectedEndpoints } from '../../types/openapi';

const mockOpenApi: OpenAPISpec = {
  paths: {
    '/pets': {
      get: {
        operationId: 'getPets',
        summary: 'Get all pets',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createPet',
        summary: 'Create a pet',
        parameters: [],
        responses: {
          '201': {
            description: 'Pet created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/pets/{id}': {
      get: {
        operationId: 'getPetById',
        summary: 'Get pet by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const mockSelectedEndpoints: SelectedEndpoints = {
  'getPets': {
    path: '/pets',
    method: 'GET',
    typeName: 'Pet',
    selectedAttrs: {
      'id': true,
      'name': false,
    },
  },
  'createPet': {
    path: '/pets',
    method: 'POST',
    typeName: 'Pet',
    selectedAttrs: {
      'id': true,
      'name': true,
    },
  },
  'getPetById': {
    path: '/pets/{id}',
    method: 'GET',
    typeName: 'Pet',
    selectedAttrs: {
      'id': true,
      'name': true,
    },
  },
};

describe('configGenerator', () => {
  describe('generateAppConfigYaml', () => {
    it('returns default message when no OpenAPI spec is provided', () => {
      const result = generateAppConfigYaml(null);
      
      expect(result).toBe('# Application config YAML will appear here\n');
    });

    it('returns default message when no selected endpoints are provided', () => {
      const result = generateAppConfigYaml(mockOpenApi, {});
      
      expect(result).toBe('# Application config YAML will appear here\n');
    });
  });
});

