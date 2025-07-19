import React, { useState, useEffect } from "react";
import { Box, Flex, Heading, HStack, Input, IconButton } from "@chakra-ui/react";
import { Sun, Moon } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { TreeView } from "./components/TreeView";
import { generateGraphQLSchemaFromSelections } from "./graphql/generateGraphQL";
import ErrorBoundary from "./components/ErrorBoundary";
import { TabsRoot, TabsList, TabsTrigger, TabsContentGroup, TabsContent } from "@chakra-ui/react";
import yaml from "js-yaml";
import { generateAppConfigYaml } from "./configGenerator";

function App() {
  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const [openApi, setOpenApi] = useState<any>(null);
  const [openApiTree, setOpenApiTree] = useState<any[]>([]);
  const [graphqlSchema, setGraphqlSchema] = useState<string>("# GraphQL schema will appear here\n");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, Record<string, boolean>>>({});
  const [appConfigYaml, setAppConfigYaml] = useState<string>("# Application config YAML will appear here\n");

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

    // --- Generate App Config YAML ---
    setAppConfigYaml(generateAppConfigYaml(openApi, selectedAttrs));
    // --- End App Config YAML ---
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
          {/* Right: GraphQL Schema Editor with Tabs */}
          <Box flex="1" p={6} overflowY="hidden" bg={darkMode ? 'gray.900' : 'gray.50'} display="flex" flexDirection="column" minH={0} h="100%">
            <TabsRoot variant="enclosed" fitted defaultValue="schema">
              <TabsList mb={4}>
                <TabsTrigger value="schema"
                  style={{
                    color: darkMode ? '#F7FAFC' : '#1A202C',
                    fontWeight: 600,
                  }}
                  _selected={{ color: darkMode ? '#63B3ED' : '#3182CE' }}
                >
                  GraphQL Schema
                </TabsTrigger>
                <TabsTrigger value="yaml"
                  style={{
                    color: darkMode ? '#F7FAFC' : '#1A202C',
                    fontWeight: 600,
                  }}
                  _selected={{ color: darkMode ? '#63B3ED' : '#3182CE' }}
                >
                  App Config YAML
                </TabsTrigger>
              </TabsList>
              <TabsContentGroup display="flex" flexDirection="column" flex={1} minH={0} h="100%">
                <TabsContent value="schema" flex={1} minH={0} h="100%" display="flex" flexDirection="column">
                  <Heading size="sm" mb={4} color="purple.600">GraphQL Schema</Heading>
                  <Box borderRadius="md" overflow="hidden" boxShadow="md" border="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.200'} flex={1} display="flex" flexDirection="column">
                    <MonacoEditor
                      height="100%"
                      width="100%"
                      defaultLanguage="graphql"
                      theme={darkMode ? "vs-dark" : "light"}
                      value={graphqlSchema}
                      options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
                    />
                  </Box>
                </TabsContent>
                <TabsContent value="yaml" flex={1} minH={0} h="100%" display="flex" flexDirection="column">
                  <Heading size="sm" mb={4} color="purple.600">App Config YAML</Heading>
                  <Box borderRadius="md" overflow="hidden" boxShadow="md" border="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.200'} flex={1} display="flex" flexDirection="column">
                    <MonacoEditor
                      height="100%"
                      width="100%"
                      defaultLanguage="yaml"
                      theme={darkMode ? "vs-dark" : "light"}
                      value={appConfigYaml}
                      options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true }}
                    />
                  </Box>
                </TabsContent>
              </TabsContentGroup>
            </TabsRoot>
          </Box>
        </Flex>
      </Flex>
    </ErrorBoundary>
  );
}

export default App;
