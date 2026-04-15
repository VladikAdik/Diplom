import { useRef, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect } from 'react-konva';

export function Workspace({ onUpdate }: { onUpdate: (url: string) => void }) {
    const stageRef = useRef<Konva.Stage>(null);
    
    const updatePreview = () => {
        if (stageRef.current) {
            const url = stageRef.current.toDataURL();
            onUpdate(url);
        }
    };

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
