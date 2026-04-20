import { forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage } from 'react-konva';
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
    const initialImageLoadedRef = useRef(false);

    // Хук для управления зумом, панорамированием и превью
    const {
        stageRef,
        handleWheel,
        resetView,
        updatePreview
    } = useWorkspaceLogic({ onUpdate });

    // Хук для управления слоями
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


    // При каждом изменении слоёв - уведомляем родителя
    useEffect(() => {
        onLayersChange?.(layers);
    }, [layers, onLayersChange]);

    // При каждом изменении выделения - уведомляем родителя
    useEffect(() => {
        onSelectionChange?.(selectedLayerIds);
    }, [selectedLayerIds, onSelectionChange]);

    // При первом запуске (если есть image из PageStart) создаём базовый слой
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

    // Перетаскивание изображения: сохраняем новую позицию и обновляем превью
    const handleImageDragEnd = useCallback((layerId: string, x: number, y: number) => {
        updateLayerPosition(layerId, x, y);
        updatePreview();
    }, [updateLayerPosition, updatePreview]);

    // При клике на пустой фон - снимаем выделение
    const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) {
            clearSelection()
        }
    }, [clearSelection]);

    const handleTransformEnd = useCallback((ids: string[], x: number, y: number, width: number, height: number) => {
        ids.forEach(id => {
            updateLayerPosition(id, x, y, width, height);
        });
        setTimeout(() => updatePreview(), 0);
    }, [updateLayerPosition, updatePreview]);

    // Рендер одного слоя (вынесен в useCallback, чтобы не пересоздавать на каждый рендер)
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
                                selectLayer(layer.id, isMultiSelect);
                            }
                        }}
                        stroke={isSelected ? '#2196F3' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                        name={layer.id}
                    />
                )}
                {/* TODO: рендер фигур и текста */}
            </KonvaLayer>
        );
    }, [selectedLayerIds, layerRefs, selectLayer, handleImageDragEnd, selectedTool]);

    // Экспонируем методы наружу (через ref, который получит PageRedactor)
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
                onClick={handleStageClick}
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
            </Stage>
        </div>
    );
});