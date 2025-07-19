import { describe, it, expect } from 'vitest';
import { enrichSelectedAttributes } from './selectionEnricher';
import type { OpenAPISpec, SelectedAttributes } from '../../types/openapi';

describe('Selection Enricher', () => {
  const mockOpenApi: OpenAPISpec = {
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            profile: { $ref: '#/components/schemas/Profile' },
            posts: {
              type: 'array',
              items: { $ref: '#/components/schemas/Post' }
            }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            settings: { $ref: '#/components/schemas/Settings' }
          }
        },
        Settings: {
          type: 'object',
          properties: {
            theme: { type: 'string' },
            notifications: { type: 'boolean' }
          }
        },
        Post: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            author: { $ref: '#/components/schemas/User' }
          }
        }
      }
    }
  };

  describe('enrichSelectedAttributes', () => {
    it('should preserve existing selections', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          'profile.email': true
        },
        Profile: {
          email: true,
          settings: true
        }
      };

      const enriched = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(enriched.User.id).toBe(true);
      expect(enriched.Profile.email).toBe(true);
      expect(enriched.Profile.settings).toBe(true);
    });

    it('should handle selections without nested paths', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          profile: true
        }
      };

      const enriched = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(enriched.User).toEqual({
        id: true,
        profile: true
      });

      // No enrichment needed for simple selections
      expect(enriched.Profile).toBeUndefined();
    });

    it('should handle empty selections', () => {
      const selectedAttrs: SelectedAttributes = {};
      const enriched = enrichSelectedAttributes(selectedAttrs, mockOpenApi);
      expect(enriched).toEqual({});
    });

    it('should handle selections for non-existent schemas', () => {
      const selectedAttrs: SelectedAttributes = {
        NonExistent: {
          'field.nested': true
        }
      };

      const enriched = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(enriched.NonExistent).toEqual({
        'field.nested': true
      });
    });

    it('should merge multiple enrichments for the same type', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {
          'profile.email': true,
          'posts.0.author.id': true
        }
      };

      const enriched = enrichSelectedAttributes(selectedAttrs, mockOpenApi);

      expect(enriched.User).toEqual({
        'profile.email': true,
        'posts.0.author.id': true,
        id: true // from posts.0.author.id
      });

      expect(enriched.Profile).toEqual({
        email: true
      });
    });
  });
});