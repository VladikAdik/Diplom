import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import type { Layer } from '../types/Layer';


export function useLayers() {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set);
    const layerRefs = useRef<Map<string, Konva.Layer>>(new Map());

    // Генерация уникального ID
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Добавить слой
    const addLayer = useCallback((layer: Omit<Layer, 'id' | 'zIndex'>) => {
        setLayers(prev => {
            const newLayer: Layer = {
                ...layer,
                id: generateId(),
                zIndex: prev.length
            };
            return [...prev, newLayer];
        });
    }, [generateId]);

    // Удалить слой
    const removeLayer = useCallback((id: string) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        layerRefs.current.delete(id);

        setSelectedLayerIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
    }, []);

    const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
        setSelectedLayerIds(prev => {
            const newSet = new Set(prev);

            if (multiSelect) {
                // Ctrl/Cmd + клик: добавляем/убираем слой
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
            } else {
                // Обычный клик: выделяем только этот слой
                newSet.clear();
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

    // Переключить видимость
    const toggleVisibility = useCallback((id: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === id
                ? { ...layer, visible: !layer.visible }
                : layer
        ));
    }, []);

    // Заблокировать/разблокировать
    const toggleLock = useCallback((id: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === id
                ? { ...layer, locked: !layer.locked }
                : layer
        ));
    }, []);

    // Изменить прозрачность
    const setOpacity = useCallback((id: string, opacity: number) => {
        setLayers(prev => prev.map(layer =>
            layer.id === id
                ? { ...layer, opacity }
                : layer
        ));

        const layer = layerRefs.current.get(id);
        if (layer) {
            layer.opacity(opacity);
            layer.getLayer()?.batchDraw();
        }
    }, []);

    // Переместить слой вверх/вниз (обновляет zIndex)
    const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === id);
            if (index === -1) return prev;

            // Проверка границ
            if (direction === 'up' && index === prev.length - 1) return prev;
            if (direction === 'down' && index === 0) return prev;

            const newIndex = direction === 'up' ? index + 1 : index - 1;
            const newLayers = [...prev];

            // Меняем местами
            [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

            // Обновляем zIndex для всех слоёв (чтобы порядок соответствовал)
            return newLayers.map((layer, idx) => ({
                ...layer,
                zIndex: idx
            }));
        });
    }, []);

    // Обновить позицию слоя (после перетаскивания)
    const updateLayerPosition = useCallback((
        id: string,
        x: number,
        y: number,
        width?: number,
        height?: number,
        rotation?: number
    ) => {
        setLayers(prev => prev.map(layer =>
            layer.id === id
                ? {
                    ...layer,
                    x,
                    y,
                    ...(width !== undefined && { width }),
                    ...(height !== undefined && { height }),
                    ...(rotation !== undefined && { rotation })
                }
                : layer
        ));
    }, []);

    return {
        layers,
        selectedLayerIds,
        setSelectedLayerIds,
        selectLayer,
        clearSelection,
        selectAll,
        layerRefs,
        addLayer,
        removeLayer,
        toggleVisibility,
        toggleLock,
        setOpacity,
        moveLayer,
        updateLayerPosition
    };
}