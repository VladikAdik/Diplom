
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import { useWorkspaceLogic } from '../bll/useWorkspaceLogic';

interface WorkspaceProps {
    image?: HTMLImageElement | null;
    onUpdate?: (url: string) => void;
}

export interface WorkspaceRef {
    addImage: (newImage: HTMLImageElement) => void;
}

export function Workspace({ image, onUpdate }: WorkspaceProps) {
    const {
        stageRef,
        imageRef,
        handleWheel,
        handleDragEnd,
        handleDragMove,
    } = useWorkspaceLogic({ image, onUpdate });
    
    
    return <div>
        <Stage
            ref={stageRef}
            width={window.innerWidth}
            height={window.innerHeight - 100}
            
            onWheel={handleWheel}
            style={{ border: '1px solid #ccc',
                background: '#f5f5f5',
                willChange: 'transform' }}
        >
            <Layer>
                {/* Если есть изображение - показываем его */}
                {image && <KonvaImage
                    ref={imageRef}
                    image={image}
                    draggable
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                />}
            </Layer>
        </Stage>
    </div>;
}
