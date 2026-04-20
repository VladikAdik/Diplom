// TransformControls.tsx
import { Transformer } from 'react-konva';
import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';

interface TransformControlsProps {
    selectedNodeIds: Set<string>;
    layerRefs: React.RefObject<Map<string, Konva.Layer>>
    onTransformEnd?: (transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        deltaX: number;
        deltaY: number;
        deltaWidth: number;
        deltaHeight: number;
        deltaRotation: number;
    }>) => void;
}

export function TransformControls({
    selectedNodeIds,
    layerRefs,
    onTransformEnd
}: TransformControlsProps) {
    const transformerRef = useRef<Konva.Transformer>(null);
    // Сохраняем начальные данные трансформации
    const transformStartData = useRef<Map<string, { x: number; y: number; width: number; height: number; rotation: number }>>(new Map());

    // Найти все узлы по ID
    const findNodesByIds = useCallback((ids: Set<string>): Konva.Node[] => {
        const nodes: Konva.Node[] = [];

        for (const id of ids) {
            const konvaLayer = layerRefs.current.get(id);
            if (konvaLayer) {
                // Ищем Image узел внутри слоя
                const imageNode = konvaLayer.findOne(`.${id}`);
                if (imageNode && imageNode instanceof Konva.Image) {
                    nodes.push(imageNode);
                }
            }
        }

        return nodes;
    }, [layerRefs]);

    // Сохранить начальные позиции перед трансформацией
    const handleTransformStart = useCallback(() => {
        if (selectedNodeIds.size === 0) return;

        const nodes = findNodesByIds(selectedNodeIds);
        transformStartData.current.clear();

        nodes.forEach(node => {
            transformStartData.current.set(node.name(), {
                x: node.x(),
                y: node.y(),
                width: node.width(),
                height: node.height(),
                rotation: node.rotation()
            });
        });
    }, [selectedNodeIds, findNodesByIds]);

    // После завершения трансформации - передаём изменения
    const handleTransformEnd = useCallback(() => {
        if (!onTransformEnd || selectedNodeIds.size === 0) return;

        const nodes = findNodesByIds(selectedNodeIds);

        // Для каждого узла вычисляем изменения относительно начальной позиции
        const transforms = nodes.map((node) => {
            const id = node.name();
            const startData = transformStartData.current.get(id);

            if (!startData) return null;

            return {
                id,
                x: node.x(),
                y: node.y(),
                width: node.width(),
                height: node.height(),
                rotation: node.rotation(),
                // Вычисляем дельты (относительные изменения)
                deltaX: node.x() - startData.x,
                deltaY: node.y() - startData.y,
                deltaWidth: node.width() - startData.width,
                deltaHeight: node.height() - startData.height,
                deltaRotation: node.rotation() - startData.rotation
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        // Передаём все трансформации
        onTransformEnd(transforms);

        transformStartData.current.clear();
    }, [selectedNodeIds, findNodesByIds, onTransformEnd]);

    // Обновить трансформер при изменении выделения
    useEffect(() => {
        if (!transformerRef.current) return;

        if (selectedNodeIds.size === 0) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
            return;
        }

        // Даём время на рендер
        const timer = setTimeout(() => {
            const nodes = findNodesByIds(selectedNodeIds);

            if (nodes.length > 0) {
                transformerRef.current?.nodes(nodes);
                transformerRef.current?.getLayer()?.batchDraw();

                // Настройки трансформера для множественного выбора
                transformerRef.current?.rotateEnabled(true);
                transformerRef.current?.resizeEnabled(true);
            } else {
                transformerRef.current?.nodes([]);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [selectedNodeIds, findNodesByIds]);

    if (selectedNodeIds.size === 0) return null;

    return (
        <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
                // Минимальный размер
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