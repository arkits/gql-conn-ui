import type { OpenAPISpec, TreeNode } from '../types/openapi';

export function parseOpenApiToTree(openApi: OpenAPISpec): TreeNode[] {
  if (!openApi?.paths) return [];

  return Object.entries(openApi.paths)
    .map(([path, methods]) => ({
      path,
      methods: Object.entries(methods)
        .filter(([, details]) => {
          // Only include methods with a 2xx response that has a content property
          const responses = details.responses || {};
          return Object.entries(responses).some(
            ([code, resp]) => /^2\d\d$/.test(code) && resp && resp.content
          );
        })
        .map(([method, details]) => ({
          method: method.toUpperCase(),
          details,
        })),
    }))
    .filter((node) => node.methods.length > 0); // Filter out paths with no methods
}

export function collectPaths(obj: unknown, prefix: string[] = []): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  if (Array.isArray(obj)) {
    // Add the array index path itself
    const arrayPath = [...prefix, '0'].join('.');
    let paths: string[] = [arrayPath];
    // Recurse into the first element if it exists
    if (obj.length > 0) {
      paths = paths.concat(collectPaths(obj[0], [...prefix, '0']));
    }
    return paths;
  }
  let paths: string[] = [];
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = [...prefix, key];
    paths.push(currentPath.join('.'));
    if (typeof val === 'object' && val !== null) {
      paths = paths.concat(collectPaths(val, currentPath));
    }
  }
  return paths;
}

export function generateSampleFromSchema(schema: unknown, openApi: OpenAPISpec): unknown {
  if (!schema) return null;
  
  if (typeof schema === 'object' && schema && '$ref' in schema) {
    const refName = (schema.$ref as string).replace('#/components/schemas/', '');
    const resolved = openApi?.components?.schemas?.[refName];
    return generateSampleFromSchema(resolved, openApi);
  }
  
  if (typeof schema === 'object' && schema && 'type' in schema && schema.type === 'object') {
    const obj: Record<string, unknown> = {};
    if ('properties' in schema && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as Record<string, unknown>)) {
        obj[key] = generateSampleFromSchema(propSchema, openApi);
      }
    }
    return obj;
  }
  
  if (typeof schema === 'object' && schema && 'type' in schema && schema.type === 'array') {
    return [generateSampleFromSchema((schema as { items?: unknown }).items, openApi)];
  }
  
  if (typeof schema === 'object' && schema && 'type' in schema) {
    const type = schema.type as string;
    if (type === 'string') return 'string';
    if (type === 'integer' || type === 'number') return 0;
    if (type === 'boolean') return true;
  }
  return null;
}