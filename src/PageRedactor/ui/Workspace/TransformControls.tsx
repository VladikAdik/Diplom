import { Transformer } from 'react-konva';
import { useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { MIN_NODE_SIZE, SELECTION_STROKE } from '../../constants/editor';
import { SHAPE_REGISTRY } from '../../constants/shapeRegistry';
import type { Layer } from '../../types/Layer';

interface TransformControlsProps {
    selectedNodeIds: Set<string>;
    layerRefs: React.RefObject<Map<string, Konva.Group>>;
    layers: Layer[]; // ← нужно для определения типа фигуры
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
    layers,
    onTransformEnd
}: TransformControlsProps) {
    const transformerRef = useRef<Konva.Transformer>(null);

    // -----------------------------------------
    // Утилиты
    // -----------------------------------------

    const findNodesByIds = useCallback((ids: Set<string>): Konva.Node[] => {
        const nodes: Konva.Node[] = [];
        ids.forEach(id => {
            const group = layerRefs.current.get(id);
            if (group) {
                nodes.push(group);
            } else {
                console.warn(`Node ${id} not found`);
            }
        });
        return nodes;
    }, [layerRefs]);

    // -----------------------------------------
    // Проверка: можно ли менять размер непропорционально
    // -----------------------------------------

    const getLayerConstraint = useCallback((nodeId: string) => {
        const layer = layers.find(l => l.id === nodeId);
        if (layer?.type === 'shape' && layer.data.type === 'shape') {
            const def = SHAPE_REGISTRY[layer.data.shapeType];
            return def?.constrainResize || null;
        }
        return null;
    }, [layers]);

    // -----------------------------------------
    // Обработчик завершения трансформации
    // -----------------------------------------

    const handleTransformEnd = useCallback(() => {
        if (!onTransformEnd || selectedNodeIds.size === 0) return;
        if (!transformerRef.current) return;

        const nodes = transformerRef.current.nodes();
        if (nodes.length === 0) return;

        const transforms = nodes.map((node) => {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            let newWidth = Math.max(node.width() * scaleX, MIN_NODE_SIZE);
            let newHeight = Math.max(node.height() * scaleY, MIN_NODE_SIZE);

            // Применяем ограничение из реестра (для круга — пропорциональность)
            const constraint = getLayerConstraint(node.name());
            if (constraint) {
                const constrained = constraint(newWidth, newHeight);
                newWidth = constrained.width;
                newHeight = constrained.height;
            }

            return {
                id: node.name(),
                x: node.x(),
                y: node.y(),
                width: newWidth,
                height: newHeight,
                rotation: node.rotation(),
            };
        });

        // Отправляем новые размеры
        onTransformEnd(transforms);

        // Сбрасываем scale, т.к. размеры теперь в width/height
        nodes.forEach(node => {
            node.scaleX(1);
            node.scaleY(1);
        });

        transformerRef.current.getLayer()?.batchDraw();
    }, [selectedNodeIds, onTransformEnd, getLayerConstraint]);

    // -----------------------------------------
    // Применение трансформера к выделенным узлам
    // -----------------------------------------

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

            // Настройки трансформера
            transformerRef.current.rotateEnabled(true);
            transformerRef.current.resizeEnabled(true);
            
            // Если выделен один элемент — можно менять соотношение сторон
            // Если несколько — сохраняем пропорции для группы
            if (selectedNodeIds.size === 1) {
                transformerRef.current.keepRatio(false);
            } else {
                transformerRef.current.keepRatio(true);
            }
        });

        return () => cancelAnimationFrame(timer);
    }, [selectedNodeIds, findNodesByIds]);

    // -----------------------------------------
    // Скрываем, если ничего не выделено
    // -----------------------------------------

    if (selectedNodeIds.size === 0) return null;

    // -----------------------------------------
    // Рендер
    // -----------------------------------------

    return (
        <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
                // Минимальный размер
                if (newBox.width < MIN_NODE_SIZE || newBox.height < MIN_NODE_SIZE) {
                    return oldBox;
                }

                // Если выделен один узел — проверяем constraint
                if (selectedNodeIds.size === 1) {
                    const nodeId = [...selectedNodeIds][0];
                    const constraint = getLayerConstraint(nodeId);
                    
                    if (constraint) {
                        // Для круга: при изменении одной стороны подгоняем вторую
                        const constrained = constraint(newBox.width, newBox.height);
                        
                        // Определяем, какая сторона изменилась
                        if (Math.abs(newBox.width - oldBox.width) > Math.abs(newBox.height - oldBox.height)) {
                            // Менялась ширина — подгоняем высоту
                            return { ...newBox, height: constrained.height };
                        } else {
                            // Менялась высота — подгоняем ширину
                            return { ...newBox, width: constrained.width };
                        }
                    }
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
            enabledAnchors={[
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
                'middle-left',
                'middle-right',
                'top-center',
                'bottom-center',
            ]}
        />
    );
}