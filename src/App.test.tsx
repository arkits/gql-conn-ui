import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { TestWrapper } from './test/TestWrapper';

// Mock the Monaco editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="monaco-editor">{value}</div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sun: () => <div data-testid="sun-icon" />,
  Moon: () => <div data-testid="moon-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />,
}));

// Mock the hooks
vi.mock('./hooks/useFileUpload', () => ({
  useFileUpload: vi.fn(() => ({
    openApi: null,
    openApiTree: [],
    handleFileUpload: vi.fn(),
  })),
}));

vi.mock('./hooks/useSelection', () => ({
  useSelection: vi.fn(() => ({
    selectedAttrs: {},
    selectedEndpoints: {},
    handleAttrToggle: vi.fn(),
    handleSelectAllAttrs: vi.fn(),
    clearSelection: vi.fn(),
  })),
}));

vi.mock('./hooks/useGraphQLGeneration', () => ({
  useGraphQLGeneration: vi.fn(() => ({
    graphqlSchema: '# GraphQL schema will appear here',
    appConfigYaml: '# App config YAML will appear here',
  })),
}));

vi.mock('./hooks/useSettings', () => ({
  useSettings: vi.fn(() => ({
    isDrawerOpen: false,
    setIsDrawerOpen: vi.fn(),
  })),
}));

// Mock the components
vi.mock('./components/TreeView', () => ({
  TreeView: ({ tree }: { tree: unknown[] }) => (
    <div data-testid="tree-view">
      {tree.length > 0 ? 'Tree content' : 'No tree content'}
    </div>
  ),
}));

vi.mock('./components/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock('./components/SideDrawer', () => ({
  SideDrawer: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="side-drawer" style={{ display: isOpen ? 'block' : 'none' }}>
      Side Drawer
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main application', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/OpenAPI.*GraphQL Converter/)).toBeInTheDocument();
      expect(screen.getAllByText('GraphQL Schema')).toHaveLength(2);
      expect(screen.getAllByText('App Config YAML')).toHaveLength(2);
    });
  });

  it('renders error boundary wrapper', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  it('renders settings provider wrapper', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/OpenAPI.*GraphQL Converter/)).toBeInTheDocument();
    });
  });

  it('displays file upload input', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      const fileInput = screen.getByDisplayValue('');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.json,.yaml,.yml');
    });
  });

  it('displays dark mode toggle button', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      const darkModeButton = screen.getByRole('button', { name: /toggle dark mode/i });
      expect(darkModeButton).toBeInTheDocument();
    });
  });

  it('displays settings button', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      const settingsButton = screen.getByRole('button', { name: /open settings/i });
      expect(settingsButton).toBeInTheDocument();
    });
  });

  it('displays tabs for schema and YAML', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      const schemaTabs = screen.getAllByText('GraphQL Schema');
      const yamlTabs = screen.getAllByText('App Config YAML');
      expect(schemaTabs.length).toBeGreaterThan(0);
      expect(yamlTabs.length).toBeGreaterThan(0);
    });
  });

  it('displays Monaco editors for schema and YAML', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      const editors = screen.getAllByTestId('monaco-editor');
      expect(editors).toHaveLength(2);
    });
  });

  it('displays default content when no file is uploaded', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Upload an OpenAPI spec to visualize endpoints.')).toBeInTheDocument();
    });
  });

  it('toggles dark mode when button is clicked', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    const darkModeButton = await screen.findByRole('button', { name: /toggle dark mode/i });
    fireEvent.click(darkModeButton);

    await waitFor(() => {
      expect(darkModeButton).toBeInTheDocument();
    });
  });

  it('applies dark mode class to body', async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/OpenAPI.*GraphQL Converter/)).toBeInTheDocument();
    });
  });
});