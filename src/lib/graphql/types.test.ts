import { describe, it, expect } from 'vitest';
import type { TypeMaps, GraphQLOperationResult } from './types';
import { GraphQLObjectType, GraphQLInputObjectType, GraphQLString } from 'graphql';

describe('types', () => {
  describe('TypeMaps interface', () => {
    it('should allow creating TypeMaps with proper structure', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {
          id: { type: GraphQLString },
        },
      });

      const mockInputType = new GraphQLInputObjectType({
        name: 'TestInput',
        fields: {
          id: { type: GraphQLString },
        },
      });

      const typeMaps: TypeMaps = {
        output: {
          TestObject: mockObjectType,
        },
        input: {
          TestInput: mockInputType,
        },
      };

      expect(typeMaps.output.TestObject).toBe(mockObjectType);
      expect(typeMaps.input.TestInput).toBe(mockInputType);
    });

    it('should allow empty TypeMaps', () => {
      const typeMaps: TypeMaps = {
        output: {},
        input: {},
      };

      expect(typeMaps.output).toEqual({});
      expect(typeMaps.input).toEqual({});
    });

    it('should allow multiple types in TypeMaps', () => {
      const mockObjectType1 = new GraphQLObjectType({
        name: 'TestObject1',
        fields: {},
      });

      const mockObjectType2 = new GraphQLObjectType({
        name: 'TestObject2',
        fields: {},
      });

      const typeMaps: TypeMaps = {
        output: {
          TestObject1: mockObjectType1,
          TestObject2: mockObjectType2,
        },
        input: {},
      };

      expect(typeMaps.output.TestObject1).toBe(mockObjectType1);
      expect(typeMaps.output.TestObject2).toBe(mockObjectType2);
    });
  });

  describe('GraphQLOperationResult interface', () => {
    it('should allow creating GraphQLOperationResult with proper structure', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {
          id: { type: GraphQLString },
        },
      });

      const mockInputType = new GraphQLInputObjectType({
        name: 'TestInput',
        fields: {
          id: { type: GraphQLString },
        },
      });

      const operationResult: GraphQLOperationResult = {
        operationId: 'testOperation',
        gqlType: mockObjectType,
        args: {
          id: { type: mockInputType },
        },
        description: 'Test operation',
        directive: {
          path: '/test',
          method: 'GET',
          selection: ['id', 'name'],
        },
      };

      expect(operationResult.operationId).toBe('testOperation');
      expect(operationResult.gqlType).toBe(mockObjectType);
      expect(operationResult.args.id.type).toBe(mockInputType);
      expect(operationResult.description).toBe('Test operation');
      expect(operationResult.directive.path).toBe('/test');
      expect(operationResult.directive.method).toBe('GET');
      expect(operationResult.directive.selection).toEqual(['id', 'name']);
    });

    it('should allow empty args in GraphQLOperationResult', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {},
      });

      const operationResult: GraphQLOperationResult = {
        operationId: 'testOperation',
        gqlType: mockObjectType,
        args: {},
        description: 'Test operation',
        directive: {
          path: '/test',
          method: 'GET',
          selection: [],
        },
      };

      expect(operationResult.args).toEqual({});
    });

    it('should allow multiple args in GraphQLOperationResult', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {},
      });

      const mockInputType1 = new GraphQLInputObjectType({
        name: 'TestInput1',
        fields: {},
      });

      const mockInputType2 = new GraphQLInputObjectType({
        name: 'TestInput2',
        fields: {},
      });

      const operationResult: GraphQLOperationResult = {
        operationId: 'testOperation',
        gqlType: mockObjectType,
        args: {
          arg1: { type: mockInputType1 },
          arg2: { type: mockInputType2 },
        },
        description: 'Test operation',
        directive: {
          path: '/test',
          method: 'GET',
          selection: ['arg1', 'arg2'],
        },
      };

      expect(operationResult.args.arg1.type).toBe(mockInputType1);
      expect(operationResult.args.arg2.type).toBe(mockInputType2);
    });

    it('should allow empty selection in directive', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {},
      });

      const operationResult: GraphQLOperationResult = {
        operationId: 'testOperation',
        gqlType: mockObjectType,
        args: {},
        description: 'Test operation',
        directive: {
          path: '/test',
          method: 'GET',
          selection: [],
        },
      };

      expect(operationResult.directive.selection).toEqual([]);
    });

    it('should allow different HTTP methods in directive', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {},
      });

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach(method => {
        const operationResult: GraphQLOperationResult = {
          operationId: `testOperation${method}`,
          gqlType: mockObjectType,
          args: {},
          description: 'Test operation',
          directive: {
            path: '/test',
            method,
            selection: [],
          },
        };

        expect(operationResult.directive.method).toBe(method);
      });
    });

    it('should allow complex paths in directive', () => {
      const mockObjectType = new GraphQLObjectType({
        name: 'TestObject',
        fields: {},
      });

      const complexPaths = [
        '/users/{id}',
        '/users/{id}/posts/{postId}',
        '/api/v1/users',
        '/',
      ];

      complexPaths.forEach(path => {
        const operationResult: GraphQLOperationResult = {
          operationId: 'testOperation',
          gqlType: mockObjectType,
          args: {},
          description: 'Test operation',
          directive: {
            path,
            method: 'GET',
            selection: [],
          },
        };

        expect(operationResult.directive.path).toBe(path);
      });
    });
  });
}); 