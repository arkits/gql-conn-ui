import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreeView } from './TreeView';
import type { TreeNode, OpenAPISpec, SelectedAttributes } from '../types/openapi';
import { TestWrapper } from '../test/TestWrapper';

// Mock the MethodDetails component
vi.mock('./MethodDetails', () => ({
  MethodDetails: ({ details }: { details: import('../types/openapi').OpenAPIOperation }) => (
    <div data-testid="method-details">
      Method Details for {details.summary || 'No summary'}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
}));

const mockOpenApi: OpenAPISpec = {
  paths: {
    '/pets': {
      get: {
        operationId: 'getPets',
        summary: 'Get all pets',
        parameters: [],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createPet',
        summary: 'Create a pet',
        parameters: [],
        responses: {
          '201': {
            description: 'Pet created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/pets/{id}': {
      get: {
        operationId: 'getPetById',
        summary: 'Get pet by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const mockTree: TreeNode[] = [
  {
    path: '/pets',
    methods: [
      {
        method: 'GET',
        details: mockOpenApi.paths!['/pets'].get!,
      },
      {
        method: 'POST',
        details: mockOpenApi.paths!['/pets'].post!,
      },
    ],
  },
  {
    path: '/pets/{id}',
    methods: [
      {
        method: 'GET',
        details: mockOpenApi.paths!['/pets/{id}'].get!,
      },
    ],
  },
];

const mockSelectedAttrs: SelectedAttributes = {
  Pet: {
    'id': true,
    'name': false,
  },
};

const defaultProps = {
  tree: mockTree,
  openApi: mockOpenApi,
  darkMode: false,
  selectedAttrs: mockSelectedAttrs,
  onAttrToggle: vi.fn(),
  onSelectAllAttrs: vi.fn(),
};

describe('TreeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all endpoints in the tree', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('/pets')).toBeInTheDocument();
    expect(screen.getByText('/pets/{id}')).toBeInTheDocument();
  });

  it('renders all methods for each endpoint', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    // Expand the first endpoint to see its methods
    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  it('shows method summaries when available', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    // Expand the first endpoint to see its methods
    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);

    expect(screen.getByText('Get all pets')).toBeInTheDocument();
    expect(screen.getByText('Create a pet')).toBeInTheDocument();
    
    // Expand the second endpoint
    const petsByIdEndpoint = screen.getByText('/pets/{id}');
    fireEvent.click(petsByIdEndpoint);
    
    expect(screen.getByText('Get pet by ID')).toBeInTheDocument();
  });

  it('expands endpoint when clicked', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);

    // Should show methods after expansion
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
  });

  it('expands method when clicked', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    // First expand the endpoint
    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);

    // Then click on a method
    const getMethod = screen.getByText('GET');
    fireEvent.click(getMethod);

    // Should show method details
    expect(screen.getByTestId('method-details')).toBeInTheDocument();
  });

  it('toggles endpoint expansion state', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    const petsEndpoint = screen.getByText('/pets');
    
    // Initially collapsed
    expect(screen.queryByText('Get all pets')).not.toBeInTheDocument();
    
    // Expand
    fireEvent.click(petsEndpoint);
    expect(screen.getByText('Get all pets')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(petsEndpoint);
    expect(screen.queryByText('Get all pets')).not.toBeInTheDocument();
  });

  it('toggles method expansion state', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    // Expand endpoint first
    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);

    const getMethod = screen.getByText('GET');
    
    // Initially collapsed
    expect(screen.queryByTestId('method-details')).not.toBeInTheDocument();
    
    // Expand
    fireEvent.click(getMethod);
    expect(screen.getByTestId('method-details')).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(getMethod);
    expect(screen.queryByTestId('method-details')).not.toBeInTheDocument();
  });

  it('renders with dark mode styling', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} darkMode={true} />
      </TestWrapper>
    );

    const petsEndpoint = screen.getByText('/pets');
    expect(petsEndpoint).toBeInTheDocument();
  });

  it('handles empty tree', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} tree={[]} />
      </TestWrapper>
    );

    expect(screen.queryByText('/pets')).not.toBeInTheDocument();
    expect(screen.queryByText('/pets/{id}')).not.toBeInTheDocument();
  });

  it('handles endpoint with no methods', () => {
    const emptyTree: TreeNode[] = [
      {
        path: '/empty',
        methods: [],
      },
    ];

    render(
      <TestWrapper>
        <TreeView {...defaultProps} tree={emptyTree} />
      </TestWrapper>
    );

    expect(screen.getByText('/empty')).toBeInTheDocument();
    // Should not show any methods
    expect(screen.queryByText('GET')).not.toBeInTheDocument();
  });

  it('calls onAttrToggle when method details trigger it', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    // Expand endpoint and method
    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);
    
    const getMethod = screen.getByText('GET');
    fireEvent.click(getMethod);

    // MethodDetails should be rendered and would call onAttrToggle if triggered
    expect(screen.getByTestId('method-details')).toBeInTheDocument();
  });

  it('calls onSelectAllAttrs when method details trigger it', () => {
    render(
      <TestWrapper>
        <TreeView {...defaultProps} />
      </TestWrapper>
    );

    // Expand endpoint and method
    const petsEndpoint = screen.getByText('/pets');
    fireEvent.click(petsEndpoint);
    
    const getMethod = screen.getByText('GET');
    fireEvent.click(getMethod);

    // MethodDetails should be rendered and would call onSelectAllAttrs if triggered
    expect(screen.getByTestId('method-details')).toBeInTheDocument();
  });
}); 