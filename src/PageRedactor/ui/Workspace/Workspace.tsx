import { useCallback } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useWorkspaceLogic } from '../../hooks/useWorkspace';
import { useSelectionRect } from '../../hooks/useSelectionRect';
import { LayerRenderer } from './LayerRenderer';
import { TransformControls } from './TransformControls';
import { SelectionRectLayer } from './SelectionRectLayer';
import type { Layer } from '../../types/Layer';
import type Konva from 'konva';

// === Типы ===
interface WorkspaceProps {
    layers: Layer[];
    selectedLayerIds: Set<string>;
    selectedTool: string;
    layerRefs: React.RefObject<Map<string, Konva.Group>>;
    stageSize: { width: number; height: number };
    onSelectLayer: (id: string, multiSelect?: boolean) => void;
    onClearSelection: () => void;
    onLayerDragEnd: (id: string, x: number, y: number) => void;
    onTransformEnd: (transforms: TransformData[]) => void;
    onUpdate?: (url: string) => void;
}

type TransformData = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
};

// === Стили ===
const CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    height: 'calc(100vh - 100px)',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

const STAGE_STYLE = (tool: string): React.CSSProperties => ({
    border: '1px solid #ccc',
    background: '#f5f5f5',
    cursor: tool === 'select' ? 'default' : 'crosshair',
});

// === Компонент ===
export function Workspace({
    layers,
    selectedLayerIds,
    selectedTool,
    layerRefs,
    stageSize,
    onSelectLayer,
    onClearSelection,
    onLayerDragEnd,
    onTransformEnd,
    onUpdate,
}: WorkspaceProps) {
    
    // Управление сценой
    const { stageRef, containerRef, updatePreview } = useWorkspaceLogic({ onUpdate });

    // Выделение рамкой
    const { isSelecting, selectionRect } = useSelectionRect({
        stageRef,
        selectedTool,
        layers,
        clearSelection: onClearSelection,
        selectLayer: onSelectLayer,
    });

    // Конец перетаскивания слоя
    const handleDragEnd = useCallback(
        (layerId: string, x: number, y: number) => {
            onLayerDragEnd(layerId, x, y);
            updatePreview();
        },
        [onLayerDragEnd, updatePreview]
    );

    // Конец трансформации (масштабирование/поворот)
    const handleTransformEnd = useCallback(
        (transforms: TransformData[]) => {
            onTransformEnd(transforms);
            setTimeout(() => updatePreview(), 0);
        },
        [onTransformEnd, updatePreview]
    );

    // Трансформер показываем только в режиме выделения
    const showTransformer = selectedTool === 'select';

    return (
        <div ref={containerRef} style={CONTAINER_STYLE}>
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                style={STAGE_STYLE(selectedTool)}
            >
                {/* Слои */}
                <KonvaLayer>
                    {layers.map((layer) => (
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

                    {/* Трансформер для выделенных */}
                    <TransformControls
                        selectedNodeIds={showTransformer ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        onTransformEnd={handleTransformEnd}
                    />
                </KonvaLayer>

                {/* Рамка выделения */}
                <SelectionRectLayer
                    isSelecting={isSelecting}
                    selectionRect={selectionRect}
                />
            </Stage>
        </div>
    );
}