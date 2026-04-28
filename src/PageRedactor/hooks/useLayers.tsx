import { useState, useCallback, useRef, useEffect } from 'react';
import type { Layer, ShapeConfig, ShapeLayerData, TextConfig } from '../types/Layer';
import { useHistory } from './useHistory';
import { useSnapMove, type SnapGuide } from './useSnapMove';
import { imageToDataURL } from '../utils/imageUtils';
import { useFilters } from './useFilters';
import { SHAPE_REGISTRY } from '../constants/shapeRegistry';
import {
    DEFAULT_LAYER_X, DEFAULT_LAYER_Y, DEFAULT_LAYER_OPACITY,
    DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT,
    DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT,
    DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY,
    DEFAULT_SHAPE_FILL, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
    DEFAULT_TEXT_FILL, DEFAULT_TEXT_ALIGN
} from '../constants/editor';
import type Konva from 'konva';

// Генератор ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================================
// Фабрики слоёв (чистые функции, создают готовый объект Layer)
// ============================================================

function createImageLayerData(image: HTMLImageElement, centerX: number, centerY: number): Omit<Layer, 'id' | 'zIndex'> {
    return {
        name: 'Изображение',
        visible: true,
        locked: false,
        opacity: DEFAULT_LAYER_OPACITY,
        type: 'image',
        x: centerX,
        y: centerY,
        width: image.width,
        height: image.height,
        rotation: 0,
        data: {
            type: 'image',
            src: imageToDataURL(image),
            width: image.width,
            height: image.height
        },
        runtime: { imageElement: image }
    };
}

function createShapeLayerData(
    shapeType: string,
    x: number,
    y: number,
    config?: ShapeConfig
): Omit<Layer, 'id' | 'zIndex'> {
    const def = SHAPE_REGISTRY[shapeType];
    if (!def) throw new Error(`Unknown shape type: ${shapeType}`);

    const w = config?.width ?? DEFAULT_SHAPE_WIDTH;
    const h = config?.height ?? DEFAULT_SHAPE_HEIGHT;
    const { extraData, extraRuntime } = def.getExtraData(w, h);

    const baseData = {
        type: 'shape' as const,
        shapeType,
        fill: config?.fill ?? DEFAULT_SHAPE_FILL,
        stroke: config?.stroke ?? DEFAULT_STROKE_COLOR,
        strokeWidth: config?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
        width: w,
        height: h,
    };

    return {
        name: def.label,
        visible: true,
        locked: false,
        opacity: DEFAULT_LAYER_OPACITY,
        type: 'shape',
        x, y,
        width: w,
        height: h,
        rotation: 0,
        data: { ...baseData, ...extraData },
        runtime: { shapeConfig: { ...baseData, ...extraRuntime } }
    };
}

function createTextLayerData(
    text: string,
    x: number,
    y: number,
    config?: { fontSize?: number; fontFamily?: string; fill?: string; width?: number; height?: number }
): Omit<Layer, 'id' | 'zIndex'> {
    const w = config?.width ?? DEFAULT_TEXT_WIDTH;
    const h = config?.height ?? DEFAULT_TEXT_HEIGHT;
    const fs = config?.fontSize ?? DEFAULT_FONT_SIZE;
    const ff = config?.fontFamily ?? DEFAULT_FONT_FAMILY;
    const f = config?.fill ?? DEFAULT_TEXT_FILL;

    return {
        name: 'Текст',
        visible: true,
        locked: false,
        opacity: DEFAULT_LAYER_OPACITY,
        type: 'text',
        x, y,
        width: w,
        height: h,
        rotation: 0,
        data: {
            type: 'text',
            text,
            fontSize: fs,
            fontFamily: ff,
            fill: f,
            align: DEFAULT_TEXT_ALIGN,
            width: w,
            height: h
        },
        runtime: { textConfig: { text, fontSize: fs, fontFamily: ff, fill: f, align: DEFAULT_TEXT_ALIGN, width: w } }
    };
}

function duplicateLayerData(original: Layer): Omit<Layer, 'id' | 'zIndex'> {
    return {
        name: `${original.name} (копия)`,
        visible: original.visible,
        locked: false,
        opacity: original.opacity,
        type: original.type,
        x: (original.x ?? DEFAULT_LAYER_X) + 20,
        y: (original.y ?? DEFAULT_LAYER_Y) + 20,
        width: original.width,
        height: original.height,
        rotation: original.rotation,
        data: { ...original.data },
        runtime: original.runtime ? { ...original.runtime } : undefined
    };
}

// ============================================================
// Сериализация / десериализация для истории
// ============================================================

function serializeLayer(layer: Layer): Layer {
    const syncedData = { ...layer.data };

    if (layer.type === 'shape' && layer.runtime?.shapeConfig) {
        const shapeConfig = layer.runtime.shapeConfig;
        Object.assign(syncedData, {
            width: layer.width,
            height: layer.height,
            fill: shapeConfig.fill as string,
            stroke: shapeConfig.stroke as string,
            strokeWidth: shapeConfig.strokeWidth as number,
            radius: shapeConfig.radius,
            radiusX: shapeConfig.radiusX,
            radiusY: shapeConfig.radiusY,
        });
    }

    if (layer.type === 'text' && layer.runtime?.textConfig) {
        const textConfig = layer.runtime.textConfig;
        Object.assign(syncedData, {
            text: textConfig.text as string,
            fontSize: textConfig.fontSize as number,
            fontFamily: textConfig.fontFamily as string,
            fill: textConfig.fill as string,
        });
    }

    if (layer.type === 'image' && layer.runtime?.imageElement) {
        Object.assign(syncedData, {
            src: imageToDataURL(layer.runtime.imageElement),
            width: layer.width,
            height: layer.height,
        });
    }

    if (layer.type === 'canvas') {
        Object.assign(syncedData, {
            width: layer.width,
            height: layer.height,
        });
    }

    return {
        ...layer,
        data: syncedData,
        runtime: undefined
    };
}

async function deserializeLayer(layer: Layer): Promise<Layer> {
    const data = layer.data;

    switch (data.type) {
        case 'image': {
            if (!('src' in data) || !data.src) return { ...layer, runtime: {} };
            try {
                const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = data.src;
                });
                return { ...layer, runtime: { imageElement: img } };
            } catch (error) {
                console.error('Failed to restore image:', error);
                return { ...layer, runtime: {} };
            }
        }

        case 'shape': {
            const shapeData = data as ShapeLayerData;
            const shapeConfig: Konva.ShapeConfig = {
                fill: shapeData.fill || DEFAULT_SHAPE_FILL,
                stroke: shapeData.stroke || DEFAULT_STROKE_COLOR,
                strokeWidth: shapeData.strokeWidth || DEFAULT_STROKE_WIDTH,
                width: shapeData.width,
                height: shapeData.height,
            };

            if (shapeData.shapeType === 'circle') {
                shapeConfig.radius = shapeData.radius || 50;
            } else if (shapeData.shapeType === 'ellipse') {
                shapeConfig.radiusX = shapeData.radiusX || 50;
                shapeConfig.radiusY = shapeData.radiusY || 30;
            }

            return { ...layer, runtime: { shapeConfig } };
        }

        case 'canvas': {
            return { ...layer, runtime: {} };
        }

        case 'text': {
            return {
                ...layer,
                runtime: {
                    textConfig: {
                        text: ('text' in data && data.text) || '',
                        fontSize: ('fontSize' in data && data.fontSize) || DEFAULT_FONT_SIZE,
                        fontFamily: ('fontFamily' in data && data.fontFamily) || DEFAULT_FONT_FAMILY,
                        fill: ('fill' in data && data.fill) || DEFAULT_TEXT_FILL,
                        align: ('align' in data && data.align) || DEFAULT_TEXT_ALIGN,
                        width: data.width || DEFAULT_TEXT_WIDTH,
                    }
                }
            };
        }

        default:
            return { ...layer, runtime: {} };
    }
}

// ============================================================
// Хук useLayers
// ============================================================

export function useLayers(stageSize: { width: number; height: number }) {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const layerRefs = useRef<Map<string, Konva.Group>>(new Map());

    const { saveState, undo: undoHistory, redo: redoHistory, canUndo, canRedo, clearHistory } = useHistory();

    const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

    const selectedIdsRef = useRef(selectedIds);
    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    // ============================================================
    // ЕДИНСТВЕННАЯ точка мутации состояния
    // ============================================================

    const mutate = useCallback(
        (mutation: (prevLayers: Layer[]) => Layer[]) => {
            setLayers(prev => {
                const next = mutation(prev);
                const serialized = next.map(serializeLayer);
                saveState(serialized, selectedIdsRef.current);
                return next;
            });
        },
        [saveState]
    );

    const { previewFilter, applyFilter, cancelPreview } = useFilters(layers, setLayers, mutate);

    // ============================================================
    // CRUD операции
    // ============================================================

    const addLayer = useCallback(
        (layerData: Omit<Layer, 'id' | 'zIndex'>) => {
            mutate(prev => {
                const newLayer: Layer = {
                    ...layerData,
                    id: generateId(),
                    zIndex: prev.length
                };
                return [...prev, newLayer];
            });
        },
        [mutate]
    );

    const addImageLayer = useCallback(
        (image: HTMLImageElement, centerX: number, centerY: number) => {
            addLayer(createImageLayerData(image, centerX, centerY));
        },
        [addLayer]
    );

    const addShapeLayer = useCallback(
        (shapeType: string, x = DEFAULT_LAYER_X, y = DEFAULT_LAYER_Y, config?: ShapeConfig) => {
            addLayer(createShapeLayerData(shapeType, x, y, config));
        },
        [addLayer]
    );

    const addTextLayer = useCallback(
        (text = 'Новый текст', x = DEFAULT_LAYER_X, y = DEFAULT_LAYER_Y, config?: TextConfig) => {
            addLayer(createTextLayerData(text, x, y, config));
        },
        [addLayer]
    );

    const duplicateLayer = useCallback(
        (id: string) => {
            const layer = layers.find(l => l.id === id);
            if (layer) {
                addLayer(duplicateLayerData(layer));
            }
        },
        [layers, addLayer]
    );

    const removeLayer = useCallback(
        (id: string) => {
            mutate(prev => {
                layerRefs.current.delete(id);
                return prev.filter(l => l.id !== id);
            });
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        },
        [mutate]
    );

    const updateLayer = useCallback(
        (id: string, updates: Partial<Layer>) => {
            mutate(prev =>
                prev.map(layer =>
                    layer.id === id ? { ...layer, ...updates } : layer
                )
            );
        },
        [mutate]
    );

    // ============================================================
    // Обновление позиции/размера с учётом типа фигуры
    // ============================================================

    const updateLayerPosition = useCallback(
        (id: string, x: number, y: number, width?: number, height?: number, rotation?: number) => {
            mutate(prev =>
                prev.map(layer => {
                    if (layer.id !== id) return layer;

                    const updated = {
                        ...layer,
                        x, y,
                        ...(width !== undefined && { width }),
                        ...(height !== undefined && { height }),
                        ...(rotation !== undefined && { rotation })
                    };

                    // Синхронизируем data
                    if (updated.data) {
                        updated.data = {
                            ...updated.data,
                            ...(width !== undefined && { width }),
                            ...(height !== undefined && { height })
                        };
                    }

                    // Обновляем shapeConfig через реестр
                    if (updated.runtime?.shapeConfig && layer.type === 'shape' && layer.data.type === 'shape') {
                        const def = SHAPE_REGISTRY[layer.data.shapeType];
                        if (def) {
                            const w = width ?? layer.width ?? 100;
                            const h = height ?? layer.height ?? 100;
                            updated.runtime.shapeConfig = def.updateConfig(updated.runtime.shapeConfig, w, h);

                            // Синхронизируем специфичные данные в data
                            if (layer.data.shapeType === 'circle') {
                                (updated.data as ShapeLayerData).radius = Math.min(w, h) / 2;
                            }
                        }
                    }

                    return updated;
                })
            );
        },
        [mutate]
    );

    const updateMultipleLayers = useCallback(
        (updates: Array<{ id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number }>) => {
            mutate(prev => {
                let newLayers = [...prev];

                updates.forEach(update => {
                    newLayers = newLayers.map(layer => {
                        if (layer.id !== update.id) return layer;

                        const updated = { ...layer, ...update };

                        if (updated.data) {
                            updated.data = {
                                ...updated.data,
                                ...(update.width !== undefined && { width: update.width }),
                                ...(update.height !== undefined && { height: update.height })
                            };
                        }

                        if (updated.runtime?.shapeConfig && layer.type === 'shape' && layer.data.type === 'shape') {
                            const def = SHAPE_REGISTRY[layer.data.shapeType];
                            if (def) {
                                const w = update.width ?? layer.width ?? 100;
                                const h = update.height ?? layer.height ?? 100;
                                updated.runtime.shapeConfig = def.updateConfig(updated.runtime.shapeConfig, w, h);

                                if (layer.data.shapeType === 'circle') {
                                    (updated.data as ShapeLayerData).radius = Math.min(w, h) / 2;
                                }
                            }
                        }

                        return updated;
                    });
                });

                return newLayers;
            });
        },
        [mutate]
    );

    const moveLayer = useCallback(
        (id: string, direction: 'up' | 'down') => {
            mutate(prev => {
                const index = prev.findIndex(l => l.id === id);
                if (index === -1) return prev;
                if (direction === 'up' && index === prev.length - 1) return prev;
                if (direction === 'down' && index === 0) return prev;

                const newIndex = direction === 'up' ? index + 1 : index - 1;
                const newLayers = [...prev];
                [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

                return newLayers.map((layer, idx) => ({ ...layer, zIndex: idx }));
            });
        },
        [mutate]
    );

    const getFirstImageBounds = useCallback(() => {
        const firstImage = layers.find(l => l.type === 'image');
        if (!firstImage) return null;
        return {
            width: firstImage.width ?? 100,
            height: firstImage.height ?? 100
        };
    }, [layers]);

    const addCanvasLayer = useCallback((width: number, height: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const dataURL = canvas.toDataURL();
        canvas.remove();

        addLayer({
            name: 'Холст',
            visible: true,
            locked: false,
            opacity: 1,
            type: 'canvas',
            x: 0, y: 0,
            width, height,
            rotation: 0,
            data: { type: 'canvas', src: dataURL, width, height },
            runtime: {},
        });
    }, [addLayer]);

    const handlePositionChange = useCallback(
        (id: string, x: number, y: number, saveHistory: boolean) => {
            if (saveHistory) {
                mutate(prev =>
                    prev.map(layer =>
                        layer.id === id ? { ...layer, x, y } : layer
                    )
                );
            } else {
                setLayers(prev =>
                    prev.map(layer =>
                        layer.id === id ? { ...layer, x, y } : layer
                    )
                );
            }
        },
        [mutate]
    );

    const setLayersDirect = useCallback((newLayers: Layer[]) => {
        setLayers(newLayers);
    }, []);

    const { handleDragMove, handleDragEnd } = useSnapMove({
        layers,
        stageSize,
        setSnapGuides,
        onPositionChange: handlePositionChange,
    });

    // ============================================================
    // Операции без сохранения в историю
    // ============================================================

    const toggleVisibility = useCallback((id: string) => {
        setLayers(prev =>
            prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
        );
    }, []);

    const toggleLock = useCallback((id: string) => {
        setLayers(prev =>
            prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l)
        );
    }, []);

    const setOpacity = useCallback((id: string, opacity: number) => {
        setLayers(prev =>
            prev.map(l => l.id === id ? { ...l, opacity } : l)
        );
    }, []);

    // ============================================================
    // Выделение
    // ============================================================

    const selectLayer = useCallback((id: string, multiSelect: boolean = false) => {
        setSelectedIds(prev => {
            const next = new Set(multiSelect ? prev : []);
            if (multiSelect && next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(layers.map(l => l.id)));
    }, [layers]);

    // ============================================================
    // Undo / Redo
    // ============================================================

    const undo = useCallback(async () => {
        const state = await undoHistory();
        if (state) {
            layerRefs.current.clear();
            const restoredLayers = await Promise.all(state.layers.map(deserializeLayer));
            setLayers(restoredLayers);
            setSelectedIds(new Set(state.selectedIds));
        }
    }, [undoHistory]);

    const redo = useCallback(async () => {
        const state = await redoHistory();
        if (state) {
            layerRefs.current.clear();
            const restoredLayers = await Promise.all(state.layers.map(deserializeLayer));
            setLayers(restoredLayers);
            setSelectedIds(new Set(state.selectedIds));
        }
    }, [redoHistory]);

    const clearAll = useCallback(() => {
        setLayers([]);
        setSelectedIds(new Set());
        layerRefs.current.clear();
        clearHistory();
    }, [clearHistory]);

    // ============================================================
    // Экспорт
    // ============================================================

    return {
        layers,
        selectedLayerIds: selectedIds,
        layerRefs,

        addLayer,
        addImageLayer,
        addShapeLayer,
        addTextLayer,
        addCanvasLayer,
        duplicateLayer,
        removeLayer,
        updateLayer,
        updateLayerPosition,
        updateMultipleLayers,
        moveLayer,
        getFirstImageBounds,
        setLayersDirect,

        snapGuides,
        handleDragMove,
        handleDragEnd,

        toggleVisibility,
        toggleLock,
        setOpacity,

        selectLayer,
        clearSelection,
        selectAll,

        undo,
        redo,
        canUndo,
        canRedo,
        clearAll,

        previewFilter,
        applyFilter,
        cancelPreview,
    };
}