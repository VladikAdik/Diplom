import { useState, useCallback } from 'react';
import type { Layer } from '../../types/Layer';

export function useLayerSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
    setSelectedIds(prev => {
      const next = new Set(multiSelect ? prev : []);
      if (multiSelect && next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback((layers: Layer[]) => {
    setSelectedIds(new Set(layers.map(l => l.id)));
  }, []);

  const removeFromSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    selectLayer,
    clearSelection,
    selectAll,
    removeFromSelection,
  };
}