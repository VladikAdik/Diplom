import { forwardRef, useCallback } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useWorkspaceLogic } from '../../hooks/useWorkspace';
import { useSelectionRect } from '../../hooks/useSelectionRect';
import { LayerRenderer } from './LayerRenderer';
import { TransformControls } from './TransformControls';
import { SelectionRectLayer } from './SelectionRectLayer';
import type { Layer } from '../../types/Layer';
import type Konva from 'konva';

interface WorkspaceProps {
    layers: Layer[];
    selectedLayerIds: Set<string>;
    selectedTool: string;
    layerRefs: React.RefObject<Map<string, Konva.Group>>;
    stageSize: { width: number; height: number };

    // Колбэки (теперь приходят напрямую из useLayers)
    onSelectLayer: (id: string, multiSelect?: boolean) => void;
    onClearSelection: () => void;
    onLayerDragEnd: (id: string, x: number, y: number) => void;
    onTransformEnd: (transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => void;

    onUpdate?: (url: string) => void;
}

export type WorkspaceHandle = {
    resetView: () => void;
    updatePreview: () => void;
    getStage: () => Konva.Stage | null;
};

export const Workspace = forwardRef<WorkspaceHandle, WorkspaceProps>(({
    layers,
    selectedLayerIds,
    selectedTool,
    layerRefs,
    stageSize,
    onSelectLayer,
    onClearSelection,
    onLayerDragEnd,
    onTransformEnd,
    onUpdate
}) => {
    // ==================================
    // Хуки
    // ==================================

    // Управление сценой: зум, ресайз, превью
    const { stageRef, handleWheel, updatePreview } = useWorkspaceLogic({ onUpdate });

    // Логика выделения рамкой (drag-прямоугольник)
    const { isSelecting, selectionRect } = useSelectionRect({
        stageRef,
        selectedTool,
        layers,
        clearSelection: onClearSelection,
        selectLayer: onSelectLayer
    });

    // ==================================
    // Обработчики событий
    // ==================================

    const handleDragEnd = useCallback((layerId: string, x: number, y: number) => {
        onLayerDragEnd(layerId, x, y);
        updatePreview();
    }, [onLayerDragEnd, updatePreview]);

    const handleTransformEnd = useCallback((transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => {
        onTransformEnd(transforms);
        setTimeout(() => updatePreview(), 0);
    }, [onTransformEnd, updatePreview]);

    // ==================================
    // Рендер
    // ==================================

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 100px)',
            overflow: 'hidden',
            display: 'flex',           // ← добавить
            justifyContent: 'center',  // ← добавить
            alignItems: 'center'
        }}>
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onWheel={handleWheel}
                style={{
                    border: '1px solid #ccc',
                    background: '#f5f5f5',
                    cursor: selectedTool === 'select' ? 'default' : 'crosshair'
                }}
            >
                <KonvaLayer>
                    {layers.map(layer => (
                        <LayerRenderer
                            key={layer.id}
                            layer={layer}
                            isSelected={selectedLayerIds.has(layer.id)}
                            canDrag={!layer.locked && selectedTool === 'select'}
                            onDragEnd={handleDragEnd}
                            onSelect={onSelectLayer}
                            selectedTool={selectedTool}
                            layerRefs={layerRefs}
                        />
                    ))}

                    <TransformControls
                        selectedNodeIds={selectedTool === 'select' ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        onTransformEnd={handleTransformEnd}
                    />
                </KonvaLayer>

                <SelectionRectLayer isSelecting={isSelecting} selectionRect={selectionRect} />
            </Stage>
        </div>
    );
});