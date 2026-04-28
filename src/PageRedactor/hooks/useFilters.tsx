import { useCallback, useRef } from 'react';
import type { Layer } from '../types/Layer';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast' | 'saturate';

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

function getLayerSrc(layer: Layer): string | null {
    const data = layer.data as { src?: string };
    return data.src || null;
}

function cloneLayer(layer: Layer): Layer {
    return {
        ...layer,
        data: { ...layer.data },
        runtime: layer.runtime ? {
            imageElement: layer.runtime.imageElement,
            shapeConfig: layer.runtime.shapeConfig ? { ...layer.runtime.shapeConfig } : undefined,
            textConfig: layer.runtime.textConfig ? { ...layer.runtime.textConfig } : undefined,
        } : undefined,
    };
}

export function useFilters(
    layers: Layer[],
    setLayers: (value: Layer[] | ((prev: Layer[]) => Layer[])) => void,
    mutate: (mutation: (prev: Layer[]) => Layer[]) => void
) {
    const originalLayersRef = useRef<Layer[] | null>(null);

    const previewFilter = useCallback((filterType: FilterType, value: number, selectedIds: Set<string>) => {
        if (!originalLayersRef.current) {
            originalLayersRef.current = layers.map(cloneLayer);
        }

        const originals = originalLayersRef.current;

        setLayers((prev: Layer[]): Layer[] => {
            return prev.map((layer: Layer): Layer => {
                if (!selectedIds.has(layer.id)) return layer;

                const original = originals.find((o: Layer) => o.id === layer.id);
                if (!original) return layer;

                const isImage = original.type === 'image' && original.runtime?.imageElement;
                const isCanvas = original.type === 'canvas';

                if (!isImage && !isCanvas) return layer;

                let sourceImg: HTMLImageElement | null = null;

                if (isImage && original.runtime?.imageElement) {
                    sourceImg = original.runtime.imageElement;
                } else if (isCanvas) {
                    const src = getLayerSrc(original);
                    if (src) {
                        sourceImg = new Image();
                        sourceImg.src = src;
                    }
                }

                if (!sourceImg || !sourceImg.width || !sourceImg.height) return layer;

                const canvas = document.createElement('canvas');
                canvas.width = sourceImg.width;
                canvas.height = sourceImg.height;
                const ctx = canvas.getContext('2d')!;

                if (filterType !== 'none' && value !== 0) {
                    ctx.filter = getCSSFilter(filterType, value);
                }
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
    }, [layers, setLayers]);

    const applyFilter = useCallback((filterType: FilterType, value: number, selectedIds: Set<string>) => {
        const originals = originalLayersRef.current;
        originalLayersRef.current = null;

        mutate((prev: Layer[]): Layer[] => {
            return prev.map((layer: Layer): Layer => {
                if (!selectedIds.has(layer.id)) return layer;

                const original = originals?.find((o: Layer) => o.id === layer.id) || layer;

                const isImage = original.type === 'image' && original.runtime?.imageElement;
                const isCanvas = original.type === 'canvas';

                if (!isImage && !isCanvas) return layer;

                let sourceImg: HTMLImageElement | null = null;

                if (isImage && original.runtime?.imageElement) {
                    sourceImg = original.runtime.imageElement;
                } else if (isCanvas) {
                    const src = getLayerSrc(original);
                    if (src) {
                        sourceImg = new Image();
                        sourceImg.src = src;
                    }
                }

                if (!sourceImg || !sourceImg.width || !sourceImg.height) return layer;

                const canvas = document.createElement('canvas');
                canvas.width = sourceImg.width;
                canvas.height = sourceImg.height;
                const ctx = canvas.getContext('2d')!;

                if (filterType !== 'none' && value !== 0) {
                    ctx.filter = getCSSFilter(filterType, value);
                }
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

    const cancelPreview = useCallback(() => {
        if (originalLayersRef.current) {
            setLayers(originalLayersRef.current);
            originalLayersRef.current = null;
        }
    }, [setLayers]);

    return { previewFilter, applyFilter, cancelPreview };
}