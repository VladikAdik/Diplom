import { forwardRef, useImperativeHandle, useEffect, useCallback, useRef, useState } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage, Rect } from 'react-konva';
import { useWorkspaceLogic } from '../../bll/useWorkspaceLogic';
import { useLayers } from '../../bll/useLayers';
import { type Layer } from '../../types/Layer';
import { TransformControls } from './TransformControls'
import type Konva from 'konva';

interface WorkspaceProps {
    image?: HTMLImageElement | null
    onUpdate?: (url: string) => void
    onLayersChange?: (layers: Layer[]) => void
    onSelectionChange?: (ids: Set<string>) => void
    selectedTool?: string
}

export interface WorkspaceRef {
    addImage: (newImage: HTMLImageElement) => void
    addLayer: () => void
    getLayers: () => Layer[]
    selectLayer: (id: string, multiSelect?: boolean) => void
    toggleVisibility: (id: string) => void
    toggleLock: (id: string) => void
    removeLayer: (id: string) => void
    resetView: () => void
}

export const Workspace = forwardRef<WorkspaceRef, WorkspaceProps>(({
    image,
    onUpdate,
    onLayersChange,
    onSelectionChange,
    selectedTool = 'select'
}, ref) => {
    // Флаг для предотвращения повторной загрузки начального изображения
    const initialImageLoadedRef = useRef(false);
    
    // Состояния для рамки выделения
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const selectionStartRef = useRef({ x: 0, y: 0 });
    const isDrawingRef = useRef(false);

    // Хуки бизнес-логики
    const { stageRef, handleWheel, resetView, updatePreview } = useWorkspaceLogic({ onUpdate });

    const {
        layers,
        selectedLayerIds,
        selectLayer,
        clearSelection,
        layerRefs,
        addLayer,
        removeLayer,
        toggleVisibility,
        toggleLock,
        updateLayerPosition,
    } = useLayers();

    // Уведомляем родителя об изменении слоёв
    useEffect(() => {
        onLayersChange?.(layers);
    }, [layers, onLayersChange]);

    // Уведомляем родителя об изменении выделения
    useEffect(() => {
        onSelectionChange?.(selectedLayerIds);
    }, [selectedLayerIds, onSelectionChange]);

    // При первом запуске создаём слой с переданным изображением
    useEffect(() => {
        if (image && !initialImageLoadedRef.current && layers.length === 0) {
            initialImageLoadedRef.current = true;
            addLayer({
                name: 'Базовое изображение',
                visible: true,
                locked: false,
                opacity: 1,
                type: 'image',
                data: image,
                x: 100,
                y: 100
            });
        }
    }, [image, addLayer, layers.length]);

    // Обработчик завершения перетаскивания слоя
    const handleImageDragEnd = useCallback((layerId: string, x: number, y: number) => {
        updateLayerPosition(layerId, x, y);
        updatePreview();
    }, [updateLayerPosition, updatePreview]);

    // Обработчик завершения трансформации (масштабирование/поворот)
    const handleTransformEnd = useCallback((transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => {
        transforms.forEach(({ id, x, y, width, height, rotation }) => {
            updateLayerPosition(id, x, y, width, height, rotation);
        });
        setTimeout(() => updatePreview(), 0);
    }, [updateLayerPosition, updatePreview]);

    // Обработка выделения рамкой (клик + перетаскивание на пустом месте)
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        
        const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (selectedTool !== 'select') return;
            if (e.target !== stage) return;
            
            const pos = stage.getPointerPosition();
            if (!pos) return;
            
            isDrawingRef.current = true;
            selectionStartRef.current = pos;
            setIsSelecting(true);
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        };
        
        const handleMouseMove = () => {
            if (!isDrawingRef.current || selectedTool !== 'select') return;
            
            const pos = stage.getPointerPosition();
            if (!pos) return;
            
            const startX = selectionStartRef.current.x;
            const startY = selectionStartRef.current.y;
            const width = pos.x - startX;
            const height = pos.y - startY;
            
            setSelectionRect({
                x: width > 0 ? startX : pos.x,
                y: height > 0 ? startY : pos.y,
                width: Math.abs(width),
                height: Math.abs(height)
            });
        };
        
        const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingRef.current || selectedTool !== 'select') return;
    
    // Если рамка маленькая (простой клик) - сбрасываем выделение
    const isClickOnly = selectionRect.width <= 5 && selectionRect.height <= 5;
    
    if (isClickOnly) {
        // Простой клик по пустоте - сбрасываем выделение
        if (!e.evt.ctrlKey && !e.evt.metaKey) {
            clearSelection();
        }
    } else {
        // Рамка достаточно большая - выделяем попавшие слои
        const toSelect: string[] = [];
        
        layers.forEach(layer => {
            if (layer.locked) return;
            
            const x = layer.x ?? 100;
            const y = layer.y ?? 100;
            const w = layer.width ?? (layer.data instanceof HTMLImageElement ? layer.data.width : 200);
            const h = layer.height ?? (layer.data instanceof HTMLImageElement ? layer.data.height : 200);
            
            if (selectionRect.x < x + w && selectionRect.x + selectionRect.width > x &&
                selectionRect.y < y + h && selectionRect.y + selectionRect.height > y) {
                toSelect.push(layer.id);
            }
        });
        
        if (toSelect.length > 0) {
            clearSelection();
            toSelect.forEach(id => selectLayer(id, true));
        }
    }
    
    // Сброс состояния рисования
    isDrawingRef.current = false;
    setIsSelecting(false);
    setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
};
        
        stage.on('mousedown', handleMouseDown);
        stage.on('mousemove', handleMouseMove);
        stage.on('mouseup', handleMouseUp);
        
        return () => {
            stage.off('mousedown', handleMouseDown);
            stage.off('mousemove', handleMouseMove);
            stage.off('mouseup', handleMouseUp);
        };
    }, [selectedTool, stageRef, layers, clearSelection, selectLayer, selectionRect]);

    // Рендер отдельного слоя
    const renderLayer = useCallback((layer: Layer) => {
        const isSelected = selectedLayerIds.has(layer.id);
        const canDrag = !layer.locked && selectedTool === 'select';

        return (
            <KonvaLayer
                key={layer.id}
                ref={(node) => {
                    if (node) {
                        const konvaLayer = node.getLayer();
                        if (konvaLayer) {
                            layerRefs.current.set(layer.id, konvaLayer);
                        }
                    }
                }}
                visible={layer.visible}
                opacity={layer.opacity}
                listening={!layer.locked}
            >
                {layer.type === 'image' && layer.data instanceof HTMLImageElement && (
                    <KonvaImage
                        image={layer.data}
                        x={layer.x ?? 100}
                        y={layer.y ?? 100}
                        width={layer.width}
                        height={layer.height}
                        draggable={canDrag}
                        onDragEnd={(e) => {
                            handleImageDragEnd(layer.id, e.target.x(), e.target.y());
                        }}
                        onMouseDown={(e) => {
                            e.cancelBubble = true;
                            if (selectedTool === 'select') {
                                const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                                const isAlreadySelected = selectedLayerIds.has(layer.id);
                                if (isAlreadySelected && !isMultiSelect) return;
                                selectLayer(layer.id, isMultiSelect);
                            }
                        }}
                        stroke={isSelected ? '#2196F3' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                        name={layer.id}
                    />
                )}
            </KonvaLayer>
        );
    }, [selectedLayerIds, layerRefs, selectLayer, handleImageDragEnd, selectedTool]);

    // Экспортируем методы для родительского компонента
    useImperativeHandle(ref, () => ({
        addImage: (newImage: HTMLImageElement) => {
            addLayer({
                name: `Изображение ${layers.length + 1}`,
                visible: true,
                locked: false,
                opacity: 1,
                type: 'image',
                data: newImage,
                x: 100,
                y: 100
            });
        },
        getLayers: () => layers,
        selectLayer: (id: string, multiSelect: boolean = false) => selectLayer(id, multiSelect),
        toggleVisibility: (id: string) => toggleVisibility(id),
        toggleLock: (id: string) => toggleLock(id),
        removeLayer: (id: string) => removeLayer(id),
        addLayer: () => {
            addLayer({
                name: `Слой ${layers.length + 1}`,
                visible: true,
                locked: false,
                opacity: 1,
                type: 'shape',
                data: null,
                x: 100,
                y: 100
            });
        },
        resetView: resetView
    }), [layers, addLayer, toggleVisibility, toggleLock, removeLayer, resetView, selectLayer]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight - 100}
                onWheel={handleWheel}
                style={{
                    border: '1px solid #ccc',
                    background: '#f5f5f5',
                    cursor: selectedTool === 'select' ? 'default' : 'crosshair'
                }}
            >
                {layers.map(renderLayer)}

                <KonvaLayer>
                    <TransformControls
                        selectedNodeIds={selectedTool === 'select' ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        onTransformEnd={handleTransformEnd}
                    />
                </KonvaLayer>

                {isSelecting && selectionRect.width > 0 && selectionRect.height > 0 && (
                    <KonvaLayer>
                        <Rect
                            x={selectionRect.x}
                            y={selectionRect.y}
                            width={selectionRect.width}
                            height={selectionRect.height}
                            fill="rgba(33, 150, 243, 0.2)"
                            stroke="#2196F3"
                            strokeWidth={2}
                            dash={[5, 5]}
                            listening={false}
                        />
                    </KonvaLayer>
                )}
            </Stage>
        </div>
    );
});