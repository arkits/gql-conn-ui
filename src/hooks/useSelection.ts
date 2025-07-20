import { useState, useCallback } from 'react';
import type { SelectedAttributes, SelectedEndpoints } from '../types/openapi';
import { collectPaths } from '../utils/openapi';

export function useSelection() {
  const [selectedAttrs, setSelectedAttrs] = useState<SelectedAttributes>({});
  const [selectedEndpoints, setSelectedEndpoints] = useState<SelectedEndpoints>({});

  const handleAttrToggle = useCallback((
    typeName: string, 
    path: string[], 
    endpointPath?: string, 
    endpointMethod?: string
  ) => {
    setSelectedAttrs(prev => {
      const typeAttrs = { ...(prev[typeName] || {}) };
      const key = path.join('.');
      typeAttrs[key] = !typeAttrs[key];
      const newSelectedAttrs = { ...prev, [typeName]: typeAttrs };
      
      // Update selectedEndpoints based on the new selectedAttrs state
      if (endpointPath && endpointMethod) {
        const endpointKey = `${endpointMethod.toUpperCase()}_${endpointPath}`;
        setSelectedEndpoints(prevEndpoints => {
          // Check if there are any selected attributes for this type in the new state
          const hasSelectedAttrs = Object.values(typeAttrs).some(selected => selected);
          
          if (!hasSelectedAttrs) {
            // Remove endpoint if no attributes selected
            const { [endpointKey]: _, ...rest } = prevEndpoints;
            return rest;
          } else {
            // Update endpoint with current selectedAttrs for this type
            return {
              ...prevEndpoints,
              [endpointKey]: {
                path: endpointPath,
                method: endpointMethod.toUpperCase(),
                typeName,
                selectedAttrs: typeAttrs
              }
            };
          }
        });
      }
      
      return newSelectedAttrs;
    });
  }, []);

  const handleSelectAllAttrs = useCallback((
    typeName: string, 
    sample: any, 
    endpointPath?: string, 
    endpointMethod?: string
  ) => {
    setSelectedAttrs(prev => {
      const allPaths = collectPaths(sample);
      const typeAttrs = prev[typeName] || {};
      const allSelected = allPaths.every(path => typeAttrs[path]);
      
      let newTypeAttrs: Record<string, boolean>;
      if (allSelected) {
        // Deselect all
        newTypeAttrs = {};
      } else {
        // Select all
        newTypeAttrs = {};
        allPaths.forEach(path => { newTypeAttrs[path] = true; });
      }
      
      const newSelectedAttrs = { ...prev, [typeName]: newTypeAttrs };
      
      // Update selectedEndpoints based on the new selectedAttrs state
      if (endpointPath && endpointMethod) {
        const endpointKey = `${endpointMethod.toUpperCase()}_${endpointPath}`;
        setSelectedEndpoints(prevEndpoints => {
          if (allSelected) {
            // Deselect all - remove endpoint
            const { [endpointKey]: _, ...rest } = prevEndpoints;
            return rest;
          } else {
            // Select all - add/update endpoint
            return {
              ...prevEndpoints,
              [endpointKey]: {
                path: endpointPath,
                method: endpointMethod.toUpperCase(),
                typeName,
                selectedAttrs: newTypeAttrs
              }
            };
          }
        });
      }
      
      return newSelectedAttrs;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAttrs({});
    setSelectedEndpoints({});
  }, []);

  return {
    selectedAttrs,
    selectedEndpoints,
    handleAttrToggle,
    handleSelectAllAttrs,
    clearSelection
  };
}