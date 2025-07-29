import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { TestWrapper } from "./test/TestWrapper";

// Mock the Monaco editor
vi.mock("@monaco-editor/react", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="monaco-editor">{value}</div>
  ),
}));

// Mock the hooks
vi.mock("./hooks/useFileUpload", () => ({
  useFileUpload: vi.fn(() => ({
    openApi: null,
    openApiTree: [],
    handleFileUpload: vi.fn(),
  })),
}));

vi.mock("./hooks/useSelection", () => ({
  useSelection: vi.fn(() => ({
    selectedAttrs: {},
    selectedEndpoints: {},
    handleAttrToggle: vi.fn(),
    handleSelectAllAttrs: vi.fn(),
    clearSelection: vi.fn(),
  })),
}));

vi.mock("./hooks/useGraphQLGeneration", () => ({
  useGraphQLGeneration: vi.fn(() => ({
    graphqlSchema: "# GraphQL schema will appear here",
    appConfigYaml: "# App config YAML will appear here",
  })),
}));

vi.mock("./hooks/useSettings", () => ({
  useSettings: vi.fn(() => ({
    isDrawerOpen: false,
    setIsDrawerOpen: vi.fn(),
  })),
}));

vi.mock("react-dropzone", () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

// Mock the components
vi.mock("./components/TreeView", () => ({
  TreeView: ({ tree }: { tree: unknown[] }) => (
    <div data-testid="tree-view">
      {tree.length > 0 ? "Tree content" : "No tree content"}
    </div>
  ),
}));

vi.mock("./components/Clipboard", () => ({
  Clipboard: () => <div data-testid="clipboard" />,
}));

vi.mock("./components/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("./components/SideDrawer", () => ({
  SideDrawer: ({ isOpen }: { isOpen: boolean }) => (
    <div
      data-testid="side-drawer"
      style={{ display: isOpen ? "block" : "none" }}
    >
      Side Drawer
    </div>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the main application", async () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/OpenAPI.*GraphQL Converter/)
      ).toBeInTheDocument();
      expect(screen.getAllByText("GraphQL Schema")).toHaveLength(2);
      expect(screen.getAllByText("App Config YAML")).toHaveLength(2);
    });
  });
});