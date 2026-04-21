import { useState, useCallback, useRef } from 'react';
import Konva from 'konva';
import type { Layer, ShapeLayerData } from '../types/Layer';

export function useLayers(onStateChange?: (layers: Layer[], selectedIds: Set<string>, isIntermediate?: boolean) => void) {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
    const layerRefs = useRef<Map<string, Konva.Layer>>(new Map());

    // Генерация уникального ID
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    const notifyChange = useCallback((newLayers: Layer[], newSelectedIds: Set<string>, isIntermediate: boolean = false) => {
        onStateChange?.(newLayers, newSelectedIds, isIntermediate);
    }, [onStateChange]);

    // Добавить слой
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
            notifyChange(newLayers, selectedLayerIds, false);
            return newLayers;
        });
    }, [generateId, notifyChange, selectedLayerIds]);

    const addImageLayer = useCallback((image: HTMLImageElement, x: number = 100, y: number = 100) => {
        const newLayer: Omit<Layer, 'id' | 'zIndex'> = {
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
            data: { type: 'image', src: '' }, // временно
            runtime: { imageElement: image }
        };
        addLayer(newLayer);
    }, [layers.length, addLayer]);

    const addShapeLayer = useCallback((shapeType: ShapeLayerData['shapeType'], x: number = 100, y: number = 100) => {
        const newLayer: Omit<Layer, 'id' | 'zIndex'> = {
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
                shapeType,
                fill: '#cccccc',
                stroke: '#000000',
                strokeWidth: 2
            }
        };
        addLayer(newLayer);
    }, [layers.length, addLayer]);

    const addTextLayer = useCallback((text: string = 'Новый текст', x: number = 100, y: number = 100) => {
        const newLayer: Omit<Layer, 'id' | 'zIndex'> = {
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
                align: 'left'
            }
        };
        addLayer(newLayer);
    }, [layers.length, addLayer]);

    // Удалить слой
    const removeLayer = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.filter(l => l.id !== id);
            layerRefs.current.delete(id);

            const newSelectedIds = new Set(selectedLayerIds);
            newSelectedIds.delete(id);

            notifyChange(newLayers, newSelectedIds, false);
            setSelectedLayerIds(newSelectedIds);
            return newLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Выделить слой (НЕ сохраняем в историю)
    const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
        setSelectedLayerIds(prev => {
            const newSet = new Set(prev);

            if (multiSelect) {
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
            } else {
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
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id
                    ? { ...layer, visible: !layer.visible }
                    : layer
            );
            notifyChange(newLayers, selectedLayerIds, false);
            return newLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Заблокировать/разблокировать
    const toggleLock = useCallback((id: string) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id
                    ? { ...layer, locked: !layer.locked }
                    : layer
            );
            notifyChange(newLayers, selectedLayerIds, false);
            return newLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Изменить прозрачность
    const setOpacity = useCallback((id: string, opacity: number) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
                layer.id === id
                    ? { ...layer, opacity }
                    : layer
            );
            notifyChange(newLayers, selectedLayerIds, false);

            // Обновляем Konva узел
            const konvaLayer = layerRefs.current.get(id);
            if (konvaLayer) {
                konvaLayer.opacity(opacity);
                konvaLayer.getLayer()?.batchDraw();
            }

            return newLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Переместить слой вверх/вниз
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

            notifyChange(reindexedLayers, selectedLayerIds, false);
            return reindexedLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Обновить позицию слоя (после перетаскивания или трансформации)
    const updateLayerPosition = useCallback((
        id: string,
        x: number,
        y: number,
        width?: number,
        height?: number,
        rotation?: number,
        isIntermediate: boolean = false
    ) => {
        setLayers(prev => {
            const newLayers = prev.map(layer =>
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
            );
            notifyChange(newLayers, selectedLayerIds, isIntermediate);
            return newLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Обновить несколько слоёв сразу (для batch операций)
    const updateMultipleLayers = useCallback((
        updates: Array<{
            id: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
            rotation?: number;
        }>,
        isIntermediate: boolean = false
    ) => {
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
                            ...(update.rotation !== undefined && { rotation: update.rotation })
                        }
                        : layer
                );
            });

            notifyChange(newLayers, selectedLayerIds, isIntermediate);
            return newLayers;
        });
    }, [selectedLayerIds, notifyChange]);

    // Восстановить состояние (для undo/redo)
    const restoreState = useCallback((newLayers: Layer[], newSelectedIds: Set<string>) => {
        setLayers(newLayers);
        setSelectedLayerIds(newSelectedIds);
    }, []);

    // Получить слой по ID
    const getLayer = useCallback((id: string) => {
        return layers.find(l => l.id === id);
    }, [layers]);

    // Дублировать слой
    const duplicateLayer = useCallback((id: string) => {
        const layerToDuplicate = layers.find(l => l.id === id);
        if (!layerToDuplicate) return;

        const duplicatedLayer: Omit<Layer, 'id' | 'zIndex'> = {
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
        };

        addLayer(duplicatedLayer);
    }, [layers, addLayer]);

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
        restoreState,
        getLayer,
        duplicateLayer
    };
}