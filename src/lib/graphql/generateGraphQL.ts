import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  printSchema,
  GraphQLInputObjectType,
} from "graphql";
import type {
  GraphQLFieldConfigMap,
  GraphQLOutputType,
  GraphQLInputType,
} from "graphql";

function hasRef(obj: any): obj is { $ref: string } {
  return obj && typeof obj === 'object' && obj !== null && typeof obj.$ref === 'string';
}

// Helper to map OpenAPI types to GraphQL output types
function mapOpenApiTypeToGraphQL(schema: any, openApi: any, selectedAttrs: Record<string, Record<string, boolean>>, typeName: string, path: string[] = [], typeMap: Record<string, GraphQLObjectType> = {}): GraphQLOutputType {
  if (!schema) return GraphQLString;
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    if (typeMap[refName]) return typeMap[refName];
    const resolved = openApi?.components?.schemas?.[refName];
    // Recursively build the type and cache it
    const gqlType = buildGraphQLType(refName, resolved, openApi, selectedAttrs, refName, [], typeMap);
    typeMap[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }
  if (schema.type === 'object') {
    return buildGraphQLType(typeName, schema, openApi, selectedAttrs, typeName, path, typeMap);
  }
  if (schema.type === 'array') {
    // For arrays, use the correct item type name
    let itemTypeName = typeName.replace(/s$/, '');
    if (hasRef(schema.items)) {
      itemTypeName = (schema.items as { $ref: string }).$ref.replace('#/components/schemas/', '');
    }
    return new GraphQLList(mapOpenApiTypeToGraphQL(schema.items, openApi, selectedAttrs, itemTypeName, [...path, '0'], typeMap));
  }
  if (schema.type === 'string') return GraphQLString;
  if (schema.type === 'integer') return GraphQLInt;
  if (schema.type === 'number') return GraphQLFloat;
  if (schema.type === 'boolean') return GraphQLBoolean;
  return GraphQLString;
}

// Helper to map OpenAPI types to GraphQL input types
function mapOpenApiTypeToGraphQLInput(schema: any, openApi: any, inputTypeMap: Record<string, GraphQLInputObjectType> = {}, nameHint = 'Input'): GraphQLInputType {
  if (!schema) return GraphQLString;
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '') + nameHint;
    if (inputTypeMap[refName]) return inputTypeMap[refName];
    const resolved = openApi?.components?.schemas?.[refName.replace(nameHint, '')];
    const gqlType = buildGraphQLInputType(refName, resolved, openApi, inputTypeMap);
    inputTypeMap[refName] = gqlType;
    return gqlType;
  }
  if (schema.type === 'object') {
    return buildGraphQLInputType(nameHint, schema, openApi, inputTypeMap);
  }
  if (schema.type === 'array') {
    return new GraphQLList(mapOpenApiTypeToGraphQLInput(schema.items, openApi, inputTypeMap, nameHint + 'Item'));
  }
  if (schema.type === 'string') return GraphQLString;
  if (schema.type === 'integer') return GraphQLInt;
  if (schema.type === 'number') return GraphQLFloat;
  if (schema.type === 'boolean') return GraphQLBoolean;
  return GraphQLString;
}

function buildGraphQLInputType(
  name: string,
  schema: any,
  openApi: any,
  inputTypeMap: Record<string, GraphQLInputObjectType> = {}
): GraphQLInputObjectType {
  if (!schema) return new GraphQLInputObjectType({ name: name + '_Empty', fields: {} });
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '') + 'Input';
    if (inputTypeMap[refName]) return inputTypeMap[refName];
    const resolved = openApi?.components?.schemas?.[refName.replace('Input', '')];
    const gqlType = buildGraphQLInputType(refName, resolved, openApi, inputTypeMap);
    inputTypeMap[refName] = gqlType;
    return gqlType;
  }
  if (schema.type === 'object') {
    const fields: any = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        fields[key] = { type: mapOpenApiTypeToGraphQLInput(propSchema, openApi, inputTypeMap, name + '_' + key) };
      }
    }
    const gqlType = new GraphQLInputObjectType({
      name,
      fields,
    });
    inputTypeMap[name] = gqlType;
    return gqlType;
  }
  // Fallback for non-object
  return new GraphQLInputObjectType({ name: name + '_ScalarInput', fields: {} });
}

function buildGraphQLType(
  name: string,
  schema: any,
  openApi: any,
  selectedAttrs: Record<string, Record<string, boolean>>,
  typeName: string,
  path: string[] = [],
  typeMap: Record<string, GraphQLObjectType> = {}
): GraphQLObjectType | GraphQLList<GraphQLObjectType> {
  if (!schema) return new GraphQLObjectType({ name: name + '_Empty', fields: {} });
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    if (typeMap[refName]) return typeMap[refName];
    const resolved = openApi?.components?.schemas?.[refName];
    // --- PATCH START ---
    // If selectedAttrs[refName] is empty, infer from parent
    let nestedSelectedAttrs = selectedAttrs[refName];
    if (!nestedSelectedAttrs || Object.keys(nestedSelectedAttrs).length === 0) {
      // Find all parent selectedAttrs[typeName] keys that start with the current path
      const parentSelected = selectedAttrs[typeName] || {};
      const prefix = path.length > 0 ? path.join('.') + '.' : '';
      nestedSelectedAttrs = {};
      for (const attrPath in parentSelected) {
        if (attrPath.startsWith(prefix)) {
          const rest = attrPath.slice(prefix.length);
          if (rest && !rest.includes('.')) {
            nestedSelectedAttrs[rest] = true;
          } else if (rest) {
            // For deeper nesting, only take the first segment
            const first = rest.split('.')[0];
            nestedSelectedAttrs[first] = true;
          }
        }
      }
    }
    // Pass the inferred selectedAttrs for the nested type
    const newSelectedAttrs = { ...selectedAttrs, [refName]: nestedSelectedAttrs };
    const gqlType = buildGraphQLType(refName, resolved, openApi, newSelectedAttrs, refName, [], typeMap);
    typeMap[refName] = gqlType as GraphQLObjectType;
    return gqlType;
    // --- PATCH END ---
  }
  if (schema.type === 'object') {
    const selected = selectedAttrs[typeName] || {};
    const fields: GraphQLFieldConfigMap<any, any> = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const attrPath = [...path, key].join('.');
        if (selected[attrPath]) {
          // For nested objects/arrays, pass the correct type name
          let nestedTypeName = key;
          if (propSchema && hasRef(propSchema)) {
            nestedTypeName = propSchema.$ref.replace('#/components/schemas/', '');
          }
          fields[key] = {
            type: mapOpenApiTypeToGraphQL(propSchema, openApi, selectedAttrs, nestedTypeName, [...path, key], typeMap),
          };
        }
      }
    }
    const gqlType = new GraphQLObjectType({
      name,
      fields,
    });
    typeMap[name] = gqlType;
    return gqlType;
  }
  if (schema.type === 'array') {
    // For arrays, use the correct item type name
    let itemTypeName = typeName.replace(/s$/, '');
    if (hasRef(schema.items)) {
      itemTypeName = (schema.items as { $ref: string }).$ref.replace('#/components/schemas/', '');
    }
    return new GraphQLList(buildGraphQLType(itemTypeName, schema.items, openApi, selectedAttrs, itemTypeName, [...path, '0'], typeMap) as GraphQLObjectType);
  }
  // Fallback for non-object
  return new GraphQLObjectType({ name: name + '_Scalar', fields: {} });
}

export function generateGraphQLSchemaFromSelections(openApi: any, selectedAttrs: Record<string, Record<string, boolean>>): string {
  if (!openApi) return '';
  // --- PATCH START: Preprocess selectedAttrs for nested types ---
  // Deep copy to avoid mutating input
  const enrichedSelectedAttrs: Record<string, Record<string, boolean>> = JSON.parse(JSON.stringify(selectedAttrs));
  // --- PATCH START: Robust handling for object and array references ---
  function addSelectedAttrForReference(schema: any, pathSegments: string[], enrichedSelectedAttrs: Record<string, Record<string, boolean>>) {
    if (!schema || pathSegments.length === 0) return;
    const [field, ...rest] = pathSegments;
    let nextSchema = null;
    let nextTypeName = null;
    // Step into the field if it exists
    if (schema.properties && schema.properties[field]) {
      nextSchema = schema.properties[field];
      // If it's a $ref (object reference)
      if (nextSchema.$ref) {
        nextTypeName = nextSchema.$ref.replace('#/components/schemas/', '');
        if (rest.length > 0) {
          if (!enrichedSelectedAttrs[nextTypeName]) enrichedSelectedAttrs[nextTypeName] = {};
          enrichedSelectedAttrs[nextTypeName][rest.join('.')] = true;
        }
        return;
      }
      // If it's an array of $ref (array reference)
      if (nextSchema.type === 'array' && nextSchema.items && nextSchema.items.$ref) {
        nextTypeName = nextSchema.items.$ref.replace('#/components/schemas/', '');
        // Only add the next segment (e.g., for tags.id, add 'id' to Tag)
        if (rest.length > 0) {
          const [arrayField, ...arrayRest] = rest;
          if (!enrichedSelectedAttrs[nextTypeName]) enrichedSelectedAttrs[nextTypeName] = {};
          if (arrayField) {
            enrichedSelectedAttrs[nextTypeName][arrayField] = true;
          }
          // If there is deeper nesting, support it (e.g., tags.subfield.id)
          if (arrayRest.length > 0) {
            addSelectedAttrForReference(nextSchema.items, arrayRest, enrichedSelectedAttrs);
          }
        }
        return;
      }
      // If it's a plain object, keep walking
      if (rest.length > 0) {
        addSelectedAttrForReference(nextSchema, rest, enrichedSelectedAttrs);
      }
    }
    // If the root schema is an array
    else if (schema.type === 'array' && schema.items) {
      nextSchema = schema.items;
      if (nextSchema.$ref) {
        nextTypeName = nextSchema.$ref.replace('#/components/schemas/', '');
        if (rest.length > 0) {
          const [arrayField, ...arrayRest] = rest;
          if (!enrichedSelectedAttrs[nextTypeName]) enrichedSelectedAttrs[nextTypeName] = {};
          if (arrayField) {
            enrichedSelectedAttrs[nextTypeName][arrayField] = true;
          }
          if (arrayRest.length > 0) {
            addSelectedAttrForReference(nextSchema, arrayRest, enrichedSelectedAttrs);
          }
        }
        return;
      }
      if (rest.length > 0) {
        addSelectedAttrForReference(nextSchema, rest, enrichedSelectedAttrs);
      }
    }
  }

  for (const [typeName, attrs] of Object.entries(selectedAttrs)) {
    const schema = openApi?.components?.schemas?.[typeName];
    for (const attrPath of Object.keys(attrs)) {
      if (attrPath.includes('.')) {
        const pathSegments = attrPath.split('.');
        addSelectedAttrForReference(schema, pathSegments, enrichedSelectedAttrs);
      }
    }
  }
  // --- PATCH END ---

  const typeMap: Record<string, GraphQLObjectType> = {};
  const inputTypeMap: Record<string, GraphQLInputObjectType> = {};
  const queryFields: GraphQLFieldConfigMap<any, any> = {};
  const comments: string[] = [];
  // Store directive args for each query
  const queryDirectives: Record<string, { path: string; method: string; selection: string[] }> = {};

  function processOperation(path: string, method: string, details: any) {
    const operationId = details.operationId || `${method}_${path.replace(/\W+/g, '_')}`;
    const description = details.summary || details.description || '';
    const responses = details.responses || {};
    const parameters = details.parameters || [];
    const requestBody = details.requestBody;
    const successEntry = Object.entries(responses).find(([code]) => /^2\d\d$/.test(code));
    if (!successEntry) return;
    const [code, resp] = successEntry;
    const respObj = resp as any;
    if (!respObj.content) return;
    for (const [type, content] of Object.entries(respObj.content as any)) {
      const contentObj = content as any;
      if (type.includes('json') && contentObj.schema) {
        let typeName = '';
        if (contentObj.schema.$ref) {
          typeName = contentObj.schema.$ref.replace('#/components/schemas/', '');
        } else if (operationId) {
          typeName = operationId + '_' + code;
        } else {
          typeName = 'Type_' + code;
        }
        const selected = enrichedSelectedAttrs[typeName];
        if (selected && Object.keys(selected).length > 0) {
          // Build the GraphQL type (handle array response)
          let gqlType: GraphQLOutputType;
          if (contentObj.schema.type === 'array') {
            let itemTypeName = typeName.replace(/s$/, '');
            if (hasRef(contentObj.schema.items as unknown)) {
              itemTypeName = (contentObj.schema.items as any)['$ref'].replace('#/components/schemas/', '');
            }
            gqlType = new GraphQLList(buildGraphQLType(itemTypeName, contentObj.schema.items, openApi, enrichedSelectedAttrs, itemTypeName, [], typeMap) as GraphQLObjectType);
          } else {
            gqlType = buildGraphQLType(typeName, contentObj.schema, openApi, enrichedSelectedAttrs, typeName, [], typeMap) as GraphQLObjectType;
          }

          // Build GraphQL arguments from OpenAPI params
          const args: Record<string, { type: GraphQLInputType }> = {};
          // Path and query parameters
          for (const param of parameters) {
            if (!param.name || !param.in) continue;
            let gqlType: GraphQLInputType = GraphQLString;
            if (param.schema) {
              gqlType = mapOpenApiTypeToGraphQLInput(param.schema, openApi, inputTypeMap, param.name + 'Input');
            }
            if (param.required) {
              gqlType = new GraphQLNonNull(gqlType);
            }
            args[param.name] = { type: gqlType };
          }
          // JSON request body
          if (requestBody && requestBody.content && requestBody.content['application/json']) {
            const reqSchema = requestBody.content['application/json'].schema;
            if (reqSchema) {
              let inputTypeName = operationId + 'Input';
              if (reqSchema.$ref) {
                inputTypeName = reqSchema.$ref.replace('#/components/schemas/', '') + 'Input';
              }
              const inputType = mapOpenApiTypeToGraphQLInput(reqSchema, openApi, inputTypeMap, inputTypeName);
              args['input'] = { type: inputType };
            }
          }

          // Add to Query
          queryFields[operationId] = {
            type: gqlType,
            args,
            resolve: () => ({}), // dummy resolver for SDL
            description: description ? `OpenAPI: ${method.toUpperCase()} ${path}\n${description}` : `OpenAPI: ${method.toUpperCase()} ${path}`,
          };
          // Add comment for documentation
          comments.push(`# OpenAPI: ${method.toUpperCase()} ${path}\n# ${description}`);

          // Collect directive args for this query
          queryDirectives[operationId] = {
            path,
            method: method.toUpperCase(),
            selection: Object.keys(selected),
          };
        }
      }
    }
  }

  for (const [path, methods] of Object.entries(openApi.paths || {})) {
    for (const [method, details] of Object.entries(methods as any)) {
      processOperation(path, method, details as any);
    }
  }

  if (Object.keys(queryFields).length === 0) {
    return '# GraphQL schema will appear here\n';
  }

  const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: queryFields,
  });

  const schema = new GraphQLSchema({
    query: QueryType,
  });

  // Add comments at the top
  let sdl = printSchema(schema);
  if (comments.length > 0) {
    sdl = comments.join('\n') + '\n' + sdl;
  }

  // Add the @dataSource directive definition if not present
  const directiveDef = 'directive @dataSource(path: String!, method: String!, selection: [String!]!) on FIELD_DEFINITION';
  if (!sdl.includes('directive @dataSource')) {
    sdl = directiveDef + '\n\n' + sdl;
  }

  // Inject the directive into each query field
  // Find the Query type definition in SDL and add the directive to each field
  sdl = sdl.replace(/(type Query \{[\s\S]*?\n\})/, (match) => {
    // For each field, add the directive
    return match.replace(/^(\s*)(\w+)(\([^)]*\))?\s*:\s*([^!\n]+!?)/gm, (line, indent, field, args, type) => {
      if (queryDirectives[field]) {
        const { path, method, selection } = queryDirectives[field];
        // Format selection as a GraphQL array literal
        const selectionArr = '[' + selection.map(s => `\"${s}\"`).join(', ') + ']';
        return `${indent}${field}${args || ''}: ${type} @dataSource(path: \"${path}\", method: \"${method}\", selection: ${selectionArr})`;
      }
      return line;
    });
  });

  return sdl;
} 