import React from "react";
import { Box, Text } from "@chakra-ui/react";

export interface JsonWithCheckboxesProps {
  value: any;
  path: string[];
  selected: Record<string, boolean>;
  onToggle: (path: string[]) => void;
  darkMode: boolean;
}

export const JsonWithCheckboxes: React.FC<JsonWithCheckboxesProps> = ({ value, path, selected, onToggle, darkMode }) => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return (
      <Box pl={3} borderLeft="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.300'}>
        {Object.entries(value).map(([key, val]) => {
          const attrPath = [...path, key];
          const checked = !!selected[attrPath.join('.')];
          return (
            <Box key={key} display="flex" alignItems="flex-start" mt={1}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(attrPath)}
                style={{ marginRight: 6, marginTop: 2 }}
              />
              <Text as="span" fontFamily="mono" fontSize="xs" color={darkMode ? 'gray.100' : 'gray.800'}>
                <b>{key}</b>: {typeof val === 'object' && val !== null ? '' : JSON.stringify(val)}
              </Text>
              {typeof val === 'object' && val !== null && (
                <JsonWithCheckboxes value={val} path={attrPath} selected={selected} onToggle={onToggle} darkMode={darkMode} />
              )}
            </Box>
          );
        })}
      </Box>
    );
  } else if (Array.isArray(value)) {
    return (
      <Box pl={3} borderLeft="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.300'}>
        <Text as="span" fontFamily="mono" fontSize="xs" color={darkMode ? 'gray.100' : 'gray.800'}>[</Text>
        <JsonWithCheckboxes value={value[0]} path={[...path, '0']} selected={selected} onToggle={onToggle} darkMode={darkMode} />
        <Text as="span" fontFamily="mono" fontSize="xs" color={darkMode ? 'gray.100' : 'gray.800'}>]</Text>
      </Box>
    );
  }
  return null;
}; 