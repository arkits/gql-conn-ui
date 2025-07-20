import React, { memo, useCallback, useMemo } from "react";
import { Box, Text } from "@chakra-ui/react";

export interface JsonWithCheckboxesProps {
  value: unknown;
  path: string[];
  selected: Record<string, boolean>;
  onToggle: (path: string[]) => void;
  darkMode: boolean;
}

const JsonProperty = memo<{
  propKey: string;
  value: unknown;
  path: string[];
  selected: Record<string, boolean>;
  onToggle: (path: string[]) => void;
  darkMode: boolean;
}>(({ propKey, value, path, selected, onToggle, darkMode }) => {
  const attrPath = useMemo(() => [...path, propKey], [path, propKey]);
  const checked = !!selected[attrPath.join('.')];
  
  const handleToggle = useCallback(() => {
    onToggle(attrPath);
  }, [attrPath, onToggle]);

  const isComplexValue = typeof value === 'object' && value !== null;

  return (
    <Box display="flex" alignItems="flex-start" mt={1}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleToggle}
        style={{ marginRight: 8, marginTop: 2, accentColor: 'teal' }}
      />
      <Box flex={1}>
        <Text 
          as="span" 
          fontFamily="mono" 
          fontSize="xs" 
          color={darkMode ? 'gray.100' : 'gray.800'}
          wordBreak="break-word"
        >
          <Box as="span" fontWeight="bold" color="teal.300">{propKey}</Box>
          {!isComplexValue && (
            <>
              <Box as="span" color="gray.500">: </Box>
              <Box as="span" color="purple.400">{JSON.stringify(value)}</Box>
            </>
          )}
        </Text>
        {isComplexValue && (
          <JsonWithCheckboxes 
            value={value} 
            path={attrPath} 
            selected={selected} 
            onToggle={onToggle} 
            darkMode={darkMode} 
          />
        )}
      </Box>
    </Box>
  );
});

JsonProperty.displayName = 'JsonProperty';

const ArrayDisplay = memo<{
  value: unknown[];
  path: string[];
  selected: Record<string, boolean>;
  onToggle: (path: string[]) => void;
  darkMode: boolean;
}>(({ value, path, selected, onToggle, darkMode }) => (
  <Box pl={3} borderLeft="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.300'}>
    <Text as="span" fontFamily="mono" fontSize="xs" color={darkMode ? 'gray.400' : 'gray.600'}>
      [
    </Text>
    <JsonWithCheckboxes 
      value={value[0]} 
      path={[...path, '0']} 
      selected={selected} 
      onToggle={onToggle} 
      darkMode={darkMode} 
    />
    <Text as="span" fontFamily="mono" fontSize="xs" color={darkMode ? 'gray.400' : 'gray.600'}>
      ]
    </Text>
  </Box>
));

ArrayDisplay.displayName = 'ArrayDisplay';

export const JsonWithCheckboxes: React.FC<JsonWithCheckboxesProps> = memo(({ 
  value, 
  path, 
  selected, 
  onToggle, 
  darkMode 
}) => {
  if (Array.isArray(value)) {
    return (
      <ArrayDisplay 
        value={value} 
        path={path} 
        selected={selected} 
        onToggle={onToggle} 
        darkMode={darkMode} 
      />
    );
  }
  
  if (typeof value === 'object' && value !== null) {
    return (
      <Box pl={3} borderLeft="1px solid" borderColor={darkMode ? 'gray.700' : 'gray.300'}>
        {Object.entries(value).map(([key, val]) => (
          <JsonProperty
            key={key}
            propKey={key}
            value={val}
            path={path}
            selected={selected}
            onToggle={onToggle}
            darkMode={darkMode}
          />
        ))}
      </Box>
    );
  }
  
  return null;
});

JsonWithCheckboxes.displayName = 'JsonWithCheckboxes'; 