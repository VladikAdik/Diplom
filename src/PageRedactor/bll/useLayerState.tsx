import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import type { Layer } from '../types/Layer';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useLayerState() {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
    const layerRefs = useRef<Map<string, Konva.Layer>>(new Map());

    // ====== CRUD ======

    const addLayer = useCallback((layer: Omit<Layer, 'id' | 'zIndex'>, layers: Layer[]): Layer[] => {
        const newLayer: Layer = {
            ...layer,
            id: generateId(),
            zIndex: layers.length,
            runtime: layer.runtime || undefined,
            data: layer.data
        };
        return [...layers, newLayer];
    }, []);

    const removeLayer = useCallback((id: string, layers: Layer[]): Layer[] => {
        layerRefs.current.delete(id);
        return layers.filter(l => l.id !== id);
    }, []);

    const updateLayer = useCallback((id: string, updates: Partial<Layer>, layers: Layer[]): Layer[] => {
        return layers.map(layer =>
            layer.id === id ? { ...layer, ...updates } : layer
        );
    }, []);

    const updateMultipleLayers = useCallback((
        updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number; data?: Layer['data'] }>,
        layers: Layer[]
    ): Layer[] => {
        let newLayers = [...layers];
        updates.forEach(update => {
            newLayers = newLayers.map(layer =>
                layer.id === update.id ? {
                    ...layer,
                    ...update,
                    data: update.data ? { ...layer.data, ...update.data } : layer.data
                } : layer
            );
        });
        return newLayers;
    }, []);

    const moveLayer = useCallback((id: string, direction: 'up' | 'down', layers: Layer[]): Layer[] => {
        const index = layers.findIndex(l => l.id === id);
        if (index === -1) return layers;
        if (direction === 'up' && index === layers.length - 1) return layers;
        if (direction === 'down' && index === 0) return layers;

        const newIndex = direction === 'up' ? index + 1 : index - 1;
        const newLayers = [...layers];
        [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

        return newLayers.map((layer, idx) => ({ ...layer, zIndex: idx }));
    }, []);

    // ====== ВЫДЕЛЕНИЕ ======

    const selectLayer = useCallback((id: string, multiSelect: boolean, currentSelected: Set<string>): Set<string> => {
        const newSet = new Set(multiSelect ? currentSelected : []);
        if (multiSelect && newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    }, []);

    const clearSelection = useCallback((): Set<string> => new Set(), []);

    const selectAll = useCallback((layers: Layer[]): Set<string> => {
        return new Set(layers.map(l => l.id));
    }, []);

    const removeFromSelection = useCallback((id: string, currentSelected: Set<string>): Set<string> => {
        const newSelected = new Set(currentSelected);
        newSelected.delete(id);
        return newSelected;
    }, []);

    return {
        // State
        layers,
        setLayers,
        selectedLayerIds,
        setSelectedLayerIds,
        layerRefs,

        // Pure functions (не меняют state, возвращают новые значения)
        addLayer,
        removeLayer,
        updateLayer,
        updateMultipleLayers,
        moveLayer,
        selectLayer,
        clearSelection,
        selectAll,
        removeFromSelection,
    };
}