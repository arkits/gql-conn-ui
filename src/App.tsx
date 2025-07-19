import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Separator,
} from "@chakra-ui/react";
import { Sun, Moon, ChevronDown, ChevronRight } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";

// Placeholder for OpenAPI to GraphQL conversion
import { buildSchema, printSchema, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLList, GraphQLInputObjectType, GraphQLNonNull, GraphQLID, GraphQLScalarType } from "graphql";
import openapiTS from "openapi-typescript";

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

// Placeholder OpenAPI to GraphQL conversion
function openApiToGraphQL(openApi: any): string {
  // TODO: Replace with real conversion logic
  // For now, return a dummy schema
  return `type Query {\n  hello: String\n}`;
}

// Helper to resolve $ref and get schema definition
function resolveRef(ref: string, openApi: any) {
  if (!ref.startsWith('#/components/schemas/')) return null;
  const name = ref.replace('#/components/schemas/', '');
  return openApi?.components?.schemas?.[name] || null;
}

// Helper to generate a sample JSON from a schema
function generateSampleFromSchema(schema: any, openApi: any): any {
  if (!schema) return null;
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, openApi);
    return generateSampleFromSchema(resolved, openApi);
  }
  if (schema.type === 'object') {
    const obj: any = {};
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        obj[key] = generateSampleFromSchema(propSchema, openApi);
      }
    }
    return obj;
  }
  if (schema.type === 'array') {
    return [generateSampleFromSchema(schema.items, openApi)];
  }
  if (schema.type === 'string') {
    return 'string';
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return 0;
  }
  if (schema.type === 'boolean') {
    return true;
  }
  return null;
}

// Helper to convert OpenAPI schema to GraphQL type string
function openApiSchemaToGraphQLType(name: string, schema: any, openApi: any, typeMap: Record<string, string> = {}): string {
  if (!schema) return '';
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    if (typeMap[refName]) return refName;
    const resolved = resolveRef(schema.$ref, openApi);
    return openApiSchemaToGraphQLType(refName, resolved, openApi, typeMap);
  }
  if (schema.type === 'object') {
    let fields = '';
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const fieldType = openApiSchemaToGraphQLType(key, propSchema, openApi, typeMap);
        fields += `  ${key}: ${fieldType}\n`;
      }
    }
    const typeDef = `type ${name} {\n${fields}}`;
    typeMap[name] = typeDef;
    return name;
  }
  if (schema.type === 'array') {
    const itemType = openApiSchemaToGraphQLType(name + 'Item', schema.items, openApi, typeMap);
    return `[${itemType}]`;
  }
  if (schema.type === 'string') return 'String';
  if (schema.type === 'integer') return 'Int';
  if (schema.type === 'number') return 'Float';
  if (schema.type === 'boolean') return 'Boolean';
  return 'String';
}

const MethodDetails = ({ details, openApi, darkMode, onTypeSelect, selectedTypes }: { details: any, openApi: any, darkMode: boolean, onTypeSelect: (typeName: string, schema: any) => void, selectedTypes: Record<string, any> }) => {
  // Parameters
  const parameters = details.parameters || [];
  // Request body
  const requestBody = details.requestBody;
  // Responses
  const responses = details.responses || {};

  // Only show successful responses (2xx)
  const successResponses = Object.entries(responses).filter(([code]) => /^2\d\d$/.test(code));

  return (
    <Box pl={4} mt={1} mb={2}>
      {/* Parameters */}
      {parameters.length > 0 && (
        <Box mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">Parameters:</Text>
          <VStack align="start" gap={1} pl={2}>
            {parameters.map((param: any, idx: number) => (
              <Text fontSize="xs" key={idx}>
                <b>{param.name}</b> <span style={{ color: '#888' }}>({param.in})</span>
                {param.required ? ' (required)' : ''} - {param.description || ''}
              </Text>
            ))}
          </VStack>
        </Box>
      )}
      {/* Request Body */}
      {requestBody && (
        <Box mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">Request Body:</Text>
          <Text fontSize="xs" pl={2}>{requestBody.description || 'No description'}</Text>
          {requestBody.content && (
            <VStack align="start" gap={1} pl={2}>
              {Object.entries(requestBody.content).map(([type, content]: any, idx) => (
                <Text fontSize="xs" key={idx}>
                  <b>{type}</b>: {content.schema ? JSON.stringify(content.schema) : ''}
                </Text>
              ))}
            </VStack>
          )}
        </Box>
      )}
      {/* Successful Responses Only */}
      {successResponses.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">Successful Responses:</Text>
          <VStack align="start" gap={1} pl={2}>
            {successResponses.map(([code, resp]: any, idx) => (
              <Box key={idx}>
                <Text fontSize="xs"><b>{code}</b>: {resp.description || ''}</Text>
                {resp.content && (
                  <VStack align="start" gap={0} pl={2}>
                    {Object.entries(resp.content).map(([type, content]: any, j) => {
                      // If JSON, visualize sample
                      let sample = null;
                      let typeName = null;
                      if (type.includes('json') && content.schema) {
                        sample = generateSampleFromSchema(content.schema, openApi);
                        // Try to get a type name for selection
                        if (content.schema.$ref) {
                          typeName = content.schema.$ref.replace('#/components/schemas/', '');
                        } else if (details.operationId) {
                          typeName = details.operationId + '_' + code;
                        } else {
                          typeName = 'Type_' + code;
                        }
                      }
                      return (
                        <Box key={j}>
                          <Text fontSize="xs">
                            <b>{type}</b>: {content.schema ? JSON.stringify(content.schema) : ''}
                          </Text>
                          {sample && (
                            <Box>
                              <Box as="pre" fontSize="xs" bg={darkMode ? 'gray.800' : 'gray.100'} color={darkMode ? 'gray.100' : 'gray.800'} p={2} borderRadius="md" mt={1} maxW="400px" overflowX="auto">
                                {JSON.stringify(sample, null, 2)}
                              </Box>
                              <label style={{ display: 'flex', alignItems: 'center', marginTop: 4, fontSize: '0.9em', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={!!selectedTypes[typeName]}
                                  onChange={() => onTypeSelect(typeName, content.schema)}
                                  style={{ marginRight: 6 }}
                                />
                                Use as GraphQL type: <b style={{ marginLeft: 4 }}>{typeName}</b>
                              </label>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

const TreeView = ({ tree, openApi, darkMode, onTypeSelect, selectedTypes }: { tree: any[], openApi: any, darkMode: boolean, onTypeSelect: (typeName: string, schema: any) => void, selectedTypes: Record<string, any> }) => {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [expandedMethods, setExpandedMethods] = useState<Record<string, Record<string, boolean>>>({});

  const toggleEndpoint = (path: string) => {
    setExpandedEndpoints(prev => ({ ...prev, [path]: !prev[path] }));
  };
  const toggleMethod = (path: string, method: string) => {
    setExpandedMethods(prev => ({
      ...prev,
      [path]: {
        ...prev[path],
        [method]: !prev[path]?.[method],
      },
    }));
  };

  return (
    <VStack align="stretch" gap={2}>
      {tree.map((node, i) => (
        <Box key={i} pl={2} borderLeft="2px solid" borderColor="gray.200" className="dark:border-gray-600">
          <HStack gap={2} cursor="pointer" onClick={() => toggleEndpoint(node.path)}>
            {expandedEndpoints[node.path] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Text fontWeight="bold" color="teal.500">{node.path}</Text>
          </HStack>
          {expandedEndpoints[node.path] && (
            <VStack align="start" pl={4} gap={1}>
              {node.methods.map((m: any, j: number) => (
                <Box key={j}>
                  <HStack gap={2} cursor="pointer" onClick={() => toggleMethod(node.path, m.method)}>
                    {expandedMethods[node.path]?.[m.method] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Text fontSize="sm" color="purple.500">{m.method}</Text>
                    <Text fontSize="sm">{m.details.summary || ""}</Text>
                  </HStack>
                  {expandedMethods[node.path]?.[m.method] && (
                    <MethodDetails details={m.details} openApi={openApi} darkMode={darkMode} onTypeSelect={onTypeSelect} selectedTypes={selectedTypes} />
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      ))}
    </VStack>
  );
};

function App() {
  // Simple dark mode toggle using className
  const [darkMode, setDarkMode] = useState(true);
  React.useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const [openApi, setOpenApi] = useState<any>(null);
  const [openApiTree, setOpenApiTree] = useState<any[]>([]);
  const [graphqlSchema, setGraphqlSchema] = useState<string>("# GraphQL schema will appear here\n");
  const [selectedTypes, setSelectedTypes] = useState<Record<string, any>>({});

  // Handler for selecting types
  const handleTypeSelect = (typeName: string, schema: any) => {
    setSelectedTypes(prev => {
      const newTypes = { ...prev };
      if (newTypes[typeName]) {
        delete newTypes[typeName];
      } else {
        newTypes[typeName] = schema;
      }
      return newTypes;
    });
  };

  // Generate GraphQL schema from selected types
  const generateGraphQLSchema = () => {
    const typeMap: Record<string, string> = {};
    Object.entries(selectedTypes).forEach(([typeName, schema]) => {
      openApiSchemaToGraphQLType(typeName, schema, openApi, typeMap);
    });
    return Object.values(typeMap).join('\n\n');
  };

  useEffect(() => {
    if (openApi && Object.keys(selectedTypes).length > 0) {
      setGraphqlSchema(generateGraphQLSchema());
    } else {
      setGraphqlSchema('# GraphQL schema will appear here\n');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, openApi]);

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
    setGraphqlSchema(openApiToGraphQL(json));
  };

  return (
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
            <TreeView tree={openApiTree} openApi={openApi} darkMode={darkMode} onTypeSelect={handleTypeSelect} selectedTypes={selectedTypes} />
          ) : (
            <Text color="gray.400">Upload an OpenAPI spec to visualize endpoints.</Text>
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
  );
}

export default App;
