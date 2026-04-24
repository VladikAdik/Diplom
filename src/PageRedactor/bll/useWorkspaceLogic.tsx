import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';
import { MIN_SCALE, MAX_SCALE, ZOOM_STEP, STAGE_PADDING_BOTTOM } from '../constants/editor';

interface WorkspaceLogicProps {
    onUpdate?: (url: string) => void;
}

export function useWorkspaceLogic({ onUpdate }: WorkspaceLogicProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const updatePreview = useCallback(() => {
        if (stageRef.current) {
            const url = stageRef.current.toDataURL();
            onUpdate?.(url);
        }
    }, [onUpdate]);

    // Обработчик колесика мыши (зум всей сцены)
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        
        const stage = stageRef.current;
        if (!stage) return;
        
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        
        if (!pointer) return;
        
        const delta = e.evt.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        let newScale = oldScale + delta;
        newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
        
        if (newScale === oldScale) return;
        
        // Зум относительно позиции мыши
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        
        const newPosition = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        
        stage.scale({ x: newScale, y: newScale });
        stage.position(newPosition);
        stage.batchDraw();
        
        setScale(newScale);
        setPosition(newPosition);
        
    }, []);

    // Ресайз окна
    useEffect(() => {
        const handleResize = () => {
            if (!stageRef.current) return;
            
            const stageWidth = window.innerWidth;
            const stageHeight = window.innerHeight - STAGE_PADDING_BOTTOM;
            
            stageRef.current.width(stageWidth);
            stageRef.current.height(stageHeight);
            stageRef.current.batchDraw();
            
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Сброс вида (центрировать всё)
    const resetView = useCallback(() => {
        if (!stageRef.current) return;
        
        stageRef.current.scale({ x: 1, y: 1 });
        stageRef.current.position({ x: 0, y: 0 });
        stageRef.current.batchDraw();
        
        setScale(1);
        setPosition({ x: 0, y: 0 });
        updatePreview();
    }, [updatePreview]);

    return {
        stageRef,
        scale,
        position,
        handleWheel,
        resetView,
        updatePreview
    };
}