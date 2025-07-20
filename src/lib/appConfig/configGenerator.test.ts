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

    it('generates YAML config for selected endpoints', () => {
      const result = generateAppConfigYaml(mockOpenApi, mockSelectedEndpoints);
      
      expect(result).toContain('version: 1');
      expect(result).toContain('endpoints:');
      expect(result).toContain('Api/getPets:');
      expect(result).toContain('Api/createPet:');
      expect(result).toContain('Api/getPetById:');
    });

    it('includes HTTP method and URL template for each endpoint', () => {
      const result = generateAppConfigYaml(mockOpenApi, mockSelectedEndpoints);
      
      expect(result).toContain('method: GET');
      expect(result).toContain('method: POST');
      expect(result).toContain('template: /pets');
      expect(result).toContain('template: /pets/{id}');
    });

    it('extracts path parameters correctly', () => {
      const result = generateAppConfigYaml(mockOpenApi, mockSelectedEndpoints);
      
      // Should include path parameters for endpoints that have them
      expect(result).toContain('path_params:');
      expect(result).toContain('- id');
    });

    it('handles endpoints without path parameters', () => {
      const openApiWithoutPathParams: OpenAPISpec = {
        paths: {
          '/pets': {
            get: {
              operationId: 'getPets',
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  required: false,
                  schema: { type: 'integer' },
                },
              ],
              responses: {},
            },
          },
        },
      };
      
      const endpointsWithoutPathParams = {
        'getPets': {
          path: '/pets',
          method: 'GET',
          typeName: 'Pet',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(openApiWithoutPathParams, endpointsWithoutPathParams);
      
      expect(result).toContain('Api/getPets:');
      expect(result).toContain('template: /pets');
      // Should have empty path_params array for endpoints without path parameters
      expect(result).toContain('path_params: []');
    });

    it('handles endpoints with missing operation details', () => {
      const openApiWithMissingDetails: OpenAPISpec = {
        paths: {
          '/test': {
            get: {
              // Missing operationId
              summary: 'Test endpoint',
              parameters: [],
              responses: {},
            },
          },
        },
      };
      
      const selectedEndpoints = {
        'test': {
          path: '/test',
          method: 'GET',
          typeName: 'Test',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(openApiWithMissingDetails, selectedEndpoints);
      
      // Should use fallback naming when operationId is missing
      expect(result).toContain('Api/GET__test:');
    });

    it('handles endpoints with missing path in OpenAPI spec', () => {
      const selectedEndpoints = {
        'missingPath': {
          path: '/missing',
          method: 'GET',
          typeName: 'Test',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(mockOpenApi, selectedEndpoints);
      
      // Should skip endpoints that don't exist in the OpenAPI spec
      expect(result).not.toContain('Api/missingPath:');
    });

    it('handles endpoints with missing method in OpenAPI spec', () => {
      const selectedEndpoints = {
        'missingMethod': {
          path: '/pets',
          method: 'PUT', // This method doesn't exist in the mock
          typeName: 'Pet',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(mockOpenApi, selectedEndpoints);
      
      // Should skip endpoints with missing methods
      expect(result).not.toContain('Api/missingMethod:');
    });

    it('generates correct endpoint names with operationId', () => {
      const result = generateAppConfigYaml(mockOpenApi, mockSelectedEndpoints);
      
      expect(result).toContain('Api/getPets:');
      expect(result).toContain('Api/createPet:');
      expect(result).toContain('Api/getPetById:');
    });

    it('generates fallback endpoint names when operationId is missing', () => {
      const openApiWithoutOperationId: OpenAPISpec = {
        paths: {
          '/test': {
            get: {
              summary: 'Test endpoint',
              parameters: [],
              responses: {},
            },
          },
        },
      };
      
      const selectedEndpoints = {
        'test': {
          path: '/test',
          method: 'GET',
          typeName: 'Test',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(openApiWithoutOperationId, selectedEndpoints);
      
      // Should use method + path as fallback
      expect(result).toContain('Api/GET__test:');
    });

    it('sanitizes path names in fallback endpoint names', () => {
      const openApiWithSpecialChars: OpenAPISpec = {
        paths: {
          '/pets/{id}/details': {
            get: {
              summary: 'Get pet details',
              parameters: [],
              responses: {},
            },
          },
        },
      };
      
      const selectedEndpoints = {
        'test': {
          path: '/pets/{id}/details',
          method: 'GET',
          typeName: 'Test',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(openApiWithSpecialChars, selectedEndpoints);
      
      // Should sanitize special characters in path
      expect(result).toContain('Api/GET__pets_id_details:');
    });

    it('includes all required path parameters', () => {
      const openApiWithMultipleParams: OpenAPISpec = {
        paths: {
          '/users/{userId}/posts/{postId}': {
            get: {
              operationId: 'getUserPost',
              parameters: [
                {
                  name: 'userId',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
                {
                  name: 'postId',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
                {
                  name: 'limit',
                  in: 'query',
                  required: false,
                  schema: { type: 'integer' },
                },
              ],
              responses: {},
            },
          },
        },
      };
      
      const selectedEndpoints = {
        'getUserPost': {
          path: '/users/{userId}/posts/{postId}',
          method: 'GET',
          typeName: 'Post',
          selectedAttrs: {},
        },
      };
      
      const result = generateAppConfigYaml(openApiWithMultipleParams, selectedEndpoints);
      
      expect(result).toContain('- userId');
      expect(result).toContain('- postId');
      expect(result).not.toContain('- limit'); // Query parameters should not be included
    });

    it('generates valid YAML structure', () => {
      const result = generateAppConfigYaml(mockOpenApi, mockSelectedEndpoints);
      
      // Should start with YAML document separator
      expect(result).toMatch(/^---\n/);
      
      // Should have proper YAML structure
      expect(result).toContain('version: 1');
      expect(result).toContain('endpoints:');
      
      // Should have proper indentation for nested objects
      expect(result).toMatch(/ {2}Api\/\w+:/);
      expect(result).toMatch(/ {4}http:/);
      expect(result).toMatch(/ {6}method:/);
      expect(result).toMatch(/ {6}url:/);
    });
  });
}); 