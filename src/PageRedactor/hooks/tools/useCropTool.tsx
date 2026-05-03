import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import type { Layer } from '../../types/Layer';

interface UseCropToolProps {
    stageRef: React.RefObject<Konva.Stage | null>;
    layers: Layer[];
    targetLayerId: string | null;
    selectedTool: string;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    selectLayer?: (id: string) => void;  // ← добавь
    onCropComplete?: () => void;
}

export function useCropTool({
    stageRef,
    layers,
    targetLayerId,
    selectedTool,
    selectLayer,
    updateLayer,
    onCropComplete
}: UseCropToolProps) {
    const [isCropping, setIsCropping] = useState(false);
    const [cropShape, setCropShape] = useState<'rect' | 'free'>('rect');
    const [rectArea, setRectArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [freePoints, setFreePoints] = useState<{ x: number; y: number }[]>([]);

    // Для рисования прямоугольника
    const isDrawingRect = useRef(false);
    const rectStartRef = useRef({ x: 0, y: 0 });

    // Для рисования произвольной формы
    const isDrawingFree = useRef(false);

    const getTargetLayer = useCallback(() => {
        if (!targetLayerId) return null;
        const layer = layers.find(l => l.id === targetLayerId);
        if (!layer || layer.locked) return null;
        if (layer.type !== 'image' && layer.type !== 'canvas') return null;
        return layer;
    }, [layers, targetLayerId]);

    const startCrop = useCallback((shape: 'rect' | 'free') => {
        const layer = getTargetLayer();
        if (!layer) return;
        setCropShape(shape);
        setIsCropping(true);
        setRectArea({ x: 0, y: 0, width: 0, height: 0 });
        setFreePoints([]);
        isDrawingRect.current = false;
        isDrawingFree.current = false;
    }, [getTargetLayer]);

    const cancelCrop = useCallback(() => {
        setIsCropping(false);
        setRectArea({ x: 0, y: 0, width: 0, height: 0 });
        setFreePoints([]);
        isDrawingRect.current = false;
        isDrawingFree.current = false;
    }, []);

    const handleMouseDown = useCallback(() => {
        const isCropActive = selectedTool === 'cropRect' || selectedTool === 'cropFree';
        if (!isCropActive || !isCropping) return;

        const stage = stageRef.current;
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        const layer = getTargetLayer();
        if (!layer) return;

        const scaleX = stage.scaleX();
        const scaleY = stage.scaleY();
        const lx = (pos.x - stage.x()) / scaleX - (layer.x ?? 0);
        const ly = (pos.y - stage.y()) / scaleY - (layer.y ?? 0);

        if (cropShape === 'rect') {
            // Начинаем рисовать прямоугольник
            isDrawingRect.current = true;
            rectStartRef.current = { x: lx, y: ly };
            setRectArea({ x: lx, y: ly, width: 0, height: 0 });
        } else if (cropShape === 'free') {
            // Для произвольной формы — добавляем точки
            isDrawingFree.current = true;
            setFreePoints([{ x: lx, y: ly }]);
        }
    }, [selectedTool, isCropping, cropShape, stageRef, getTargetLayer]);

    const handleMouseMove = useCallback(() => {
        // Прямоугольник
        if (cropShape === 'rect' && isDrawingRect.current) {
            const stage = stageRef.current;
            if (!stage) return;

            const pos = stage.getPointerPosition();
            if (!pos) return;

            const layer = getTargetLayer();
            if (!layer) return;

            const scaleX = stage.scaleX();
            const scaleY = stage.scaleY();
            const lx = (pos.x - stage.x()) / scaleX - (layer.x ?? 0);
            const ly = (pos.y - stage.y()) / scaleY - (layer.y ?? 0);

            setRectArea({
                x: lx > rectStartRef.current.x ? rectStartRef.current.x : lx,
                y: ly > rectStartRef.current.y ? rectStartRef.current.y : ly,
                width: Math.abs(lx - rectStartRef.current.x),
                height: Math.abs(ly - rectStartRef.current.y),
            });
            return;
        }

        // Произвольная форма
        if (cropShape === 'free' && isDrawingFree.current) {
            const stage = stageRef.current;
            if (!stage) return;

            const pos = stage.getPointerPosition();
            if (!pos) return;

            const layer = getTargetLayer();
            if (!layer) return;

            const scaleX = stage.scaleX();
            const scaleY = stage.scaleY();
            const lx = (pos.x - stage.x()) / scaleX - (layer.x ?? 0);
            const ly = (pos.y - stage.y()) / scaleY - (layer.y ?? 0);

            setFreePoints(prev => [...prev, { x: lx, y: ly }]);
        }
    }, [cropShape, stageRef, getTargetLayer]);

    const handleMouseUp = useCallback(() => {
        // Для прямоугольника — фиксируем область при отпускании
        if (cropShape === 'rect' && isDrawingRect.current) {
            isDrawingRect.current = false;
            return;
        }

        // Для произвольной формы — завершаем рисование
        if (cropShape === 'free' && isDrawingFree.current) {
            isDrawingFree.current = false;
        }
    }, [cropShape]);

    const applyCrop = useCallback(() => {
        const layer = getTargetLayer();
        if (!layer) return;

        // Для прямоугольника — проверяем что область выбрана
        if (cropShape === 'rect' && (rectArea.width < 5 || rectArea.height < 5)) {
            cancelCrop();
            return;
        }

        // Для произвольной формы — нужно минимум 3 точки
        if (cropShape === 'free' && freePoints.length < 3) {
            cancelCrop();
            return;
        }

        // Получаем исходное изображение
        let sourceImg: HTMLImageElement | null = null;
        if (layer.runtime?.imageElement) {
            sourceImg = layer.runtime.imageElement;
        } else if (layer.type === 'canvas' && layer.data.type === 'canvas') {
            sourceImg = new Image();
            sourceImg.src = layer.data.src;
        }

        if (!sourceImg) return;

        const canvas = document.createElement('canvas');
        let cropX = 0, cropY = 0, cropW = 0, cropH = 0;

        if (cropShape === 'rect' && rectArea.width > 0 && rectArea.height > 0) {
            cropX = Math.max(0, rectArea.x);
            cropY = Math.max(0, rectArea.y);
            cropW = Math.min(rectArea.width, (layer.width || sourceImg.width) - cropX);
            cropH = Math.min(rectArea.height, (layer.height || sourceImg.height) - cropY);
            canvas.width = cropW;
            canvas.height = cropH;
        } else if (cropShape === 'free' && freePoints.length >= 3) {
            const xs = freePoints.map(p => p.x);
            const ys = freePoints.map(p => p.y);
            const minX = Math.max(0, Math.min(...xs));
            const minY = Math.max(0, Math.min(...ys));
            const maxX = Math.min(layer.width || sourceImg.width, Math.max(...xs));
            const maxY = Math.min(layer.height || sourceImg.height, Math.max(...ys));
            cropW = maxX - minX;
            cropH = maxY - minY;
            canvas.width = cropW;
            canvas.height = cropH;
            cropX = minX;
            cropY = minY;
        } else {
            return;
        }

        const ctx = canvas.getContext('2d')!;

        if (cropShape === 'free' && freePoints.length >= 3) {
            ctx.beginPath();
            const adjustedPoints = freePoints.map(p => ({ x: p.x - cropX, y: p.y - cropY }));
            ctx.moveTo(adjustedPoints[0].x, adjustedPoints[0].y);
            for (let i = 1; i < adjustedPoints.length; i++) {
                ctx.lineTo(adjustedPoints[i].x, adjustedPoints[i].y);
            }
            ctx.closePath();
            ctx.clip();
        }

        ctx.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const dataURL = canvas.toDataURL();
        const newImg = new Image();
        newImg.onload = () => {
            const newX = (layer.x ?? 0) + cropX;
            const newY = (layer.y ?? 0) + cropY;

            updateLayer(layer.id, {
                type: 'canvas',
                x: newX,
                y: newY,
                width: cropW,
                height: cropH,
                data: {
                    type: 'canvas',
                    src: dataURL,
                    width: cropW,
                    height: cropH,
                },
                runtime: { imageElement: newImg },
            });

            // Выделяем только ПОСЛЕ обновления
            setTimeout(() => {
                selectLayer?.(layer.id);
                onCropComplete?.();
            }, 0);
        };

        newImg.onerror = () => {
            cancelCrop();
        };

        newImg.src = dataURL;
        cancelCrop(); // сбрасываем UI сразу
    }, [getTargetLayer, cropShape, rectArea, freePoints, updateLayer, cancelCrop, onCropComplete, selectLayer]);

    return {
        isCropping,
        cropShape,
        rectArea,
        freePoints,
        startCrop,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,  // ← добавили
        applyCrop,
        cancelCrop,
    };
}