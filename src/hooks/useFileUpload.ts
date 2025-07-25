import { useState, useCallback } from "react";
import SwaggerClient from "swagger-client";
import yaml from "js-yaml";
import type { OpenAPISpec, TreeNode } from "../types/openapi";
import { parseOpenApiToTree } from "../utils/openapi";

// Helper function to process the file content
async function processFileContent(content: string) {
  let rawSpec;
  try {
    rawSpec = JSON.parse(content);
  } catch {
    try {
      rawSpec = yaml.load(content);
      if (typeof rawSpec === 'string') {
        // If yaml.load returns a string, it's likely an error or not a valid object
        rawSpec = yaml.load(rawSpec);
      }
    } catch {
      throw new Error("Invalid OpenAPI file: must be valid JSON or YAML");
    }
  }

  if (!rawSpec || typeof rawSpec !== 'object') {
    throw new Error("Invalid OpenAPI content: does not resolve to an object");
  }

  const client = await SwaggerClient({ spec: rawSpec });
  return client.spec as OpenAPISpec;
}


export function useFileUpload() {
  const [openApi, setOpenApi] = useState<OpenAPISpec | null>(null);
  const [openApiTree, setOpenApiTree] = useState<TreeNode[]>([]);

  const processOpenApiSpec = useCallback(async (spec: OpenAPISpec) => {
    try {
      console.log("Parsed OpenAPI spec:", spec);
      const tree = parseOpenApiToTree(spec);
      console.log("Generated OpenAPI tree:", tree);
      setOpenApi(spec);
      setOpenApiTree(tree);
      return { success: true, spec };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process spec",
      };
    }
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return { success: false, error: "No file selected" };

      try {
        const text = await file.text();
        const spec = await processFileContent(text);
        return await processOpenApiSpec(spec);
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to process file",
        };
      }
    },
    [processOpenApiSpec]
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
