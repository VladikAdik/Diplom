import { Layer as KonvaLayer, Rect, Line, Group } from 'react-konva';
import type { Layer } from '../../types/Layer';

interface CropOverlayProps {
    isCropping: boolean;
    cropShape: 'rect' | 'free';
    rectArea: { x: number; y: number; width: number; height: number };
    freePoints: { x: number; y: number }[];
    targetLayer?: Layer | null;
    stageWidth?: number;
    stageHeight?: number;
}

export function CropOverlay({ isCropping, cropShape, rectArea, freePoints, targetLayer }: CropOverlayProps) {
    if (!isCropping || !targetLayer) return null;
    
    const layerX = targetLayer.x ?? 0;
    const layerY = targetLayer.y ?? 0;
    
    return (
        <KonvaLayer name="crop-overlay">
            {/* Затемнение всей сцены */}
            <Rect x={-5000} y={-5000} width={10000} height={10000} fill="rgba(0,0,0,0.5)" listening={false} />
            
            {/* Вырезаемая область (прозрачная) */}
            <Group x={layerX} y={layerY}>
                {cropShape === 'rect' && rectArea.width > 0 && rectArea.height > 0 && (
                    <>
                        {/* Прозрачная область */}
                        <Rect
                            x={rectArea.x}
                            y={rectArea.y}
                            width={rectArea.width}
                            height={rectArea.height}
                            fill="rgba(255,255,255,0.3)"
                            listening={false}
                        />
                        {/* Рамка */}
                        <Rect
                            x={rectArea.x}
                            y={rectArea.y}
                            width={rectArea.width}
                            height={rectArea.height}
                            stroke="#2196F3"
                            strokeWidth={2}
                            dash={[5, 5]}
                            listening={false}
                        />
                        {/* Уголки */}
                        {[
                            { x: rectArea.x, y: rectArea.y },
                            { x: rectArea.x + rectArea.width, y: rectArea.y },
                            { x: rectArea.x, y: rectArea.y + rectArea.height },
                            { x: rectArea.x + rectArea.width, y: rectArea.y + rectArea.height },
                        ].map((pos, i) => (
                            <Rect
                                key={i}
                                x={pos.x - 4}
                                y={pos.y - 4}
                                width={8}
                                height={8}
                                fill="#2196F3"
                                stroke="white"
                                strokeWidth={1}
                                listening={false}
                            />
                        ))}
                    </>
                )}
                
                {cropShape === 'free' && freePoints.length > 1 && (
                    <Line
                        points={freePoints.flatMap(p => [p.x, p.y])}
                        stroke="#2196F3"
                        strokeWidth={2}
                        fill="rgba(33,150,243,0.2)"
                        closed={freePoints.length >= 3}
                        listening={false}
                    />
                )}
            </Group>
        </KonvaLayer>
    );
}