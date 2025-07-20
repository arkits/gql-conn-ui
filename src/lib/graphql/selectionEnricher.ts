import type { OpenAPISpec, OpenAPISchema, SelectedAttributes } from '../../types/openapi';
import { hasRef, getRefName } from './utils';

export function enrichSelectedAttributes(
  selectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec
): SelectedAttributes {
  // Only enrich attributes that are explicitly selected (true)
  const enriched: SelectedAttributes = JSON.parse(JSON.stringify(selectedAttrs));

  for (const [typeName, attrs] of Object.entries(selectedAttrs)) {
    const schema = openApi.components?.schemas?.[typeName];
    if (!schema) continue;

    for (const [attrPath, isSelected] of Object.entries(attrs)) {
      // Only process attributes that are explicitly selected
      if (isSelected && attrPath.includes('.')) {
        const pathSegments = attrPath.split('.');
        addSelectedAttrForReference(schema, pathSegments, enriched, openApi, typeName);
      }
    }
  }

  return mergeEnrichedAttributes(enriched);
}

function addSelectedAttrForReference(
  schema: OpenAPISchema,
  pathSegments: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec,
  currentTypeName?: string
): void {
  if (!schema || pathSegments.length === 0) return;
  
  const [field, ...rest] = pathSegments;

  // Handle array index '0' - skip and apply rest to item type
  if (field === '0') {
    handleArrayIndexZero(schema, rest, enrichedSelectedAttrs, openApi, currentTypeName);
    return;
  }

  // Handle leaf property of an object
  if (pathSegments.length === 1 && schema.properties?.[field]) {
    addLeafProperty(field, currentTypeName, enrichedSelectedAttrs);
    return;
  }

  // Step into the field if it exists
  if (schema.properties?.[field]) {
    const nextSchema = schema.properties[field];
    handleNestedProperty(nextSchema, rest, enrichedSelectedAttrs, openApi, currentTypeName);
    return;
  }

  // Handle root array
  if (schema.type === 'array' && schema.items) {
    handleRootArray(schema.items, [field, ...rest], enrichedSelectedAttrs, openApi, currentTypeName);
  }
}

function handleArrayIndexZero(
  schema: OpenAPISchema,
  rest: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec,
  currentTypeName?: string
): void {
  if (schema.items && hasRef(schema.items)) {
    const refType = getRefName(schema.items.$ref);
    if (rest.length > 0) {
      const [nextField, ...nextRest] = rest;
      if (!refType || !nextField) return;

      ensureTypeExists(refType, enrichedSelectedAttrs);
      
      if (nextRest.length === 0) {
        enrichedSelectedAttrs[refType][nextField] = true;
      } else {
        const refSchema = openApi.components?.schemas?.[refType];
        if (refSchema) {
          addSelectedAttrForReference(refSchema, [nextField, ...nextRest], enrichedSelectedAttrs, openApi, refType);
        }
      }
    }
    return;
  }

  // Recurse into items with the item type name
  let itemTypeName = currentTypeName;
  if (schema.items && hasRef(schema.items)) {
    itemTypeName = getRefName(schema.items.$ref);
  }
  if (schema.items) {
    addSelectedAttrForReference(schema.items, rest, enrichedSelectedAttrs, openApi, itemTypeName);
  }
}

function addLeafProperty(
  field: string,
  currentTypeName: string | undefined,
  enrichedSelectedAttrs: SelectedAttributes
): void {
  if (!currentTypeName) return;
  ensureTypeExists(currentTypeName, enrichedSelectedAttrs);
  enrichedSelectedAttrs[currentTypeName][field] = true;
}

function handleNestedProperty(
  nextSchema: OpenAPISchema,
  rest: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec,
  currentTypeName?: string
): void {
  if (nextSchema.$ref) {
    handleRefProperty(nextSchema.$ref, rest, enrichedSelectedAttrs, openApi);
    return;
  }

  if (nextSchema.type === 'array' && nextSchema.items && hasRef(nextSchema.items)) {
    handleArrayRefProperty(nextSchema.items.$ref, rest, enrichedSelectedAttrs, openApi);
    return;
  }

  if (rest.length > 0 && currentTypeName) {
    addSelectedAttrForReference(nextSchema, rest, enrichedSelectedAttrs, openApi, currentTypeName);
  }
}

function handleRefProperty(
  ref: string,
  rest: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec
): void {
  const nextTypeName = getRefName(ref);
  if (rest.length === 0) return;

  ensureTypeExists(nextTypeName, enrichedSelectedAttrs);

  if (rest.length === 1) {
    enrichedSelectedAttrs[nextTypeName][rest[0]] = true;
  } else {
    const refSchema = openApi.components?.schemas?.[nextTypeName];
    if (refSchema) {
      addSelectedAttrForReference(refSchema, rest, enrichedSelectedAttrs, openApi, nextTypeName);
    }
  }
}

function handleArrayRefProperty(
  itemRef: string,
  rest: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec
): void {
  const nextTypeName = getRefName(itemRef);
  if (rest.length === 0) return;

  const [arrayField, ...arrayRest] = rest;
  if (!arrayField) return;

  ensureTypeExists(nextTypeName, enrichedSelectedAttrs);

  if (arrayField === '0') {
    const refSchema = openApi.components?.schemas?.[nextTypeName];
    if (refSchema && arrayRest.length > 0) {
      addSelectedAttrForReference(refSchema, arrayRest, enrichedSelectedAttrs, openApi, nextTypeName);
    }
  } else if (arrayRest.length === 0) {
    enrichedSelectedAttrs[nextTypeName][arrayField] = true;
  } else {
    const refSchema = openApi.components?.schemas?.[nextTypeName];
    if (refSchema) {
      addSelectedAttrForReference(refSchema, [arrayField, ...arrayRest], enrichedSelectedAttrs, openApi, nextTypeName);
    }
  }
}

function handleRootArray(
  items: OpenAPISchema,
  pathSegments: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec,
  currentTypeName?: string
): void {
  if (hasRef(items)) {
    const nextTypeName = getRefName(items.$ref);
    const [arrayField, ...arrayRest] = pathSegments;
    
    if (!arrayField) return;
    
    ensureTypeExists(nextTypeName, enrichedSelectedAttrs);

    if (arrayRest.length === 0) {
      enrichedSelectedAttrs[nextTypeName][arrayField] = true;
    } else if (arrayField === '0') {
      addSelectedAttrForReference(items, arrayRest, enrichedSelectedAttrs, openApi, nextTypeName);
    } else {
      const refSchema = openApi.components?.schemas?.[nextTypeName];
      if (refSchema) {
        addSelectedAttrForReference(refSchema, [arrayField, ...arrayRest], enrichedSelectedAttrs, openApi, nextTypeName);
      }
    }
  } else if (pathSegments.length > 0 && currentTypeName) {
    addSelectedAttrForReference(items, pathSegments, enrichedSelectedAttrs, openApi, currentTypeName);
  }
}

function ensureTypeExists(typeName: string, enrichedSelectedAttrs: SelectedAttributes): void {
  if (!enrichedSelectedAttrs[typeName]) {
    enrichedSelectedAttrs[typeName] = {};
  }
}

function mergeEnrichedAttributes(enriched: SelectedAttributes): SelectedAttributes {
  const merged: SelectedAttributes = {};
  
  for (const [typeName, attrs] of Object.entries(enriched)) {
    if (!merged[typeName]) merged[typeName] = {};
    for (const [key, value] of Object.entries(attrs)) {
      // Preserve the original selection state
      merged[typeName][key] = value;
    }
  }
  
  return merged;
}