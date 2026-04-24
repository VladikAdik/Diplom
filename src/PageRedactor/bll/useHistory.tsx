import { useCallback, useRef, useState } from 'react';
import type { Layer } from '../types/Layer';
import { RuntimeFactory } from './runtimeFactory';

interface HistoryState {
    layers: Layer[];
    selectedLayerIds: string[];
}

const MAX_HISTORY_SIZE = 50;

export function useHistory() {
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const historyRef = useRef<HistoryState[]>([]);
    const isUndoRedoRef = useRef(false);
    const lastSavedStateRef = useRef<string>('');

    // Функция обновления флагов
    const updateFlags = useCallback((index: number, totalLength: number) => {
        setCanUndo(index > 0);
        setCanRedo(index < totalLength - 1);
    }, []);

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

        const selectedIdsArray = Array.from(selectedIds);
        const stateString = JSON.stringify({
            layers: serializedLayers,
            selectedLayerIds: selectedIdsArray
        });

        if (stateString === lastSavedStateRef.current) {
            return;
        }
        lastSavedStateRef.current = stateString;

        // ИСПРАВЛЕНИЕ: правильно обрезаем историю
        const newHistory = historyRef.current.slice(0, historyIndex + 1);
        newHistory.push({
            layers: serializedLayers,
            selectedLayerIds: selectedIdsArray
        });

        if (newHistory.length > MAX_HISTORY_SIZE) {
            newHistory.shift();
        }

        historyRef.current = newHistory;
        const newIndex = newHistory.length - 1;
        setHistoryIndex(newIndex);
        updateFlags(newIndex, newHistory.length);
        
        console.log('History saved:', {
            index: newIndex,
            totalStates: newHistory.length,
            canUndo: newIndex > 0,
            canRedo: false
        });
    }, [historyIndex, updateFlags]);

    const restoreState = useCallback(async (state: HistoryState): Promise<{
        layers: Layer[];
        selectedLayerIds: Set<string>;
    }> => {
        const restoredLayers = await Promise.all(
            state.layers.map(async (layer) => {
                const runtime = await RuntimeFactory.createRuntime(layer.data);
                return {
                    ...layer,
                    runtime: runtime
                };
            })
        );

        return {
            layers: restoredLayers,
            selectedLayerIds: new Set(state.selectedLayerIds)
        };
    }, []);

    const undo = useCallback(async () => {
        if (historyIndex <= 0) {
            console.log('Cannot undo: at beginning');
            return null;
        }

        isUndoRedoRef.current = true;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        updateFlags(newIndex, historyRef.current.length);
        lastSavedStateRef.current = JSON.stringify(historyRef.current[newIndex]);

        const restored = await restoreState(historyRef.current[newIndex]);
        return restored;
    }, [historyIndex, restoreState, updateFlags]);

    const redo = useCallback(async () => {
        const historyLength = historyRef.current.length;
        if (historyIndex >= historyLength - 1) {
            console.log('Cannot redo: at end');
            return null;
        }

        isUndoRedoRef.current = true;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        updateFlags(newIndex, historyLength);
        lastSavedStateRef.current = JSON.stringify(historyRef.current[newIndex]);

        const restored = await restoreState(historyRef.current[newIndex]);
        return restored;
    }, [historyIndex, restoreState, updateFlags]);

    const clearHistory = useCallback(() => {
        console.log('Clearing all history');
        historyRef.current = [];
        setHistoryIndex(-1);
        setCanUndo(false);
        setCanRedo(false);
        lastSavedStateRef.current = '';
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