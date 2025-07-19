import { describe, it, expect } from 'vitest';
import { generateGraphQLSchemaFromSelections } from './generateGraphQL';
import type { OpenAPISpec, SelectedAttributes } from '../../types/openapi';

describe('GraphQL Schema Generator', () => {
  const mockOpenApi: OpenAPISpec = {
    paths: {
      '/users': {
        get: {
          operationId: 'getUsers',
          summary: 'Get all users',
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        },
        post: {
          operationId: 'createUser',
          summary: 'Create a new user',
          parameters: [
            {
              name: 'x-api-key',
              in: 'header',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUserInput' }
              }
            }
          },
          responses: {
            '201': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      },
      '/users/{id}': {
        get: {
          operationId: 'getUserById',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            profile: { $ref: '#/components/schemas/Profile' }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            bio: { type: 'string' },
            avatar: { type: 'string' }
          }
        },
        CreateUserInput: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  };

  describe('generateGraphQLSchemaFromSelections', () => {
    it('should return empty message for null OpenAPI spec', () => {
      const result = generateGraphQLSchemaFromSelections(null as any, {});
      expect(result).toBe('');
    });

    it('should return placeholder when no attributes are selected', () => {
      const selectedAttrs: SelectedAttributes = {};
      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);
      expect(result).toBe('# GraphQL schema will appear here\n');
    });

    it('should handle operations without successful responses', () => {
      const openApiNoSuccess: OpenAPISpec = {
        paths: {
          '/error': {
            get: {
              responses: {
                '400': {
                  description: 'Bad request'
                }
              }
            }
          }
        }
      };

      const result = generateGraphQLSchemaFromSelections(openApiNoSuccess, {});
      expect(result).toBe('# GraphQL schema will appear here\n');
    });

    it('should handle operations without content in responses', () => {
      const openApiNoContent: OpenAPISpec = {
        paths: {
          '/nocontent': {
            get: {
              responses: {
                '204': {
                  description: 'No content'
                }
              }
            }
          }
        }
      };

      const result = generateGraphQLSchemaFromSelections(openApiNoContent, {});
      expect(result).toBe('# GraphQL schema will appear here\n');
    });
  });

  describe('edge cases', () => {
    it('should handle OpenAPI spec without paths', () => {
      const emptyOpenApi: OpenAPISpec = {};
      const result = generateGraphQLSchemaFromSelections(emptyOpenApi, {});
      expect(result).toBe('# GraphQL schema will appear here\n');
    });
  });
});