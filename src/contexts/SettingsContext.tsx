import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { SettingsContext } from './SettingsContextDef';

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [requiredScopes, setRequiredScopes] = useState<string[][]>([["test"]]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const value = {
    requiredScopes,
    setRequiredScopes,
    isDrawerOpen,
    setIsDrawerOpen,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 