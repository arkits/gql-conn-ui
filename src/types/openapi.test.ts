import { describe, it, expect } from 'vitest';
import type {
  OpenAPISpec,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  OpenAPIMediaType,
  OpenAPISchema,
  TreeNode,
  TreeMethod,
  SelectedAttributes,
  EndpointSelection,
  SelectedEndpoints,
  GraphQLDirective,
} from './openapi';

describe('openapi types', () => {
  describe('OpenAPISpec interface', () => {
    it('should allow creating OpenAPISpec with paths and components', () => {
      const spec: OpenAPISpec = {
        paths: {
          '/pets': {
            get: {
              operationId: 'getPets',
              summary: 'Get all pets',
              parameters: [],
              responses: {},
            },
          },
        },
        components: {
          schemas: {
            Pet: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      };

      expect(spec.paths?.['/pets']?.get?.operationId).toBe('getPets');
      expect(spec.components?.schemas?.Pet?.type).toBe('object');
    });

    it('should allow empty OpenAPISpec', () => {
      const spec: OpenAPISpec = {};

      expect(spec.paths).toBeUndefined();
      expect(spec.components).toBeUndefined();
    });
  });

  describe('OpenAPIOperation interface', () => {
    it('should allow creating OpenAPIOperation with all properties', () => {
      const operation: OpenAPIOperation = {
        operationId: 'getPets',
        summary: 'Get all pets',
        description: 'Retrieve all pets from the database',
        parameters: [],
        requestBody: {
          description: 'Pet data',
          required: true,
          content: {},
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {},
          },
        },
      };

      expect(operation.operationId).toBe('getPets');
      expect(operation.summary).toBe('Get all pets');
      expect(operation.description).toBe('Retrieve all pets from the database');
    });

    it('should allow partial OpenAPIOperation', () => {
      const operation: OpenAPIOperation = {
        summary: 'Get all pets',
      };

      expect(operation.summary).toBe('Get all pets');
      expect(operation.operationId).toBeUndefined();
    });
  });

  describe('OpenAPIParameter interface', () => {
    it('should allow creating OpenAPIParameter with all properties', () => {
      const parameter: OpenAPIParameter = {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Pet ID',
      };

      expect(parameter.name).toBe('id');
      expect(parameter.in).toBe('path');
      expect(parameter.required).toBe(true);
      expect(parameter.schema?.type).toBe('string');
      expect(parameter.description).toBe('Pet ID');
    });

    it('should allow different parameter locations', () => {
      const locations: Array<OpenAPIParameter['in']> = ['path', 'query', 'header', 'cookie'];

      locations.forEach(location => {
        const parameter: OpenAPIParameter = {
          name: 'test',
          in: location,
        };

        expect(parameter.in).toBe(location);
      });
    });
  });

  describe('OpenAPIRequestBody interface', () => {
    it('should allow creating OpenAPIRequestBody with all properties', () => {
      const requestBody: OpenAPIRequestBody = {
        description: 'Pet data',
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      };

      expect(requestBody.description).toBe('Pet data');
      expect(requestBody.required).toBe(true);
      expect(requestBody.content?.['application/json']?.schema?.type).toBe('object');
    });
  });

  describe('OpenAPIResponse interface', () => {
    it('should allow creating OpenAPIResponse with all properties', () => {
      const response: OpenAPIResponse = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      };

      expect(response.description).toBe('Successful response');
      expect(response.content?.['application/json']?.schema?.type).toBe('object');
    });
  });

  describe('OpenAPIMediaType interface', () => {
    it('should allow creating OpenAPIMediaType with schema', () => {
      const mediaType: OpenAPIMediaType = {
        schema: { type: 'object' },
      };

      expect(mediaType.schema?.type).toBe('object');
    });
  });

  describe('OpenAPISchema interface', () => {
    it('should allow creating OpenAPISchema with all properties', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
        items: { type: 'string' },
        $ref: '#/components/schemas/Pet',
        required: ['id'],
        description: 'Pet schema',
      };

      expect(schema.type).toBe('object');
      expect(schema.properties?.id?.type).toBe('string');
      expect(schema.items?.type).toBe('string');
      expect(schema.$ref).toBe('#/components/schemas/Pet');
      expect(schema.required).toEqual(['id']);
      expect(schema.description).toBe('Pet schema');
    });

    it('should allow different schema types', () => {
      const types: Array<OpenAPISchema['type']> = ['string', 'integer', 'number', 'boolean', 'array', 'object'];

      types.forEach(type => {
        const schema: OpenAPISchema = { type };

        expect(schema.type).toBe(type);
      });
    });
  });

  describe('TreeNode interface', () => {
    it('should allow creating TreeNode with methods', () => {
      const treeNode: TreeNode = {
        path: '/pets',
        methods: [
          {
            method: 'GET',
            details: {
              operationId: 'getPets',
              summary: 'Get all pets',
              parameters: [],
              responses: {},
            },
          },
        ],
      };

      expect(treeNode.path).toBe('/pets');
      expect(treeNode.methods).toHaveLength(1);
      expect(treeNode.methods[0].method).toBe('GET');
    });
  });

  describe('TreeMethod interface', () => {
    it('should allow creating TreeMethod with details', () => {
      const treeMethod: TreeMethod = {
        method: 'POST',
        details: {
          operationId: 'createPet',
          summary: 'Create a pet',
          parameters: [],
          responses: {},
        },
      };

      expect(treeMethod.method).toBe('POST');
      expect(treeMethod.details.operationId).toBe('createPet');
    });
  });

  describe('SelectedAttributes interface', () => {
    it('should allow creating SelectedAttributes with nested structure', () => {
      const selectedAttrs: SelectedAttributes = {
        Pet: {
          'id': true,
          'name': false,
          'age': true,
        },
        User: {
          'id': true,
          'email': true,
        },
      };

      expect(selectedAttrs.Pet?.['id']).toBe(true);
      expect(selectedAttrs.Pet?.['name']).toBe(false);
      expect(selectedAttrs.User?.['email']).toBe(true);
    });

    it('should allow empty SelectedAttributes', () => {
      const selectedAttrs: SelectedAttributes = {};

      expect(Object.keys(selectedAttrs)).toHaveLength(0);
    });
  });

  describe('EndpointSelection interface', () => {
    it('should allow creating EndpointSelection with all properties', () => {
      const endpointSelection: EndpointSelection = {
        path: '/pets/{id}',
        method: 'GET',
        typeName: 'Pet',
        selectedAttrs: {
          'id': true,
          'name': false,
        },
      };

      expect(endpointSelection.path).toBe('/pets/{id}');
      expect(endpointSelection.method).toBe('GET');
      expect(endpointSelection.typeName).toBe('Pet');
      expect(endpointSelection.selectedAttrs['id']).toBe(true);
    });
  });

  describe('SelectedEndpoints interface', () => {
    it('should allow creating SelectedEndpoints with multiple endpoints', () => {
      const selectedEndpoints: SelectedEndpoints = {
        'getPets': {
          path: '/pets',
          method: 'GET',
          typeName: 'Pet',
          selectedAttrs: { 'id': true },
        },
        'createPet': {
          path: '/pets',
          method: 'POST',
          typeName: 'Pet',
          selectedAttrs: { 'name': true },
        },
      };

      expect(selectedEndpoints['getPets']?.path).toBe('/pets');
      expect(selectedEndpoints['createPet']?.method).toBe('POST');
    });

    it('should allow empty SelectedEndpoints', () => {
      const selectedEndpoints: SelectedEndpoints = {};

      expect(Object.keys(selectedEndpoints)).toHaveLength(0);
    });
  });

  describe('GraphQLDirective interface', () => {
    it('should allow creating GraphQLDirective with all properties', () => {
      const directive: GraphQLDirective = {
        path: '/pets/{id}',
        method: 'GET',
        selection: ['id', 'name', 'age'],
      };

      expect(directive.path).toBe('/pets/{id}');
      expect(directive.method).toBe('GET');
      expect(directive.selection).toEqual(['id', 'name', 'age']);
    });

    it('should allow empty selection array', () => {
      const directive: GraphQLDirective = {
        path: '/pets',
        method: 'GET',
        selection: [],
      };

      expect(directive.selection).toEqual([]);
    });

    it('should allow different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        const directive: GraphQLDirective = {
          path: '/test',
          method,
          selection: [],
        };

        expect(directive.method).toBe(method);
      });
    });
  });
}); 