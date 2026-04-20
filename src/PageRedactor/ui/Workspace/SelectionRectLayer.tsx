import { Layer as KonvaLayer, Rect } from 'react-konva';

interface SelectionRectLayerProps {
    isSelecting: boolean;                                    // Идёт ли рисование рамки
    selectionRect: { x: number; y: number; width: number; height: number }; // Координаты рамки
}

export function SelectionRectLayer({ isSelecting, selectionRect }: SelectionRectLayerProps) {
    // Не рисуем рамку, если нет активного выделения или размер нулевой
    if (!isSelecting || selectionRect.width <= 0 || selectionRect.height <= 0) {
        return null;
    }

    return (
        <KonvaLayer>
            <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(33, 150, 243, 0.2)"
                stroke="#2196F3"                 // Синяя граница
                strokeWidth={2}
                dash={[5, 5]}                   // Пунктирная линия
                listening={false}               // Рамка не должна перехватывать события
            />
        </KonvaLayer>
    );
}