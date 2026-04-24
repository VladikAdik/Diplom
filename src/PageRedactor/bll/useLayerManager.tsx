import { useCallback, useEffect, useRef } from 'react';
import { useLayerState } from './useLayerState';
import { useHistory } from './useHistory';
import { useLayerFactory } from './useLayerFactory';
import type { Layer } from '../types/Layer';

export function useLayerManager() {
    const {
        layers,
        setLayers,
        selectedLayerIds,
        setSelectedLayerIds,
        layerRefs,
        addLayer: addLayerPure,
        removeLayer: removeLayerPure,
        updateLayer: updateLayerPure,
        updateMultipleLayers: updateMultipleLayersPure,
        moveLayer: moveLayerPure,
        selectLayer: selectLayerPure,
        clearSelection: clearSelectionPure,
        removeFromSelection: removeFromSelectionPure,
    } = useLayerState();

    const { saveState, undo: undoHistory, redo: redoHistory, canUndo, canRedo, clearHistory } = useHistory();
    const { createImageLayer, createShapeLayer, createTextLayer, duplicateLayer } = useLayerFactory();

    // Ref для актуального выделения
    const selectedIdsRef = useRef(selectedLayerIds);
    useEffect(() => {
        selectedIdsRef.current = selectedLayerIds;
    }, [selectedLayerIds]);

    // ====== ОПЕРАЦИИ С АВТОСОХРАНЕНИЕМ ======

    const applyAndSave = useCallback((updater: (prev: Layer[]) => Layer[]) => {
        setLayers(prev => {
            const newLayers = updater(prev);
            saveState(newLayers, selectedIdsRef.current);
            return newLayers;
        });
    }, [setLayers, saveState]);

    const addLayer = useCallback((layerData: Omit<Layer, 'id' | 'zIndex'>) => {
        applyAndSave(prev => addLayerPure(layerData, prev));
    }, [applyAndSave, addLayerPure]);

    const removeLayer = useCallback((id: string) => {
        applyAndSave(prev => {
            const newLayers = removeLayerPure(id, prev);
            setSelectedLayerIds(prevSelected => removeFromSelectionPure(id, prevSelected));
            return newLayers;
        });
    }, [applyAndSave, removeLayerPure, removeFromSelectionPure, setSelectedLayerIds]);

    const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
        applyAndSave(prev => moveLayerPure(id, direction, prev));
    }, [applyAndSave, moveLayerPure]);

    const updateLayerPosition = useCallback((id: string, x: number, y: number, width?: number, height?: number, rotation?: number) => {
        applyAndSave(prev => {
            const existingLayer = prev.find(l => l.id === id);
            if (!existingLayer) return prev;

            return updateLayerPure(id, {
                x, y,
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...(rotation !== undefined && { rotation }),
                data: {
                    ...existingLayer.data,
                    ...(width !== undefined && { width }),
                    ...(height !== undefined && { height })
                }
            } as Partial<Layer>, prev);
        });
    }, [applyAndSave, updateLayerPure]);

    const updateMultipleLayers = useCallback((updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }>) => {
        applyAndSave(prev => {
            const processedUpdates = updates.map(update => {
                const existingLayer = prev.find(l => l.id === update.id);
                return {
                    ...update,
                    ...(existingLayer && {
                        data: {
                            ...existingLayer.data,
                            ...(update.width !== undefined && { width: update.width }),
                            ...(update.height !== undefined && { height: update.height })
                        }
                    })
                };
            });
            return updateMultipleLayersPure(processedUpdates, prev);
        });
    }, [applyAndSave, updateMultipleLayersPure]);

    // ====== ОПЕРАЦИИ БЕЗ СОХРАНЕНИЯ ======

    const toggleVisibility = useCallback((id: string) => {
        setLayers(prev => {
            const layer = prev.find(l => l.id === id);
            if (!layer) return prev;
            return updateLayerPure(id, { visible: !layer.visible }, prev);
        });
    }, [setLayers, updateLayerPure]);

    const toggleLock = useCallback((id: string) => {
        setLayers(prev => {
            const layer = prev.find(l => l.id === id);
            if (!layer) return prev;
            return updateLayerPure(id, { locked: !layer.locked }, prev);
        });
    }, [setLayers, updateLayerPure]);

    const setOpacity = useCallback((id: string, opacity: number) => {
        setLayers(prev => updateLayerPure(id, { opacity }, prev));
    }, [setLayers, updateLayerPure]);

    // ====== ВЫДЕЛЕНИЕ ======

    const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
        setSelectedLayerIds(prev => selectLayerPure(id, multiSelect, prev));
    }, [setSelectedLayerIds, selectLayerPure]);

    const clearSelection = useCallback(() => {
        setSelectedLayerIds(clearSelectionPure());
    }, [setSelectedLayerIds, clearSelectionPure]);

    const selectAll = useCallback(() => {
        setSelectedLayerIds(new Set(layers.map(l => l.id)));
    }, [setSelectedLayerIds, layers]);

    // ====== UNDO / REDO ======

    const undo = useCallback(async () => {
        const state = await undoHistory();
        if (state) {
            layerRefs.current.clear();
            setLayers(state.layers);
            setSelectedLayerIds(state.selectedLayerIds);
        }
    }, [undoHistory, layerRefs, setLayers, setSelectedLayerIds]);

    const redo = useCallback(async () => {
        const state = await redoHistory();
        if (state) {
            layerRefs.current.clear();
            setLayers(state.layers);
            setSelectedLayerIds(state.selectedLayerIds);
        }
    }, [redoHistory, layerRefs, setLayers, setSelectedLayerIds]);

    const clearAll = useCallback(() => {
        setLayers([]);
        setSelectedLayerIds(new Set());
        layerRefs.current.clear();
        clearHistory();
    }, [setLayers, setSelectedLayerIds, layerRefs, clearHistory]);

    // ====== ФАБРИКИ (удобные обёртки) ======

    const addImageLayer = useCallback((image: HTMLImageElement, x?: number, y?: number) => {
        addLayer(createImageLayer(image, x, y));
    }, [addLayer, createImageLayer]);

    const addShapeLayer = useCallback((shapeType: 'rect' | 'circle' | 'ellipse' | 'line', x?: number, y?: number) => {
        addLayer(createShapeLayer(shapeType, x, y));
    }, [addLayer, createShapeLayer]);

    const addTextLayer = useCallback((text?: string, x?: number, y?: number) => {
        addLayer(createTextLayer(text, x, y));
    }, [addLayer, createTextLayer]);

    const duplicateLayerById = useCallback((id: string) => {
        const layer = layers.find(l => l.id === id);
        if (layer) {
            addLayer(duplicateLayer(layer));
        }
    }, [layers, addLayer, duplicateLayer]);

    return {
        layers,
        selectedLayerIds,
        layerRefs,

        // CRUD
        addLayer,
        removeLayer,
        updateLayerPosition,
        updateMultipleLayers,
        moveLayer,

        // Фабрики
        addImageLayer,
        addShapeLayer,
        addTextLayer,
        duplicateLayer: duplicateLayerById,

        // Свойства (без undo)
        toggleVisibility,
        toggleLock,
        setOpacity,

        // Выделение
        selectLayer,
        clearSelection,
        selectAll,

        // Undo/Redo
        undo,
        redo,
        canUndo,
        canRedo,
        clearAll,
    };
}