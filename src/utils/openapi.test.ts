import { describe, it, expect } from 'vitest';
import { parseOpenApiToTree, collectPaths, generateSampleFromSchema } from './openapi';
import type { OpenAPISpec } from '../types/openapi';

describe('OpenAPI Utils', () => {
  describe('parseOpenApiToTree', () => {
    it('should parse OpenAPI spec to tree structure', () => {
      const openApi: OpenAPISpec = {
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                    }
                  }
                }
              }
            },
            post: {
              operationId: 'createUser',
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
          '/posts': {
            get: {
              operationId: 'getPosts',
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { type: 'array', items: { $ref: '#/components/schemas/Post' } }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const tree = parseOpenApiToTree(openApi);

      expect(tree).toHaveLength(2);
      expect(tree[0].path).toBe('/users');
      expect(tree[0].methods).toHaveLength(2);
      expect(tree[0].methods[0].method).toBe('GET');
      expect(tree[0].methods[1].method).toBe('POST');
      expect(tree[1].path).toBe('/posts');
      expect(tree[1].methods).toHaveLength(1);
    });

    it('should filter out methods without 2xx responses with content', () => {
      const openApi: OpenAPISpec = {
        paths: {
          '/users': {
            get: {
              responses: {
                '200': {
                  description: 'Success but no content'
                }
              }
            },
            post: {
              responses: {
                '400': {
                  content: {
                    'application/json': {
                      schema: { type: 'object' }
                    }
                  }
                }
              }
            },
            put: {
              responses: {
                '201': {
                  content: {
                    'application/json': {
                      schema: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const tree = parseOpenApiToTree(openApi);

      expect(tree).toHaveLength(1);
      expect(tree[0].methods).toHaveLength(1);
      expect(tree[0].methods[0].method).toBe('PUT');
    });

    it('should return empty array for invalid OpenAPI spec', () => {
      expect(parseOpenApiToTree({})).toEqual([]);
      expect(parseOpenApiToTree({ paths: {} })).toEqual([]);
    });

    it('should filter out paths with no valid methods', () => {
      const openApi: OpenAPISpec = {
        paths: {
          '/invalid': {
            get: {
              responses: {
                '400': {
                  description: 'Bad request'
                }
              }
            }
          },
          '/valid': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const tree = parseOpenApiToTree(openApi);
      expect(tree).toHaveLength(1);
      expect(tree[0].path).toBe('/valid');
    });
  });

  describe('collectPaths', () => {
    it('should collect paths from nested objects', () => {
      const obj = {
        name: 'John',
        profile: {
          email: 'john@example.com',
          settings: {
            theme: 'dark'
          }
        }
      };

      const paths = collectPaths(obj);
      expect(paths).toEqual([
        'name',
        'profile',
        'profile.email',
        'profile.settings',
        'profile.settings.theme'
      ]);
    });
  });

  describe('generateSampleFromSchema', () => {
    const mockOpenApi: OpenAPISpec = {
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              age: { type: 'integer' }
            }
          },
          Post: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              author: { $ref: '#/components/schemas/User' }
            }
          }
        }
      }
    };

    it('should generate sample for object schema', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          count: { type: 'integer' },
          active: { type: 'boolean' }
        }
      };

      const sample = generateSampleFromSchema(schema, mockOpenApi);

      expect(sample).toEqual({
        id: 'string',
        count: 0,
        active: true
      });
    });

    it('should generate sample for array schema', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        }
      };

      const sample = generateSampleFromSchema(schema, mockOpenApi);

      expect(sample).toEqual([
        { name: 'string' }
      ]);
    });

    it('should resolve $ref schemas', () => {
      const schema = { $ref: '#/components/schemas/User' };
      const sample = generateSampleFromSchema(schema, mockOpenApi);

      expect(sample).toEqual({
        id: 'string',
        name: 'string',
        age: 0
      });
    });

    it('should handle nested $ref schemas', () => {
      const schema = { $ref: '#/components/schemas/Post' };
      const sample = generateSampleFromSchema(schema, mockOpenApi);

      expect(sample).toEqual({
        title: 'string',
        author: {
          id: 'string',
          name: 'string',
          age: 0
        }
      });
    });

    it('should return sample values for primitive types', () => {
      expect(generateSampleFromSchema({ type: 'string' }, mockOpenApi)).toBe('string');
      expect(generateSampleFromSchema({ type: 'integer' }, mockOpenApi)).toBe(0);
      expect(generateSampleFromSchema({ type: 'number' }, mockOpenApi)).toBe(0);
      expect(generateSampleFromSchema({ type: 'boolean' }, mockOpenApi)).toBe(true);
    });

    it('should return null for invalid schemas', () => {
      expect(generateSampleFromSchema(null, mockOpenApi)).toBe(null);
      expect(generateSampleFromSchema(undefined, mockOpenApi)).toBe(null);
      expect(generateSampleFromSchema({ $ref: '#/components/schemas/NonExistent' }, mockOpenApi)).toBe(null);
    });

    it('should handle array of $ref items', () => {
      const schema = {
        type: 'array',
        items: { $ref: '#/components/schemas/User' }
      };

      const sample = generateSampleFromSchema(schema, mockOpenApi);

      expect(sample).toEqual([
        {
          id: 'string',
          name: 'string',
          age: 0
        }
      ]);
    });

    it('should handle allOf', () => {
      const schema = {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            properties: {
              extra: { type: 'string' }
            }
          }
        ]
      };

      const sample = generateSampleFromSchema(schema, mockOpenApi);

      expect(sample).toEqual({
        id: 'string',
        name: 'string',
        age: 0,
        extra: 'string'
      });
    });

    it('should handle schema with properties but no type', () => {
      const schema = {
        properties: {
          name: { type: 'string' }
        }
      };

      const sample = generateSampleFromSchema(schema, mockOpenApi);
      expect(sample).toEqual({ name: 'string' });
    });

    it('should use example if provided', () => {
      const schema = {
        type: 'string',
        example: 'test'
      };

      const sample = generateSampleFromSchema(schema, mockOpenApi);
      expect(sample).toBe('test');
    });
  });

  describe('collectPaths with arrays', () => {
    it('should collect paths from nested objects with arrays', () => {
      const obj = {
        name: 'John',
        profiles: [
          {
            email: 'john@example.com',
            settings: {
              theme: 'dark'
            }
          }
        ]
      };

      const paths = collectPaths(obj);
      expect(paths).toEqual([
        'name',
        'profiles',
        'profiles.0',
        'profiles.0.email',
        'profiles.0.settings',
        'profiles.0.settings.theme'
      ]);
    });
  });

  describe('parseOpenApiToTree with direct schema', () => {
    it('should handle response with direct schema', () => {
      const openApi: OpenAPISpec = {
        paths: {
          '/users': {
            get: {
              operationId: 'getUsers',
              responses: {
                '200': {
                  // @ts-expect-error - testing invalid schema
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                }
              }
            }
          }
        }
      };

      const tree = parseOpenApiToTree(openApi);
      expect(tree).toHaveLength(1);
      expect(tree[0].methods[0].details.responses['200'].content['application/json'].schema).toBeDefined();
    });
  });
});