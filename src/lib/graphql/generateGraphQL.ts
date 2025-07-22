import {
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
  type GraphQLFieldConfigMap
} from 'graphql';
import type { OpenAPISpec, SelectedAttributes, SelectedEndpoints } from '../../types/openapi';
import type { TypeMaps } from './types';
import { processOperation } from './operationProcessor';

export function generateGraphQLSchemaFromSelections(
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes,
  selectedEndpoints: SelectedEndpoints = {},
  requiredScopes: string[][] = [["test"]]
): string {
  if (!openApi) return '';
  
  const typeMaps: TypeMaps = {
    output: {},
    input: {}
  };

  const queryFields: GraphQLFieldConfigMap<unknown, unknown> = {};
  const queryDirectives: Record<string, { path: string; method: string; selection: string[] }> = {};

  // Process only selected operations
  for (const [, endpointSelection] of Object.entries(selectedEndpoints)) {
    const { path, method } = endpointSelection;
    
    // Find the operation in the OpenAPI spec
    const methods = openApi.paths?.[path];
    if (!methods) continue;
    
    const details = methods[method.toLowerCase()];
    if (!details) continue;

    const result = processOperation(path, method.toLowerCase(), details, openApi, selectedAttrs, typeMaps);
    
    if (result) {
      queryFields[result.operationId] = {
        type: result.gqlType,
        args: result.args,
        resolve: () => ({}), // dummy resolver for SDL
        description: result.description
      };
      
      queryDirectives[result.operationId] = result.directive;
    }
  }

  if (Object.keys(queryFields).length === 0) {
    return '# GraphQL schema will appear here\n';
  }

  const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: queryFields
  });

  const schema = new GraphQLSchema({
    query: QueryType
  });

  return generateSchemaWithDirectives(schema, [], queryDirectives, requiredScopes, openApi);
}

function generateSchemaWithDirectives(
  schema: GraphQLSchema,
  _comments: string[], // unused now
  queryDirectives: Record<string, { path: string; method: string; selection: string[] }>,
  requiredScopes: string[][],
  openApi: OpenAPISpec
): string {
  let sdl = printSchema(schema);

  // Add type comments with OpenAPI type names and descriptions
  sdl = sdl.replace(/(type\s+(\w+)\s*(?:@\w+[^{]*)?\{)/g, (match, typeDef, typeName) => {
    if (typeName === 'Query') return match;
    
    // Look up the type in the OpenAPI schema
    const schema = openApi?.components?.schemas?.[typeName];
    if (schema && schema.description) {
      const comment = `# ${typeName}: ${schema.description}\n`;
      return comment + match;
    }
    
    return match;
  });

  // Inject directives into query fields (only @dataSource)
  sdl = sdl.replace(/(type Query \{[\s\S]*?\n\})/, (match) => {
    return match.replace(/^(\s*)(\w+)(\([^)]*\))?\s*:\s*([^!\n]+!?)/gm, (line, indent, field, args, type) => {
      if (queryDirectives[field]) {
        const { path, method, selection } = queryDirectives[field];
        const selectionArr = '[' + selection.map(s => `"${s}"`).join(', ') + ']';
        return `${indent}${field}${args || ''}: ${type} @dataSource(path: "${path}", method: "${method}", selection: ${selectionArr})`;
      }
      return line;
    });
  });

  // Apply @requiredScopes directive to type definitions
  // Find all type definitions and add the directive
  sdl = sdl.replace(/(type\s+(\w+)\s*\{)/g, (match, _typeDef, typeName) => {
    // Skip the Query type
    if (typeName === 'Query') {
      return match;
    }
    
    // Add @requiredScopes directive with default scopes
    const defaultScopes = '[' + requiredScopes.map(scope => `[${scope.map(s => `"${s}"`).join(', ')}]`).join(', ') + ']';
    return `type ${typeName} @requiredScopes(scopes: ${defaultScopes}) {`;
  });

  // Add the directive definitions at the bottom of the schema
  const directiveDefs = [];
  
  // Add the @dataSource directive definition
  const directiveDef = 'directive @dataSource(path: String!, method: String!, selection: [String!]!) on FIELD_DEFINITION';
  if (!sdl.includes('directive @dataSource')) {
    directiveDefs.push(directiveDef);
  }

  // Add the @requiredScopes directive definition
  const requiredScopesDef = 'directive @requiredScopes(scopes: [[String!]!]!) on OBJECT';
  if (!sdl.includes('directive @requiredScopes')) {
    directiveDefs.push(requiredScopesDef);
  }

  // Append directive definitions to the end of the schema
  if (directiveDefs.length > 0) {
    sdl += '\n\n' + directiveDefs.join('\n');
  }

  return sdl;
}