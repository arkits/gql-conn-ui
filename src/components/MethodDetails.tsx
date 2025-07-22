import React, { memo, useMemo, useCallback } from "react";
import { Box, Text, Button } from "@chakra-ui/react";
import { JsonWithCheckboxes } from "./JsonWithCheckboxes";
import type { OpenAPISpec, SelectedAttributes, OpenAPIOperation } from '../types/openapi';
import { generateSampleFromSchema, collectPaths } from '../utils/openapi';

function isPlainObject(val: unknown): val is Record<string, boolean> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export interface MethodDetailsProps {
  details: OpenAPIOperation;
  openApi: OpenAPISpec;
  darkMode: boolean;
  onAttrToggle: (typeName: string, path: string[]) => void;
  selectedAttrs: SelectedAttributes;
  onSelectAllAttrs: (typeName: string, sample: unknown) => void;
}

interface Parameter {
  name: string;
  in: string;
  schema?: { type?: string };
  description?: string;
}

const ParameterList = memo<{
  parameters: Parameter[];
  darkMode: boolean;
}>(({ parameters, darkMode }) => {
  if (parameters.length === 0) return null;
  
  return (
    <Box mb={2}>
      <Text fontSize="xs" fontWeight="bold" color={darkMode ? 'gray.400' : 'gray.600'} mb={1}>
        Parameters:
      </Text>
      <Box pl={2}>
        {parameters.map((param: Parameter, idx: number) => (
          <Box key={idx} display="flex" alignItems="center" fontSize="xs" mb={1}>
            <Text as="span" fontWeight="bold" color={darkMode ? 'teal.300' : 'teal.600'} minW="60px">
              {param.name}
            </Text>
            <Text as="span" color={darkMode ? 'gray.400' : 'gray.600'} ml={2} minW="40px">
              {param.in}
            </Text>
            <Text as="span" color={darkMode ? 'purple.400' : 'purple.600'} ml={2} minW="50px">
              {param.schema?.type || ''}
            </Text>
            <Text as="span" color={darkMode ? 'gray.400' : 'gray.600'} ml={2}>
              {param.description || ''}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

ParameterList.displayName = 'ParameterList';

interface RequestBody {
  description?: string;
  content?: Record<string, { schema?: unknown }>;
}

const RequestBodySection = memo<{
  requestBody: RequestBody | undefined;
  openApi: OpenAPISpec;
  darkMode: boolean;
}>(({ requestBody, openApi, darkMode }) => {
  if (!requestBody) return null;
  
  return (
    <Box mb={2}>
      <Text fontSize="xs" fontWeight="bold" color={darkMode ? 'gray.400' : 'gray.600'} mb={1}>
        Request Body:
      </Text>
      <Text fontSize="xs" pl={2} color={darkMode ? 'gray.400' : 'gray.600'}>
        {requestBody.description || 'No description'}
      </Text>
      {requestBody.content && (
        <Box pl={2}>
          {Object.entries(requestBody.content).map(([, content], idx) => {
            const sample = content.schema ? generateSampleFromSchema(content.schema, openApi) : null;
            return sample ? (
              <Box key={idx}>
                <Box 
                  as="pre" 
                  fontSize="xs" 
                  bg={darkMode ? 'gray.800' : 'gray.100'} 
                  color={darkMode ? 'gray.100' : 'gray.800'} 
                  p={2} 
                  borderRadius="md" 
                  mt={1} 
                  maxW="400px" 
                  overflowX="auto"
                >
                  <JsonWithCheckboxes 
                    value={sample} 
                    path={[]} 
                    selected={{}} 
                    onToggle={() => {}} 
                    darkMode={darkMode} 
                  />
                </Box>
              </Box>
            ) : null;
          })}
        </Box>
      )}
    </Box>
  );
});

RequestBodySection.displayName = 'RequestBodySection';

const SelectAllButton = memo<{
  typeName: string;
  sample: unknown;
  selectedAttrs: SelectedAttributes;
  onSelectAllAttrs: (typeName: string, sample: unknown) => void;
  darkMode: boolean;
}>(({ typeName, sample, selectedAttrs, onSelectAllAttrs, darkMode }) => {
  const allPaths = useMemo(() => collectPaths(sample), [sample]);
  const typeAttrs = useMemo(() => selectedAttrs[typeName] || {}, [selectedAttrs, typeName]);
  const allSelected = useMemo(() => 
    allPaths.length > 0 && allPaths.every(path => typeAttrs[path]),
    [allPaths, typeAttrs]
  );
  
  const handleClick = useCallback(() => {
    onSelectAllAttrs(typeName, sample);
  }, [typeName, sample, onSelectAllAttrs]);
  
  return (
    <Button
      size="xs"
      variant="ghost"
      bg={darkMode ? 'gray.700' : 'gray.200'}
      color={darkMode ? 'gray.100' : 'gray.800'}
      _hover={{ bg: darkMode ? 'gray.600' : 'gray.300' }}
      onClick={handleClick}
      mb={2}
    >
      {allSelected ? 'Deselect All' : 'Select All'}
    </Button>
  );
});

SelectAllButton.displayName = 'SelectAllButton';

interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  $ref?: string;
  $$ref?: string;
  required?: string[];
  description?: string;
  allOf?: OpenAPISchema[];
  xml?: {
    name?: string;
    wrapped?: boolean;
  };
}


interface Response {
  content?: Record<string, { schema?: OpenAPISchema }>;
  description?: string;
  headers?: Record<string, { description?: string; schema?: OpenAPISchema; $ref?: string }>;
}

export const MethodDetails: React.FC<MethodDetailsProps> = memo(({ 
  details, 
  openApi, 
  darkMode, 
  onAttrToggle, 
  selectedAttrs, 
  onSelectAllAttrs 
}) => {
  const parameters = details.parameters || [];
  const requestBody = details.requestBody;
  const successResponses = useMemo(() => {
    const responses = details.responses || {};
    return Object.entries(responses).filter(([code]) => /^2\d\d$/.test(code));
  }, [details.responses]);

  const getTypeName = useCallback((schema: OpenAPISchema | undefined, baseTypeName?: string): string => {
    if (!schema || typeof schema !== 'object') return baseTypeName || 'UnknownType';

    // Check for allOf reference first
    if (schema.allOf && Array.isArray(schema.allOf)) {
      // Try to get name from the first ref in allOf
      for (const subSchema of schema.allOf) {
        if (subSchema.$ref) {
          const refName = subSchema.$ref.replace('#/components/schemas/', '');
          return refName;
        }
      }
    }

    // Try getting name from $ref
    if (schema.$ref) {
      const refString = schema.$ref;
      if (refString.includes('#/components/schemas/')) {
        return refString.split('#/components/schemas/')[1];
      }
      return refString.replace('#/components/schemas/', '');
    }

    // Try getting name from $$ref
    if (schema.$$ref) {
      const match = schema.$$ref.match(/\/components\/schemas\/([^/]+)/);
      if (match) return match[1];
    }

    // Try xml name
    if (schema.xml?.name) {
      return schema.xml.name;
    }

    return baseTypeName || 'UnknownType';
  }, []);

  return (
    <Box pl={4} mt={1} mb={2}>
      <ParameterList parameters={parameters} darkMode={darkMode} />
      <RequestBodySection requestBody={requestBody} openApi={openApi} darkMode={darkMode} />
      
      {successResponses.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
            Responses:
          </Text>
          <Box pl={2}>
            {successResponses.map(([code, resp], idx) => {
              const respObj = resp as Response;
              if (!respObj.content) return null;

              return Object.entries(respObj.content).map(([type, content], j) => {
                const contentObj = content as { schema?: unknown };
                if (!type.toLowerCase().includes('json') || !contentObj.schema) return null;

                const sample = generateSampleFromSchema(contentObj.schema, openApi);
                if (!sample) return null;

                const typeName = getTypeName(contentObj.schema, `${details.operationId || 'Type'}_${code}`);
                const description = (resp as Response).description || '';
                const headers = (resp as Response).headers;

                return (
                  <Box key={`${idx}-${j}`} mb={3}>
                    <Text fontSize="xs" fontWeight="bold" color={darkMode ? 'purple.400' : 'purple.600'} mb={1}>
                      {typeName}
                    </Text>
                    {description && (
                      <Text fontSize="xs" color={darkMode ? 'gray.400' : 'gray.600'} mb={2}>
                        {description}
                      </Text>
                    )}
                    {headers && Object.keys(headers).length > 0 && (
                      <Box mb={2}>
                        <Text fontSize="xs" fontWeight="bold" color={darkMode ? 'teal.300' : 'teal.600'}>Response Headers:</Text>
                        <Box pl={2}>
                          {Object.entries(headers).map(([headerName, headerObj]) => (
                            <Box key={headerName} display="flex" alignItems="center" fontSize="xs" mb={1}>
                              <Text as="span" fontWeight="bold" color={darkMode ? 'teal.200' : 'teal.700'} minW="80px">{headerName}</Text>
                              <Text as="span" color={darkMode ? 'gray.400' : 'gray.600'} ml={2}>{headerObj.description || ''}</Text>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    <SelectAllButton
                      typeName={typeName}
                      sample={sample}
                      selectedAttrs={selectedAttrs}
                      onSelectAllAttrs={onSelectAllAttrs}
                      darkMode={darkMode}
                    />
                    <Box 
                      as="pre" 
                      fontSize="xs" 
                      bg={darkMode ? 'gray.800' : 'gray.100'} 
                      color={darkMode ? 'gray.100' : 'gray.800'} 
                      p={2} 
                      borderRadius="md" 
                      w="100%" 
                      overflowX="auto"
                    >
                      <JsonWithCheckboxes 
                        value={sample} 
                        path={[]} 
                        selected={isPlainObject(selectedAttrs[typeName]) ? selectedAttrs[typeName] : {}} 
                        onToggle={path => onAttrToggle(typeName, path)} 
                        darkMode={darkMode} 
                      />
                    </Box>
                  </Box>
                );
              });
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
});

MethodDetails.displayName = 'MethodDetails';