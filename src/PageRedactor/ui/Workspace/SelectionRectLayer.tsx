import { Layer as KonvaLayer, Rect } from 'react-konva';
import { SELECTION_FILL, SELECTION_STROKE, SELECTION_STROKE_WIDTH } from '../../constants/editor';

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
                fill={SELECTION_FILL}
                stroke={SELECTION_STROKE}
                strokeWidth={SELECTION_STROKE_WIDTH}
                dash={[5, 5]}                   // Пунктирная линия
                listening={false}               // Рамка не должна перехватывать события
            />
        </KonvaLayer>
    );
}