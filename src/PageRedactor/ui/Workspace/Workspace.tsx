import { forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useWorkspaceLogic } from '../../bll/useWorkspaceLogic';
import { type Layer } from '../../types/Layer';
import { TransformControls } from './TransformControls';
import { useSelectionRect } from './useSelectionRect';
import { SelectionRectLayer } from './SelectionRectLayer';
import { LayerRenderer } from './LayerRenderer';
import type Konva from 'konva';

interface WorkspaceHandle {
    resetView: () => void;
    updatePreview: () => void;
    getStage: () => Konva.Stage | null;
}

interface WorkspaceProps {
    layers: Layer[];
    selectedLayerIds: Set<string>;
    image?: HTMLImageElement | null;
    onUpdate?: (url: string) => void;
    selectedTool?: string;
    onSelectLayer?: (id: string, multiSelect?: boolean) => void;
    onClearSelection?: () => void;
    onLayerDragEnd?: (id: string, x: number, y: number) => void;
    onTransformEnd?: (transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => void;
    layerRefs?: React.MutableRefObject<Map<string, Konva.Group>>;
    onStageReady?: (stage: Konva.Stage) => void;
}

export const Workspace = forwardRef<WorkspaceHandle, WorkspaceProps>(({
    layers,
    selectedLayerIds,
    image,
    onUpdate,
    selectedTool = 'select',
    onSelectLayer,
    onClearSelection,
    onLayerDragEnd,
    onTransformEnd,
    layerRefs: externalLayerRefs,
    onStageReady
}, ref) => {
    const initialImageLoadedRef = useRef(false);
    const { stageRef, handleWheel, resetView, updatePreview } = useWorkspaceLogic({ onUpdate });

    // Внутренние refs для слоёв, если не переданы снаружи
    const internalLayerRefs = useRef<Map<string, Konva.Group>>(new Map());
    const layerRefs = externalLayerRefs || internalLayerRefs;
    const stageReadyCalled = useRef(false);

    // Хук для выделения рамкой
    const { isSelecting, selectionRect } = useSelectionRect({
        stageRef,
        selectedTool,
        layers,
        clearSelection: onClearSelection || (() => { }),
        selectLayer: onSelectLayer || (() => { })
    });

    // Уведомляем родителя о готовности stage (если нужно)
    useEffect(() => {
        if (stageRef.current && !stageReadyCalled.current) {
            stageReadyCalled.current = true;
            onStageReady?.(stageRef.current);
        }
    }, [stageRef, onStageReady]);

    // При монтировании: если передано изображение, создаём базовый слой через пропсы
    useEffect(() => {
        if (image && !initialImageLoadedRef.current && layers.length === 0) {
            initialImageLoadedRef.current = true;
            // Это должно обрабатываться родителем через addImageLayer
            console.warn('Image provided but no layers - use addImageLayer from useLayers');
        }
    }, [image, layers.length]);

    // Обработчик завершения перетаскивания слоя
    const handleImageDragEnd = useCallback((layerId: string, x: number, y: number) => {
        onLayerDragEnd?.(layerId, x, y);
        // Сохраняем состояние ПОСЛЕ завершения перетаскивания
        updatePreview();
    }, [onLayerDragEnd, updatePreview]);

    // Обработчик завершения трансформации
    const handleTransformEnd = useCallback((transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => {
        console.log('🟡 Workspace: received transforms:', transforms);
        onTransformEnd?.(transforms);
        // Сохраняем состояние ПОСЛЕ применения трансформации
        setTimeout(() => updatePreview(), 0);
    }, [onTransformEnd, updatePreview]);

    // Обёртка для selectLayer
    const handleSelectLayer = useCallback((id: string, multiSelect: boolean) => {
        onSelectLayer?.(id, multiSelect);
    }, [onSelectLayer]);

    // Экспортируем методы через ref (для обратной совместимости)
    useImperativeHandle(ref, () => ({
        resetView,
        updatePreview,
        getStage: () => stageRef.current
    }), [resetView, updatePreview, stageRef]);

    // Вычисляем, можно ли перетаскивать слой
    const canDrag = useCallback((layer: Layer) => {
        return !layer.locked && selectedTool === 'select';
    }, [selectedTool]);

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
                {/* Единый слой для всех объектов */}
                <KonvaLayer>
                    {/* Все объекты */}
                    {layers.map(layer => (
                        <LayerRenderer
                            key={`${layer.id}-${layer.zIndex}`}
                            layer={layer}
                            isSelected={selectedLayerIds.has(layer.id)}
                            canDrag={canDrag(layer)}
                            onDragEnd={handleImageDragEnd}
                            onSelect={handleSelectLayer}
                            selectedTool={selectedTool}
                            layerRefs={layerRefs}
                        />
                    ))}

                    {/* Контролы трансформации */}
                    <TransformControls
                        selectedNodeIds={selectedTool === 'select' ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        onTransformEnd={handleTransformEnd}
                    />
                </KonvaLayer>

                {/* Рамка выделения */}
                <SelectionRectLayer isSelecting={isSelecting} selectionRect={selectionRect} />
            </Stage>
        </div>
    );
});