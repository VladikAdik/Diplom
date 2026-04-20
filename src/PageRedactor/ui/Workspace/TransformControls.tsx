// TransformControls.tsx
import { Transformer } from 'react-konva';
import { useEffect, useRef } from 'react';
import Konva from 'konva';

interface TransformControlsProps {
    selectedNodeIds: Set<string>;
    layerRefs: React.RefObject<Map<string, Konva.Layer>>
    onTransformEnd?: (id: string[], x: number, y: number, width: number, height: number) => void;
}

export function TransformControls({ 
    selectedNodeIds, 
    layerRefs, 
    onTransformEnd 
}: TransformControlsProps) {
    const transformerRef = useRef<Konva.Transformer>(null);

    // Этот эффект срабатывает, когда выбранный слой меняется
    useEffect(() => {
        if (!transformerRef.current) {
            return;
        }

        if (selectedNodeIds.size === 0) {
            transformerRef.current.nodes([]);
            return;
        }

        // Даём время на рендер
        const timer = setTimeout(() => {
            const nodes: Konva.Node[] = [];
            
            for (const id of selectedNodeIds) {
                const konvaLayer = layerRefs.current.get(id);
                if (konvaLayer) {
                    const imageNode = konvaLayer.findOne(`.${id}`);
                    if (imageNode && imageNode instanceof Konva.Image) {
                        nodes.push(imageNode);
                    }
                }
            }
            
            if (nodes.length > 0) {
                transformerRef.current?.nodes(nodes);
                transformerRef.current?.getLayer()?.batchDraw();
            } else {
                transformerRef.current?.nodes([]);
            }
        }, 0);
        
        return () => clearTimeout(timer);
    }, [selectedNodeIds, layerRefs]);

    // Когда пользователь закончил трансформацию (отпустил мышь)
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
        if (!onTransformEnd || selectedNodeIds.size === 0) return;
        
        const node = e.target;
        const ids = Array.from(selectedNodeIds);
        onTransformEnd(ids, node.x(), node.y(), node.width(), node.height());
    };

    // Если ничего не выбрано - не рендерим трансформер
    if (selectedNodeIds.size === 0) return null;

    return (
        <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
                // Защита от слишком маленького размера
                if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                }
                return newBox;
            }}
            rotateEnabled={true}
            resizeEnabled={true}
            keepRatio={false}
            onTransformEnd={handleTransformEnd}
            borderStroke="#2196F3"
            borderStrokeWidth={2}
            anchorFill="#2196F3"
            anchorStroke="#fff"
            anchorSize={8}
            rotateAnchorOffset={20}
            ignoreStroke={true}
        />
    );
}