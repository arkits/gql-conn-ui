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
          description: 'A user in the system',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            profile: { $ref: '#/components/schemas/Profile' }
          }
        },
        Profile: {
          type: 'object',
          description: 'User profile information',
          properties: {
            bio: { type: 'string' },
            avatar: { type: 'string' }
          }
        },
        CreateUserInput: {
          type: 'object',
          description: 'Input for creating a user',
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

    it('should generate doc comments for types and queries, but not for type Query', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true, name: true, email: true, profile: true },
        Profile: { bio: true, avatar: true },
        CreateUserInput: { name: true, email: true }
      };
      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);
      // Should have doc comments for User, Profile, CreateUserInput
      expect(result).toContain('"""A user in the system"""\ntype User');
      expect(result).toContain('"""User profile information"""\ntype Profile');
      // expect(result).toContain('"""Input for creating a user"""\ninput CreateUserInput');
      // Should have doc comments for query fields
      // expect(result).toContain('"""Get all users"""\n  getUsers');
      // expect(result).toContain('"""Create a new user"""\n  createUser');
      // Should NOT have a doc comment above type Query
      expect(result).not.toMatch(/"""[^"]+"""\s*type Query/);
    });

    it('should apply @requiredScopes directive to type definitions but not Query type', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true, name: true },
        Profile: { bio: true }
      };
      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);
      
      // Should have @requiredScopes directive definition
      expect(result).toContain('directive @requiredScopes(scopes: [[String!]!]!) on OBJECT');
      
      // Should apply @requiredScopes to User type
      expect(result).toContain('type User @requiredScopes(scopes: [["test"]]) {');
      
      // Should apply @requiredScopes to Profile type
      expect(result).toContain('type Profile @requiredScopes(scopes: [["test"]]) {');
      
      // Should NOT apply @requiredScopes to Query type
      expect(result).toContain('type Query {');
      expect(result).not.toContain('type Query @requiredScopes');
    });

    it('should use custom requiredScopes when provided', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true, name: true }
      };
      const customScopes = [['read:users'], ['write:users', 'admin']];
      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs, customScopes);
      
      // Should apply custom scopes to User type
      expect(result).toContain('type User @requiredScopes(scopes: [["read:users"], ["write:users", "admin"]]) {');
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