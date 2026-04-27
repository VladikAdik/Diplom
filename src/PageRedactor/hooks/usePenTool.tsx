import { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import type { Layer } from '../types/Layer';

interface DrawingSettings {
    color: string;
    width: number;
    isEraser: boolean;
}

interface UseDrawingToolProps {
    stageRef: React.RefObject<Konva.Stage | null>;
    selectedTool: string;
    layers: Layer[];
    selectedLayerIds: Set<string>;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    penColor?: string;
    penWidth?: number;
}

export function useDrawingTool({
    stageRef,
    selectedTool,
    layers,
    selectedLayerIds,
    updateLayer,
    penColor = '#000000',
    penWidth = 4,
}: UseDrawingToolProps) {
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const offCanvas = useRef<HTMLCanvasElement | null>(null);
    const offCtx = useRef<CanvasRenderingContext2D | null>(null);
    const targetLayerId = useRef<string | null>(null);
    const previewLine = useRef<Konva.Line | null>(null);
    const previewLayer = useRef<Konva.Layer | null>(null);
    const settings = useRef<DrawingSettings>({ color: penColor, width: penWidth, isEraser: false });

    useEffect(() => {
        const isEraser = selectedTool === 'eraser';
        settings.current = {
            color: isEraser ? '#000000' : penColor,
            width: penWidth,
            isEraser,
        };
    }, [penColor, penWidth, selectedTool]);

    const isActiveTool = useCallback(() => {
        return selectedTool === 'pen' || selectedTool === 'eraser';
    }, [selectedTool]);

    const removePreview = useCallback(() => {
        if (previewLayer.current) {
            previewLayer.current.destroy();
            previewLayer.current = null;
            previewLine.current = null;
            stageRef.current?.batchDraw();
        }
    }, [stageRef]);

    const getTargetLayer = useCallback((): Layer | null => {
        if (selectedLayerIds.size !== 1) return null;
        const id = [...selectedLayerIds][0];
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.locked || !layer.visible) return null;
        if (layer.type !== 'image' && layer.type !== 'canvas') return null;
        return layer;
    }, [layers, selectedLayerIds]);

    const initOffCanvas = useCallback((layer: Layer) => {
    const w = layer.width || 100;
    const h = layer.height || 100;

    offCanvas.current = document.createElement('canvas');
    offCanvas.current.width = w;
    offCanvas.current.height = h;
    offCtx.current = offCanvas.current.getContext('2d', { alpha: true })!;

    // 1. Image с готовым элементом — рисуем синхронно
    if (layer.type === 'image' && layer.runtime?.imageElement) {
        offCtx.current.drawImage(layer.runtime.imageElement, 0, 0, w, h);
        return;
    }

    // 2. Создаём временное изображение и рисуем СИНХРОННО через блокирующую загрузку
    const src = (layer.data.type === 'image' || layer.data.type === 'canvas')
        ? layer.data.src : null;
    if (!src) return;

    // Используем готовый Image из кэша браузера (если загружался ранее)
    const img = new Image();
    img.src = src;
    
    if (img.complete) {
        // Уже загружено — рисуем синхронно
        offCtx.current.drawImage(img, 0, 0, w, h);
    } else {
        // Не загружено — ждём (редкий случай)
        offCtx.current.fillStyle = '#ffffff';
        offCtx.current.fillRect(0, 0, w, h);
        img.onload = () => {
            if (!offCtx.current || !offCanvas.current) return;
            offCtx.current.clearRect(0, 0, w, h);
            offCtx.current.drawImage(img, 0, 0, w, h);
        };
    }
}, []);

    const handleMouseDown = useCallback(() => {
        if (!isActiveTool()) return;
        const layer = getTargetLayer();
        if (!layer) return;

        removePreview();

        targetLayerId.current = layer.id;
        initOffCanvas(layer);
        isDrawing.current = true;
        lastPos.current = null;

        const stage = stageRef.current;
        if (!stage) return;

        const { color, width, isEraser } = settings.current;

        previewLayer.current = new Konva.Layer();
        const group = new Konva.Group({
            x: layer.x ?? 0,
            y: layer.y ?? 0,
        });

        previewLine.current = new Konva.Line({
            points: [],
            stroke: isEraser ? '#ffffff' : color,
            strokeWidth: width,
            opacity: isEraser ? 0.5 : 1,
            lineCap: 'round',
            lineJoin: 'round',
            tension: 0.5,
            listening: false,
        });

        group.add(previewLine.current);
        previewLayer.current.add(group);
        stage.add(previewLayer.current);
    }, [isActiveTool, getTargetLayer, initOffCanvas, removePreview, stageRef]);

    const drawLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
        const ctx = offCtx.current;
        if (!ctx) return;
        const { color, width, isEraser } = settings.current;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
        }
        ctx.stroke();
    }, []);

    const drawDot = useCallback((x: number, y: number) => {
        const ctx = offCtx.current;
        if (!ctx) return;
        const { color, width, isEraser } = settings.current;

        ctx.beginPath();
        ctx.arc(x, y, width / 2, 0, Math.PI * 2);

        if (isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = color;
        }
        ctx.fill();
    }, []);

    const handleMouseMove = useCallback(() => {
    if (!isDrawing.current || !isActiveTool()) return;
    const stage = stageRef.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const layer = layers.find(l => l.id === targetLayerId.current);
    if (!layer) return;

    const scaleX = stage.scaleX();
    const scaleY = stage.scaleY();
    
    // Правильный расчет координат относительно слоя
    const lx = (pos.x - stage.x()) / scaleX - (layer.x ?? 0);
    const ly = (pos.y - stage.y()) / scaleY - (layer.y ?? 0);

    if (lastPos.current) {
        drawLine(lastPos.current.x, lastPos.current.y, lx, ly);
    } else {
        drawDot(lx, ly);
    }
    lastPos.current = { x: lx, y: ly };

    // Обновляем превью
    if (previewLine.current) {
        const pts = previewLine.current.points();
        previewLine.current.points([...pts, lx, ly]);
        previewLayer.current?.batchDraw();
    }
}, [isActiveTool, stageRef, layers, drawLine, drawDot]);

    const handleMouseUp = useCallback(() => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPos.current = null;

        removePreview();

        if (!offCanvas.current || !targetLayerId.current) return;

        const id = targetLayerId.current;
        const layer = layers.find(l => l.id === id);
        if (!layer) return;

        const dataURL = offCanvas.current.toDataURL('image/png');

        if (layer.type === 'image') {
            updateLayer(id, {
                type: 'canvas' as const,
                data: {
                    type: 'canvas' as const,
                    src: dataURL,
                    width: layer.width,
                    height: layer.height,
                },
                runtime: undefined,
            });
        } else {
            updateLayer(id, {
                data: {
                    ...layer.data,
                    src: dataURL,
                } as Layer['data'],
            });
        }
    }, [layers, updateLayer, removePreview]);

    const reset = useCallback(() => {
        isDrawing.current = false;
        lastPos.current = null;
        targetLayerId.current = null;
        removePreview();
    }, [removePreview]);

    return { handleMouseDown, handleMouseMove, handleMouseUp, reset };
}