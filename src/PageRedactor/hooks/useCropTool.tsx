import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import type { Layer } from '../types/Layer';

interface UseCropToolProps {
    stageRef: React.RefObject<Konva.Stage | null>;
    layers: Layer[];
    selectedLayerIds: Set<string>;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    onCropComplete?: () => void; // опционально — сбросить инструмент
}

export function useCropTool({ stageRef, layers, selectedLayerIds, updateLayer, onCropComplete }: UseCropToolProps) {
    const [isCropping, setIsCropping] = useState(false);
    const [cropShape, setCropShape] = useState<'rect' | 'free'>('rect');
    const [rectArea, setRectArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [freePoints, setFreePoints] = useState<{ x: number; y: number }[]>([]);
    const drawingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });

    const getTargetLayer = useCallback(() => {
        if (selectedLayerIds.size !== 1) return null;
        const id = [...selectedLayerIds][0];
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.locked) return null;
        if (layer.type !== 'image' && layer.type !== 'canvas') return null;
        return layer;
    }, [layers, selectedLayerIds]);

    const cancelCrop = useCallback(() => {
        setIsCropping(false);
        setRectArea({ x: 0, y: 0, width: 0, height: 0 });
        setFreePoints([]);
        drawingRef.current = false;
    }, []);

    const startCrop = useCallback((shape: 'rect' | 'free') => {
        const layer = getTargetLayer();
        if (!layer) return;
        setCropShape(shape);
        setIsCropping(true);
        setRectArea({ x: 0, y: 0, width: 0, height: 0 });
        setFreePoints([]);
        drawingRef.current = false;
    }, [getTargetLayer]);

    const handleMouseDown = useCallback(() => {
        if (!isCropping) return;
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
            drawingRef.current = true;
            startPosRef.current = { x: lx, y: ly };
            setRectArea({ x: lx, y: ly, width: 0, height: 0 });
        } else {
            setFreePoints(prev => [...prev, { x: lx, y: ly }]);
        }
    }, [isCropping, cropShape, stageRef, getTargetLayer]);

    const handleMouseMove = useCallback(() => {
        if (!isCropping || cropShape !== 'rect' || !drawingRef.current) return;
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
            x: lx > startPosRef.current.x ? startPosRef.current.x : lx,
            y: ly > startPosRef.current.y ? startPosRef.current.y : ly,
            width: Math.abs(lx - startPosRef.current.x),
            height: Math.abs(ly - startPosRef.current.y),
        });
    }, [isCropping, cropShape, stageRef, getTargetLayer]);

    const applyCrop = useCallback(() => {
        const layer = getTargetLayer();
        if (!layer) return;
        
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
        newImg.src = dataURL;
        
        updateLayer(layer.id, {
            type: 'canvas',
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
        
        cancelCrop();
        onCropComplete?.();
    }, [getTargetLayer, cropShape, rectArea, freePoints, updateLayer, cancelCrop, onCropComplete]);

    return {
        isCropping,
        cropShape,
        rectArea,
        freePoints,
        startCrop,
        handleMouseDown,
        handleMouseMove,
        applyCrop,
        cancelCrop,
    };
}