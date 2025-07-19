import { describe, it, expect } from 'vitest';
import { 
  hasRef, 
  resolveRef, 
  getRefName, 
  collectPaths, 
  isSuccessResponse, 
  generateOperationId 
} from './utils';
import type { OpenAPISpec } from '../../types/openapi';

describe('GraphQL Utils', () => {
  describe('hasRef', () => {
    it('should return true for objects with $ref property', () => {
      expect(hasRef({ $ref: '#/components/schemas/User' })).toBe(true);
    });

    it('should return false for objects with non-string $ref', () => {
      expect(hasRef({ $ref: 123 })).toBe(false);
      expect(hasRef({ $ref: null })).toBe(false);
    });
  });

  describe('resolveRef', () => {
    const mockOpenApi: OpenAPISpec = {
      components: {
        schemas: {
          User: { type: 'object', properties: { id: { type: 'string' } } },
          Post: { type: 'object', properties: { title: { type: 'string' } } }
        }
      }
    };

    it('should resolve valid schema references', () => {
      const result = resolveRef('#/components/schemas/User', mockOpenApi);
      expect(result).toEqual({ type: 'object', properties: { id: { type: 'string' } } });
    });

    it('should return null for invalid references', () => {
      expect(resolveRef('#/invalid/reference', mockOpenApi)).toBe(null);
      expect(resolveRef('#/components/schemas/NonExistent', mockOpenApi)).toBe(null);
    });

    it('should return null when openApi has no components', () => {
      expect(resolveRef('#/components/schemas/User', {})).toBe(null);
    });
  });

  describe('getRefName', () => {
    it('should extract reference name from $ref string', () => {
      expect(getRefName('#/components/schemas/User')).toBe('User');
      expect(getRefName('#/components/schemas/PostDetails')).toBe('PostDetails');
    });

    it('should handle empty or invalid refs', () => {
      expect(getRefName('#/components/schemas/')).toBe('');
      expect(getRefName('invalid')).toBe('invalid');
    });
  });

  describe('collectPaths', () => {
    it('should collect all nested object paths', () => {
      const obj = {
        id: '1',
        user: {
          name: 'John',
          details: {
            age: 30
          }
        }
      };

      const paths = collectPaths(obj);
      expect(paths).toContain('id');
      expect(paths).toContain('user');
      expect(paths).toContain('user.name');
      expect(paths).toContain('user.details');
      expect(paths).toContain('user.details.age');
    });

    it('should handle null and primitive values', () => {
      expect(collectPaths(null)).toEqual([]);
      expect(collectPaths('string')).toEqual([]);
      expect(collectPaths(123)).toEqual([]);
      expect(collectPaths(true)).toEqual([]);
    });

    it('should handle empty objects and arrays', () => {
      expect(collectPaths({})).toEqual([]);
      expect(collectPaths([])).toEqual([]);
    });
  });

  describe('isSuccessResponse', () => {
    it('should return true for 2xx status codes', () => {
      expect(isSuccessResponse('200')).toBe(true);
      expect(isSuccessResponse('201')).toBe(true);
      expect(isSuccessResponse('204')).toBe(true);
      expect(isSuccessResponse('299')).toBe(true);
    });

    it('should return false for non-2xx status codes', () => {
      expect(isSuccessResponse('100')).toBe(false);
      expect(isSuccessResponse('300')).toBe(false);
      expect(isSuccessResponse('400')).toBe(false);
      expect(isSuccessResponse('404')).toBe(false);
      expect(isSuccessResponse('500')).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(isSuccessResponse('abc')).toBe(false);
      expect(isSuccessResponse('')).toBe(false);
    });
  });

  describe('generateOperationId', () => {
    it('should generate operation ID from path and method', () => {
      expect(generateOperationId('/users', 'get')).toBe('get__users');
      expect(generateOperationId('/users/{id}', 'post')).toBe('post__users_id_');
      expect(generateOperationId('/api/v1/posts', 'delete')).toBe('delete_api_v1_posts');
    });
  });
});