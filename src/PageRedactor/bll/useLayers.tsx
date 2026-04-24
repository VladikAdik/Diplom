import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import type { Layer } from '../types/Layer';
import { useHistory } from './useHistory';

export function useLayers() {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
    const layerRefs = useRef<Map<string, Konva.Layer>>(new Map());
    const { saveState, undo: undoHistory, redo: redoHistory, canUndo, canRedo, clearHistory } = useHistory();

    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const saveCurrentStateInternal = useCallback((newLayers: Layer[], newSelectedIds: Set<string>, isIntermediate: boolean = false) => {
        saveState(newLayers, newSelectedIds, isIntermediate);
    }, [saveState]);

    const saveCurrentState = useCallback((isIntermediate: boolean = false) => {
        setLayers(currentLayers => {
            setSelectedLayerIds(currentSelectedIds => {
                saveState(currentLayers, currentSelectedIds, isIntermediate);
                return currentSelectedIds;
            });
            return currentLayers;
        });
    }, [saveState]);

    const addLayer = useCallback((layer: Omit<Layer, 'id' | 'zIndex'>) => {
        setLayers(prev => {
            const newLayer: Layer = {
                ...layer,
                id: generateId(),
                zIndex: prev.length,
                runtime: layer.runtime || undefined,
                data: layer.data
            };
            const newLayers = [...prev, newLayer];
            saveCurrentStateInternal(newLayers, selectedLayerIds);
            return newLayers;
        });
    }, [generateId, saveCurrentStateInternal, selectedLayerIds]);

    const addImageLayer = useCallback((image: HTMLImageElement, x: number = 100, y: number = 100) => {
        addLayer({
            name: `Изображение ${layers.length + 1}`,
            visible: true,
            locked: false,
            opacity: 1,
            type: 'image',
            x,
            y,
            width: image.width,
            height: image.height,
            rotation: 0,
            data: { type: 'image', src: '', width: image.width, height: image.height },
            runtime: { imageElement: image }
        });
    }, [layers.length, addLayer]);

    const addShapeLayer = useCallback((shapeType: 'rect' | 'circle' | 'ellipse' | 'line', x: number = 100, y: number = 100) => {
        addLayer({
            name: `${shapeType} ${layers.length + 1}`,
            visible: true,
            locked: false,
            opacity: 1,
            type: 'shape',
            x,
            y,
            width: 100,
            height: 100,
            rotation: 0,
            data: {
                type: 'shape',
                shapeType: shapeType,
                fill: '#cccccc',
                stroke: '#000000',
                strokeWidth: 2,
                width: 100,
                height: 100
            }
        });
    }, [layers.length, addLayer]);

    const addTextLayer = useCallback((text: string = 'Новый текст', x: number = 100, y: number = 100) => {
        addLayer({
            name: `Текст ${layers.length + 1}`,
            visible: true,
            locked: false,
            opacity: 1,
            type: 'text',
            x,
            y,
            width: 200,
            height: 50,
            rotation: 0,
            data: {
                type: 'text',
                text,
                fontSize: 16,
                fontFamily: 'Arial',
                fill: '#000000',
                align: 'left',
                width: 200,
                height: 50
            }
        });
    }, [layers.length, addLayer]);

    const removeLayer = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.filter(l => l.id !== id);
            layerRefs.current.delete(id);
            
            setSelectedLayerIds(prevSelected => {
                const newSelectedIds = new Set(prevSelected);
                newSelectedIds.delete(id);
                saveCurrentStateInternal(newLayers, newSelectedIds);
                return newSelectedIds;
            });
            
            return newLayers;
        });
    }, [saveCurrentStateInternal]);

    const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
        setSelectedLayerIds(prev => {
            const newSet = new Set(multiSelect ? prev : []);
            if (multiSelect && newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedLayerIds(new Set());
    }, []);

    const selectAll = useCallback(() => {
        setSelectedLayerIds(new Set(layers.map(l => l.id)));
    }, [layers]);

    const toggleVisibility = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id ? { ...layer, visible: !layer.visible } : layer
            );
            saveCurrentStateInternal(newLayers, selectedLayerIds);
            return newLayers;
        });
    }, [selectedLayerIds, saveCurrentStateInternal]);

    const toggleLock = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id ? { ...layer, locked: !layer.locked } : layer
            );
            saveCurrentStateInternal(newLayers, selectedLayerIds);
            return newLayers;
        });
    }, [selectedLayerIds, saveCurrentStateInternal]);

    const setOpacity = useCallback((id: string, opacity: number) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id ? { ...layer, opacity } : layer
            );

            const konvaLayer = layerRefs.current.get(id);
            if (konvaLayer) {
                konvaLayer.opacity(opacity);
                konvaLayer.getLayer()?.batchDraw();
            }

            saveCurrentStateInternal(newLayers, selectedLayerIds);
            return newLayers;
        });
    }, [selectedLayerIds, saveCurrentStateInternal]);

    const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === id);
            if (index === -1) return prev;
            if (direction === 'up' && index === prev.length - 1) return prev;
            if (direction === 'down' && index === 0) return prev;

            const newIndex = direction === 'up' ? index + 1 : index - 1;
            const newLayers = [...prev];
            [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

            const reindexedLayers = newLayers.map((layer, idx) => ({
                ...layer,
                zIndex: idx
            }));

            saveCurrentStateInternal(reindexedLayers, selectedLayerIds);
            return reindexedLayers;
        });
    }, [selectedLayerIds, saveCurrentStateInternal]);

    const updateLayerPosition = useCallback((id: string, x: number, y: number, width?: number, height?: number, rotation?: number, isIntermediate: boolean = false) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id
                    ? {
                        ...layer,
                        x,
                        y,
                        ...(width !== undefined && { width }),
                        ...(height !== undefined && { height }),
                        ...(rotation !== undefined && { rotation }),
                        data: {
                            ...layer.data,
                            ...(width !== undefined && { width }),
                            ...(height !== undefined && { height })
                        }
                    }
                    : layer
            );

            if (!isIntermediate) {
                saveCurrentStateInternal(newLayers, selectedLayerIds, false);
            }
            return newLayers;
        });
    }, [selectedLayerIds, saveCurrentStateInternal]);

    const updateMultipleLayers = useCallback((updates: Array<{
        id: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        rotation?: number;
    }>, isIntermediate: boolean = false) => {
        setLayers(prev => {
            let newLayers = [...prev];
            updates.forEach(update => {
                newLayers = newLayers.map(layer =>
                    layer.id === update.id
                        ? {
                            ...layer,
                            ...(update.x !== undefined && { x: update.x }),
                            ...(update.y !== undefined && { y: update.y }),
                            ...(update.width !== undefined && { width: update.width }),
                            ...(update.height !== undefined && { height: update.height }),
                            ...(update.rotation !== undefined && { rotation: update.rotation }),
                            data: {
                                ...layer.data,
                                ...(update.width !== undefined && { width: update.width }),
                                ...(update.height !== undefined && { height: update.height })
                            }
                        }
                        : layer
                );
            });

            if (!isIntermediate) {
                saveCurrentStateInternal(newLayers, selectedLayerIds, false);
            }
            return newLayers;
        });
    }, [selectedLayerIds, saveCurrentStateInternal]);

    const restoreState = useCallback((newLayers: Layer[], newSelectedIds: Set<string>) => {
        setLayers(newLayers);
        setSelectedLayerIds(newSelectedIds);
    }, []);

    const duplicateLayer = useCallback((id: string) => {
        const layerToDuplicate = layers.find(l => l.id === id);
        if (!layerToDuplicate) return;

        addLayer({
            name: `${layerToDuplicate.name} (копия)`,
            visible: layerToDuplicate.visible,
            locked: false,
            opacity: layerToDuplicate.opacity,
            type: layerToDuplicate.type,
            data: layerToDuplicate.data,
            x: (layerToDuplicate.x ?? 100) + 20,
            y: (layerToDuplicate.y ?? 100) + 20,
            width: layerToDuplicate.width,
            height: layerToDuplicate.height,
            rotation: layerToDuplicate.rotation
        });
    }, [layers, addLayer]);

    const undo = useCallback(async () => {
        const state = await undoHistory();
        if (state) {
            layerRefs.current.clear();
            setLayers(state.layers);
            setSelectedLayerIds(state.selectedLayerIds);
        }
    }, [undoHistory]);

    const redo = useCallback(async () => {
        const state = await redoHistory();
        if (state) {
            layerRefs.current.clear();
            setLayers(state.layers);
            setSelectedLayerIds(state.selectedLayerIds);
        }
    }, [redoHistory]);

    const clearAll = useCallback(() => {
        setLayers([]);
        setSelectedLayerIds(new Set());
        layerRefs.current.clear();
        clearHistory();
    }, [clearHistory]);

    return {
        layers,
        selectedLayerIds,
        setSelectedLayerIds,
        selectLayer,
        clearSelection,
        selectAll,
        layerRefs,
        addLayer,
        addImageLayer,
        addShapeLayer,
        addTextLayer,
        removeLayer,
        toggleVisibility,
        toggleLock,
        setOpacity,
        moveLayer,
        updateLayerPosition,
        updateMultipleLayers,
        saveCurrentState,
        restoreState,
        duplicateLayer,
        undo,
        redo,
        canUndo,
        canRedo,
        clearAll
    };
}