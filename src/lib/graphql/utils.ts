import type { OpenAPISchema, OpenAPISpec } from '../../types/openapi';

export function hasRef(obj: unknown): obj is { $ref: string } | { $$ref: string } {
  return Boolean(
    obj && typeof obj === 'object' && obj !== null &&
    (('$ref' in obj && typeof (obj as { $ref: unknown }).$ref === 'string') ||
     ('$$ref' in obj && typeof (obj as { $$ref: unknown }).$$ref === 'string'))
  );
}

function extractRefName(ref: string): string | undefined {
  if (!ref) return undefined;
  
  // Try full URL or path format
  const urlMatch = ref.match(/\/components\/schemas\/([^/]+)/);
  if (urlMatch) return urlMatch[1];
  
  // Try hash format
  const hashMatch = ref.match(/#\/components\/schemas\/([^/]+)/);
  if (hashMatch) return hashMatch[1];
  
  // Try simple name
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

export function getPreferredName(schema: OpenAPISchema): string | undefined {
  if (!schema) return undefined;
  
  // First try to get xml.name (capitalized) from the schema
  if (schema.xml?.name) {
    return capitalizeTypeName(schema.xml.name);
  }
  
  // Then try standard $ref
  if ('$ref' in schema && schema.$ref) {
    const name = extractRefName(schema.$ref);
    if (name) return name;
  }
  
  // Finally try $$ref
  if ('$$ref' in schema && schema.$$ref) {
    const name = extractRefName(schema.$$ref);
    if (name) return name;
  }

  return undefined;
}

export function resolveRef(ref: string, openApi: OpenAPISpec): OpenAPISchema | null {
  if (!ref) return null;
  
  const refName = extractRefName(ref);
  if (!refName) return null;
  
  return openApi.components?.schemas?.[refName] || null;
}

export function getRefName(ref: string): string {
  if (!ref) return '';
  
  const name = extractRefName(ref);
  if (!name) return '';
  
  return name;
}

export function collectPaths(obj: unknown, prefix: string[] = []): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  if (Array.isArray(obj)) {
    return collectPaths(obj[0], [...prefix, '0']);
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

export function isSuccessResponse(code: string): boolean {
  return /^2\d\d$/.test(code);
}

export function generateOperationId(path: string, method: string): string {
  // Replace all non-alphanumeric characters with underscores, then trim leading/trailing underscores
  const sanitizedPath = path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `${method}__${sanitizedPath}`;
}

export function capitalizeTypeName(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function singularizeAndCapitalize(typeName: string): string {
  const singular = typeName.replace(/s$/, '');
  return capitalizeTypeName(singular);
}