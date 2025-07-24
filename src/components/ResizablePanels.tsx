import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box } from '@chakra-ui/react';

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  darkMode: boolean;
}

export const ResizablePanels: React.FC<ResizablePanelsProps> = ({ leftPanel, rightPanel, darkMode }) => {
  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={40} minSize={20}>
        {leftPanel}
      </Panel>
      <PanelResizeHandle>
        <Box
          w="2"
          bg={darkMode ? 'gray.700' : 'gray.200'}
          _hover={{ bg: darkMode ? 'blue.500' : 'blue.300' }}
          h="100%"
        />
      </PanelResizeHandle>
      <Panel defaultSize={60} minSize={30}>
        {rightPanel}
      </Panel>
    </PanelGroup>
  );
};
