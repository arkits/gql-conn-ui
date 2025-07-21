import { GraphQLList, type GraphQLOutputType, type GraphQLInputType } from 'graphql';
import type { 
  OpenAPISpec, 
  OpenAPIOperation, 
  SelectedAttributes,
  OpenAPIResponse,
  OpenAPIMediaType,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPISchema
} from '../../types/openapi';
import type { TypeMaps, GraphQLOperationResult } from './types';
import { hasRef, getRefName, isSuccessResponse, generateOperationId } from './utils';
import { mapToGraphQLInputType, mapParameterToGraphQLInput } from './typeMapper';
import { buildObjectType } from './schemaBuilder';

export function processOperation(
  path: string,
  method: string,
  details: OpenAPIOperation,
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  typeMaps: TypeMaps
): GraphQLOperationResult | null {
  const operationId = details.operationId || generateOperationId(path, method);
  const description = details.summary || details.description || '';
  const responses = details.responses || {};
  const parameters = details.parameters || [];
  const requestBody = details.requestBody;

  const successEntry = Object.entries(responses).find(([code]) => isSuccessResponse(code));
  if (!successEntry) return null;

  const [code, resp] = successEntry;
  const respObj = resp as OpenAPIResponse;
  if (!respObj.content) return null;

  for (const [mediaType, content] of Object.entries(respObj.content)) {
    const contentObj = content as OpenAPIMediaType;
    if (!mediaType.includes('json') || !contentObj.schema) continue;

    const typeName = determineTypeName(contentObj.schema, operationId, code);
    const selected = selectedAttrs[typeName];
    
    if (!selected || Object.keys(selected).length === 0) continue;

    const gqlType = buildResponseType(contentObj.schema, typeName, openApi, selectedAttrs, typeMaps);
    const args = buildOperationArgs(parameters, requestBody, operationId, openApi, typeMaps);
    const operationDescription = description 
      ? `OpenAPI: ${method.toUpperCase()} ${path}\n${description}` 
      : `OpenAPI: ${method.toUpperCase()} ${path}`;

    return {
      operationId,
      gqlType,
      args,
      description: operationDescription,
      directive: {
        path,
        method: method.toUpperCase(),
        selection: Object.keys(selected)
      }
    };
  }

  return null;
}

function determineTypeName(schema: OpenAPISchema, operationId: string, code: string): string {
  if (schema.$ref) {
    return getRefName(schema.$ref);
  }
  if (operationId) {
    return operationId + '_' + code;
  }
  return 'Type_' + code;
}

function buildResponseType(
  schema: OpenAPISchema,
  typeName: string,
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  typeMaps: TypeMaps
): GraphQLOutputType {
  if (schema.type === 'array') {
    let itemTypeName = typeName.replace(/s$/, '');
    if (hasRef(schema.items) && schema.items) {
      itemTypeName = getRefName(schema.items.$ref);
    }
    // Normalize selectedAttrs for array item type: strip '0.' prefix from keys
    const parentSelected = selectedAttrs[typeName] || {};
    const itemSelectedAttrs: Record<string, boolean> = {};
    for (const key in parentSelected) {
      if (key.startsWith('0.')) {
        itemSelectedAttrs[key.slice(2)] = parentSelected[key];
      }
    }
    const normalizedSelectedAttrs = { ...selectedAttrs, [itemTypeName]: itemSelectedAttrs };
    return new GraphQLList(
      buildObjectType(itemTypeName, schema.items || {}, openApi, normalizedSelectedAttrs, itemTypeName, [], typeMaps) as GraphQLOutputType
    );
  }

  return buildObjectType(typeName, schema, openApi, selectedAttrs, typeName, [], typeMaps) as GraphQLOutputType;
}

function sanitizeGraphQLName(name: string): string {
  // GraphQL names must match /^[_a-zA-Z][_a-zA-Z0-9]*$/
  // Replace invalid characters with underscores and ensure it doesn't start with a digit
  let sanitized = name.replace(/[^_a-zA-Z0-9]/g, '_');
  if (/^[0-9]/.test(sanitized)) {
    sanitized = '_' + sanitized;
  }
  return sanitized;
}

function buildOperationArgs(
  parameters: OpenAPIParameter[],
  requestBody: OpenAPIRequestBody | undefined,
  operationId: string,
  openApi: OpenAPISpec,
  typeMaps: TypeMaps
): Record<string, { type: GraphQLInputType }> {
  const args: Record<string, { type: GraphQLInputType }> = {};

  // Handle parameters
  for (const param of parameters) {
    if (!param.name || !param.in) continue;
    const argName = sanitizeGraphQLName(param.name);
    args[argName] = {
      type: mapParameterToGraphQLInput(param, openApi, typeMaps, argName)
    };
  }

  // Handle JSON request body
  if (requestBody?.content?.['application/json']) {
    const reqSchema = requestBody.content['application/json'].schema;
    if (reqSchema) {
      let inputTypeName = operationId + 'Input';
      if (reqSchema.$ref) {
        inputTypeName = getRefName(reqSchema.$ref) + 'Input';
      }
      const inputType = mapToGraphQLInputType(reqSchema, openApi, typeMaps, inputTypeName);
      args['input'] = { type: inputType };
    }
  }

  return args;
}