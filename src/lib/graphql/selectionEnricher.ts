import type { OpenAPISpec, OpenAPISchema, SelectedAttributes } from '../../types/openapi';
import { hasRef, getPreferredName } from './utils';

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
    // If the property is a $ref or array of $ref, select all children
    const propSchema = schema.properties[field];
    if (hasRef(propSchema)) {
      const refType = getPreferredName(propSchema);
      if (refType) {
        const refSchema = openApi.components?.schemas?.[refType];
        if (refSchema && refSchema.properties) {
          ensureTypeExists(refType, enrichedSelectedAttrs);
          for (const childKey of Object.keys(refSchema.properties)) {
            enrichedSelectedAttrs[refType][childKey] = true;
          }
        }
      }
    } else if (propSchema?.type === 'array' && propSchema.items && hasRef(propSchema.items)) {
      const refType = getPreferredName(propSchema.items);
      if (refType) {
        const refSchema = openApi.components?.schemas?.[refType];
        if (refSchema && refSchema.properties) {
          ensureTypeExists(refType, enrichedSelectedAttrs);
          for (const childKey of Object.keys(refSchema.properties)) {
            enrichedSelectedAttrs[refType][childKey] = true;
          }
        }
      }
    }
    // NEW: If the property itself is selected (e.g. 'category'), select all children
    if (hasRef(propSchema) || (propSchema?.type === 'array' && propSchema.items && hasRef(propSchema.items))) {
      // Already handled above
    } else if (rest.length === 0 && (propSchema?.type === 'object' && propSchema.properties)) {
      for (const childKey of Object.keys(propSchema.properties)) {
        enrichedSelectedAttrs[currentTypeName!][field + '.' + childKey] = true;
      }
    }
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
    const refType = getPreferredName(schema.items);
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
    } else {
      // Path ends at array item: select all children of the referenced type
      const refSchema = openApi.components?.schemas?.[refType];
      if (refSchema && refSchema.properties) {
        ensureTypeExists(refType, enrichedSelectedAttrs);
        for (const childKey of Object.keys(refSchema.properties)) {
          enrichedSelectedAttrs[refType][childKey] = true;
        }
      }
    }
    return;
  }

  // Recurse into items with the item type name
  let itemTypeName = currentTypeName;
  if (schema.items && hasRef(schema.items)) {
    const preferredName = getPreferredName(schema.items);
    if (preferredName) {
      itemTypeName = preferredName;
    }
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
  if (hasRef(nextSchema)) {
    const preferredName = getPreferredName(nextSchema);
    if (preferredName) {
      handleRefProperty(preferredName, rest, enrichedSelectedAttrs, openApi);
    }
    return;
  }

  if (nextSchema.type === 'array' && nextSchema.items && hasRef(nextSchema.items)) {
    const preferredName = getPreferredName(nextSchema.items);
    if (preferredName) {
      handleArrayRefProperty(preferredName, rest, enrichedSelectedAttrs, openApi);
    }
    return;
  }

  if (rest.length > 0 && currentTypeName) {
    addSelectedAttrForReference(nextSchema, rest, enrichedSelectedAttrs, openApi, currentTypeName);
  }
}

function handleRefProperty(
  typeName: string,
  rest: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec
): void {
  if (rest.length === 0) return;

  ensureTypeExists(typeName, enrichedSelectedAttrs);

  if (rest.length === 1) {
    enrichedSelectedAttrs[typeName][rest[0]] = true;
  } else {
    const refSchema = openApi.components?.schemas?.[typeName];
    if (refSchema) {
      addSelectedAttrForReference(refSchema, rest, enrichedSelectedAttrs, openApi, typeName);
    }
  }
}

function handleArrayRefProperty(
  typeName: string,
  rest: string[],
  enrichedSelectedAttrs: SelectedAttributes,
  openApi: OpenAPISpec
): void {
  if (rest.length === 0) return;

  const [arrayField, ...arrayRest] = rest;
  if (!arrayField) return;

  ensureTypeExists(typeName, enrichedSelectedAttrs);

  if (arrayField === '0') {
    const refSchema = openApi.components?.schemas?.[typeName];
    if (refSchema && arrayRest.length > 0) {
      addSelectedAttrForReference(refSchema, arrayRest, enrichedSelectedAttrs, openApi, typeName);
    }
  } else if (arrayRest.length === 0) {
    enrichedSelectedAttrs[typeName][arrayField] = true;
  } else {
    const refSchema = openApi.components?.schemas?.[typeName];
    if (refSchema) {
      addSelectedAttrForReference(refSchema, [arrayField, ...arrayRest], enrichedSelectedAttrs, openApi, typeName);
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
    const preferredName = getPreferredName(items);
    if (!preferredName) return;
    const typeName = preferredName;
    const [arrayField, ...arrayRest] = pathSegments;
    
    if (!arrayField) return;
    
    ensureTypeExists(typeName, enrichedSelectedAttrs);

    if (arrayRest.length === 0) {
      // Path ends at array item: select all children of the referenced type
      const refSchema = openApi.components?.schemas?.[typeName];
      if (refSchema && refSchema.properties) {
        for (const childKey of Object.keys(refSchema.properties)) {
          enrichedSelectedAttrs[typeName][childKey] = true;
        }
      }
    } else if (arrayField === '0') {
      addSelectedAttrForReference(items, arrayRest, enrichedSelectedAttrs, openApi, typeName);
    } else {
      const refSchema = openApi.components?.schemas?.[typeName];
      if (refSchema) {
        addSelectedAttrForReference(refSchema, [arrayField, ...arrayRest], enrichedSelectedAttrs, openApi, typeName);
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