import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { JsonWithCheckboxes } from "./JsonWithCheckboxes";

function isPlainObject(val: any): val is Record<string, boolean> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export interface MethodDetailsProps {
  details: any;
  openApi: any;
  darkMode: boolean;
  onAttrToggle: (typeName: string, path: string[]) => void;
  selectedAttrs: Record<string, Record<string, boolean>>;
  onSelectAllAttrs: (typeName: string, sample: any) => void;
}

export const MethodDetails: React.FC<MethodDetailsProps> = ({ details, openApi, darkMode, onAttrToggle, selectedAttrs, onSelectAllAttrs }) => {
  const parameters = details.parameters || [];
  const requestBody = details.requestBody;
  const responses = details.responses || {};
  const successResponses = Object.entries(responses).filter(([code]) => /^2\d\d$/.test(code));

  return (
    <Box pl={4} mt={1} mb={2}>
      {parameters.length > 0 && (
        <Box mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">Parameters:</Text>
          <Box pl={2}>
            {parameters.map((param: any, idx: number) => (
              <Box key={idx} display="flex" alignItems="center" fontSize="xs" mb={1}>
                <Text as="span" fontWeight="bold" color="teal.300" minW="60px">{param.name}</Text>
                <Text as="span" color="gray.400" ml={2} minW="40px">{param.in}</Text>
                <Text as="span" color="purple.400" ml={2} minW="50px">{param.schema?.type || ''}</Text>
                <Text as="span" color="gray.500" ml={2}>{param.description || ''}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {requestBody && (
        <Box mb={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">Request Body:</Text>
          <Text fontSize="xs" pl={2}>{requestBody.description || 'No description'}</Text>
          {requestBody.content && (
            <Box pl={2}>
              {Object.entries(requestBody.content).map(([type, content]: any, idx) => {
                let sample = null;
                if (content.schema) {
                  sample = generateSampleFromSchema(content.schema, openApi);
                }
                return sample ? (
                  <Box key={idx}>
                    <Box as="pre" fontSize="xs" bg={darkMode ? 'gray.800' : 'gray.100'} color={darkMode ? 'gray.100' : 'gray.800'} p={2} borderRadius="md" mt={1} maxW="400px" overflowX="auto">
                      <JsonWithCheckboxes value={sample} path={[]} selected={{}} onToggle={() => {}} darkMode={darkMode} />
                    </Box>
                  </Box>
                ) : null;
              })}
            </Box>
          )}
        </Box>
      )}
      {successResponses.length > 0 && (
        <Box>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">Responses:</Text>
          <Box pl={2}>
            {successResponses.map(([code, resp]: any, idx) => {
              const respObj = resp as any;
              if (!respObj.content) return null;
              return Object.entries(respObj.content as any).map(([type, content]: any, j) => {
                const contentObj = content as any;
                let sample = null;
                let typeName = null;
                if (type.includes('json') && contentObj.schema) {
                  sample = generateSampleFromSchema(contentObj.schema, openApi);
                  if (contentObj.schema.$ref) {
                    typeName = contentObj.schema.$ref.replace('#/components/schemas/', '');
                  } else if (details.operationId) {
                    typeName = details.operationId + '_' + code;
                  } else {
                    typeName = 'Type_' + code;
                  }
                }
                return sample && typeName ? (
                  <Box key={j}>
                    {/* Select All/Deselect All button for this type */}
                    <Box mb={1}>
                      {(() => {
                        // Determine if all attributes are selected
                        function collectPaths(obj: any, prefix: string[] = []): string[] {
                          if (typeof obj !== 'object' || obj === null) return [];
                          if (Array.isArray(obj)) {
                            return collectPaths(obj[0], [...prefix, '0']);
                          }
                          let paths: string[] = [];
                          for (const [key, val] of Object.entries(obj)) {
                            const currentPath = [...prefix, key];
                            paths.push(currentPath.join('.'));
                            if (typeof val === 'object' && val !== null) {
                              paths = paths.concat(collectPaths(val, currentPath));
                            }
                          }
                          return paths;
                        }
                        const allPaths = collectPaths(sample);
                        const typeAttrs = selectedAttrs[typeName] || {};
                        const allSelected = allPaths.length > 0 && allPaths.every(path => typeAttrs[path]);
                        return (
                          <button
                            style={{
                              background: darkMode ? '#2D3748' : '#E2E8F0',
                              color: darkMode ? '#F1F1F1' : '#2D3748',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              marginBottom: 4,
                            }}
                            onClick={() => onSelectAllAttrs(typeName, sample)}
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        );
                      })()}
                    </Box>
                    {/* Hide the raw type/schema line */}
                    <Box as="pre" fontSize="xs" bg={darkMode ? 'gray.800' : 'gray.100'} color={darkMode ? 'gray.100' : 'gray.800'} p={2} borderRadius="md" mt={1} maxW="400px" overflowX="auto">
                      <JsonWithCheckboxes value={sample} path={[]} selected={isPlainObject(selectedAttrs[typeName]) ? selectedAttrs[typeName] : {}} onToggle={path => onAttrToggle(typeName, path)} darkMode={darkMode} />
                    </Box>
                  </Box>
                ) : null;
              });
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Helper to generate a sample JSON from a schema (copy from App.tsx or import from a shared utils file)
function generateSampleFromSchema(schema: any, openApi: any): any {
  if (!schema) return null;
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    const resolved = openApi?.components?.schemas?.[refName];
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
  if (schema.type === 'string') return 'string';
  if (schema.type === 'integer' || schema.type === 'number') return 0;
  if (schema.type === 'boolean') return true;
  return null;
} 