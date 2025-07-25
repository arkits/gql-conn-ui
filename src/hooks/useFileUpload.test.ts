import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';
import SwaggerClient from 'swagger-client';
import yaml from 'js-yaml';

vi.mock('swagger-client');
vi.mock('js-yaml');

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an error if no file is selected', async () => {
    const { result } = renderHook(() => useFileUpload());
    const event = {
      target: { files: [] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.handleFileUpload(event);
    });
    expect(uploadResult.success).toBe(false);
    expect(uploadResult.error).toBe('No file selected');
  });

  it('should handle valid JSON file', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = {
      text: () => Promise.resolve('{"swagger": "2.0"}'),
    };
    const event = {
      target: { files: [mockFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    (SwaggerClient as vi.Mock).mockResolvedValue({ spec: { swagger: '2.0' } });
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.handleFileUpload(event);
    });
    expect(uploadResult.success).toBe(true);
    expect(result.current.openApi).toEqual({ swagger: '2.0' });
  });

  it('should handle valid YAML file', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = {
      text: () => Promise.resolve('swagger: "2.0"'),
    };
    const event = {
      target: { files: [mockFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    (yaml.load as vi.Mock).mockReturnValue({ swagger: '2.0' });
    (SwaggerClient as vi.Mock).mockResolvedValue({ spec: { swagger: '2.0' } });
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.handleFileUpload(event);
    });
    expect(uploadResult.success).toBe(true);
    expect(result.current.openApi).toEqual({ swagger: '2.0' });
  });

  it('should return an error for invalid file type', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = {
      text: () => Promise.resolve('invalid'),
    };
    const event = {
      target: { files: [mockFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    (yaml.load as vi.Mock).mockImplementation(() => {
      throw new Error('bad yaml');
    });
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.handleFileUpload(event);
    });
    expect(uploadResult.success).toBe(false);
    expect(uploadResult.error).toBe(
      'Invalid OpenAPI file: must be valid JSON or YAML'
    );
  });

  it('should handle swagger client error', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = {
      text: () => Promise.resolve('{"swagger": "2.0"}'),
    };
    const event = {
      target: { files: [mockFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    (SwaggerClient as vi.Mock).mockRejectedValue(new Error('Swagger error'));
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.handleFileUpload(event);
    });
    expect(uploadResult.success).toBe(false);
    expect(uploadResult.error).toBe('Swagger error');
  });

  it('should clear data', async () => {
    const { result } = renderHook(() => useFileUpload());
    const mockFile = {
      text: () => Promise.resolve('{"swagger": "2.0"}'),
    };
    const event = {
      target: { files: [mockFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    (SwaggerClient as vi.Mock).mockResolvedValue({ spec: { swagger: '2.0' } });
    await act(async () => {
      await result.current.handleFileUpload(event);
    });
    act(() => {
      result.current.clearData();
    });
    expect(result.current.openApi).toBe(null);
  });
});
