import { useEffect, useRef, useState } from 'react';
import type Konva from 'konva';
import type { Layer } from '../../types/Layer';
import { DEFAULT_LAYER_X, DEFAULT_LAYER_Y, DEFAULT_SHAPE_WIDTH } from '../../constants/editor';

interface UseSelectionRectProps {
    stageRef: React.RefObject<Konva.Stage | null>;
    selectedTool: string;
    layers: Layer[];
    clearSelection: () => void;
    selectLayer: (id: string, multiSelect?: boolean) => void;
}

export function useSelectionRect({
    stageRef,
    selectedTool,
    layers,
    clearSelection,
    selectLayer
}: UseSelectionRectProps) {
    // Состояния для рамки выделения
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Ref'ы для отслеживания состояния без ререндеров
    const selectionStartRef = useRef({ x: 0, y: 0 });  // Точка начала рамки
    const isDrawingRef = useRef(false);                // Флаг рисования рамки
    const selectionRectRef = useRef(selectionRect); // ref для актуальной рамки

    useEffect(() => {
        selectionRectRef.current = selectionRect;
    }, [selectionRect]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        // Начало рисования рамки
        const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (selectedTool !== 'select') return;
            if (e.target !== stage) return;  // Только клик по пустому фону

            const pos = stage.getPointerPosition();
            if (!pos) return;

            isDrawingRef.current = true;
            selectionStartRef.current = pos;
            setIsSelecting(true);
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
        };

        // Обновление размеров рамки при движении мыши
        const handleMouseMove = () => {
            if (!isDrawingRef.current || selectedTool !== 'select') return;

            const pos = stage.getPointerPosition();
            if (!pos) return;

            const startX = selectionStartRef.current.x;
            const startY = selectionStartRef.current.y;
            const width = pos.x - startX;
            const height = pos.y - startY;

            // Поддерживаем отрицательные размеры (перетаскивание влево/вверх)
            setSelectionRect({
                x: width > 0 ? startX : pos.x,
                y: height > 0 ? startY : pos.y,
                width: Math.abs(width),
                height: Math.abs(height)
            });
        };

        // Завершение рисования рамки
        const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
            if (!isDrawingRef.current || selectedTool !== 'select') return;

            const currentRect = selectionRectRef.current;
            const isClickOnly = currentRect.width <= 5 && currentRect.height <= 5;

            if (isClickOnly) {
                // Простой клик по пустоте — сбрасываем выделение (если без Ctrl)
                if (!e.evt.ctrlKey && !e.evt.metaKey) {
                    clearSelection();
                }
            } else {
                // Рамка достаточно большая — выделяем все пересекающиеся слои
                const toSelect: string[] = [];

                layers.forEach(layer => {
                    if (layer.locked) return;

                    const x = layer.x ?? DEFAULT_LAYER_X;
                    const y = layer.y ?? DEFAULT_LAYER_Y;
                    const w = layer.width ?? (layer.data.width ?? DEFAULT_SHAPE_WIDTH);
                    const h = layer.height ?? (layer.data.height ?? DEFAULT_SHAPE_WIDTH);

                    // Проверка пересечения рамки со слоем (AABB collision detection)
                    if (currentRect.x < x + w && currentRect.x + currentRect.width > x &&
                        currentRect.y < y + h && currentRect.y + currentRect.height > y) {
                        toSelect.push(layer.id);
                    }
                });

                if (toSelect.length > 0) {
                    clearSelection();
                    toSelect.forEach(id => selectLayer(id, true));
                }
            }

            // Сброс состояния рисования
            isDrawingRef.current = false;
            setIsSelecting(false);
            setSelectionRect({ x: 0, y: 0, width: 0, height: 0 });
        };

        // Регистрируем обработчики на Stage
        stage.on('mousedown', handleMouseDown);
        stage.on('mousemove', handleMouseMove);
        stage.on('mouseup', handleMouseUp);

        // Очистка при размонтировании
        return () => {
            stage.off('mousedown', handleMouseDown);
            stage.off('mousemove', handleMouseMove);
            stage.off('mouseup', handleMouseUp);
        };
    }, [selectedTool, stageRef, layers, clearSelection, selectLayer]);

    return { isSelecting, selectionRect };
}