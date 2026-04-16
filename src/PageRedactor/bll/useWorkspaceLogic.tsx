import { useRef, useEffect, useCallback, useState } from 'react';
import Konva from 'konva';

interface WorkspaceLogicProps {
    image?: HTMLImageElement | null;
    onUpdate?: (url: string) => void;
}

export function useWorkspaceLogic({ image, onUpdate }: WorkspaceLogicProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const imageRef = useRef<Konva.Image>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const updatePreview = useCallback(() => {
        if (stageRef.current) {
            const url = stageRef.current.toDataURL();
            onUpdate?.(url);
        }
    }, [onUpdate]);

    // Обработчик колесика мыши
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        
        if (!stageRef.current || !imageRef.current) return;
        
        const stage = stageRef.current;
        const oldScale = scale;
        const pointer = stage.getPointerPosition();
        
        if (!pointer) return;
        
        const delta = e.evt.deltaY > 0 ? -0.05 : 0.05;
        let newScale = oldScale + delta;
        newScale = Math.min(Math.max(newScale, 0.1), 5);
        
        if (newScale === oldScale) return;
        
        const mousePointTo = {
            x: (pointer.x - position.x) / oldScale,
            y: (pointer.y - position.y) / oldScale,
        };
        
        const newPosition = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        
        setScale(newScale);
        setPosition(newPosition);
        
        imageRef.current.scale({ x: newScale, y: newScale });
        imageRef.current.position(newPosition);
        imageRef.current.getLayer()?.batchDraw();
        
        updatePreview();
    }, [scale, position, updatePreview]);

    // Ресайз окна
    useEffect(() => {
        const handleResize = () => {
            if (!stageRef.current || !image) return;
            
            const stageWidth = window.innerWidth;
            const stageHeight = window.innerHeight;
            
            stageRef.current.width(stageWidth);
            stageRef.current.height(stageHeight);
            
            const newScale = Math.min(
                (stageWidth * 0.8) / image.width,
                (stageHeight * 0.8) / image.height,
                1
            );
            
            const x = (stageWidth - image.width * newScale) / 2;
            const y = (stageHeight - image.height * newScale) / 2;
            
            setScale(newScale);
            setPosition({ x, y });
            
            if (imageRef.current) {
                imageRef.current.scale({ x: newScale, y: newScale });
                imageRef.current.position({ x, y });
                imageRef.current.getLayer()?.batchDraw();
            }
            
            updatePreview();
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [image, updatePreview]);

    useEffect(() => {
        updatePreview();
    }, [updatePreview]);

    const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        setPosition(e.target.position());
        updatePreview();
    }, [updatePreview]);

    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        setPosition(e.target.position());
    }, []);

    return {
        stageRef,
        imageRef,
        scale,
        position,
        handleWheel,
        handleDragEnd,
        handleDragMove,
        updatePreview
    };
}