import { memo } from 'react';
import { Layer as KonvaLayer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Layer } from '../../types/Layer';

interface LayerRendererProps {
    layer: Layer;
    isSelected: boolean;
    canDrag: boolean;
    onDragEnd: (id: string, x: number, y: number) => void;
    onSelect: (id: string, multiSelect: boolean) => void;
    selectedTool: string;
    layerRefs: React.RefObject<Map<string, Konva.Layer>>;    // Ссылки на Konva слои
}

// memo предотвращает лишние перерендеры (оптимизация)
export const LayerRenderer = memo(({
    layer,
    isSelected,
    canDrag,
    onDragEnd,
    onSelect,
    selectedTool,
    layerRefs
}: LayerRendererProps) => {
    return (
        <KonvaLayer
            // Сохраняем ссылку на Konva слой для TransformControls
            ref={(node) => {
                if (node) {
                    layerRefs.current.set(layer.id, node.getLayer());
                }
                return () => {
                    layerRefs.current.delete(layer.id);
                };
            }}
            visible={layer.visible}     // Видимость слоя
            opacity={layer.opacity}     // Прозрачность слоя
            listening={!layer.locked}   // Заблокированный слой не реагирует на события
        >
            {/* Пока поддерживаются только изображения */}
            {layer.type === 'image' && layer.data instanceof HTMLImageElement && (
                <KonvaImage
                    image={layer.data}
                    x={layer.x ?? 100}
                    y={layer.y ?? 100}
                    width={layer.width}
                    height={layer.height}
                    draggable={canDrag}           // Перетаскивание только в режиме select
                    onDragEnd={(e) => onDragEnd(layer.id, e.target.x(), e.target.y())}
                    onMouseDown={(e) => {
                        e.cancelBubble = true;    // Останавливаем всплытие события
                        if (selectedTool === 'select') {
                            const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
                            const isAlreadySelected = isSelected;
                            // Если слой уже выделен и без Ctrl — не меняем выделение
                            if (isAlreadySelected && !isMultiSelect) return;
                            onSelect(layer.id, isMultiSelect);
                        }
                    }}
                    stroke={isSelected ? '#2196F3' : undefined}  // Синяя обводка у выделенного
                    strokeWidth={isSelected ? 2 : 0}
                    name={layer.id}  // Используется TransformControls для поиска узла
                />
            )}
        </KonvaLayer>
    );
});

LayerRenderer.displayName = 'LayerRenderer';  // Для удобства отладки в React DevTools