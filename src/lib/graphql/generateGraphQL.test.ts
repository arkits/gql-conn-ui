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

    it('should generate GraphQL schema for selected attributes', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true,
          email: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('type Query');
      expect(result).toContain('getUsers');
      expect(result).toContain('createUser');
      expect(result).toContain('getUserById');
      expect(result).toContain('type User');
      expect(result).toContain('id: String');
      expect(result).toContain('name: String');
      expect(result).toContain('email: String');
      expect(result).toContain('directive @dataSource');
    });

    it('should include parameters as GraphQL arguments', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('createUser(x-api-key: String!, input: CreateUserInputInput)');
      expect(result).toContain('getUserById(id: String!)');
    });

    it('should handle array response types', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('getUsers: [User]');
    });

    it('should include @dataSource directive with correct metadata', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('@dataSource(path: "/users", method: "GET"');
      expect(result).toContain('@dataSource(path: "/users", method: "POST"');
      expect(result).toContain('@dataSource(path: "/users/{id}", method: "GET"');
    });

    it('should handle nested object selections', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true,
          profile: true
        },
        Profile: {
          bio: true,
          avatar: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('type User');
      expect(result).toContain('type Profile');
      expect(result).toContain('profile: Profile');
      expect(result).toContain('bio: String');
      expect(result).toContain('avatar: String');
    });

    it('should include operation comments', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('# OpenAPI: GET /users');
      expect(result).toContain('# Get all users');
      expect(result).toContain('# OpenAPI: POST /users');
      expect(result).toContain('# Create a new user');
    });

    it('should handle operations without operationId', () => {
      const openApiWithoutOpId: OpenAPISpec = {
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const selectedAttrs: SelectedAttributes = {
        'get_test_200': {
          message: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(openApiWithoutOpId, selectedAttrs);
      expect(result).toContain('get_test: get_test_200');
    });

    it('should handle request body with input types', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('input CreateUserInputInput');
      expect(result).toContain('createUser(x-api-key: String!, input: CreateUserInputInput)');
    });

    it('should include selection in directive', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true,
          email: true
        }
      };

      const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs);

      expect(result).toContain('selection: ["id", "name", "email"]');
    });
  });

  describe('edge cases', () => {
    it('should handle OpenAPI spec without paths', () => {
      const emptyOpenApi: OpenAPISpec = {};
      const result = generateGraphQLSchemaFromSelections(emptyOpenApi, {});
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
});