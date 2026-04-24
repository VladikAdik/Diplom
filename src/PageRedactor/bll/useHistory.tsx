import { useCallback, useRef, useState } from 'react';
import type { Layer } from '../types/Layer';
import { RuntimeFactory } from './runtimeFactory';
import { MAX_HISTORY_SIZE } from '../constants/editor';

interface HistoryState {
    layers: Layer[];
    selectedLayerIds: string[];
}

export function useHistory() {
    const [, setHistoryIndex] = useState(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const historyRef = useRef<HistoryState[]>([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false);
    const isRestoringRef = useRef(false);

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

        // Используем ref для актуального индекса
        const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
        newHistory.push({
            layers: serializedLayers,
            selectedLayerIds: selectedIdsArray
        });

        if (newHistory.length > MAX_HISTORY_SIZE) {
            newHistory.shift();
            historyIndexRef.current = Math.max(0, historyIndexRef.current - 1);
        }

        historyRef.current = newHistory;
        const newIndex = newHistory.length - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        updateFlags(newIndex, newHistory.length);

        console.log('History saved:', {
            index: newIndex,
            totalStates: newHistory.length,
            canUndo: newIndex > 0,
            canRedo: false
        });
    }, [updateFlags]);

    const restoreState = useCallback(async (state: HistoryState): Promise<{
        layers: Layer[];
        selectedLayerIds: Set<string>;
    }> => {
        const restoredLayers = await Promise.all(
            state.layers.map(async (layer) => {
                try {
                    const runtime = await RuntimeFactory.createRuntime(layer.data);
                    return { ...layer, runtime };
                } catch (error) {
                    console.error(`Failed to restore layer ${layer.id}:`, error);
                    return { ...layer, runtime: {} };
                }
            })
        );

        return {
            layers: restoredLayers,
            selectedLayerIds: new Set(state.selectedLayerIds)
        };
    }, []);

    const undo = useCallback(async () => {
        if (isRestoringRef.current) {
            console.log('Already restoring, ignoring undo');
            return null;
        }

        if (historyIndexRef.current <= 0) {
            console.log('Cannot undo: at beginning');
            return null;
        }

        isRestoringRef.current = true;
        isUndoRedoRef.current = true;

        const newIndex = historyIndexRef.current - 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        updateFlags(newIndex, historyRef.current.length);

        try {
            const restored = await restoreState(historyRef.current[newIndex]);
            return restored;
        } finally {
            isRestoringRef.current = false;
        }
    }, [restoreState, updateFlags]);

    const redo = useCallback(async () => {
        if (isRestoringRef.current) {
            console.log('Already restoring, ignoring redo');
            return null;
        }

        const historyLength = historyRef.current.length;
        if (historyIndexRef.current >= historyLength - 1) {
            console.log('Cannot redo: at end');
            return null;
        }

        isRestoringRef.current = true;
        isUndoRedoRef.current = true;

        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        updateFlags(newIndex, historyLength);

        try {
            const restored = await restoreState(historyRef.current[newIndex]);
            return restored;
        } finally {
            isRestoringRef.current = false;
        }
    }, [restoreState, updateFlags]);

    const clearHistory = useCallback(() => {
        console.log('Clearing all history');
        historyRef.current = [];
        historyIndexRef.current = -1;
        setHistoryIndex(-1);
        setCanUndo(false);
        setCanRedo(false);
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