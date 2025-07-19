import {
  GraphQLObjectType,
  GraphQLSchema,
  printSchema,
  type GraphQLFieldConfigMap
} from 'graphql';
import type { OpenAPISpec, SelectedAttributes } from '../../types/openapi';
import type { TypeMaps } from './types';
import { enrichSelectedAttributes } from './selectionEnricher';
import { processOperation } from './operationProcessor';

export function generateGraphQLSchemaFromSelections(
  openApi: OpenAPISpec,
  selectedAttrs: SelectedAttributes
): string {
  if (!openApi) return '';

  const enrichedAttrs = enrichSelectedAttributes(selectedAttrs, openApi);
  
  const typeMaps: TypeMaps = {
    output: {},
    input: {}
  };

  const queryFields: GraphQLFieldConfigMap<any, any> = {};
  const comments: string[] = [];
  const queryDirectives: Record<string, { path: string; method: string; selection: string[] }> = {};

  // Process all operations
  for (const [path, methods] of Object.entries(openApi.paths || {})) {
    for (const [method, details] of Object.entries(methods as any)) {
      const result = processOperation(path, method, details as any, openApi, enrichedAttrs, typeMaps);
      
      if (result) {
        queryFields[result.operationId] = {
          type: result.gqlType,
          args: result.args,
          resolve: () => ({}), // dummy resolver for SDL
          description: result.description
        };
        
        const operationDetails = details as any;
        comments.push(`# OpenAPI: ${result.directive.method} ${result.directive.path}\n# ${operationDetails.summary || operationDetails.description || ''}`);
        queryDirectives[result.operationId] = result.directive;
      }
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

  return generateSchemaWithDirectives(schema, comments, queryDirectives);
}

function generateSchemaWithDirectives(
  schema: GraphQLSchema,
  comments: string[],
  queryDirectives: Record<string, { path: string; method: string; selection: string[] }>
): string {
  let sdl = printSchema(schema);

  // Add comments at the top
  if (comments.length > 0) {
    sdl = comments.join('\n') + '\n' + sdl;
  }

  // Add the @dataSource directive definition
  const directiveDef = 'directive @dataSource(path: String!, method: String!, selection: [String!]!) on FIELD_DEFINITION';
  if (!sdl.includes('directive @dataSource')) {
    sdl = directiveDef + '\n\n' + sdl;
  }

  // Inject directives into query fields
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

  return sdl;
}