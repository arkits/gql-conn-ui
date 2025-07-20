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
  type GraphQLInputType
} from 'graphql';
import type { OpenAPISchema, OpenAPISpec, SelectedAttributes } from '../../types/openapi';
import type { TypeMaps } from './types';
import { hasRef, resolveRef, getRefName } from './utils';

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
    return new GraphQLObjectType({ name: name + '_Empty', fields: {} });
  }

  if (schema.$ref) {
    const refName = getRefName(schema.$ref);
    if (typeMaps.output[refName]) return typeMaps.output[refName];
    
    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) {
      return new GraphQLObjectType({ name: refName + '_Unresolved', fields: {} });
    }

    const nestedSelectedAttrs = enrichSelectedAttrsForRef(selectedAttrs, typeName, path, refName);
    const gqlType = buildObjectType(refName, resolved, openApi, nestedSelectedAttrs, refName, [], typeMaps);
    typeMaps.output[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }

  if (schema.type === 'object') {
    const selected = selectedAttrs[typeName] || {};
    const fields: GraphQLFieldConfigMap<unknown, unknown> = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const attrPath = [...path, key].join('.');
        if (selected[attrPath]) {
          let nestedTypeName = key;
          if (propSchema && hasRef(propSchema)) {
            nestedTypeName = getRefName(propSchema.$ref);
          }

          fields[key] = {
            type: mapToGraphQLOutputTypeInternal(propSchema, openApi, selectedAttrs, nestedTypeName, [...path, key], typeMaps)
          };
        }
      }
    }

    const gqlType = new GraphQLObjectType({ name, fields, description: schema.description });
    typeMaps.output[name] = gqlType;
    return gqlType;
  }

  if (schema.type === 'array') {
    let itemTypeName = typeName.replace(/s$/, '');
    if (hasRef(schema.items) && schema.items) {
      itemTypeName = getRefName(schema.items.$ref);
    }
    return new GraphQLList(
      buildObjectType(itemTypeName, schema.items || {}, openApi, selectedAttrs, itemTypeName, [...path, '0'], typeMaps) as GraphQLObjectType
    );
  }

  return new GraphQLObjectType({ name: name + '_Scalar', fields: {} });
}

export function buildInputType(
  name: string,
  schema: OpenAPISchema,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps
): GraphQLInputObjectType {
  if (!schema) {
    return new GraphQLInputObjectType({ name: name + '_Empty', fields: {} });
  }

  if (schema.$ref) {
    const refName = getRefName(schema.$ref) + 'Input';
    if (typeMaps.input[refName]) return typeMaps.input[refName];
    
    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) {
      return new GraphQLInputObjectType({ name: refName + '_Unresolved', fields: {} });
    }

    const gqlType = buildInputType(refName, resolved, openApi, typeMaps);
    typeMaps.input[refName] = gqlType;
    return gqlType;
  }

  if (schema.type === 'object') {
    const fields: Record<string, { type: GraphQLInputType }> = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        fields[key] = { 
          type: mapToGraphQLInputTypeInternal(propSchema, openApi, typeMaps, name + '_' + key) 
        };
      }
    }

    const gqlType = new GraphQLInputObjectType({ name, fields });
    typeMaps.input[name] = gqlType;
    return gqlType;
  }

  return new GraphQLInputObjectType({ name: name + '_ScalarInput', fields: {} });
}

function enrichSelectedAttrsForRef(
  selectedAttrs: SelectedAttributes,
  typeName: string,
  path: string[],
  refName: string
): SelectedAttributes {
  let nestedSelectedAttrs = selectedAttrs[refName];
  
  if (!nestedSelectedAttrs || Object.keys(nestedSelectedAttrs).length === 0) {
    const parentSelected = selectedAttrs[typeName] || {};
    const prefix = path.length > 0 ? path.join('.') + '.' : '';
    nestedSelectedAttrs = {};
    
    for (const attrPath in parentSelected) {
      if (attrPath.startsWith(prefix)) {
        const rest = attrPath.slice(prefix.length);
        if (rest && !rest.includes('.')) {
          nestedSelectedAttrs[rest] = true;
        } else if (rest) {
          const first = rest.split('.')[0];
          nestedSelectedAttrs[first] = true;
        }
      }
    }
  }

  return { ...selectedAttrs, [refName]: nestedSelectedAttrs };
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

  if (schema.$ref) {
    const refName = getRefName(schema.$ref);
    if (typeMaps.output[refName]) return typeMaps.output[refName];
    
    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) return GraphQLString;
    
    const gqlType = buildObjectType(refName, resolved, openApi, selectedAttrs, refName, [], typeMaps);
    typeMaps.output[refName] = gqlType as GraphQLObjectType;
    return gqlType;
  }

  switch (schema.type) {
    case 'object': {
      return buildObjectType(typeName, schema, openApi, selectedAttrs, typeName, path, typeMaps);
    }
    
    case 'array': {
      let itemTypeName = typeName.replace(/s$/, '');
      if (hasRef(schema.items) && schema.items) {
        itemTypeName = getRefName(schema.items.$ref);
      }
      return new GraphQLList(
        mapToGraphQLOutputTypeInternal(schema.items, openApi, selectedAttrs, itemTypeName, [...path, '0'], typeMaps)
      );
    }
    
    case 'string':
      return GraphQLString;
    case 'integer':
      return GraphQLInt;
    case 'number':
      return GraphQLFloat;
    case 'boolean':
      return GraphQLBoolean;
    default:
      return GraphQLString;
  }
}

function mapToGraphQLInputTypeInternal(
  schema: OpenAPISchema | undefined,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps,
  nameHint = 'Input'
): GraphQLInputType {
  if (!schema) return GraphQLString;

  if (schema.$ref) {
    const refName = getRefName(schema.$ref) + nameHint;
    if (typeMaps.input[refName]) return typeMaps.input[refName];
    
    const resolved = resolveRef(schema.$ref, openApi);
    if (!resolved) return GraphQLString;
    
    const gqlType = buildInputType(refName, resolved, openApi, typeMaps);
    typeMaps.input[refName] = gqlType;
    return gqlType;
  }

  switch (schema.type) {
    case 'object': {
      return buildInputType(nameHint, schema, openApi, typeMaps);
    }
    
    case 'array': {
      return new GraphQLList(
        mapToGraphQLInputTypeInternal(schema.items, openApi, typeMaps, nameHint + 'Item')
      );
    }
    
    case 'string':
      return GraphQLString;
    case 'integer':
      return GraphQLInt;
    case 'number':
      return GraphQLFloat;
    case 'boolean':
      return GraphQLBoolean;
    default:
      return GraphQLString;
  }
}