import { memo, useEffect } from 'react';
import { Layer as KonvaLayer, Image as KonvaImage, Shape as KonvaShape, Text as KonvaText } from 'react-konva';
import type Konva from 'konva';
import type { Layer } from '../../types/Layer';

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
        return () => {
            layerRefs.current.delete(layer.id);
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
                    x={layer.x ?? 100}
                    y={layer.y ?? 100}
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
                    stroke={isSelected ? '#2196F3' : undefined}
                    strokeWidth={isSelected ? 2 : 0}
                    name={layer.id}
                />
            )}

            {/* Фигуры */}
            {layer.type === 'shape' && layer.runtime?.shapeConfig && (
                <KonvaShape
                    {...layer.runtime.shapeConfig}
                    x={layer.x}
                    y={layer.y}
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
                    stroke={isSelected ? '#2196F3' : layer.runtime.shapeConfig.stroke}
                    strokeWidth={isSelected ? 2 : layer.runtime.shapeConfig.strokeWidth}
                    name={layer.id}
                />
            )}

            {/* Текст */}
            {layer.type === 'text' && layer.runtime?.textConfig && (
                <KonvaText
                    {...layer.runtime.textConfig}
                    x={layer.x}
                    y={layer.y}
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
                    stroke={isSelected ? '#2196F3' : undefined}
                    strokeWidth={isSelected ? 2 : 0}
                    name={layer.id}
                />
            )}
        </KonvaLayer>
    );
});

LayerRenderer.displayName = 'LayerRenderer';