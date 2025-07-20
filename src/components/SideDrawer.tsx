import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
  Heading,
  Drawer,
  Portal,
  CloseButton,
} from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose, darkMode }) => {
  const { requiredScopes, setRequiredScopes } = useSettings();
  const [tempScopes, setTempScopes] = useState<string[][]>(requiredScopes);

  const handleSave = () => {
    setRequiredScopes(tempScopes);
    onClose();
  };

  const handleCancel = () => {
    setTempScopes(requiredScopes);
    onClose();
  };

  const addScopeGroup = () => {
    setTempScopes([...tempScopes, ['']]);
  };

  const removeScopeGroup = (index: number) => {
    if (tempScopes.length > 1) {
      setTempScopes(tempScopes.filter((_, i) => i !== index));
    }
  };

  const updateScopeGroup = (groupIndex: number, scopeIndex: number, value: string) => {
    const newScopes = [...tempScopes];
    if (!newScopes[groupIndex]) {
      newScopes[groupIndex] = [];
    }
    newScopes[groupIndex][scopeIndex] = value;
    setTempScopes(newScopes);
  };

  const addScopeToGroup = (groupIndex: number) => {
    const newScopes = [...tempScopes];
    if (!newScopes[groupIndex]) {
      newScopes[groupIndex] = [];
    }
    newScopes[groupIndex].push('');
    setTempScopes(newScopes);
  };

  const removeScopeFromGroup = (groupIndex: number, scopeIndex: number) => {
    const newScopes = [...tempScopes];
    if (newScopes[groupIndex] && newScopes[groupIndex].length > 1) {
      newScopes[groupIndex] = newScopes[groupIndex].filter((_, i) => i !== scopeIndex);
      setTempScopes(newScopes);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            bg={darkMode ? 'gray.800' : 'white'}
            borderLeft="1px solid"
            borderColor={darkMode ? 'gray.700' : 'gray.200'}
          >
            <Drawer.Header
              bg={darkMode ? 'gray.900' : 'gray.50'}
              borderBottom="1px solid"
              borderColor={darkMode ? 'gray.700' : 'gray.200'}
            >
              <Drawer.Title color={darkMode ? 'gray.100' : 'gray.800'}>
                Settings
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color={darkMode ? 'gray.400' : 'gray.600'}
                  _hover={{ bg: darkMode ? 'gray.700' : 'gray.200' }}
                />
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body p={6}>
              <VStack gap={6} align="stretch">
                {/* Required Scopes Section */}
                <Box>
                  <Heading size="sm" mb={4} color={darkMode ? 'gray.100' : 'gray.800'}>
                    Required Scopes
                  </Heading>
                  <Text fontSize="sm" color={darkMode ? 'gray.400' : 'gray.600'} mb={4}>
                    Configure the default scopes for the @requiredScopes directive. Each group represents an OR condition.
                  </Text>

                  <VStack gap={4} align="stretch">
                    {tempScopes.map((scopeGroup, groupIndex) => (
                      <Box
                        key={groupIndex}
                        p={4}
                        border="1px solid"
                        borderColor={darkMode ? 'gray.600' : 'gray.300'}
                        borderRadius="md"
                        bg={darkMode ? 'gray.700' : 'gray.50'}
                      >
                        <HStack justify="space-between" mb={3}>
                          <Text fontSize="sm" fontWeight="medium" color={darkMode ? 'gray.300' : 'gray.700'}>
                            Scope Group {groupIndex + 1}
                          </Text>
                          <IconButton
                            aria-label="Remove scope group"
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeScopeGroup(groupIndex)}
                            disabled={tempScopes.length === 1}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </HStack>

                        <VStack gap={2} align="stretch">
                          {scopeGroup.map((scope, scopeIndex) => (
                            <HStack key={scopeIndex} gap={2}>
                              <Input
                                value={scope}
                                onChange={(e) => updateScopeGroup(groupIndex, scopeIndex, e.target.value)}
                                placeholder="Enter scope name"
                                size="sm"
                                bg={darkMode ? 'gray.600' : 'white'}
                                borderColor={darkMode ? 'gray.500' : 'gray.300'}
                                color={darkMode ? 'gray.100' : 'gray.800'}
                                _focus={{ borderColor: 'teal.400' }}
                              />
                              <IconButton
                                aria-label="Remove scope"
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => removeScopeFromGroup(groupIndex, scopeIndex)}
                                disabled={scopeGroup.length === 1}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </HStack>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addScopeToGroup(groupIndex)}
                            colorScheme="teal"
                          >
                            <Plus size={14} />
                            Add Scope
                          </Button>
                        </VStack>
                      </Box>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addScopeGroup}
                      colorScheme="teal"
                    >
                      <Plus size={16} />
                      Add Scope Group
                    </Button>
                  </VStack>
                </Box>

                <Box borderTop="1px solid" borderColor={darkMode ? 'gray.600' : 'gray.300'} pt={4} />

                {/* Action Buttons */}
                <HStack gap={3} justify="flex-end">
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button colorScheme="teal" onClick={handleSave}>
                    Save Settings
                  </Button>
                </HStack>
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}; 