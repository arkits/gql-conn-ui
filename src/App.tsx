import React, { useState, useEffect } from "react";
import { Box, Flex, Heading, HStack, Input, IconButton } from "@chakra-ui/react";
import { Sun, Moon, Menu } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import { TreeView } from "./components/TreeView";
import ErrorBoundary from "./components/ErrorBoundary";
import { TabsRoot, TabsList, TabsTrigger, TabsContentGroup, TabsContent } from "@chakra-ui/react";
import { SideDrawer } from "./components/SideDrawer";
import { SettingsProvider, useSettings } from "./contexts/SettingsContext";

import { useFileUpload } from "./hooks/useFileUpload";
import { useSelection } from "./hooks/useSelection";
import { useGraphQLGeneration } from "./hooks/useGraphQLGeneration";

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const { isDrawerOpen, setIsDrawerOpen } = useSettings();
  
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const { openApi, openApiTree, handleFileUpload } = useFileUpload();
  const { selectedAttrs, selectedEndpoints, handleAttrToggle, handleSelectAllAttrs, clearSelection } = useSelection();
  const { graphqlSchema, appConfigYaml } = useGraphQLGeneration(openApi, selectedAttrs, selectedEndpoints);

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = await handleFileUpload(e);
    if (result.success) {
      clearSelection();
    } else {
      alert(result.error);
    }
  };

  return (
    <ErrorBoundary>
      <Flex 
        direction="column" 
        minH="100vh" 
        minW="0" 
        w="100vw" 
        h="100vh" 
        className={darkMode ? "dark" : "light"}
      >
        {/* Header/Nav Bar */}
        <Flex
          as="header"
          align="center"
          justify="center"
          px={0}
          py={0}
          bg={darkMode ? 'gray.900' : 'white'}
          boxShadow="sm"
          borderBottomWidth="1px"
          borderColor={darkMode ? 'gray.700' : 'gray.200'}
        >
          <Flex
            w="100%"
            maxW="1200px"
            align="center"
            justify="space-between"
            px={{ base: 4, md: 8 }}
            py={2}
            borderRadius="xl"
            bg={darkMode ? 'gray.800' : 'gray.50'}
            boxShadow="md"
            mt={3}
            mb={3}
          >
            <HStack gap={6} align="center">
              <Heading size="md" color="teal.400" letterSpacing="tight" fontWeight={700}>
                OpenAPI{" "}
                <Box as="span" color={darkMode ? 'gray.400' : 'gray.600'} fontWeight={400} mx={1}>
                  →
                </Box>{" "}
                GraphQL Converter
              </Heading>
              <Input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={onFileUpload}
                size="sm"
                w="auto"
                bg={darkMode ? 'gray.700' : 'gray.100'}
                borderRadius="md"
                _hover={{ bg: darkMode ? 'gray.600' : 'gray.200' }}
                _focus={{ borderColor: 'teal.400' }}
                fontSize="sm"
                color={darkMode ? 'gray.100' : 'gray.800'}
                p={1}
              />
            </HStack>
            <HStack gap={2}>
              <IconButton
                aria-label="Toggle dark mode"
                onClick={() => setDarkMode((d) => !d)}
                variant="ghost"
                size="md"
                color={darkMode ? 'yellow.300' : 'gray.700'}
                _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
              <IconButton
                aria-label="Open settings"
                onClick={() => setIsDrawerOpen(true)}
                variant="ghost"
                size="md"
                color={darkMode ? 'gray.300' : 'gray.700'}
                _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
              >
                <Menu size={20} />
              </IconButton>
            </HStack>
          </Flex>
        </Flex>
        
        {/* Main Content */}
        <Flex flex="1" overflow="hidden">
          {/* Left: OpenAPI Tree */}
          <Box 
            w="40%" 
            minW="320px" 
            maxW="600px" 
            p={6} 
            overflowY="auto" 
            borderRight="1px solid" 
            borderColor={darkMode ? 'gray.700' : 'gray.200'} 
            bg={darkMode ? '#18181B' : 'white'}
          >
            <Heading size="sm" mb={4} color="teal.600">
              OpenAPI Spec
            </Heading>
            {openApiTree.length > 0 ? (
              <TreeView 
                tree={openApiTree} 
                openApi={openApi} 
                darkMode={darkMode} 
                selectedAttrs={selectedAttrs} 
                onAttrToggle={handleAttrToggle} 
                onSelectAllAttrs={handleSelectAllAttrs} 
              />
            ) : (
              <Box color="gray.400">
                Upload an OpenAPI spec to visualize endpoints.
              </Box>
            )}
          </Box>
          
          {/* Right: GraphQL Schema Editor with Tabs */}
          <Box 
            flex="1" 
            p={6} 
            overflowY="hidden" 
            bg={darkMode ? 'gray.900' : 'gray.50'} 
            display="flex" 
            flexDirection="column" 
            minH={0} 
            h="100%"
          >
            <TabsRoot variant="enclosed" fitted defaultValue="schema">
              <TabsList 
                mb={4} 
                bg={darkMode ? '#23232B' : '#EDF2F7'} 
                borderRadius="md" 
                boxShadow="sm" 
                border="none" 
                p={1}
              >
                <TabsTrigger 
                  value="schema"
                  style={{
                    color: darkMode ? '#F1F1F1' : '#2D3748',
                    fontWeight: 600,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    background: 'none',
                    fontSize: '0.875rem',
                  }}
                  _selected={{
                    color: darkMode ? '#63B3ED' : '#2B6CB0',
                    bg: darkMode ? '#18181B' : '#fff',
                    boxShadow: darkMode ? '0 2px 8px #0004' : '0 2px 8px #0001',
                  }}
                  borderRadius="md"
                  px={3}
                  py={1}
                >
                  GraphQL Schema
                </TabsTrigger>
                <TabsTrigger 
                  value="yaml"
                  style={{
                    color: darkMode ? '#F1F1F1' : '#2D3748',
                    fontWeight: 600,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    background: 'none',
                    fontSize: '0.875rem',
                  }}
                  _selected={{
                    color: darkMode ? '#63B3ED' : '#2B6CB0',
                    bg: darkMode ? '#18181B' : '#fff',
                    boxShadow: darkMode ? '0 2px 8px #0004' : '0 2px 8px #0001',
                  }}
                  borderRadius="md"
                  px={3}
                  py={1}
                >
                  App Config YAML
                </TabsTrigger>
              </TabsList>
              
              <TabsContentGroup display="flex" flexDirection="column" flex={1} minH={0} h="100%">
                <TabsContent 
                  value="schema" 
                  flex={1} 
                  minH={0} 
                  h="100%" 
                  display="flex" 
                  flexDirection="column"
                >
                  <Heading size="sm" mb={4} color="purple.600">
                    GraphQL Schema
                  </Heading>
                  <Box 
                    borderRadius="md" 
                    overflow="auto" 
                    boxShadow="md" 
                    border="1px solid" 
                    borderColor={darkMode ? 'gray.700' : 'gray.200'} 
                    flex={1} 
                    minH={0} 
                    h="100%" 
                    display="flex" 
                    flexDirection="column"
                  >
                    <MonacoEditor
                      height="100%"
                      width="100%"
                      defaultLanguage="graphql"
                      theme={darkMode ? "vs-dark" : "light"}
                      value={graphqlSchema}
                      options={{ 
                        minimap: { enabled: false }, 
                        scrollBeyondLastLine: true, 
                        automaticLayout: true 
                      }}
                    />
                  </Box>
                </TabsContent>
                
                <TabsContent 
                  value="yaml" 
                  flex={1} 
                  minH={0} 
                  h="100%" 
                  display="flex" 
                  flexDirection="column"
                >
                  <Heading size="sm" mb={4} color="purple.600">
                    App Config YAML
                  </Heading>
                  <Box 
                    borderRadius="md" 
                    overflow="auto" 
                    boxShadow="md" 
                    border="1px solid" 
                    borderColor={darkMode ? 'gray.700' : 'gray.200'} 
                    flex={1} 
                    minH={0} 
                    h="100%" 
                    display="flex" 
                    flexDirection="column"
                  >
                    <MonacoEditor
                      height="100%"
                      width="100%"
                      defaultLanguage="yaml"
                      theme={darkMode ? "vs-dark" : "light"}
                      value={appConfigYaml}
                      options={{ 
                        minimap: { enabled: false }, 
                        scrollBeyondLastLine: true, 
                        automaticLayout: true 
                      }}
                    />
                  </Box>
                </TabsContent>
              </TabsContentGroup>
            </TabsRoot>
          </Box>
        </Flex>
        
        {/* SideDrawer */}
        <SideDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          darkMode={darkMode} 
        />
      </Flex>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;