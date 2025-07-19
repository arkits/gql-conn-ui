import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql';

export interface TypeMaps {
  output: Record<string, GraphQLObjectType>;
  input: Record<string, GraphQLInputObjectType>;
}

export interface GraphQLOperationResult {
  operationId: string;
  gqlType: any;
  args: Record<string, { type: any }>;
  description: string;
  directive: {
    path: string;
    method: string;
    selection: string[];
  };
}