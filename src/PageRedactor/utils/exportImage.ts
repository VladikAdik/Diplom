// src/utils/exportImage.ts
import Konva from 'konva';
import type { Layer } from '../types/Layer';
import { getContentBounds } from './getContentBounds';

interface ExportOptions {
    format: 'png' | 'jpeg';
    quality?: number;
    pixelRatio?: number;
    padding?: number;
}

export function exportImage(
    stage: Konva.Stage,
    layers: Layer[],
    options: ExportOptions = { format: 'png' }
): string | null {
    const bounds = getContentBounds(layers);
    if (!bounds) return null;

    const { format, quality = 0.95, pixelRatio = 2, padding = 20 } = options;

    // Преобразуем координаты сцены в координаты stage (view)
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();

    const x = (bounds.x - padding) * scale + stageX;
    const y = (bounds.y - padding) * scale + stageY;
    const width = (bounds.width + padding * 2) * scale;
    const height = (bounds.height + padding * 2) * scale;

    return stage.toDataURL({
        mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality,
        pixelRatio,
        x,
        y,
        width,
        height,
    });
}

export function downloadImage(
    stage: Konva.Stage,
    layers: Layer[],
    filename: string,
    options: ExportOptions = { format: 'png' }
): void {
    const dataURL = exportImage(stage, layers, options);
    if (!dataURL) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
}