import { useState, useCallback } from "react";
import SwaggerClient from "swagger-client";
import yaml from "js-yaml";
import type { OpenAPISpec, TreeNode } from "../types/openapi";
import { parseOpenApiToTree } from "../utils/openapi";

export function useFileUpload() {
  const [openApi, setOpenApi] = useState<OpenAPISpec | null>(null);
  const [openApiTree, setOpenApiTree] = useState<TreeNode[]>([]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return { success: false, error: "No file selected" };

      try {
        const text = await file.text();
        let rawSpec;
        try {
          rawSpec = JSON.parse(text);
        } catch {
          try {
            rawSpec = yaml.load(text);
          } catch {
            return {
              success: false,
              error: "Invalid OpenAPI file: must be valid JSON or YAML",
            };
          }
        }
        const client = await SwaggerClient({ spec: rawSpec });
        // Convert to plain object for compatibility
        const spec = client.spec as OpenAPISpec;
        console.log("Parsed OpenAPI spec:", spec);
        const tree = parseOpenApiToTree(spec);
        console.log("Generated OpenAPI tree:", tree);
        setOpenApi(spec);
        setOpenApiTree(tree);
        return { success: true, spec };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to process file",
        };
      }
    },
    []
  );

  const clearData = useCallback(() => {
    setOpenApi(null);
    setOpenApiTree([]);
  }, []);

  return {
    openApi,
    openApiTree,
    handleFileUpload,
    clearData,
  };
}
