import React, { useState, useEffect } from "react";
import { Box, Flex, Heading, HStack, Input, IconButton } from "@chakra-ui/react";
import { Sun, Moon } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { TreeView } from "./components/TreeView";
import { generateGraphQLSchemaFromSelections } from "./graphql/generateGraphQL";

// ErrorBoundary component (keep as is)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {}
  render() {
    if (this.state.hasError) {
      return (
        <Box p={6} color="red.500" bg="red.50">
          <b>Something went wrong:</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </Box>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const [openApi, setOpenApi] = useState<any>(null);
  const [openApiTree, setOpenApiTree] = useState<any[]>([]);
  const [graphqlSchema, setGraphqlSchema] = useState<string>("# GraphQL schema will appear here\n");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, Record<string, boolean>>>({});

  // Handler for toggling attribute selection
  const handleAttrToggle = (typeName: string, path: string[]) => {
    setSelectedAttrs(prev => {
      const typeAttrs = { ...(prev[typeName] || {}) };
      const key = path.join('.');
      typeAttrs[key] = !typeAttrs[key];
      return { ...prev, [typeName]: typeAttrs };
    });
  };

  useEffect(() => {
    if (openApi && Object.keys(selectedAttrs).some(typeName => Object.keys(selectedAttrs[typeName] || {}).length > 0)) {
      setGraphqlSchema(generateGraphQLSchemaFromSelections(openApi, selectedAttrs));
    } else {
      setGraphqlSchema('# GraphQL schema will appear here\n');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttrs, openApi]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      alert("Invalid JSON file");
      return;
    }
    setOpenApi(json);
    setOpenApiTree(parseOpenApiToTree(json));
    setSelectedAttrs({});
  };

  // Helper to parse OpenAPI and build a tree structure
  function parseOpenApiToTree(openApi: any) {
    if (!openApi?.paths) return [];
    return Object.entries(openApi.paths).map(([path, methods]: any) => ({
      path,
      methods: Object.entries(methods).map(([method, details]: any) => ({
        method: method.toUpperCase(),
        details,
      })),
    }));
  }

  return (
    <ErrorBoundary>
      <Flex direction="column" minH="100vh" minW="0" w="100vw" h="100vh" className={darkMode ? "dark" : "light"}>
        {/* Header */}
        <Flex as="header" align="center" justify="space-between" px={6} py={4} bg={darkMode ? 'gray.800' : 'white'} boxShadow="sm">
          <HStack gap={4}>
            <Heading size="md" color="teal.500">OpenAPI → GraphQL Converter</Heading>
            <Input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} size="sm" w="auto" />
          </HStack>
          <IconButton
            aria-label="Toggle dark mode"
            onClick={() => setDarkMode((d) => !d)}
            variant="ghost"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </IconButton>
        </Flex>
        {/* Main Content */}
        <Flex flex="1" overflow="hidden">
          {/* Left: OpenAPI Tree */}
          <Box w="40%" minW="320px" maxW="600px" p={6} overflowY="auto" borderRight="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.200'} bg={darkMode ? 'gray.800' : 'white'}>
            <Heading size="sm" mb={4} color="teal.600">OpenAPI Spec</Heading>
            {openApiTree.length > 0 ? (
              <TreeView tree={openApiTree} openApi={openApi} darkMode={darkMode} selectedAttrs={selectedAttrs} onAttrToggle={handleAttrToggle} />
            ) : (
              <Box color="gray.400">Upload an OpenAPI spec to visualize endpoints.</Box>
            )}
          </Box>
          {/* Right: GraphQL Schema Editor */}
          <Box flex="1" p={6} overflowY="hidden" bg={darkMode ? 'gray.900' : 'gray.50'} display="flex" flexDirection="column" minH={0} h="100%"> 
            <Heading size="sm" mb={4} color="purple.600">GraphQL Schema</Heading>
            <Box borderRadius="md" overflow="hidden" boxShadow="md" border="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.200'} flex="1" minH={0} display="flex">
              <MonacoEditor
                height="100%"
                width="100%"
                defaultLanguage="graphql"
                theme={darkMode ? "vs-dark" : "light"}
                value={graphqlSchema}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
              />
            </Box>
          </Box>
        </Flex>
      </Flex>
    </ErrorBoundary>
  );
}

export default App;
