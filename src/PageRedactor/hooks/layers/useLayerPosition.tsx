import { useCallback } from 'react';
import type { Layer, ShapeLayerData } from '../../types/Layer';
import { SHAPE_REGISTRY } from '../../constants/shapeRegistry';

type MutateFn = (mutation: (prevLayers: Layer[]) => Layer[]) => void;

export function useLayerPosition(mutate: MutateFn) {
  const updateLayerPosition = useCallback(
    (id: string, x: number, y: number, width?: number, height?: number, rotation?: number) => {
      mutate(prev =>
        prev.map(layer => {
          if (layer.id !== id) return layer;

          const updated = {
            ...layer,
            x, y,
            ...(width !== undefined && { width }),
            ...(height !== undefined && { height }),
            ...(rotation !== undefined && { rotation })
          };

          // Синхронизируем data
          if (updated.data) {
            updated.data = {
              ...updated.data,
              ...(width !== undefined && { width }),
              ...(height !== undefined && { height })
            };
          }

          // Обновляем shapeConfig через реестр
          if (updated.runtime?.shapeConfig && layer.type === 'shape' && layer.data.type === 'shape') {
            const def = SHAPE_REGISTRY[layer.data.shapeType];
            if (def) {
              const w = width ?? layer.width ?? 100;
              const h = height ?? layer.height ?? 100;
              updated.runtime.shapeConfig = def.updateConfig(updated.runtime.shapeConfig, w, h);

              if (layer.data.shapeType === 'circle') {
                (updated.data as ShapeLayerData).radius = Math.min(w, h) / 2;
              }
            }
          }

          return updated;
        })
      );
    },
    [mutate]
  );

  const updateMultipleLayers = useCallback(
    (updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }>) => {
      mutate(prev => {
        let newLayers = [...prev];

        updates.forEach(update => {
          newLayers = newLayers.map(layer => {
            if (layer.id !== update.id) return layer;

            const updated = { ...layer, ...update };

            if (updated.data) {
              updated.data = {
                ...updated.data,
                ...(update.width !== undefined && { width: update.width }),
                ...(update.height !== undefined && { height: update.height })
              };
            }

            if (updated.runtime?.shapeConfig && layer.type === 'shape' && layer.data.type === 'shape') {
              const def = SHAPE_REGISTRY[layer.data.shapeType];
              if (def) {
                const w = update.width ?? layer.width ?? 100;
                const h = update.height ?? layer.height ?? 100;
                updated.runtime.shapeConfig = def.updateConfig(updated.runtime.shapeConfig, w, h);

                if (layer.data.shapeType === 'circle') {
                  (updated.data as ShapeLayerData).radius = Math.min(w, h) / 2;
                }
              }
            }

            return updated;
          });
        });

        return newLayers;
      });
    },
    [mutate]
  );

  const moveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      mutate(prev => {
        const index = prev.findIndex(l => l.id === id);
        if (index === -1) return prev;
        if (direction === 'up' && index === prev.length - 1) return prev;
        if (direction === 'down' && index === 0) return prev;

        const newIndex = direction === 'up' ? index + 1 : index - 1;
        const newLayers = [...prev];
        [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

        return newLayers.map((layer, idx) => ({ ...layer, zIndex: idx }));
      });
    },
    [mutate]
  );

  return { updateLayerPosition, updateMultipleLayers, moveLayer };
}