import { useCallback, useRef, useState } from 'react';
import type { Layer } from '../../types/Layer';
import { MAX_HISTORY_SIZE } from '../../constants/editor';

interface HistoryState {
    layers: Layer[];  // Уже сериализованные (без runtime)
    selectedIds: string[];
}

export function useHistory() {
    const historyRef = useRef<HistoryState[]>([]);
    const indexRef = useRef(-1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateFlags = useCallback(() => {
        const idx = indexRef.current;
        const len = historyRef.current.length;
        setCanUndo(idx > 0);
        setCanRedo(idx < len - 1);
    }, []);

    const saveState = useCallback((layers: Layer[], selectedIds: Set<string>) => {
        // Обрезаем будущее (если мы отменили часть действий и сделали новое)
        historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
        
        historyRef.current.push({
            layers, // Уже сериализованные (useLayers передаёт готовые)
            selectedIds: Array.from(selectedIds)
        });

        // Ограничиваем размер истории
        if (historyRef.current.length > MAX_HISTORY_SIZE) {
            historyRef.current.shift();
        }

        indexRef.current = historyRef.current.length - 1;
        updateFlags();
    }, [updateFlags]);

    const undo = useCallback((): HistoryState | null => {
        if (indexRef.current <= 0) return null;
        indexRef.current--;
        updateFlags();
        return historyRef.current[indexRef.current];
    }, [updateFlags]);

    const redo = useCallback((): HistoryState | null => {
        if (indexRef.current >= historyRef.current.length - 1) return null;
        indexRef.current++;
        updateFlags();
        return historyRef.current[indexRef.current];
    }, [updateFlags]);

    const clearHistory = useCallback(() => {
        historyRef.current = [];
        indexRef.current = -1;
        setCanUndo(false);
        setCanRedo(false);
    }, []);

    return { saveState, undo, redo, canUndo, canRedo, clearHistory };
}