import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';

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
    const createMockEvent = (file: File | null) => ({
      target: {
        files: file ? [file] : null
      }
    }) as React.ChangeEvent<HTMLInputElement>;

    it('should return error when no file is selected', async () => {
      const { result } = renderHook(() => useFileUpload());

      const event = createMockEvent(null);

      let uploadResult: { success: boolean; error?: string };
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('No file selected');
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
      } as React.ChangeEvent<HTMLInputElement>;

      let uploadResult: { success: boolean; error?: string };
      await act(async () => {
        uploadResult = await result.current.handleFileUpload(event);
      });

      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('File read error');
      expect(result.current.openApi).toBe(null);
      expect(result.current.openApiTree).toEqual([]);
    });
  });

  describe('clearData', () => {
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
});