import { useState, useCallback, useRef, useEffect } from 'react';
import type { Layer, ShapeConfig, TextConfig } from '../../types/Layer';
import type Konva from 'konva';
import { generateId, createImageLayerData, createShapeLayerData, createTextLayerData, duplicateLayerData } from './createLayers';
import { toSnapshot, fromSnapshot } from './layerToHistory';
import { useLayerSelection } from './useLayerSelection';
import { useLayerPosition } from './useLayerPosition';
import { useHistory } from '../workspace';
import { useSnapMove, type SnapGuide } from '../interaction';
import { useFilters } from '../tools';

export function useLayers(stageSize: { width: number; height: number }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const layerRefs = useRef<Map<string, Konva.Group>>(new Map());
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  const { saveState, undo: undoHistory, redo: redoHistory, canUndo, canRedo, clearHistory } = useHistory();
  const { selectedIds, setSelectedIds, selectLayer, clearSelection, selectAll, removeFromSelection } = useLayerSelection();

  // Синхронизируем ref с актуальным selectedIds
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Единая точка мутации с сохранением в историю
  const mutate = useCallback(
    (mutation: (prevLayers: Layer[]) => Layer[]) => {
      setLayers(prev => {
        const next = mutation(prev);
        saveState(next.map(toSnapshot), selectedIdsRef.current);
        return next;
      });
    },
    [saveState]
  );

  const { updateLayerPosition, updateMultipleLayers, moveLayer } = useLayerPosition(mutate);

  // Фильтры
  const { previewFilter, applyFilter, cancelPreview } = useFilters(layers, setLayers, mutate);

  // ============================================================
  // CRUD операции
  // ============================================================

  const addLayer = useCallback(
    (layerData: Omit<Layer, 'id' | 'zIndex'>) => {
      mutate(prev => {
        const newLayer: Layer = {
          ...layerData,
          id: generateId(),
          zIndex: prev.length
        };
        selectLayer(newLayer.id);
        return [...prev, newLayer];
      });
    },
    [mutate, selectLayer]
  );

  const addImageLayer = useCallback(
    (image: HTMLImageElement, centerX: number, centerY: number) => {
      addLayer(createImageLayerData(image, centerX, centerY));
    },
    [addLayer]
  );

  const addShapeLayer = useCallback(
    (shapeType: string, x = 100, y = 100, config?: ShapeConfig) => {
      addLayer(createShapeLayerData(shapeType, x, y, config));
    },
    [addLayer]
  );

  const addTextLayer = useCallback(
    (text = 'Новый текст', x = 100, y = 100, config?: TextConfig) => {
      addLayer(createTextLayerData(text, x, y, config));
    },
    [addLayer]
  );

  const duplicateLayer = useCallback(
    (id: string) => {
      const layer = layers.find(l => l.id === id);
      if (layer) addLayer(duplicateLayerData(layer));
    },
    [layers, addLayer]
  );

  const removeLayer = useCallback(
    (id: string) => {
      mutate(prev => {
        layerRefs.current.delete(id);
        return prev.filter(l => l.id !== id);
      });
      removeFromSelection(id);
    },
    [mutate, removeFromSelection]
  );

  const updateLayer = useCallback(
    (id: string, updates: Partial<Layer>) => {
      mutate(prev =>
        prev.map(layer => layer.id === id ? { ...layer, ...updates } : layer)
      );
    },
    [mutate]
  );

  const addCanvasLayer = useCallback((width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const dataURL = canvas.toDataURL();
    canvas.remove();

    addLayer({
      name: 'Холст',
      visible: true,
      locked: false,
      opacity: 1,
      type: 'canvas',
      x: 0, y: 0,
      width, height,
      rotation: 0,
      data: { type: 'canvas', src: dataURL, width, height },
      runtime: {},
    });
  }, [addLayer]);

  // ============================================================
  // Операции без сохранения в историю
  // ============================================================

  const toggleVisibility = useCallback((id: string) => {
    setLayers(prev =>
      prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
    );
  }, []);

  const toggleLock = useCallback((id: string) => {
    setLayers(prev =>
      prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l)
    );
  }, []);

  const setOpacity = useCallback((id: string, opacity: number) => {
    setLayers(prev =>
      prev.map(l => l.id === id ? { ...l, opacity } : l)
    );
  }, []);

  // ============================================================
  // Drag & Snapping
  // ============================================================

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number, saveHistory: boolean) => {
      if (saveHistory) {
        mutate(prev =>
          prev.map(layer => layer.id === id ? { ...layer, x, y } : layer)
        );
      } else {
        setLayers(prev =>
          prev.map(layer => layer.id === id ? { ...layer, x, y } : layer)
        );
      }
    },
    [mutate]
  );

  const { handleDragMove, handleDragEnd } = useSnapMove({
    layers,
    stageSize,
    setSnapGuides,
    onPositionChange: handlePositionChange,
  });

  // ============================================================
  // Undo / Redo
  // ============================================================

  const undo = useCallback(async () => {
    const state = await undoHistory();
    if (state) {
      layerRefs.current.clear();
      const restoredLayers = await Promise.all(state.layers.map(fromSnapshot));
      setLayers(restoredLayers);
      setSelectedIds(new Set(state.selectedIds));
    }
  }, [undoHistory, setSelectedIds]);

  const redo = useCallback(async () => {
    const state = await redoHistory();
    if (state) {
      layerRefs.current.clear();
      const restoredLayers = await Promise.all(state.layers.map(fromSnapshot));
      setLayers(restoredLayers);
      setSelectedIds(new Set(state.selectedIds));
    }
  }, [redoHistory, setSelectedIds]);

  const clearAll = useCallback(() => {
    setLayers([]);
    clearSelection();
    layerRefs.current.clear();
    clearHistory();
  }, [clearSelection, clearHistory]);

  // ============================================================
  // Экспорт
  // ============================================================

  return {
    layers,
    selectedLayerIds: selectedIds,
    layerRefs,

    addLayer,
    addImageLayer,
    addShapeLayer,
    addTextLayer,
    addCanvasLayer,
    duplicateLayer,
    removeLayer,
    updateLayer,
    updateLayerPosition,
    updateMultipleLayers,
    moveLayer,

    snapGuides,
    handleDragMove,
    handleDragEnd,

    toggleVisibility,
    toggleLock,
    setOpacity,

    selectLayer,
    clearSelection,
    selectAll: () => selectAll(layers),

    undo,
    redo,
    canUndo,
    canRedo,
    clearAll,

    previewFilter,
    applyFilter,
    cancelPreview,
    setLayersDirect: setLayers,
  };
}