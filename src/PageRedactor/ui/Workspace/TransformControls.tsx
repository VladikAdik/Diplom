import { Transformer } from 'react-konva';
import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { MIN_NODE_SIZE, SELECTION_STROKE } from '../../constants/editor';

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
    onTransformEnd
}: TransformControlsProps) {
    const transformerRef = useRef<Konva.Transformer>(null);

    const findNodesByIds = useCallback((ids: Set<string>): Konva.Node[] => {
        const nodes: Konva.Node[] = [];
        layerRefs.current.forEach((konvaLayer, layerId) => {
            if (ids.has(layerId)) {
                const child = konvaLayer.findOne(`#${layerId}`);
                if (child) nodes.push(child);
            }
        });
        return nodes;
    }, [layerRefs]);

    const handleTransformEnd = useCallback(() => {

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
                width: Math.max(node.width() * scaleX, MIN_NODE_SIZE),  // ДОБАВЬ Math.max
                height: Math.max(node.height() * scaleY, MIN_NODE_SIZE), // ДОБАВЬ Math.max
                rotation: node.rotation(),
            };
        });

        console.log('🟢 Sending transforms and resetting scale:', transforms);

        // Сначала отправляем новые размеры
        onTransformEnd(transforms);

        nodes.forEach(node => {
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
                if (newBox.width < MIN_NODE_SIZE || newBox.height < MIN_NODE_SIZE) {
                    return oldBox;
                }
                return newBox;
            }}
            rotateEnabled={true}
            resizeEnabled={true}
            keepRatio={false}
            onTransformEnd={handleTransformEnd}
            borderStroke={SELECTION_STROKE}
            borderStrokeWidth={2}
            anchorFill="#2196F3"
            anchorStroke="#fff"
            anchorSize={8}
            rotateAnchorOffset={20}
            ignoreStroke={true}
        />
    );
}