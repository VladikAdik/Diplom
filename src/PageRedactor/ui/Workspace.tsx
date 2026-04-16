import { useRef, useEffect, useCallback, } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';

interface WorkspaceProps {
    image?: HTMLImageElement | null;
    onUpdate?: (url: string) => void;
}

export function Workspace({ image, onUpdate }: WorkspaceProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const imageRef = useRef<Konva.Image>(null);
    
    const updatePreview = useCallback(() => {
        if (stageRef.current) {
            const url = stageRef.current.toDataURL();
            onUpdate?.(url);
        }
    }, [onUpdate]);

    // Эффект для ресайза окна
    useEffect(() => {
        const handleResize = () => {
            if (!stageRef.current || !image) return;
            
            const stageWidth = window.innerWidth;
            const stageHeight = window.innerHeight;
            
            stageRef.current.width(stageWidth);
            stageRef.current.height(stageHeight);
            
            const scaleX = (stageWidth * 0.8) / image.width;
            const scaleY = (stageHeight * 0.8) / image.height;
            const scale = Math.min(scaleX, scaleY, 1);
            
            const x = (stageWidth - image.width * scale) / 2;
            const y = (stageHeight - image.height * scale) / 2;
            
            if (imageRef.current) {
                imageRef.current.scale({ x: scale, y: scale });
                imageRef.current.position({ x, y });
                imageRef.current.getLayer()?.batchDraw();
            }
            
            updatePreview();
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [image, updatePreview]);

    useEffect(() => {
        updatePreview();
    }, []);

    return <div>
        <Stage
            ref={stageRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseUp={updatePreview}
            onDragEnd={updatePreview}
            style={{ border: '1px solid #ccc', background: '#f5f5f5' }}
        >
            <Layer>
                {/* Если есть изображение - показываем его */}
                {image && <KonvaImage image={image} x={0} y={0} draggable/>}

                <Rect
                x={50}
                y={50}
                width={100}
                height={100}
                fill="red"
                draggable
            />
            </Layer>
        </Stage>
    </div>;
}
