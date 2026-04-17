import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import type { Layer } from '../types/Layer';


export function useLayers() {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const layerRefs = useRef<Map<string, Konva.Layer>>(new Map());

    // Генерация уникального ID
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Добавить слой
    const addLayer = useCallback((layer: Omit<Layer, 'id' | 'zIndex'>) => {
        let newLayer: Layer | null = null;

        setLayers(prev => {
            newLayer = {
                ...layer,
                id: generateId(),
                zIndex: prev.length,
            };
            return [...prev, newLayer];
        });

        return newLayer!;
    }, [generateId]);

    // Удалить слой
    const removeLayer = useCallback((id: string) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        
        const layer = layerRefs.current.get(id);
        layer?.destroy();
        layerRefs.current.delete(id);
        
        if (selectedLayerId === id) {
            setSelectedLayerId(null);
        }
    }, [selectedLayerId]);

    // Переключить видимость
    const toggleVisibility = useCallback((id: string) => {
        setLayers(prev => prev.map(layer => 
            layer.id === id 
                ? { ...layer, visible: !layer.visible }
                : layer
        ));
        
        const layer = layerRefs.current.get(id);
        if (layer) {
            layer.visible(!layer.visible);
            layer.getLayer()?.batchDraw();
        }
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
    const updateLayerPosition = useCallback((id: string, x: number, y: number) => {
        setLayers(prev => prev.map(layer =>
            layer.id === id
                ? { ...layer, x, y }
                : layer
        ));
    }, []);

    return {
        layers,
        selectedLayerId,
        setSelectedLayerId,
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