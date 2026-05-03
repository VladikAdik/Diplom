import { useCallback } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useWorkspaceLogic } from '../../hooks/workspace';
import { useSelectionRect } from '../../hooks/interaction';
import { LayerRenderer } from './LayerRenderer';
import { SnapGuides } from './SnapGuides';
import { TransformControls } from './TransformControls';
import { SelectionRectLayer } from './SelectionRectLayer';
import type { SnapGuide } from '../../hooks/interaction';
import type { Layer } from '../../types/Layer';
import type Konva from 'konva';
import { CropOverlay } from './CropOverlay';
import styles from './Workspace.module.css';

interface WorkspaceProps {
    layers: Layer[];
    selectedLayerIds: Set<string>;
    selectedTool: string;
    layerRefs: React.RefObject<Map<string, Konva.Group>>;
    onSelectLayer: (id: string, multiSelect?: boolean) => void;
    onClearSelection: () => void;
    onLayerDragEnd: (id: string, x: number, y: number) => void;
    onTransformEnd: (transforms: TransformData[]) => void;
    onUpdate?: (url: string) => void;
    onLayerDragMove?: (id: string, x: number, y: number, width?: number, height?: number) => void;
    snapGuides: SnapGuide[];
    stageRef: React.RefObject<Konva.Stage | null>;
    penHandlers?: {
        onMouseDown: () => void;
        onMouseMove: () => void;
        onMouseUp: () => void;
    };
    cropHandlers?: {
        onMouseDown: () => void;
        onMouseMove: () => void;
        onMouseUp: () => void;
    };
    rectArea: { x: number; y: number; width: number; height: number };
    freePoints: { x: number; y: number }[];
    onEditText?: (id: string, node: Konva.Text) => void;
}

type TransformData = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
};

export function Workspace({
    layers,
    selectedLayerIds,
    selectedTool,
    layerRefs,
    stageRef,
    penHandlers,
    onSelectLayer,
    onClearSelection,
    onLayerDragEnd,
    onTransformEnd,
    onUpdate,
    onLayerDragMove,
    snapGuides,
    cropHandlers,
    rectArea,
    freePoints,
    onEditText,
}: WorkspaceProps) {

    const { containerRef, stageSize, updatePreview } = useWorkspaceLogic({ onUpdate, stageRef });

    const { isSelecting, selectionRect } = useSelectionRect({
        stageRef,
        selectedTool,
        layers,
        clearSelection: onClearSelection,
        selectLayer: onSelectLayer,
    });

    const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1) return;

        if (selectedTool === 'pen' || selectedTool === 'eraser') {
            penHandlers?.onMouseDown();
        }
        if (selectedTool === 'cropRect' || selectedTool === 'cropFree') {
            cropHandlers?.onMouseDown();
        }
    }, [selectedTool, penHandlers, cropHandlers]);

    const handleStageMouseMove = useCallback(() => {
        if (selectedTool === 'pen' || selectedTool === 'eraser') {
            penHandlers?.onMouseMove();
        }
        if (selectedTool === 'cropRect' || selectedTool === 'cropFree') {
            cropHandlers?.onMouseMove();
        }
    }, [selectedTool, penHandlers, cropHandlers]);

    const handleStageMouseUp = useCallback(() => {
        if (selectedTool === 'pen' || selectedTool === 'eraser') {
            penHandlers?.onMouseUp();
        }
        if (selectedTool === 'cropRect' || selectedTool === 'cropFree') {
            cropHandlers?.onMouseUp();
        }
    }, [selectedTool, penHandlers, cropHandlers]);

    const handleDragEnd = useCallback(
        (layerId: string, x: number, y: number) => {
            onLayerDragEnd(layerId, x, y);
            updatePreview();
        },
        [onLayerDragEnd, updatePreview]
    );

    const handleTransformEnd = useCallback(
        (transforms: TransformData[]) => {
            onTransformEnd(transforms);
            setTimeout(() => updatePreview(), 0);
        },
        [onTransformEnd, updatePreview]
    );

    const showTransformer = selectedTool === 'select';
    const isCropping = selectedTool === 'cropRect' || selectedTool === 'cropFree';
    const cropShape = selectedTool === 'cropRect' ? 'rect' : 'free';
    const activeLayer = layers.find(l => selectedLayerIds.has(l.id));

    const stageClass = selectedTool === 'select' ? styles.stageDefault : styles.stageCrosshair;

    return (
        <div ref={containerRef} className={styles.container}>
            <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                className={stageClass}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
            >
                <KonvaLayer>
                    {layers.map((layer) => (
                        <LayerRenderer
                            key={layer.id}
                            layer={layer}
                            isSelected={selectedLayerIds.has(layer.id)}
                            canDrag={!layer.locked && selectedTool === 'select'}
                            onDragEnd={handleDragEnd}
                            onDragMove={onLayerDragMove}
                            onSelect={onSelectLayer}
                            selectedTool={selectedTool}
                            layerRefs={layerRefs}
                            onEditText={onEditText}
                        />
                    ))}

                    <TransformControls
                        selectedNodeIds={showTransformer ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        layers={layers}
                        onTransformEnd={handleTransformEnd}
                    />
                    <SnapGuides
                        guides={snapGuides}
                        stageWidth={stageSize.width}
                        stageHeight={stageSize.height}
                    />
                </KonvaLayer>

                <CropOverlay
                    isCropping={isCropping}
                    cropShape={cropShape}
                    rectArea={rectArea}
                    freePoints={freePoints}
                    targetLayer={activeLayer}
                />

                <SelectionRectLayer
                    isSelecting={isSelecting}
                    selectionRect={selectionRect}
                />
            </Stage>
        </div>
    );
}