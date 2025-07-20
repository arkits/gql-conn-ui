import {
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  type GraphQLInputType,
  type GraphQLOutputType
} from 'graphql';
import type { OpenAPISchema, OpenAPISpec, SelectedAttributes } from '../../types/openapi';
import type { TypeMaps } from './types';
import { hasRef, resolveRef, getRefName } from './utils';
import { buildObjectType, buildInputType } from './schemaBuilder';

export function mapToGraphQLOutputType(
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
        mapToGraphQLOutputType(schema.items, openApi, selectedAttrs, itemTypeName, [...path, '0'], typeMaps)
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

export function mapToGraphQLInputType(
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
        mapToGraphQLInputType(schema.items, openApi, typeMaps, nameHint + 'Item')
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

export function mapParameterToGraphQLInput(
  parameter: { schema?: OpenAPISchema; required?: boolean },
  openApi: OpenAPISpec,
  typeMaps: TypeMaps,
  paramName: string
): GraphQLInputType {
  let gqlType: GraphQLInputType = GraphQLString;
  
  if (parameter.schema) {
    gqlType = mapToGraphQLInputType(parameter.schema, openApi, typeMaps, paramName + 'Input');
  }
  
  if (parameter.required) {
    gqlType = new GraphQLNonNull(gqlType);
  }
  
  return gqlType;
}