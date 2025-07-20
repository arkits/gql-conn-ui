import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import type { GraphQLOutputType, GraphQLInputType } from 'graphql';

export interface TypeMaps {
  output: Record<string, GraphQLObjectType>;
  input: Record<string, GraphQLInputObjectType>;
}

export interface GraphQLOperationResult {
  operationId: string;
  gqlType: GraphQLOutputType;
  args: Record<string, { type: GraphQLInputType }>;
  description: string;
  directive: {
    path: string;
    method: string;
    selection: string[];
  };
}