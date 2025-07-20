import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface SettingsContextType {
  requiredScopes: string[][];
  setRequiredScopes: (scopes: string[][]) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [requiredScopes, setRequiredScopes] = useState<string[][]>([["test"]]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const value: SettingsContextType = {
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