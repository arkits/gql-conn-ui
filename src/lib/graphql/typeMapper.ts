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
import { hasRef, resolveRef, getRefName, capitalizeTypeName, singularizeAndCapitalize } from './utils';
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
      let itemTypeName = singularizeAndCapitalize(typeName);
      const items = schema.items || {};
      const itemsWithMeta = items as { $ref?: string; $$ref?: string; xml?: { name?: string } };
      // If $$ref, resolve the referenced schema and use its xml.name if present
      if (itemsWithMeta.$$ref && typeof itemsWithMeta.$$ref === 'string') {
        const match = itemsWithMeta.$$ref.match(/\/components\/schemas\/([^/]+)/);
        if (match) {
          const refName = match[1];
          const refSchema = openApi.components?.schemas?.[refName] as OpenAPISchema & { xml?: { name?: string } };
          if (refSchema && refSchema.xml && typeof refSchema.xml.name === 'string') {
            itemTypeName = capitalizeTypeName(refSchema.xml.name);
          } else {
            itemTypeName = refName;
          }
        }
      } else if (itemsWithMeta.xml && typeof itemsWithMeta.xml.name === 'string') {
        itemTypeName = capitalizeTypeName(itemsWithMeta.xml.name);
      } else if (hasRef(items)) {
        itemTypeName = getRefName(itemsWithMeta.$ref!);
      }
      // Ensure the type is registered in typeMaps/output with the correct name
      const gqlType = mapToGraphQLOutputType(items, openApi, selectedAttrs, itemTypeName, [...path, '0'], typeMaps);
      if (gqlType instanceof GraphQLObjectType && !typeMaps.output[itemTypeName]) {
        typeMaps.output[itemTypeName] = gqlType;
      }
      return new GraphQLList(gqlType);
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