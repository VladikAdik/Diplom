import { forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useWorkspaceLogic } from '../../bll/useWorkspaceLogic';
import { type Layer } from '../../types/Layer';
import { TransformControls } from './TransformControls';
import { useSelectionRect } from './useSelectionRect';
import { SelectionRectLayer } from './SelectionRectLayer';
import { LayerRenderer } from './LayerRenderer';

interface WorkspaceProps {
    layers: Layer[];
    selectedLayerIds: Set<string>;
    image?: HTMLImageElement | null;
    onUpdate?: (url: string) => void;
    selectedTool?: string;
    onSelectLayer?: (id: string, multiSelect?: boolean) => void;
    onClearSelection?: () => void;
    onSelectAll?: () => void;
    onLayerDragEnd?: (id: string, x: number, y: number) => void;
    onTransformEnd?: (transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => void;
    onSaveStateBeforeTransform?: () => void;
    layerRefs?: React.MutableRefObject<Map<string, any>>;
    onStageReady?: (stage: any) => void;
}

export const Workspace = forwardRef<any, WorkspaceProps>(({
    layers,
    selectedLayerIds,
    image,
    onUpdate,
    selectedTool = 'select',
    onSelectLayer,
    onClearSelection,
    onSelectAll,
    onLayerDragEnd,
    onTransformEnd,
    onSaveStateBeforeTransform,
    layerRefs: externalLayerRefs,
    onStageReady
}, ref) => {
    const initialImageLoadedRef = useRef(false);
    const { stageRef, handleWheel, resetView, updatePreview } = useWorkspaceLogic({ onUpdate });

    // Внутренние refs для слоёв, если не переданы снаружи
    const internalLayerRefs = useRef<Map<string, any>>(new Map());
    const layerRefs = externalLayerRefs || internalLayerRefs;

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
        if (stageRef.current) {
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
        updatePreview();
    }, [onLayerDragEnd, updatePreview]);

    const handleTransformStart = useCallback(() => {
        console.log('🟡 Workspace: transform started - saving state BEFORE change');
        // Сохраняем состояние ДО изменения
        onSaveStateBeforeTransform?.();
    }, [onSaveStateBeforeTransform]);

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
                {/* Все слои */}
                {layers.map(layer => (
                    <LayerRenderer
                        key={layer.id}
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
                <KonvaLayer>
                    <TransformControls
                        selectedNodeIds={selectedTool === 'select' ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        onTransformStart={handleTransformStart}
                        onTransformEnd={handleTransformEnd}
                    />
                </KonvaLayer>

                {/* Рамка выделения */}
                <SelectionRectLayer isSelecting={isSelecting} selectionRect={selectionRect} />
            </Stage>
        </div>
    );
});