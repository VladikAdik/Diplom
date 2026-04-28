import { useCallback } from 'react';
import type { Layer } from '../types/Layer';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast' | 'saturate';

export interface FilterConfig {
    type: FilterType;
    value: number;
}

function getCSSFilter(type: string, value: number): string {
    switch (type) {
        case 'grayscale': return `grayscale(${value}%)`;
        case 'sepia': return `sepia(${value}%)`;
        case 'invert': return `invert(${value}%)`;
        case 'blur': return `blur(${value}px)`;
        case 'brightness': return `brightness(${value + 100}%)`;
        case 'contrast': return `contrast(${value + 100}%)`;
        case 'saturate': return `saturate(${value + 100}%)`;
        default: return 'none';
    }
}

// Вспомогательная функция для получения src
function getLayerSrc(layer: Layer): string | null {
    const data = layer.data as { src?: string };
    return data.src || null;
}

export function useFilters(
    mutate: (mutation: (prevLayers: Layer[]) => Layer[]) => void
) {
    const applyFilter = useCallback((id: string, filterType: FilterType, value: number) => {
        if (filterType === 'none' || value === 0) return;

        mutate(prev => {
            return prev.map(layer => {
                if (layer.id !== id) return layer;

                const isImage = layer.type === 'image' && layer.runtime?.imageElement;
                const isCanvas = layer.type === 'canvas';

                if (!isImage && !isCanvas) return layer;

                // Получаем исходное изображение
                const sourceImg = isImage 
                    ? layer.runtime!.imageElement!
                    : (() => {
                        const src = getLayerSrc(layer);
                        if (!src) return null;
                        const img = new Image();
                        img.src = src;
                        return img;
                      })();

                if (!sourceImg) return layer;

                const canvas = document.createElement('canvas');
                canvas.width = sourceImg.width;
                canvas.height = sourceImg.height;
                const ctx = canvas.getContext('2d')!;
                
                ctx.filter = getCSSFilter(filterType, value);
                ctx.drawImage(sourceImg, 0, 0);
                
                const dataURL = canvas.toDataURL();
                const newImg = new Image();
                newImg.src = dataURL;
                
                canvas.remove();
                
                return {
                    ...layer,
                    type: 'canvas' as const,
                    data: {
                        type: 'canvas' as const,
                        src: dataURL,
                        width: layer.width,
                        height: layer.height,
                    },
                    runtime: { imageElement: newImg },
                };
            });
        });
    }, [mutate]);

    // Превью фильтра (только для image/canvas слоёв)
    const getFilterPreview = useCallback((layer: Layer, filterType: FilterType, value: number): string | null => {
        if (filterType === 'none' || value === 0) return null;

        const isImage = layer.type === 'image' && layer.runtime?.imageElement;
        const isCanvas = layer.type === 'canvas';

        if (!isImage && !isCanvas) return null;

        const sourceImg = isImage 
            ? layer.runtime!.imageElement!
            : (() => {
                const src = getLayerSrc(layer);
                if (!src) return null;
                const img = new Image();
                img.src = src;
                return img;
              })();

        if (!sourceImg) return null;

        const canvas = document.createElement('canvas');
        canvas.width = sourceImg.width;
        canvas.height = sourceImg.height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.filter = getCSSFilter(filterType, value);
        ctx.drawImage(sourceImg, 0, 0);
        
        const dataURL = canvas.toDataURL();
        canvas.remove();
        
        return dataURL;
    }, []);

    return { applyFilter, getFilterPreview };
}