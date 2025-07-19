import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGraphQLGeneration } from './useGraphQLGeneration';
import type { OpenAPISpec, SelectedAttributes } from '../types/openapi';
import { generateGraphQLSchemaFromSelections } from '../lib/graphql/generateGraphQL';
import { generateAppConfigYaml } from '../lib/appConfig/configGenerator';

// Mock the generation functions
vi.mock('../lib/graphql/generateGraphQL', () => ({
  generateGraphQLSchemaFromSelections: vi.fn()
}));

vi.mock('../lib/appConfig/configGenerator', () => ({
  generateAppConfigYaml: vi.fn()
}));

describe('useGraphQLGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console.error mock if needed
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default messages', () => {
      const { result } = renderHook(() => useGraphQLGeneration(null, {}));

      expect(result.current.graphqlSchema).toBe('# GraphQL schema will appear here\n');
      expect(result.current.appConfigYaml).toBe('# Application config YAML will appear here\n');
      expect(result.current.hasSelections).toBe(false);
    });
  });

  describe('hasSelections calculation', () => {
    it('should return false for empty selected attributes', () => {
      const { result } = renderHook(() => useGraphQLGeneration(null, {}));

      expect(result.current.hasSelections).toBe(false);
    });

    it('should return false for types with no selected attributes', () => {
      const selectedAttrs: SelectedAttributes = {
        User: {},
        Post: {}
      };

      const { result } = renderHook(() => useGraphQLGeneration(null, selectedAttrs));

      expect(result.current.hasSelections).toBe(false);
    });

    it('should return true when any type has selected attributes', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true },
        Post: {}
      };

      const { result } = renderHook(() => useGraphQLGeneration(null, selectedAttrs));

      expect(result.current.hasSelections).toBe(true);
    });

    it('should recalculate when selectedAttrs change', () => {
      const { result, rerender } = renderHook(
        ({ selectedAttrs }) => useGraphQLGeneration(null, selectedAttrs),
        { initialProps: { selectedAttrs: {} } }
      );

      expect(result.current.hasSelections).toBe(false);

      rerender({ selectedAttrs: { User: { id: true } } });

      expect(result.current.hasSelections).toBe(true);

      rerender({ selectedAttrs: { User: {} } });

      expect(result.current.hasSelections).toBe(false);
    });
  });

  describe('GraphQL schema generation', () => {
    const mockOpenApi: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' }
    };

    it('should generate schema when openApi and selections exist', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true, name: true }
      };

      const mockSchema = 'type User { id: String name: String }';
      vi.mocked(generateGraphQLSchemaFromSelections).mockReturnValue(mockSchema);

      const { result } = renderHook(() => useGraphQLGeneration(mockOpenApi, selectedAttrs));

      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledWith(mockOpenApi, selectedAttrs);
      expect(result.current.graphqlSchema).toBe(mockSchema);
    });

    it('should show default message when no selections exist', () => {
      mockGenerateGraphQLSchema.mockReturnValue('type Query {}');

      const { result } = renderHook(() => useGraphQLGeneration(mockOpenApi, {}));

      expect(result.current.graphqlSchema).toBe('# GraphQL schema will appear here\n');
      expect(vi.mocked(generateGraphQLSchemaFromSelections)).not.toHaveBeenCalled();
    });

    it('should show default message when openApi is null', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      const { result } = renderHook(() => useGraphQLGeneration(null, selectedAttrs));

      expect(result.current.graphqlSchema).toBe('# GraphQL schema will appear here\n');
      expect(vi.mocked(generateGraphQLSchemaFromSelections)).not.toHaveBeenCalled();
    });

    it('should handle GraphQL generation errors', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      vi.mocked(generateGraphQLSchemaFromSelections).mockImplementation(() => {
        throw new Error('GraphQL generation failed');
      });

      const { result } = renderHook(() => useGraphQLGeneration(mockOpenApi, selectedAttrs));

      expect(result.current.graphqlSchema).toBe('# Error generating GraphQL schema\n');
      expect(console.error).toHaveBeenCalledWith('Error generating GraphQL schema:', expect.any(Error));
    });

    it('should regenerate when selections change', () => {
      const initialSelectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      const schema1 = 'type User { id: String }';
      const schema2 = 'type User { id: String name: String }';

      vi.mocked(generateGraphQLSchemaFromSelections)
        .mockReturnValueOnce(schema1)
        .mockReturnValueOnce(schema2);

      const { result, rerender } = renderHook(
        ({ selectedAttrs }) => useGraphQLGeneration(mockOpenApi, selectedAttrs),
        { initialProps: { selectedAttrs: initialSelectedAttrs } }
      );

      expect(result.current.graphqlSchema).toBe(schema1);
      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledWith(mockOpenApi, initialSelectedAttrs);

      const updatedSelectedAttrs: SelectedAttributes = {
        User: { id: true, name: true }
      };

      rerender({ selectedAttrs: updatedSelectedAttrs });

      expect(result.current.graphqlSchema).toBe(schema2);
      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledWith(mockOpenApi, updatedSelectedAttrs);
    });
  });

  describe('App config generation', () => {
    const mockOpenApi: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' }
    };

    it('should always generate app config', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      const mockConfig = 'dataSources:\n  - name: userApi';
      vi.mocked(generateAppConfigYaml).mockReturnValue(mockConfig);

      const { result } = renderHook(() => useGraphQLGeneration(mockOpenApi, selectedAttrs));

      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(mockOpenApi, selectedAttrs);
      expect(result.current.appConfigYaml).toBe(mockConfig);
    });

    it('should generate config even with null openApi', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      const mockConfig = '# No configuration available';
      vi.mocked(generateAppConfigYaml).mockReturnValue(mockConfig);

      const { result } = renderHook(() => useGraphQLGeneration(null, selectedAttrs));

      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(null, selectedAttrs);
      expect(result.current.appConfigYaml).toBe(mockConfig);
    });

    it('should generate config even with empty selections', () => {
      const mockConfig = '# No endpoints selected';
      vi.mocked(generateAppConfigYaml).mockReturnValue(mockConfig);

      const { result } = renderHook(() => useGraphQLGeneration(mockOpenApi, {}));

      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(mockOpenApi, {});
      expect(result.current.appConfigYaml).toBe(mockConfig);
    });

    it('should handle app config generation errors', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      vi.mocked(generateAppConfigYaml).mockImplementation(() => {
        throw new Error('Config generation failed');
      });

      const { result } = renderHook(() => useGraphQLGeneration(mockOpenApi, selectedAttrs));

      expect(result.current.appConfigYaml).toBe('# Error generating application config\n');
      expect(console.error).toHaveBeenCalledWith('Error generating app config:', expect.any(Error));
    });

    it('should regenerate when openApi changes', () => {
      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      const config1 = 'config for api v1';
      const config2 = 'config for api v2';

      vi.mocked(generateAppConfigYaml)
        .mockReturnValueOnce(config1)
        .mockReturnValueOnce(config2);

      const openApi1: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'API v1', version: '1.0.0' }
      };

      const openApi2: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'API v2', version: '2.0.0' }
      };

      const { result, rerender } = renderHook(
        ({ openApi }) => useGraphQLGeneration(openApi, selectedAttrs),
        { initialProps: { openApi: openApi1 } }
      );

      expect(result.current.appConfigYaml).toBe(config1);
      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(openApi1, selectedAttrs);

      rerender({ openApi: openApi2 });

      expect(result.current.appConfigYaml).toBe(config2);
      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(openApi2, selectedAttrs);
    });
  });

  describe('effect dependencies', () => {
    it('should only regenerate when dependencies actually change', () => {
      const mockOpenApi: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' }
      };

      const selectedAttrs: SelectedAttributes = {
        User: { id: true }
      };

      vi.mocked(generateGraphQLSchemaFromSelections).mockReturnValue('schema');
      vi.mocked(generateAppConfigYaml).mockReturnValue('config');

      const { rerender } = renderHook(() => useGraphQLGeneration(mockOpenApi, selectedAttrs));

      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledTimes(1);

      // Re-render with same props should not trigger regeneration
      rerender();

      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledTimes(1);
    });
  });

  describe('complex scenarios', () => {
    it('should handle simultaneous openApi and selectedAttrs changes', () => {
      const openApi1: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'API v1', version: '1.0.0' }
      };

      const openApi2: OpenAPISpec = {
        openapi: '3.0.0',
        info: { title: 'API v2', version: '2.0.0' }
      };

      const selectedAttrs1: SelectedAttributes = {
        User: { id: true }
      };

      const selectedAttrs2: SelectedAttributes = {
        User: { id: true, name: true },
        Post: { title: true }
      };

      vi.mocked(generateGraphQLSchemaFromSelections).mockReturnValue('updated schema');
      vi.mocked(generateAppConfigYaml).mockReturnValue('updated config');

      const { result, rerender } = renderHook(
        ({ openApi, selectedAttrs }) => useGraphQLGeneration(openApi, selectedAttrs),
        { initialProps: { openApi: openApi1, selectedAttrs: selectedAttrs1 } }
      );

      // Initial render
      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledWith(openApi1, selectedAttrs1);
      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(openApi1, selectedAttrs1);

      // Update both props
      rerender({ openApi: openApi2, selectedAttrs: selectedAttrs2 });

      expect(vi.mocked(generateGraphQLSchemaFromSelections)).toHaveBeenCalledWith(openApi2, selectedAttrs2);
      expect(vi.mocked(generateAppConfigYaml)).toHaveBeenCalledWith(openApi2, selectedAttrs2);
      expect(result.current.hasSelections).toBe(true);
    });
  });
});