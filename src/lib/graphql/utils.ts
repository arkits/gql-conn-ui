import type { OpenAPISchema, OpenAPISpec } from '../../types/openapi';

export function hasRef(obj: any): obj is { $ref: string } {
  return obj && typeof obj === 'object' && obj !== null && typeof obj.$ref === 'string';
}

export function resolveRef(ref: string, openApi: OpenAPISpec): OpenAPISchema | null {
  if (!ref.startsWith('#/components/schemas/')) return null;
  const refName = ref.replace('#/components/schemas/', '');
  return openApi.components?.schemas?.[refName] || null;
}

export function getRefName(ref: string): string {
  return ref.replace('#/components/schemas/', '');
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

export function isSuccessResponse(code: string): boolean {
  return /^2\d\d$/.test(code);
}

export function generateOperationId(path: string, method: string): string {
  return `${method}_${path.replace(/\W+/g, '_')}`;
}