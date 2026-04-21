import { useCallback, useRef, useState } from 'react';
import type { Layer } from '../types/Layer';
import { RuntimeFactory } from './runtimeFactory';

interface HistoryState {
    layers: Layer[];
    selectedLayerIds: Set<string>;
}

export function useHistory() {
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyLength, setHistoryLength] = useState(0);
    const historyRef = useRef<HistoryState[]>([]);
    const isUndoRedoRef = useRef(false);

    // Сохранить состояние
    const saveState = useCallback((layers: Layer[], selectedIds: Set<string>, isIntermediate: boolean = false) => {
        if (isIntermediate) return;
        if (isUndoRedoRef.current) {
            isUndoRedoRef.current = false;
            return;
        }

        const serializedLayers = layers.map(layer => ({
            ...layer,
            runtime: undefined,
            data: RuntimeFactory.serializeRuntime(layer)
        }));

        const newHistory = historyRef.current.slice(0, historyIndex + 1);
        newHistory.push({
            layers: serializedLayers,
            selectedLayerIds: new Set(selectedIds)
        });

        if (newHistory.length > 50) {
            newHistory.shift();
            setHistoryIndex(prev => prev - 1);
        }

        historyRef.current = newHistory;
        setHistoryIndex(historyRef.current.length - 1);
        setHistoryLength(historyRef.current.length);
    }, [historyIndex]);

    const restoreState = useCallback(async (state: HistoryState): Promise<HistoryState> => {
        const restoredLayers = await Promise.all(
            state.layers.map(async (layer) => ({
                ...layer,
                runtime: await RuntimeFactory.createRuntime(layer.data)
            }))
        );
        
        return {
            layers: restoredLayers,
            selectedLayerIds: state.selectedLayerIds
        };
    }, []);

    // Отмена (Ctrl+Z)
    const undo = useCallback(async (): Promise<HistoryState | null> => {
        if (historyIndex <= 0) return null;
        
        isUndoRedoRef.current = true;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        
        return await restoreState(historyRef.current[newIndex]);
    }, [historyIndex, restoreState]);

    // Повтор (Ctrl+Y / Ctrl+Shift+Z)
    const redo = useCallback(async (): Promise<HistoryState | null> => {
        if (historyIndex >= historyRef.current.length - 1) return null;
        
        isUndoRedoRef.current = true;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        
        return await restoreState(historyRef.current[newIndex]);
    }, [historyIndex, restoreState]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < historyLength - 1;

    // Очистить историю
    const clearHistory = useCallback(() => {
        historyRef.current = [];
        setHistoryIndex(-1);
        setHistoryLength(0);
    }, []);

    return {
        saveState,
        undo,
        redo,
        canUndo,
        canRedo,
        clearHistory
    };
}