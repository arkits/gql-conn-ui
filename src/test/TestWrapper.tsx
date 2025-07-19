import React from 'react';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

const system = createSystem(defaultConfig);

export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChakraProvider value={system}>
      {children}
    </ChakraProvider>
  );
};