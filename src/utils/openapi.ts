import type { OpenAPISchema, OpenAPISpec, TreeNode } from '../types/openapi';

export function parseOpenApiToTree(openApi: OpenAPISpec): TreeNode[] {
  if (!openApi?.paths) return [];

  return Object.entries(openApi.paths)
    .map(([path, methods]) => ({
      path,
      methods: Object.entries(methods)
        .filter(([, details]) => {
          // Include methods that have either:
          // 1. 2xx responses with content
          // 2. 2xx responses with schema directly
          const responses = details.responses || {};
          return Object.entries(responses).some(([code, resp]) => {
            if (!resp || !/^2\d\d$/.test(code)) return false;
            
            // Check if response has content
            if (resp.content) return true;
            
            // Check if response has direct schema
            if ('schema' in resp) return true;

            return false;
          });
        })
        .map(([method, details]) => {
          // Ensure responses are properly structured
          const responses = details.responses || {};
          Object.entries(responses).forEach(([code, resp]) => {
            if (/^2\d\d$/.test(code) && resp && !resp.content && 'schema' in resp) {
              // If response has direct schema, wrap it in content
              responses[code] = {
                ...resp,
                content: {
                  'application/json': {
                    schema: resp.schema as OpenAPISchema
                  }
                }
              };
            }
          });
          details.responses = responses;
          return {
            method: method.toUpperCase(),
            details,
          };
        }),
    }))
    .filter((node) => node.methods.length > 0);
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

  if (typeof schema !== 'object' || schema === null) return null;
  
  // Handle direct examples if available
  if ('example' in schema && schema.example !== undefined) {
    return schema.example;
  }

  // Handle $ref resolution - but only if there are no direct properties
  if ('$ref' in schema && !('properties' in schema) && !('type' in schema)) {
    const refString = schema.$ref as string;
    // Handle both relative refs (#/components/schemas/...) and full URLs
    let refName: string;
    if (refString.includes('#/components/schemas/')) {
      refName = refString.split('#/components/schemas/')[1];
    } else {
      // Fallback for other ref formats
      refName = refString.replace('#/components/schemas/', '');
    }
    const resolved = openApi?.components?.schemas?.[refName];
    return generateSampleFromSchema(resolved, openApi);
  }

  // Handle allOf composition
  if ('allOf' in schema && Array.isArray(schema.allOf)) {
    const mergedSchema: Record<string, unknown> = {};
    // First merge all subschemas
    for (const subSchema of schema.allOf) {
      const subSample = generateSampleFromSchema(subSchema, openApi);
      if (typeof subSample === 'object' && subSample !== null) {
        Object.assign(mergedSchema, subSample);
      }
    }
    // Then merge direct properties if any
    if ('properties' in schema && typeof schema.properties === 'object') {
      const directProps = generateSampleFromSchema({
        type: 'object',
        properties: schema.properties
      }, openApi);
      if (typeof directProps === 'object' && directProps !== null) {
        Object.assign(mergedSchema, directProps);
      }
    }
    return mergedSchema;
  }

  if (typeof schema === 'object' && schema && 'allOf' in schema) {
    // Handle allOf by merging all the schemas
    const mergedObj: Record<string, unknown> = {};
    const allOf = schema.allOf as unknown[];
    
    for (const subSchema of allOf) {
      const subSample = generateSampleFromSchema(subSchema, openApi);
      if (typeof subSample === 'object' && subSample !== null && !Array.isArray(subSample)) {
        Object.assign(mergedObj, subSample);
      }
    }
    
    // Also merge any direct properties defined on the schema itself
    if ('properties' in schema && schema.properties) {
      const directProps = generateSampleFromSchema({
        type: 'object',
        properties: schema.properties
      }, openApi);
      if (typeof directProps === 'object' && directProps !== null) {
        Object.assign(mergedObj, directProps);
      }
    }
    
    return mergedObj;
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
  
  // Handle objects without explicit type but with properties
  if (typeof schema === 'object' && schema && 'properties' in schema && !('type' in schema)) {
    const obj: Record<string, unknown> = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties as Record<string, unknown>)) {
        obj[key] = generateSampleFromSchema(propSchema, openApi);
      }
    }
    return obj;
  }
  
  if (typeof schema === 'object' && schema && 'type' in schema) {
    const type = schema.type as string;
    if (type === 'string') return 'string';
    if (type === 'integer' || type === 'number') return 0;
    if (type === 'boolean') return true;
  }
  
  return null;
}