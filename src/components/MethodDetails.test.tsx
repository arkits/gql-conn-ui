import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MethodDetails } from './MethodDetails';
import type { OpenAPISpec, SelectedAttributes, OpenAPIOperation } from '../types/openapi';

// Mock the JsonWithCheckboxes component
vi.mock('./JsonWithCheckboxes', () => ({
  JsonWithCheckboxes: vi.fn(({ value, onToggle, darkMode }) => (
    <div data-testid="json-checkboxes">
      {JSON.stringify(value)}
      <button onClick={() => onToggle(['test', 'path'])}>Toggle Test</button>
      <span>{darkMode ? 'dark' : 'light'}</span>
    </div>
  ))
}));

describe('MethodDetails', () => {
  const mockOpenApi: OpenAPISpec = {
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' }
          }
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  };

  const mockOnAttrToggle = vi.fn();
  const mockOnSelectAllAttrs = vi.fn();

  beforeEach(() => {
    mockOnAttrToggle.mockClear();
    mockOnSelectAllAttrs.mockClear();
  });

  describe('ParameterList component', () => {
    it('should render parameters when present', () => {
      const details: OpenAPIOperation = {
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'User ID'
          },
          {
            name: 'filter',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter criteria'
          }
        ],
        responses: {}
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('Parameters:')).toBeInTheDocument();
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('path')).toBeInTheDocument();
      expect(screen.getByText('string')).toBeInTheDocument();
      expect(screen.getByText('User ID')).toBeInTheDocument();
      expect(screen.getByText('filter')).toBeInTheDocument();
      expect(screen.getByText('query')).toBeInTheDocument();
      expect(screen.getByText('Filter criteria')).toBeInTheDocument();
    });

    it('should not render parameters section when no parameters', () => {
      const details: OpenAPIOperation = {
        responses: {}
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.queryByText('Parameters:')).not.toBeInTheDocument();
    });
  });

  describe('RequestBodySection component', () => {
    it('should render request body when present', () => {
      const details: OpenAPIOperation = {
        requestBody: {
          description: 'User creation data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' }
            }
          }
        },
        responses: {}
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('Request Body:')).toBeInTheDocument();
      expect(screen.getByText('User creation data')).toBeInTheDocument();
      expect(screen.getByTestId('json-checkboxes')).toBeInTheDocument();
    });

    it('should show default description when none provided', () => {
      const details: OpenAPIOperation = {
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } }
            }
          }
        },
        responses: {}
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('should not render request body section when not present', () => {
      const details: OpenAPIOperation = {
        responses: {}
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.queryByText('Request Body:')).not.toBeInTheDocument();
    });
  });

  describe('Response section', () => {
    it('should render successful responses', () => {
      const details: OpenAPIOperation = {
        operationId: 'getUser',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '404': {
            description: 'Not found'
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('Responses:')).toBeInTheDocument();
      expect(screen.getByTestId('json-checkboxes')).toBeInTheDocument();
    });

    it('should filter out non-2xx responses', () => {
      const details: OpenAPIOperation = {
        responses: {
          '400': {
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          '500': {
            description: 'Server error'
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.queryByText('Responses:')).not.toBeInTheDocument();
    });

    it('should not render responses section when no successful responses', () => {
      const details: OpenAPIOperation = {
        responses: {}
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.queryByText('Responses:')).not.toBeInTheDocument();
    });
  });

  describe('SelectAllButton component', () => {
    it('should show "Select All" when no attributes are selected', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('Select All')).toBeInTheDocument();
    });

    it('should show "Deselect All" when all attributes are selected', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      };

      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: true
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={selectedAttrs}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('should call onSelectAllAttrs when clicked', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectAllAttrs).toHaveBeenCalledWith('User', { id: 'string', name: 'string' });
    });
  });

  describe('Dark mode styling', () => {
    it('should apply dark mode styles', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={true}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('dark')).toBeInTheDocument();
    });

    it('should apply light mode styles', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByText('light')).toBeInTheDocument();
    });
  });

  describe('Type name determination', () => {
    it('should use $ref name when available', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectAllAttrs).toHaveBeenCalledWith('User', expect.any(Object));
    });

    it('should use operationId + status code when no $ref', () => {
      const details: OpenAPIOperation = {
        operationId: 'getCustomData',
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { data: { type: 'string' } }
                }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectAllAttrs).toHaveBeenCalledWith('getCustomData_200', expect.any(Object));
    });

    it('should use fallback type name when no operationId or $ref', () => {
      const details: OpenAPIOperation = {
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { type: 'string' } }
                }
              }
            }
          }
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={false}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={{}}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      const selectAllButton = screen.getByText('Select All');
      fireEvent.click(selectAllButton);

      expect(mockOnSelectAllAttrs).toHaveBeenCalledWith('Type_201', expect.any(Object));
    });
  });

  describe('JsonWithCheckboxes integration', () => {
    it('should pass correct props to JsonWithCheckboxes', () => {
      const details: OpenAPIOperation = {
        responses: {
          '200': {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      };

      const selectedAttrs: SelectedAttributes = {
        User: {
          id: true,
          name: false
        }
      };

      render(<TestWrapper>
        <MethodDetails
          details={details}
          openApi={mockOpenApi}
          darkMode={true}
          onAttrToggle={mockOnAttrToggle}
          selectedAttrs={selectedAttrs}
          onSelectAllAttrs={mockOnSelectAllAttrs}
        /></TestWrapper>
      );

      expect(screen.getByTestId('json-checkboxes')).toBeInTheDocument();
      expect(screen.getByText('dark')).toBeInTheDocument();

      // Test onToggle callback
      const toggleButton = screen.getByText('Toggle Test');
      fireEvent.click(toggleButton);

      expect(mockOnAttrToggle).toHaveBeenCalledWith('User', ['test', 'path']);
    });
  });
});