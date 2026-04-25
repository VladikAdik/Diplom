import { memo, useEffect } from 'react';
import { Image as KonvaImage, Shape as KonvaShape, Text as KonvaText, Group } from 'react-konva';
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
    layerRefs: React.RefObject<Map<string, Konva.Group>>; // ← меняем тип на Group
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
    useEffect(() => {
        const refs = layerRefs.current;
        return () => {
            refs.delete(layer.id);
        };
    }, [layer.id, layerRefs]);

    // Общий обработчик клика для всех типов
    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (selectedTool === 'select') {
            const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
            const isAlreadySelected = isSelected;
            if (isAlreadySelected && !isMultiSelect) return;
            onSelect(layer.id, isMultiSelect);
        }
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        onDragEnd(layer.id, e.target.x(), e.target.y());
    };

    // Рендерим содержимое в зависимости от типа
    const renderContent = () => {
        switch (layer.type) {
            case 'image':
                if (!layer.runtime?.imageElement) return null;
                return (
                    <KonvaImage
                        image={layer.runtime.imageElement}
                        width={layer.width}
                        height={layer.height}
                        name={layer.id}
                    />
                );
            case 'shape':
                if (!layer.runtime?.shapeConfig) return null;
                return (
                    <KonvaShape
                        {...layer.runtime.shapeConfig}
                        width={layer.width}
                        height={layer.height}
                        name={layer.id}
                    />
                );
            case 'text':
                if (!layer.runtime?.textConfig) return null;
                return (
                    <KonvaText
                        {...layer.runtime.textConfig}
                        width={layer.width}
                        height={layer.height}
                        name={layer.id}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Group
            ref={(node) => {
                if (node) {
                    layerRefs.current.set(layer.id, node);
                }
            }}
            x={layer.x ?? DEFAULT_LAYER_X}
            y={layer.y ?? DEFAULT_LAYER_Y}
            width={layer.width}    // ← добавь
            height={layer.height} 
            rotation={layer.rotation ?? 0}
            visible={layer.visible}
            opacity={layer.opacity}
            listening={!layer.locked}
            draggable={canDrag}
            onMouseDown={handleMouseDown}
            onDragEnd={handleDragEnd}
            stroke={isSelected ? SELECTION_STROKE : undefined}
            strokeWidth={isSelected ? 2 : 0}
            name={layer.id}
        >
            {renderContent()}
        </Group>
    );
});

LayerRenderer.displayName = 'LayerRenderer';