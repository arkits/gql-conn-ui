import React, { useState } from "react";
import { Box, VStack, HStack, Text } from "@chakra-ui/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MethodDetails } from "./MethodDetails";
import type { OpenAPISpec, SelectedAttributes, TreeNode } from '../types/openapi';

export interface TreeViewProps {
  tree: TreeNode[];
  openApi: OpenAPISpec | null;
  darkMode: boolean;
  selectedAttrs: SelectedAttributes;
  onAttrToggle: (typeName: string, path: string[], endpointPath?: string, endpointMethod?: string) => void;
  onSelectAllAttrs: (typeName: string, sample: unknown, endpointPath?: string, endpointMethod?: string) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({ tree, openApi, darkMode, selectedAttrs, onAttrToggle, onSelectAllAttrs }) => {
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
              {node.methods.map((m, j: number) => (
                <Box key={j}>
                  <HStack gap={2} cursor="pointer" onClick={() => toggleMethod(node.path, m.method)}>
                    {expandedMethods[node.path]?.[m.method] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <Text fontSize="sm" color="purple.500">{m.method}</Text>
                    <Text fontSize="sm">{m.details.summary || ""}</Text>
                  </HStack>
                  {expandedMethods[node.path]?.[m.method] && openApi && (
                    <MethodDetails
                      details={m.details}
                      openApi={openApi}
                      darkMode={darkMode}
                      onAttrToggle={(typeName, path) => onAttrToggle(typeName, path, node.path, m.method)}
                      selectedAttrs={selectedAttrs}
                      onSelectAllAttrs={(typeName, sample) => onSelectAllAttrs(typeName, sample, node.path, m.method)}
                    />
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