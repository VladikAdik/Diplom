import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';
import { MIN_SCALE, MAX_SCALE } from '../../constants/editor';

interface WorkspaceLogicProps {
    onUpdate?: (url: string) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
}

export function useWorkspaceLogic({ onUpdate, stageRef }: WorkspaceLogicProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const spacePressed = useRef(false);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

    // === Отслеживаем размер контейнера ===
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                setStageSize({ width, height });
                const stage = stageRef.current;
                if (stage) {
                    stage.width(width);
                    stage.height(height);
                    stage.batchDraw();
                }
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [stageRef]);

    // === Пробел ===
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                e.preventDefault();
                spacePressed.current = true;
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                spacePressed.current = false;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    // === Превью ===
    const updatePreview = useCallback(() => {
        if (stageRef.current) {
            const url = stageRef.current.toDataURL();
            onUpdate?.(url);
        }
    }, [onUpdate, stageRef]);

    // === Зум колесом ===
    const handleWheel = useCallback((event: WheelEvent) => {
        event.preventDefault();

        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newScale = oldScale * zoomFactor;

        if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newX = pointer.x - mousePointTo.x * newScale;
        const newY = pointer.y - mousePointTo.y * newScale;

        stage.scale({ x: newScale, y: newScale });
        stage.position({ x: newX, y: newY });
        stage.batchDraw();

        setScale(newScale);
        setStagePos({ x: newX, y: newY });
    }, [stageRef]);

    // === Панорамирование (колёсико или пробел+левая) ===
    const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1 || (spacePressed.current && e.evt.button === 0)) {
            isPanning.current = true;
            lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
            e.evt.preventDefault();
        }
    }, []);

    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isPanning.current) return;

        const stage = stageRef.current;
        if (!stage) return;

        const dx = e.evt.clientX - lastPanPos.current.x;
        const dy = e.evt.clientY - lastPanPos.current.y;

        let newX = stage.x() + dx;
        let newY = stage.y() + dy;

        // === Мягкое ограничение ===
        const viewW = stage.width();
        const viewH = stage.height();
        const margin = 200; // отступ, куда можно уйти

        // Вычисляем границы (если нет контента — не ограничиваем)
        // newX: центр сцены (0,0) не должен уходить далеко
        const maxX = viewW + margin;
        const minX = -margin;
        const maxY = viewH + margin;
        const minY = -margin;

        newX = Math.min(maxX, Math.max(minX, newX));
        newY = Math.min(maxY, Math.max(minY, newY));

        stage.position({ x: newX, y: newY });
        stage.batchDraw();

        lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        setStagePos({ x: newX, y: newY });
    }, [stageRef]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
    }, []);

    // === Навешиваем wheel на контейнер ===
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // === Сброс вида ===
    const resetView = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;

        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();

        setScale(1);
        setStagePos({ x: 0, y: 0 });
        updatePreview();
    }, [updatePreview, stageRef]);

    return {
        containerRef,
        scale,
        stagePos,
        stageSize,
        resetView,
        updatePreview,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}