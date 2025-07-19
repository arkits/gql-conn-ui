# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application that converts OpenAPI specifications to GraphQL schemas with a visual interface. The app allows users to upload OpenAPI/Swagger files (JSON/YAML) and interactively select which attributes to include in the generated GraphQL schema and application configuration.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Components
- **App.tsx**: Main application with file upload, dark mode toggle, and tabbed interface
- **TreeView.tsx**: Renders expandable tree view of OpenAPI endpoints and methods
- **MethodDetails.tsx**: Shows detailed view of HTTP methods with selectable attributes
- **JsonWithCheckboxes.tsx**: Interactive JSON viewer with checkboxes for attribute selection

### Key Libraries
- **GraphQL Generation**: Uses `graphql` library for schema building and SDL generation
- **UI Framework**: Chakra UI v3 with Emotion for styling
- **Code Editor**: Monaco Editor for GraphQL schema and YAML display
- **File Processing**: `js-yaml` for YAML parsing, `openapi-typescript` for OpenAPI handling

### Core Logic Files

#### src/lib/graphql/generateGraphQL.ts
Complex GraphQL schema generation logic that:
- Converts OpenAPI schemas to GraphQL types with proper type mapping
- Handles nested object references and array types
- Processes selected attributes to build filtered GraphQL schemas
- Generates SDL with custom `@dataSource` directives containing HTTP metadata
- Manages type caching to prevent infinite recursion

#### src/lib/appConfig/configGenerator.ts
Generates application configuration YAML from OpenAPI specs and selections:
- Maps selected endpoints to configuration entries
- Extracts HTTP method, URL templates, and path parameters
- Groups endpoints by API tags for organization

### Data Flow
1. User uploads OpenAPI spec (JSON/YAML)
2. File is parsed and converted to tree structure
3. TreeView displays endpoints → methods → response schemas
4. User selects attributes via checkboxes in MethodDetails
5. Selection state triggers regeneration of GraphQL schema and app config
6. Results displayed in Monaco editors with syntax highlighting

### State Management
- React useState for component-local state
- Props drilling for shared state between components
- selectedAttrs structure: `Record<string, Record<string, boolean>>` where keys are type names and attribute paths

### Type Handling
The GraphQL generator handles complex nested structures:
- Object references via `$ref`
- Array types with proper item type resolution
- Nested attribute selection with dot notation paths
- Type enrichment for referenced schemas

## Sample Files
- `samples/` directory contains example OpenAPI specs for testing:
  - `oas.json` - OpenAPI 3.0 spec
  - `petstore.yaml` - Classic Petstore example
  - `tictactoe.json` - Simple game API

## Development Notes

### TypeScript Configuration
- Uses composite TypeScript configuration with separate app and node configs
- Strict type checking enabled with modern ES modules

### Vite Configuration
- Uses SWC plugin for fast React builds
- Standard Vite development server setup

### Known Complexity Areas
- GraphQL type resolution with circular references requires careful caching
- OpenAPI schema traversal with deep nesting needs robust path handling
- Attribute selection state synchronization across multiple components