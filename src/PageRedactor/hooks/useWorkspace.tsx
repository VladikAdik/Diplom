import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';
import { MIN_SCALE, MAX_SCALE } from '../constants/editor';

interface WorkspaceLogicProps {
    onUpdate?: (url: string) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
}

const ZOOM_IN_FACTOR = 1.1;   // 10% увеличение
const ZOOM_OUT_FACTOR = 0.9;  // 10% уменьшение

export function useWorkspaceLogic({ onUpdate, stageRef }: WorkspaceLogicProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // === Превью сцены ===
    const updatePreview = useCallback(() => {
        if (stageRef.current) {
            const url = stageRef.current.toDataURL();
            onUpdate?.(url);
        }
    }, [onUpdate, stageRef]);

    // === Применение зума к сцене ===
    const applyZoom = useCallback((stage: Konva.Stage, zoomFactor: number) => {
        const currentScale = stage.scaleX();
        const newScale = currentScale * zoomFactor;

        // Проверка границ
        if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

        // Масштабируем размер сцены
        const newWidth = stage.width() * zoomFactor;
        const newHeight = stage.height() * zoomFactor;

        // Применяем изменения
        stage.width(newWidth);
        stage.height(newHeight);
        stage.scale({ x: newScale, y: newScale });
        stage.batchDraw();

        setScale(newScale);
    }, []);

    // === Обработчик колёсика мыши ===
    const handleWheel = useCallback((event: WheelEvent) => {
        event.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        // Крутим вверх = zoomIn, вниз = zoomOut
        const zoomFactor = event.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;

        applyZoom(stage, zoomFactor);
    }, [applyZoom, stageRef]);

    // === Навешиваем обработчик на весь контейнер ===
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    // === Сброс вида к исходному ===
    const resetView = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;

        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();

        setScale(1);
        updatePreview();
    }, [updatePreview, stageRef]);

    return {
        stageRef,
        containerRef,
        scale,
        resetView,
        updatePreview,
    };
}