import React, { useState, useEffect } from "react";
import { Box, Flex, Heading, HStack, Input, IconButton, useToast } from "@chakra-ui/react";
import { Sun, Moon, Menu, HelpCircle, Clipboard } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";
import copy from "copy-to-clipboard";
import { TreeView } from "./components/TreeView";
import ErrorBoundary from "./components/ErrorBoundary";
import { TabsRoot, TabsList, TabsTrigger, TabsContentGroup, TabsContent } from "@chakra-ui/react";
import { SideDrawer } from "./components/SideDrawer";
import { ResizablePanels } from './components/ResizablePanels';
import { SettingsProvider } from "./contexts/SettingsContext";
import { useSettings } from "./hooks/useSettings";

import { useFileUpload } from "./hooks/useFileUpload";
import { useSelection } from "./hooks/useSelection";
import { useGraphQLGeneration } from "./hooks/useGraphQLGeneration";
import { Dialog, CloseButton } from "@chakra-ui/react";

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const { isDrawerOpen, setIsDrawerOpen } = useSettings();
  const [helpOpen, setHelpOpen] = useState(false);
  const toast = useToast();
  
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
              <Heading size="md" color={darkMode ? 'teal.300' : 'teal.600'} letterSpacing="tight" fontWeight={700}>
                OpenAPI{" "}
                <Box as="span" color={darkMode ? 'purple.400' : 'purple.600'} fontWeight={400} mx={1}>
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
                color={darkMode ? 'teal.300' : 'teal.600'}
                _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </IconButton>
              <Dialog.Root open={helpOpen} onOpenChange={o => setHelpOpen(o.open)}>
                <Dialog.Trigger asChild>
                  <IconButton
                    aria-label="Help"
                    variant="ghost"
                    size="md"
                    color={darkMode ? 'purple.400' : 'purple.600'}
                    _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
                  >
                    <HelpCircle size={20} />
                  </IconButton>
                </Dialog.Trigger>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content bg={darkMode ? 'gray.800' : 'white'} color={darkMode ? 'gray.100' : 'gray.900'} maxW="xl">
                    <Dialog.Header>
                      <Dialog.Title>Help & Documentation</Dialog.Title>
                      <Dialog.CloseTrigger asChild>
                        <CloseButton position="absolute" right={2} top={2} />
                      </Dialog.CloseTrigger>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Box as="section" fontSize="sm" lineHeight={1.7}>
                        <Heading size="sm" mb={2} color="teal.400">What is this app?</Heading>
                        <Box mb={3}>
                          This tool converts an OpenAPI (Swagger) specification into a GraphQL schema and a YAML app config. It helps you visualize, select, and transform REST endpoints into GraphQL operations.
                        </Box>
                        <Heading size="xs" mb={1} color="purple.400">How to use:</Heading>
                        <ol style={{ paddingLeft: 18, marginBottom: 12 }}>
                          <li><b>Upload OpenAPI:</b> Click the file input to upload a <code>.json</code> or <code>.yaml</code> OpenAPI spec.</li>
                          <li><b>Explore Endpoints:</b> The left panel shows a tree of endpoints and schemas. Expand and select fields to include in your GraphQL schema.</li>
                          <li><b>Schema & Config:</b> The right panel has tabs for the generated GraphQL schema and the YAML app config. Both update live as you select endpoints/fields.</li>
                          <li><b>Settings:</b> Use the settings (menu) button to configure required scopes and other options.</li>
                          <li><b>Dark Mode:</b> Toggle dark/light mode with the sun/moon button.</li>
                        </ol>
                        <Heading size="xs" mb={1} color="purple.400">Tips:</Heading>
                        <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
                          <li>You can select/deselect all fields for a type using the "Select All" button in the tree or method details.</li>
                          <li>Changes are instant; no need to save manually.</li>
                          <li>Use the settings drawer to adjust advanced options.</li>
                        </ul>
                        <Box mt={2} color="gray.400" fontSize="xs">
                          For more info, see the README or contact the developer.
                        </Box>
                      </Box>
                    </Dialog.Body>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Dialog.Root>
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
        
        <Flex flex="1" overflow="hidden">
          <ResizablePanels
            darkMode={darkMode}
            leftPanel={
              <Box
                p={6}
                overflowY="auto"
                h="100%"
                bg={darkMode ? '#18181B' : 'white'}
              >
                <Heading size="sm" mb={4} color={darkMode ? 'teal.300' : 'teal.600'}>
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
                  <Box color={darkMode ? 'gray.400' : 'gray.600'}>
                    Upload an OpenAPI spec to visualize endpoints.
                  </Box>
                )}
              </Box>
            }
            rightPanel={
              <Box
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
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="sm" color={darkMode ? 'purple.400' : 'purple.600'}>
                          GraphQL Schema
                        </Heading>
                        <IconButton
                          aria-label="Copy GraphQL Schema"
                          icon={<Clipboard size={18} />}
                          onClick={() => {
                            copy(graphqlSchema);
                            toast({
                              title: "GraphQL Schema copied to clipboard!",
                              status: "success",
                              duration: 2000,
                              isClosable: true,
                            });
                          }}
                          size="sm"
                          variant="ghost"
                          color={darkMode ? 'gray.400' : 'gray.600'}
                          _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
                        />
                      </Flex>
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
                            automaticLayout: true,
                            fontFamily: "'Fira Mono', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', monospace"
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
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="sm" color={darkMode ? 'purple.400' : 'purple.600'}>
                          App Config YAML
                        </Heading>
                        <IconButton
                          aria-label="Copy App Config YAML"
                          icon={<Clipboard size={18} />}
                          onClick={() => {
                            copy(appConfigYaml);
                            toast({
                              title: "App Config YAML copied to clipboard!",
                              status: "success",
                              duration: 2000,
                              isClosable: true,
                            });
                          }}
                          size="sm"
                          variant="ghost"
                          color={darkMode ? 'gray.400' : 'gray.600'}
                          _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
                        />
                      </Flex>
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
                            automaticLayout: true,
                            fontFamily: "'Fira Mono', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', monospace"
                          }}
                        />
                      </Box>
                    </TabsContent>
                  </TabsContentGroup>
                </TabsRoot>
              </Box>
            }
          />
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