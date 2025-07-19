import React, { memo, useMemo, useCallback } from "react";
import { Box, Text, Button } from "@chakra-ui/react";
import { JsonWithCheckboxes } from "./JsonWithCheckboxes";
import type { OpenAPISpec, SelectedAttributes, OpenAPIOperation } from '../types/openapi';
import { generateSampleFromSchema, collectPaths } from '../utils/openapi';

function isPlainObject(val: any): val is Record<string, boolean> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export interface MethodDetailsProps {
  details: OpenAPIOperation;
  openApi: OpenAPISpec;
  darkMode: boolean;
  onAttrToggle: (typeName: string, path: string[]) => void;
  selectedAttrs: SelectedAttributes;
  onSelectAllAttrs: (typeName: string, sample: any) => void;
}

const ParameterList = memo<{
  parameters: any[];
  darkMode: boolean;
}>(({ parameters }) => {
  if (parameters.length === 0) return null;
  
  return (
    <Box mb={2}>
      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
        Parameters:
      </Text>
      <Box pl={2}>
        {parameters.map((param: any, idx: number) => (
          <Box key={idx} display="flex" alignItems="center" fontSize="xs" mb={1}>
            <Text as="span" fontWeight="bold" color="teal.300" minW="60px">
              {param.name}
            </Text>
            <Text as="span" color="gray.400" ml={2} minW="40px">
              {param.in}
            </Text>
            <Text as="span" color="purple.400" ml={2} minW="50px">
              {param.schema?.type || ''}
            </Text>
            <Text as="span" color="gray.500" ml={2}>
              {param.description || ''}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

ParameterList.displayName = 'ParameterList';

const RequestBodySection = memo<{
  requestBody: any;
  openApi: OpenAPISpec;
  darkMode: boolean;
}>(({ requestBody, openApi, darkMode }) => {
  if (!requestBody) return null;
  
  return (
    <Box mb={2}>
      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
        Request Body:
      </Text>
      <Text fontSize="xs" pl={2} color="gray.400">
        {requestBody.description || 'No description'}
      </Text>
      {requestBody.content && (
        <Box pl={2}>
          {Object.entries(requestBody.content).map(([_type, content]: any, idx) => {
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
  sample: any;
  selectedAttrs: SelectedAttributes;
  onSelectAllAttrs: (typeName: string, sample: any) => void;
  darkMode: boolean;
}>(({ typeName, sample, selectedAttrs, onSelectAllAttrs, darkMode }) => {
  const allPaths = useMemo(() => collectPaths(sample), [sample]);
  const typeAttrs = selectedAttrs[typeName] || {};
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
  const responses = details.responses || {};
  const successResponses = useMemo(() => 
    Object.entries(responses).filter(([code]) => /^2\d\d$/.test(code)),
    [responses]
  );

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
            {successResponses.map(([code, resp]: any, _idx) => {
              const respObj = resp as any;
              if (!respObj.content) return null;
              
              return Object.entries(respObj.content as any).map(([type, content]: any, j) => {
                const contentObj = content as any;
                if (!type.includes('json') || !contentObj.schema) return null;
                
                const sample = generateSampleFromSchema(contentObj.schema, openApi);
                if (!sample) return null;
                
                let typeName: string;
                if (contentObj.schema.$ref) {
                  typeName = contentObj.schema.$ref.replace('#/components/schemas/', '');
                } else if (details.operationId) {
                  typeName = details.operationId + '_' + code;
                } else {
                  typeName = 'Type_' + code;
                }
                
                return (
                  <Box key={j} mb={3}>
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
                      maxW="400px" 
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