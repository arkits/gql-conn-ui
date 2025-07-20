import type { OpenAPISchema, OpenAPISpec } from '../../types/openapi';

export function hasRef(obj: unknown): obj is { $ref: string } {
  return Boolean(obj && typeof obj === 'object' && obj !== null && '$ref' in obj && typeof (obj as { $ref: unknown }).$ref === 'string');
}

export function resolveRef(ref: string, openApi: OpenAPISpec): OpenAPISchema | null {
  if (!ref.startsWith('#/components/schemas/')) return null;
  const refName = ref.replace('#/components/schemas/', '');
  return openApi.components?.schemas?.[refName] || null;
}

export function getRefName(ref: string): string {
  return ref.replace('#/components/schemas/', '');
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