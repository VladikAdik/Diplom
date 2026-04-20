// Workspace/SelectionRect.tsx
import { Rect } from 'react-konva';
import { useState, useCallback } from 'react';
import Konva from 'konva';

interface SelectionRectProps {
    isEnabled: boolean;
    onSelect: (rect: { x: number; y: number; width: number; height: number }) => void;
}

export function SelectionRect({ isEnabled, onSelect }: SelectionRectProps) {
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isEnabled) return;
        
        // Проверяем, что нажали на пустое место (не на изображение)
        if (e.target === e.target.getStage()) {
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos) {
                setIsDrawing(true);
                setStartPoint({ x: pos.x, y: pos.y });
                setRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
            }
        }
    }, [isEnabled]);

    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !isEnabled) return;
        
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
            const width = pos.x - startPoint.x;
            const height = pos.y - startPoint.y;
            setRect({
                x: width > 0 ? startPoint.x : pos.x,
                y: height > 0 ? startPoint.y : pos.y,
                width: Math.abs(width),
                height: Math.abs(height)
            });
        }
    }, [isDrawing, isEnabled, startPoint]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing || !isEnabled) return;
        
        if (rect.width > 5 && rect.height > 5) {
            onSelect(rect);
        }
        
        setIsDrawing(false);
        setRect({ x: 0, y: 0, width: 0, height: 0 });
    }, [isDrawing, isEnabled, rect, onSelect]);

    if (!isEnabled) return null;

    return (
        <Rect
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="rgba(33, 150, 243, 0.1)"
            stroke="#2196F3"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        />
    );
}