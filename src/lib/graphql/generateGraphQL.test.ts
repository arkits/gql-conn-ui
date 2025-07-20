import { describe, it, expect } from 'vitest';
import { generateGraphQLSchemaFromSelections } from './generateGraphQL';
import type { OpenAPISpec, SelectedAttributes, SelectedEndpoints } from '../../types/openapi';

describe('generateGraphQLSchemaFromSelections', () => {
  it('should only generate queries for selected endpoints', () => {
    const mockOpenApi: OpenAPISpec = {
      paths: {
        '/store/order': {
          post: {
            operationId: 'placeOrder',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            }
          }
        },
        '/store/order/{orderId}': {
          get: {
            operationId: 'getOrderById',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Order: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              petId: { type: 'integer' },
              quantity: { type: 'integer' },
              status: { type: 'string' }
            }
          }
        }
      }
    };

    const selectedAttrs: SelectedAttributes = {
      Order: {
        id: true,
        petId: true
      }
    };

    // Only select the GET endpoint
    const selectedEndpoints: SelectedEndpoints = {
      'GET_/store/order/{orderId}': {
        path: '/store/order/{orderId}',
        method: 'GET',
        typeName: 'Order',
        selectedAttrs: {
          id: true,
          petId: true
        }
      }
    };

    const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs, selectedEndpoints);

    // Should only contain the GET endpoint query, not the POST
    expect(result).toContain('getOrderById');
    expect(result).not.toContain('placeOrder');
    expect(result).toContain('@dataSource(path: "/store/order/{orderId}", method: "GET"');
  });

  it('should return empty schema when no endpoints are selected', () => {
    const mockOpenApi: OpenAPISpec = {
      paths: {
        '/store/order': {
          post: {
            operationId: 'placeOrder',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Order: {
            type: 'object',
            properties: {
              id: { type: 'integer' }
            }
          }
        }
      }
    };

    const selectedAttrs: SelectedAttributes = {
      Order: {
        id: true
      }
    };

    const selectedEndpoints: SelectedEndpoints = {};

    const result = generateGraphQLSchemaFromSelections(mockOpenApi, selectedAttrs, selectedEndpoints);

    expect(result).toBe('# GraphQL schema will appear here\n');
  });
});