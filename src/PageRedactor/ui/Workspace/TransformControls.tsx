import { Transformer } from 'react-konva';
import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';

interface TransformControlsProps {
    selectedNodeIds: Set<string>;
    layerRefs: React.RefObject<Map<string, Konva.Layer>>
    onTransformStart?: () => void;
    onTransformEnd?: (transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => void;
}

export function TransformControls({
    selectedNodeIds,
    layerRefs,
    onTransformStart,
    onTransformEnd
}: TransformControlsProps) {
    const transformerRef = useRef<Konva.Transformer>(null);
    const skipNextEventRef = useRef(false);

    const findNodesByIds = useCallback((ids: Set<string>): Konva.Node[] => {
        const nodes: Konva.Node[] = [];
        for (const id of ids) {
            const konvaNode = layerRefs.current.get(id);
            if (konvaNode) {
                const children = konvaNode.getChildren();
                children.forEach(child => {
                    if (child.name() === id) {
                        nodes.push(child);
                    }
                });
            }
        }
        return nodes;
    }, [layerRefs]);

    const handleTransformStart = useCallback(() => {
        console.log('🔵 TransformControls: transform START');
        onTransformStart?.();
    }, [onTransformStart]);

    const handleTransformEnd = useCallback(() => {
        if (skipNextEventRef.current) {
            console.log('🔵 Skipping duplicate transform event');
            skipNextEventRef.current = false;
            return;
        }

        console.log('🔵 TransformControls handleTransformEnd called');
        
        if (!onTransformEnd || selectedNodeIds.size === 0) return;
        if (!transformerRef.current) return;

        const nodes = transformerRef.current.nodes();
        if (nodes.length === 0) return;

        const transforms = nodes.map((node) => {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            
            return {
                id: node.name(),
                x: node.x(),
                y: node.y(),
                width: node.width() * scaleX,
                height: node.height() * scaleY,
                rotation: node.rotation(),
            };
        });

        console.log('🟢 Sending transforms and resetting scale:', transforms);
        
        // Сначала отправляем новые размеры
        onTransformEnd(transforms);
        
        // Затем сбрасываем scale и устанавливаем новые размеры на нодах
        skipNextEventRef.current = true;
        nodes.forEach(node => {
            const newWidth = node.width() * node.scaleX();
            const newHeight = node.height() * node.scaleY();
            node.width(newWidth);
            node.height(newHeight);
            node.scaleX(1);
            node.scaleY(1);
        });
        
        transformerRef.current.getLayer()?.batchDraw();
        
    }, [selectedNodeIds, onTransformEnd]);

    useEffect(() => {
        if (!transformerRef.current) return;

        if (selectedNodeIds.size === 0) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
            return;
        }

        const timer = requestAnimationFrame(() => {
            if (!transformerRef.current) return;
            const nodes = findNodesByIds(selectedNodeIds);
            transformerRef.current.nodes(nodes);
            transformerRef.current.getLayer()?.batchDraw();
            transformerRef.current.rotateEnabled(true);
            transformerRef.current.resizeEnabled(true);
        });

        return () => cancelAnimationFrame(timer);
    }, [selectedNodeIds, findNodesByIds]);

    if (selectedNodeIds.size === 0) return null;

    return (
        <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) {
                    return oldBox;
                }
                return newBox;
            }}
            rotateEnabled={true}
            resizeEnabled={true}
            keepRatio={false}
            onTransformStart={handleTransformStart}
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