import { createContext } from 'react';

interface SettingsContextType {
  requiredScopes: string[][];
  setRequiredScopes: (scopes: string[][]) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined); 