import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';
import yaml from 'js-yaml';
import { parseOpenApiToTree } from '../utils/openapi';

// Mock js-yaml
vi.mock('js-yaml', () => ({
  default: {
    load: vi.fn()
  }
}));

// Mock the parseOpenApiToTree function
vi.mock('../utils/openapi', () => ({
  parseOpenApiToTree: vi.fn()
}));

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with null openApi and empty tree', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });
  });

  describe('handleFileUpload', () => {
    const createMockFile = (content: string, name = 'test.json') => {
      const file = new File([content], name, { type: 'application/json' });
      return file;
    };

    const createMockEvent = (file: File | null) => ({
      target: {
        files: file ? [file] : null
      }
    }) as React.ChangeEvent<HTMLInputElement>;

    it('should handle valid JSON file upload', async () => {
      const { result } = renderHook(() => useFileUpload());

      const mockOpenApi = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };

      const mockTree = [{ path: '/test', methods: [] }];
      vi.mocked(parseOpenApiToTree).mockReturnValue(mockTree);

      const file = createMockFile(JSON.stringify(mockOpenApi));
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.spec).toEqual(mockOpenApi);
      expect(result.current.openApi).toEqual(mockOpenApi);
      expect(result.current.openApiTree).toEqual(mockTree);
      expect(vi.mocked(parseOpenApiToTree)).toHaveBeenCalledWith(mockOpenApi);
    });

    it('should handle valid YAML file upload when JSON parsing fails', async () => {
      const { result } = renderHook(() => useFileUpload());

      const mockOpenApi = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {}
      };

      const mockTree = [{ path: '/test', methods: [] }];
      vi.mocked(yaml.load).mockReturnValue(mockOpenApi);
      vi.mocked(parseOpenApiToTree).mockReturnValue(mockTree);

      const yamlContent = 'openapi: "3.0.0"\ninfo:\n  title: Test API\n  version: 1.0.0';
      const file = createMockFile(yamlContent, 'test.yaml');
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.spec).toEqual(mockOpenApi);
      expect(result.current.openApi).toEqual(mockOpenApi);
      expect(result.current.openApiTree).toEqual(mockTree);
      expect(vi.mocked(yaml.load)).toHaveBeenCalledWith(yamlContent);
      expect(vi.mocked(parseOpenApiToTree)).toHaveBeenCalledWith(mockOpenApi);
    });

    it('should return error when no file is selected', async () => {
      const { result } = renderHook(() => useFileUpload());

      const event = createMockEvent(null);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('No file selected');
      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });

    it('should return error for invalid JSON and YAML', async () => {
      const { result } = renderHook(() => useFileUpload());

      vi.mocked(yaml.load).mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      const file = createMockFile('invalid json content');
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('Invalid OpenAPI file: must be valid JSON or YAML');
      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });

    it('should handle file reading errors', async () => {
      const { result } = renderHook(() => useFileUpload());

      // Create a mock file that will throw an error when text() is called
      const mockFile = {
        text: vi.fn().mockRejectedValue(new Error('File read error'))
      };

      const event = {
        target: {
          files: [mockFile]
        }
      } as any;

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('File read error');
      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });

    it('should handle generic errors during processing', async () => {
      const { result } = renderHook(() => useFileUpload());

      vi.mocked(parseOpenApiToTree).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const mockOpenApi = { openapi: '3.0.0' };
      const file = createMockFile(JSON.stringify(mockOpenApi));
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('Parse error');
    });

    it('should handle non-Error exceptions', async () => {
      const { result } = renderHook(() => useFileUpload());

      mockParseOpenApiToTree.mockImplementation(() => {
        throw 'String error';
      });

      const mockOpenApi = { openapi: '3.0.0' };
      const file = createMockFile(JSON.stringify(mockOpenApi));
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('Failed to process file');
    });

    it('should update state only on successful upload', async () => {
      const { result } = renderHook(() => useFileUpload());

      const mockOpenApi = { openapi: '3.0.0' };
      const mockTree = [{ path: '/test', methods: [] }];
      vi.mocked(parseOpenApiToTree).mockReturnValue(mockTree);

      const file = createMockFile(JSON.stringify(mockOpenApi));
      const event = createMockEvent(file);

      await act(async () => {
        await result.current.handleFileUpload(event);
      });

      expect(result.current.openApi).toEqual(mockOpenApi);
      expect(result.current.openApiTree).toEqual(mockTree);

      // Now try with invalid file
      vi.mocked(parseOpenApiToTree).mockImplementation(() => {
        throw new Error('Parse error');
      });

      const invalidFile = createMockFile('invalid');
      const invalidEvent = createMockEvent(invalidFile);

      await act(async () => {
        await result.current.handleFileUpload(invalidEvent);
      });

      // State should remain unchanged
      expect(result.current.openApi).toEqual(mockOpenApi);
      expect(result.current.openApiTree).toEqual(mockTree);
    });
  });

  describe('clearData', () => {
    it('should clear all data', async () => {
      const { result } = renderHook(() => useFileUpload());

      // First upload some data
      const mockOpenApi = { openapi: '3.0.0' };
      const mockTree = [{ path: '/test', methods: [] }];
      vi.mocked(parseOpenApiToTree).mockReturnValue(mockTree);

      const file = createMockFile(JSON.stringify(mockOpenApi));
      const event = createMockEvent(file);

      await act(async () => {
        await result.current.handleFileUpload(event);
      });

      expect(result.current.openApi).toEqual(mockOpenApi);
      expect(result.current.openApiTree).toEqual(mockTree);

      // Clear the data
      act(() => {
        result.current.clearData();
      });

      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });

    it('should work when no data exists', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.clearData();
      });

      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });
  });

  describe('callback stability', () => {
    it('should maintain callback references across renders', () => {
      const { result, rerender } = renderHook(() => useFileUpload());

      const initialHandleFileUpload = result.current.handleFileUpload;
      const initialClearData = result.current.clearData;

      rerender();

      expect(result.current.handleFileUpload).toBe(initialHandleFileUpload);
      expect(result.current.clearData).toBe(initialClearData);
    });
  });

  describe('edge cases', () => {
    it('should handle empty file content', async () => {
      const { result } = renderHook(() => useFileUpload());

      const file = createMockFile('');
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('Invalid OpenAPI file: must be valid JSON or YAML');
    });

    it('should handle files with different extensions', async () => {
      const { result } = renderHook(() => useFileUpload());

      const mockOpenApi = { openapi: '3.0.0' };
      const mockTree = [];
      mockParseOpenApiToTree.mockReturnValue(mockTree);

      const file = createMockFile(JSON.stringify(mockOpenApi), 'test.yml');
      const event = createMockEvent(file);

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(true);
      expect(result.current.openApi).toEqual(mockOpenApi);
    });
  });
});