import { useState, useCallback } from 'react';
import { WORKSPACE_PADDING, DEFAULT_STAGE_WIDTH, DEFAULT_STAGE_HEIGHT } from '../constants/editor';

export function useStageSize() {
    const [stageSize, setStageSize] = useState({ 
        width: DEFAULT_STAGE_WIDTH, 
        height: DEFAULT_STAGE_HEIGHT 
    });
    const [isAdjusted, setIsAdjusted] = useState(false);

    const fitToContent = useCallback((contentWidth: number, contentHeight: number) => {
        const maxWidth = window.innerWidth - WORKSPACE_PADDING * 2;
        const maxHeight = window.innerHeight - WORKSPACE_PADDING * 2;
        
        const scale = Math.min(
            maxWidth / contentWidth,
            maxHeight / contentHeight,
            1
        );
        
        setStageSize({
            width: Math.max(contentWidth * scale, 100),
            height: Math.max(contentHeight * scale, 100)
        });
        setIsAdjusted(true);
    }, []);

    const setCustomSize = useCallback((width: number, height: number) => {
        setStageSize({ width, height });
        setIsAdjusted(true);
    }, []);

    const getStageCenter = useCallback(() => {
        // Защита от NaN
        const width = stageSize.width || DEFAULT_STAGE_WIDTH;
        const height = stageSize.height || DEFAULT_STAGE_HEIGHT;
        return {
            x: width / 2,
            y: height / 2
        };
    }, [stageSize]);

    return { stageSize, fitToContent, setCustomSize, isAdjusted, getStageCenter };
}