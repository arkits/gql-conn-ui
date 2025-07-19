import type { OpenAPISpec, TreeNode } from '../types/openapi';

export function parseOpenApiToTree(openApi: OpenAPISpec): TreeNode[] {
  if (!openApi?.paths) return [];

  return Object.entries(openApi.paths)
    .map(([path, methods]: any) => ({
      path,
      methods: Object.entries(methods)
        .filter(([_, details]: any) => {
          // Only include methods with a 2xx response that has a content property
          const responses = details.responses || {};
          return Object.entries(responses).some(
            ([code, resp]: any) => /^2\d\d$/.test(code) && resp && resp.content
          );
        })
        .map(([method, details]: any) => ({
          method: method.toUpperCase(),
          details,
        })),
    }))
    .filter((node: any) => node.methods.length > 0); // Filter out paths with no methods
}

export function collectPaths(obj: any, prefix: string[] = []): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  if (Array.isArray(obj)) {
    return collectPaths(obj[0], [...prefix, '0']);
  }
  
  let paths: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const currentPath = [...prefix, key];
    paths.push(currentPath.join('.'));
    if (typeof val === 'object' && val !== null) {
      paths = paths.concat(collectPaths(val, currentPath));
    }
  }
  return paths;
}

export function generateSampleFromSchema(schema: any, openApi: OpenAPISpec): any {
  if (!schema) return null;
  
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    const resolved = openApi?.components?.schemas?.[refName];
    return generateSampleFromSchema(resolved, openApi);
  }
  
  if (schema.type === 'object') {
    const obj: any = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = generateSampleFromSchema(propSchema, openApi);
      }
    }
    return obj;
  }
  
  if (schema.type === 'array') {
    return [generateSampleFromSchema(schema.items, openApi)];
  }
  
  if (schema.type === 'string') return 'string';
  if (schema.type === 'integer' || schema.type === 'number') return 0;
  if (schema.type === 'boolean') return true;
  return null;
}