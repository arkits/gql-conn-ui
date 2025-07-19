import { useState, useCallback } from 'react';
import type { SelectedAttributes } from '../types/openapi';
import { collectPaths } from '../utils/openapi';

export function useSelection() {
  const [selectedAttrs, setSelectedAttrs] = useState<SelectedAttributes>({});

  const handleAttrToggle = useCallback((typeName: string, path: string[]) => {
    setSelectedAttrs(prev => {
      const typeAttrs = { ...(prev[typeName] || {}) };
      const key = path.join('.');
      typeAttrs[key] = !typeAttrs[key];
      return { ...prev, [typeName]: typeAttrs };
    });
  }, []);

  const handleSelectAllAttrs = useCallback((typeName: string, sample: any) => {
    setSelectedAttrs(prev => {
      const allPaths = collectPaths(sample);
      const typeAttrs = prev[typeName] || {};
      const allSelected = allPaths.every(path => typeAttrs[path]);
      
      if (allSelected) {
        // Deselect all
        return { ...prev, [typeName]: {} };
      } else {
        // Select all
        const newTypeAttrs: Record<string, boolean> = {};
        allPaths.forEach(path => { newTypeAttrs[path] = true; });
        return { ...prev, [typeName]: newTypeAttrs };
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAttrs({});
  }, []);

  return {
    selectedAttrs,
    handleAttrToggle,
    handleSelectAllAttrs,
    clearSelection
  };
}