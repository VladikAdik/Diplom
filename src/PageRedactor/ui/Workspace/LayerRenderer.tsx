import { memo, useEffect } from 'react';
import { Layer as KonvaLayer, Image as KonvaImage, Shape as KonvaShape, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { Layer } from '../../types/Layer';
import { DEFAULT_LAYER_X, DEFAULT_LAYER_Y, SELECTION_STROKE } from '../../constants/editor';

interface LayerRendererProps {
    layer: Layer;
    isSelected: boolean;
    canDrag: boolean;
    onDragEnd: (id: string, x: number, y: number) => void;
    onSelect: (id: string, multiSelect: boolean) => void;
    selectedTool: string;
    layerRefs: React.RefObject<Map<string, Konva.Layer>>;
}

export const LayerRenderer = memo(({
    layer,
    isSelected,
    canDrag,
    onDragEnd,
    onSelect,
    selectedTool,
    layerRefs
}: LayerRendererProps) => {
    // Очистка ref при размонтировании
    useEffect(() => {
        const refs = layerRefs.current;
        return () => {
            refs.delete(layer.id);
        };
    }, [layer.id, layerRefs]);

    return (
        <KonvaLayer
            ref={(node) => {
                if (node) {
                    layerRefs.current.set(layer.id, node);
                }
            }}
            visible={layer.visible}
            opacity={layer.opacity}
            listening={!layer.locked}
        >
            {/* Изображения */}
            {layer.type === 'image' && layer.runtime?.imageElement && (
                <KonvaImage
                    image={layer.runtime.imageElement}
                    x={layer.x ?? DEFAULT_LAYER_X}
                    y={layer.y ?? DEFAULT_LAYER_Y}
                    stroke={isSelected ? SELECTION_STROKE : undefined}
                    width={layer.width}
                    height={layer.height}
                    draggable={canDrag}
                    onDragEnd={(e) => onDragEnd(layer.id, e.target.x(), e.target.y())}
                    onMouseDown={(e) => {
                        e.cancelBubble = true;
                        if (selectedTool === 'select') {
                            const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                            const isAlreadySelected = isSelected;
                            if (isAlreadySelected && !isMultiSelect) return;
                            onSelect(layer.id, isMultiSelect);
                        }
                    }}
                    strokeWidth={isSelected ? 2 : 0}
                    name={layer.id}
                />
            )}

            {/* Фигуры */}
            {layer.type === 'shape' && layer.runtime?.shapeConfig && (
                <KonvaShape
                    {...layer.runtime.shapeConfig}
                    x={layer.x ?? DEFAULT_LAYER_X}
                    y={layer.y ?? DEFAULT_LAYER_Y}
                    stroke={isSelected ? SELECTION_STROKE : undefined}
                    width={layer.width}
                    height={layer.height}
                    rotation={layer.rotation}
                    draggable={canDrag}
                    onDragEnd={(e) => onDragEnd(layer.id, e.target.x(), e.target.y())}
                    onMouseDown={(e) => {
                        e.cancelBubble = true;
                        if (selectedTool === 'select') {
                            const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                            const isAlreadySelected = isSelected;
                            if (isAlreadySelected && !isMultiSelect) return;
                            onSelect(layer.id, isMultiSelect);
                        }
                    }}
                    strokeWidth={isSelected ? 2 : layer.runtime.shapeConfig.strokeWidth}
                    name={layer.id}
                />
            )}

            {/* Текст */}
            {layer.type === 'text' && layer.runtime?.textConfig && (
                <KonvaText
                    {...layer.runtime.textConfig}
                    x={layer.x ?? DEFAULT_LAYER_X}
                    y={layer.y ?? DEFAULT_LAYER_Y}
                    stroke={isSelected ? SELECTION_STROKE : undefined}
                    width={layer.width}
                    height={layer.height}
                    rotation={layer.rotation}
                    draggable={canDrag}
                    onDragEnd={(e) => onDragEnd(layer.id, e.target.x(), e.target.y())}
                    onMouseDown={(e) => {
                        e.cancelBubble = true;
                        if (selectedTool === 'select') {
                            const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                            const isAlreadySelected = isSelected;
                            if (isAlreadySelected && !isMultiSelect) return;
                            onSelect(layer.id, isMultiSelect);
                        }
                    }}
                    strokeWidth={isSelected ? 2 : 0}
                    name={layer.id}
                />
            )}
        </KonvaLayer>
    );
});

LayerRenderer.displayName = 'LayerRenderer';