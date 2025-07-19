import { useState, useCallback } from 'react';
import yaml from 'js-yaml';
import type { OpenAPISpec, TreeNode } from '../types/openapi';
import { parseOpenApiToTree } from '../utils/openapi';

export function useFileUpload() {
  const [openApi, setOpenApi] = useState<OpenAPISpec | null>(null);
  const [openApiTree, setOpenApiTree] = useState<TreeNode[]>([]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return { success: false, error: 'No file selected' };

    try {
      const text = await file.text();
      let spec: OpenAPISpec;

      try {
        spec = JSON.parse(text);
      } catch (jsonErr) {
        try {
          spec = yaml.load(text) as OpenAPISpec;
        } catch (yamlErr) {
          return { success: false, error: 'Invalid OpenAPI file: must be valid JSON or YAML' };
        }
      }

      setOpenApi(spec);
      setOpenApiTree(parseOpenApiToTree(spec));
      return { success: true, spec };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process file' 
      };
    }
  }, []);

  const clearData = useCallback(() => {
    setOpenApi(null);
    setOpenApiTree([]);
  }, []);

  return {
    openApi,
    openApiTree,
    handleFileUpload,
    clearData
  };
}