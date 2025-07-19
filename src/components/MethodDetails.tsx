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
}

export const MethodDetails: React.FC<MethodDetailsProps> = ({ details, openApi, darkMode, onAttrToggle, selectedAttrs }) => {
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