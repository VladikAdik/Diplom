import { useCallback, useEffect, useRef } from 'react';
import Konva from 'konva';
import type { Layer } from '../types/Layer';

interface PenSettings {
    color: string;
    width: number;
}

interface UsePenToolProps {
    stageRef: React.RefObject<Konva.Stage | null>;
    selectedTool: string;
    layers: Layer[];
    selectedLayerIds: Set<string>;
    updateLayer: (id: string, updates: Partial<Layer>) => void;
    penColor?: string;
    penWidth?: number;
}

export function usePenTool({
    stageRef,
    selectedTool,
    layers,
    selectedLayerIds,
    updateLayer,
    penColor = '#000000',
    penWidth = 4,
}: UsePenToolProps) {
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const offCanvas = useRef<HTMLCanvasElement | null>(null);
    const offCtx = useRef<CanvasRenderingContext2D | null>(null);
    const targetLayerId = useRef<string | null>(null);
    const previewLine = useRef<Konva.Line | null>(null);
    const previewLayer = useRef<Konva.Layer | null>(null);
    const settings = useRef<PenSettings>({ color: penColor, width: penWidth });

    // Синхронизация настроек при изменении
    useEffect(() => {
        settings.current = { color: penColor, width: penWidth };
    }, [penColor, penWidth]);

    // Удалить preview-слой
    const removePreview = useCallback(() => {
        if (previewLayer.current) {
            previewLayer.current.destroy();
            previewLayer.current = null;
            previewLine.current = null;
            stageRef.current?.batchDraw();
        }
    }, [stageRef]);

    // Получить выделенный слой
    const getTargetLayer = useCallback((): Layer | null => {
        if (selectedLayerIds.size !== 1) return null;
        const id = [...selectedLayerIds][0];
        const layer = layers.find(l => l.id === id);
        if (!layer || layer.locked || !layer.visible) return null;
        if (layer.type !== 'image' && layer.type !== 'canvas') return null;
        return layer;
    }, [layers, selectedLayerIds]);

    // Инициализация offscreen canvas
    const initOffCanvas = useCallback((layer: Layer) => {
        const w = layer.width || 100;
        const h = layer.height || 100;

        offCanvas.current = document.createElement('canvas');
        offCanvas.current.width = w;
        offCanvas.current.height = h;
        offCtx.current = offCanvas.current.getContext('2d')!;

        if (layer.type === 'image' && layer.runtime?.imageElement) {
            offCtx.current.drawImage(layer.runtime.imageElement, 0, 0, w, h);
            return;
        }

        offCtx.current.fillStyle = '#ffffff';
        offCtx.current.fillRect(0, 0, w, h);

        const src = (layer.data.type === 'image' || layer.data.type === 'canvas')
            ? layer.data.src : null;
        if (!src) return;

        const img = new Image();
        img.onload = () => {
            if (!offCtx.current || !offCanvas.current) return;
            offCtx.current.clearRect(0, 0, w, h);
            offCtx.current.drawImage(img, 0, 0, w, h);
        };
        img.src = src;
    }, []);

    // Начало рисования
    const handleMouseDown = useCallback(() => {
        if (selectedTool !== 'pen') return;
        const layer = getTargetLayer();
        if (!layer) return;

        removePreview();

        targetLayerId.current = layer.id;
        initOffCanvas(layer);
        isDrawing.current = true;
        lastPos.current = null;

        const stage = stageRef.current;
        if (!stage) return;

        const { color, width } = settings.current;

        previewLayer.current = new Konva.Layer();
        const group = new Konva.Group({
            x: layer.x ?? 0,
            y: layer.y ?? 0,
        });

        previewLine.current = new Konva.Line({
            points: [],
            stroke: color,
            strokeWidth: width,
            lineCap: 'round',
            lineJoin: 'round',
            tension: 0.5,
            listening: false,
        });

        group.add(previewLine.current);
        previewLayer.current.add(group);
        stage.add(previewLayer.current);
    }, [selectedTool, getTargetLayer, initOffCanvas, removePreview, stageRef]);

    // Рисование линии на offscreen canvas
    const drawLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
        const ctx = offCtx.current;
        if (!ctx) return;
        const { color, width } = settings.current;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }, []);

    // Рисование точки на offscreen canvas
    const drawDot = useCallback((x: number, y: number) => {
        const ctx = offCtx.current;
        if (!ctx) return;
        const { color, width } = settings.current;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, width / 2, 0, Math.PI * 2);
        ctx.fill();
    }, []);

    // Движение мыши
    const handleMouseMove = useCallback(() => {
        if (!isDrawing.current || selectedTool !== 'pen') return;
        const stage = stageRef.current;
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        const layer = layers.find(l => l.id === targetLayerId.current);
        if (!layer) return;

        const scaleX = stage.scaleX();
        const scaleY = stage.scaleY();
        const stageX = stage.x();
        const stageY = stage.y();

        const layerScreenX = (layer.x ?? 0) * scaleX + stageX;
        const layerScreenY = (layer.y ?? 0) * scaleY + stageY;

        const lx = (pos.x - layerScreenX) / scaleX;
        const ly = (pos.y - layerScreenY) / scaleY;

        if (lastPos.current) {
            drawLine(lastPos.current.x, lastPos.current.y, lx, ly);
        } else {
            drawDot(lx, ly);
        }
        lastPos.current = { x: lx, y: ly };

        if (previewLine.current) {
            const pts = previewLine.current.points();
            previewLine.current.points([...pts, lx, ly]);
            previewLayer.current?.batchDraw();
        }
    }, [selectedTool, stageRef, layers, drawLine, drawDot]);

    // Отпускание мыши — сохраняем результат
    const handleMouseUp = useCallback(() => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPos.current = null;

        removePreview();

        if (!offCanvas.current || !targetLayerId.current) return;

        const id = targetLayerId.current;
        const layer = layers.find(l => l.id === id);
        if (!layer) return;

        const dataURL = offCanvas.current.toDataURL();

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

    // Сброс при смене инструмента
    const reset = useCallback(() => {
        isDrawing.current = false;
        lastPos.current = null;
        targetLayerId.current = null;
        removePreview();
    }, [removePreview]);

    return { handleMouseDown, handleMouseMove, handleMouseUp, reset };
}