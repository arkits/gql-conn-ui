import {
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  type GraphQLFieldConfigMap,
  type GraphQLOutputType,
  type GraphQLInputType,
} from "graphql";
import type {
  OpenAPISchema,
  OpenAPISpec,
  SelectedAttributes,
} from "../../types/openapi";
import type { TypeMaps } from "./types";
import {
  hasRef,
  resolveRef,
  getRefName,
  getPreferredName,
  singularizeAndCapitalize,
} from "./utils";

export function buildObjectType(
  name: string,
  schema: OpenAPISchema,
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[] = [],
  typeMaps: TypeMaps
): GraphQLObjectType | GraphQLList<GraphQLObjectType> {
  if (!schema) {
    const typeName = name.endsWith("_Empty") ? name : name + "_Empty";
    return new GraphQLObjectType({ name: typeName, fields: {} });
  }


  if (schema.allOf) {
    // Handle allOf by merging all the schemas
    const mergedSchema: OpenAPISchema = {
      type: 'object',
      properties: {},
      required: [],
    };
    
    // Collect enhanced selected attributes from all referenced types
    let enhancedSelectedAttrs = { ...selectedAttrs };

    for (const subSchema of schema.allOf) {
      // Resolve ref if present in subSchema
      const resolvedSchema = subSchema.$ref ? resolveRef(subSchema.$ref, openApi) : subSchema;
      if (!resolvedSchema) continue;
      
      // If this subSchema has a $ref, we should inherit selections from that type
      if (subSchema.$ref) {
        const refName = getRefName(subSchema.$ref);
        const refSelections = selectedAttrs[refName] || {};
        
        // Merge ref selections into the current type, but don't override existing selections
        const currentSelections = enhancedSelectedAttrs[typeName] || {};
        const mergedSelections: Record<string, boolean> = {};
        
        // First add existing selections
        for (const [key, value] of Object.entries(currentSelections)) {
          mergedSelections[key] = value;
        }
        
        // Then add ref selections only if not already present
        for (const [key, value] of Object.entries(refSelections)) {
          if (!(key in mergedSelections)) {
            mergedSelections[key] = value;
          }
        }
        
        enhancedSelectedAttrs = {
          ...enhancedSelectedAttrs,
          [typeName]: mergedSelections
        };
      }

      // Merge properties
      if (resolvedSchema.properties) {
        mergedSchema.properties = {
          ...mergedSchema.properties,
          ...resolvedSchema.properties
        };
      }

      // Merge required fields (deduplicate)
      if (resolvedSchema.required) {
        const existingRequired = mergedSchema.required || [];
        const newRequired = resolvedSchema.required.filter(req => !existingRequired.includes(req));
        mergedSchema.required = [...existingRequired, ...newRequired];
      }

      // Merge description if not already set
      if (resolvedSchema.description && !mergedSchema.description) {
        mergedSchema.description = resolvedSchema.description;
      }
    }

    return buildObjectType(name, mergedSchema, openApi, enhancedSelectedAttrs, typeName, path, typeMaps);
  }

  // Handle $ref - but only if there are no direct properties
  if (schema.$ref && !schema.properties && !schema.type) {
    const refName = getRefName(schema.$ref);
    if (typeMaps.output[refName]) return typeMaps.output[refName];
    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) {
      return new GraphQLObjectType({
        name: refName + "_Unresolved",
        fields: {},
      });
    }

    const nestedSelectedAttrs = enrichSelectedAttrsForRef(
      selectedAttrs,
      typeName,
      path,
      refName
    );
    const gqlType = buildObjectType(
      refName,
      resolved,
      openApi,
      nestedSelectedAttrs,
      refName,
      [],
      typeMaps
    );
    typeMaps.output[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }

  // Handle schemas that have both $ref and direct properties (merged schemas)
  if (schema.$ref && (schema.properties || schema.type)) {
    // This schema has been pre-resolved and merged, use it directly
    // but still extract the ref name for type naming if available
    const refName = getRefName(schema.$ref);
    const preferredName = refName || name;
    
    // Use the merged schema directly
    const mergedSchema: OpenAPISchema = {
      ...schema,
      // Remove the $ref since we're using the merged data
      $ref: undefined
    };
    
    return buildObjectType(preferredName, mergedSchema, openApi, selectedAttrs, typeName, path, typeMaps);
  }

  if (schema.type === "object" || (schema.properties && !schema.type)) {
    // Get direct selections for this type
    const selected = selectedAttrs[typeName] || {};
    const fields: GraphQLFieldConfigMap<unknown, unknown> = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        // First check if the attribute is explicitly unselected in current type
        if (selected[key] === false) {
          continue;
        }

        // Then check both direct and nested selections
        const isSelected = selected[key] === true || Object.keys(selectedAttrs).some(parentType => {
          const parentAttrs = selectedAttrs[parentType];
          return Object.entries(parentAttrs).some(([path, value]) => {
            const matchesPath = path.endsWith(`.${key}`) || path === key;
            return matchesPath && value === true;
          });
        });
        
        if (isSelected) {
          let nestedTypeName = key;
          if (propSchema) {
            const preferredName = getPreferredName(propSchema);
            if (preferredName) {
              nestedTypeName = preferredName;
            }
          }

          fields[key] = {
            type: mapToGraphQLOutputTypeInternal(
              propSchema,
              openApi,
              selectedAttrs,
              nestedTypeName,
              [...path, key],
              typeMaps
            ),
          };
        }
      }
    }

    const gqlType = new GraphQLObjectType({
      name,
      fields,
      description: schema.description,
    });
    typeMaps.output[name] = gqlType;
    return gqlType;
  }

  if (schema.type === "array") {
    let itemTypeName = singularizeAndCapitalize(typeName);
    if (schema.items) {
      const preferredName = getPreferredName(schema.items);
      if (preferredName) {
        itemTypeName = preferredName;
      }
    }
    
    // Handle both direct selection and nested selection for array items
    const parentSelected = selectedAttrs[typeName] || {};
    const existingItemAttrs = selectedAttrs[itemTypeName] || {};
    const itemSelectedAttrs: Record<string, boolean> = {};

    // Process array item selections (with '0.' prefix)
    for (const [key, value] of Object.entries(parentSelected)) {
      if (key.startsWith("0.")) {
        const normalizedKey = key.slice(2);
        // Only copy if it's true, or if it's explicitly false
        if (value === true || value === false) {
          itemSelectedAttrs[normalizedKey] = value;
        }
      }
    }

    // Process direct selections on the referenced type, but don't override explicit array selections
    if (hasRef(schema.items)) {
      const refName = getRefName((schema.items as { $ref: string }).$ref);
      const refSelectedAttrs = selectedAttrs[refName] || {};
      for (const [key, value] of Object.entries(refSelectedAttrs)) {
        if (!(key in itemSelectedAttrs)) {
          itemSelectedAttrs[key] = value;
        }
      }
    }

    // Process direct selections on the item type, but don't override array selections
    for (const [key, value] of Object.entries(existingItemAttrs)) {
      if (!(key in itemSelectedAttrs)) {
        itemSelectedAttrs[key] = value;
      }
    }

    const normalizedSelectedAttrs = {
      ...selectedAttrs,
      [itemTypeName]: itemSelectedAttrs,
    };

    return new GraphQLList(
      buildObjectType(
        itemTypeName,
        schema.items || {},
        openApi,
        normalizedSelectedAttrs,
        itemTypeName,
        [...path, "0"],
        typeMaps
      ) as GraphQLObjectType
    );
  }

  return new GraphQLObjectType({ name: name + "_Scalar", fields: {} });
}

export function buildInputType(
  name: string,
  schema: OpenAPISchema,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps
): GraphQLInputObjectType {
  if (!schema) {
    const typeName = name.endsWith("_Empty") ? name : name + "_Empty";
    return new GraphQLInputObjectType({ name: typeName, fields: {} });
  }

  // Handle $ref only if no direct properties
  if (schema.$ref && !schema.properties && !schema.type) {
    const refName = getRefName(schema.$ref) + "Input";
    if (typeMaps.input[refName]) return typeMaps.input[refName];

    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) {
      return new GraphQLInputObjectType({
        name: refName + "_Unresolved",
        fields: {},
      });
    }

    const gqlType = buildInputType(refName, resolved, openApi, typeMaps);
    typeMaps.input[refName] = gqlType;
    return gqlType;
  }

  // Handle merged schemas (with $ref and direct properties)
  if (schema.$ref && (schema.properties || schema.type)) {
    const refName = getRefName(schema.$ref);
    const preferredName = (refName || name) + "Input";
    
    const mergedSchema: OpenAPISchema = {
      ...schema,
      $ref: undefined
    };
    
    return buildInputType(preferredName, mergedSchema, openApi, typeMaps);
  }

  if (schema.type === "object" || (schema.properties && !schema.type)) {
    const fields: Record<string, { type: GraphQLInputType }> = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        fields[key] = {
          type: mapToGraphQLInputTypeInternal(
            propSchema,
            openApi,
            typeMaps,
            name + "_" + key
          ),
        };
      }
    }

    const gqlType = new GraphQLInputObjectType({ name, fields });
    typeMaps.input[name] = gqlType;
    return gqlType;
  }

  return new GraphQLInputObjectType({
    name: name + "_ScalarInput",
    fields: {},
  });
}

function enrichSelectedAttrsForRef(
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[],
  refName: string
): SelectedAttributes {
  // Start with a fresh selection map for the referenced type
  const nestedSelectedAttrs: Record<string, boolean> = {};

  // Process nested selections from the parent type
  const parentSelected = selectedAttrs[typeName] || {};
  const prefix = path.length > 0 ? path.join(".") + "." : "";

  // First process parent selections which have explicit true/false values
  for (const [attrPath, value] of Object.entries(parentSelected)) {
    if (attrPath.startsWith(prefix)) {
      const rest = attrPath.slice(prefix.length);
      if (rest) {
        if (!rest.includes(".")) {
          // Direct field selection
          nestedSelectedAttrs[rest] = value;
        } else {
          // Nested field selection
          const first = rest.split(".")[0];
          if (!(first in nestedSelectedAttrs)) {
            nestedSelectedAttrs[first] = value;
          }
        }
      }
    }
  }

  // Then process existing ref type selections, but don't override parent selections
  const existingSelectedAttrs = selectedAttrs[refName] || {};
  for (const [key, value] of Object.entries(existingSelectedAttrs)) {
    if (!(key in nestedSelectedAttrs)) {
      nestedSelectedAttrs[key] = value;
    }
  }

  return {
    ...selectedAttrs,
    [refName]: nestedSelectedAttrs
  };
}

function mapToGraphQLOutputTypeInternal(
  schema: OpenAPISchema | undefined,
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[] = [],
  typeMaps: TypeMaps
): GraphQLOutputType {
  if (!schema) return GraphQLString;

  // Handle $ref only if no direct properties
  if (schema.$ref && !schema.properties && !schema.type) {
    const refName = getRefName(schema.$ref);
    if (typeMaps.output[refName]) return typeMaps.output[refName];

    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) return GraphQLString;

    const gqlType = buildObjectType(
      refName,
      resolved,
      openApi,
      selectedAttrs,
      refName,
      [],
      typeMaps
    );
    typeMaps.output[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }

  // Handle merged schemas (with $ref and direct properties)
  if (schema.$ref && (schema.properties || schema.type)) {
    const refName = getRefName(schema.$ref);
    const preferredName = refName || typeName;
    
    const mergedSchema: OpenAPISchema = {
      ...schema,
      $ref: undefined
    };
    
    return buildObjectType(
      preferredName,
      mergedSchema,
      openApi,
      selectedAttrs,
      preferredName,
      path,
      typeMaps
    );
  }

  switch (schema.type) {
    case "object": {
      return buildObjectType(
        typeName,
        schema,
        openApi,
        selectedAttrs,
        typeName,
        path,
        typeMaps
      );
    }

    case "array": {
      let itemTypeName = singularizeAndCapitalize(typeName);
      if (schema.items) {
        const preferredName = getPreferredName(schema.items);
        if (preferredName) {
          itemTypeName = preferredName;
        }
      }
      // Normalize selectedAttrs for array item type: strip '0.' prefix from keys
      const parentSelected = selectedAttrs[typeName] || {};
      const itemSelectedAttrs: Record<string, boolean> = {};
      for (const key in parentSelected) {
        if (key.startsWith("0.")) {
          itemSelectedAttrs[key.slice(2)] = parentSelected[key];
        }
      }
      const normalizedSelectedAttrs = {
        ...selectedAttrs,
        [itemTypeName]: itemSelectedAttrs,
      };
      return new GraphQLList(
        mapToGraphQLOutputTypeInternal(
          schema.items,
          openApi,
          normalizedSelectedAttrs,
          itemTypeName,
          [...path, "0"],
          typeMaps
        )
      );
    }

    case "string":
      return GraphQLString;
    case "integer":
      return GraphQLInt;
    case "number":
      return GraphQLFloat;
    case "boolean":
      return GraphQLBoolean;
    default:
      return GraphQLString;
  }
}

function mapToGraphQLInputTypeInternal(
  schema: OpenAPISchema | undefined,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps,
  nameHint = "Input"
): GraphQLInputType {
  if (!schema) return GraphQLString;

  // Handle $ref only if no direct properties
  if (schema.$ref && !schema.properties && !schema.type) {
    const refName = getRefName(schema.$ref) + nameHint;
    if (typeMaps.input[refName]) return typeMaps.input[refName];

    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) return GraphQLString;

    const gqlType = buildInputType(refName, resolved, openApi, typeMaps);
    typeMaps.input[refName] = gqlType;
    return gqlType;
  }

  // Handle merged schemas (with $ref and direct properties)
  if (schema.$ref && (schema.properties || schema.type)) {
    const refName = getRefName(schema.$ref);
    const preferredName = (refName || nameHint);
    
    const mergedSchema: OpenAPISchema = {
      ...schema,
      $ref: undefined
    };
    
    return buildInputType(preferredName, mergedSchema, openApi, typeMaps);
  }

  switch (schema.type) {
    case "object": {
      return buildInputType(nameHint, schema, openApi, typeMaps);
    }

    case "array": {
      return new GraphQLList(
        mapToGraphQLInputTypeInternal(
          schema.items,
          openApi,
          typeMaps,
          nameHint + "Item"
        )
      );
    }

    case "string":
      return GraphQLString;
    case "integer":
      return GraphQLInt;
    case "number":
      return GraphQLFloat;
    case "boolean":
      return GraphQLBoolean;
    default:
      return GraphQLString;
  }
}
