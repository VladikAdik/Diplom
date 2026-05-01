import type { Layer } from '../types/Layer';

interface ContentBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Вычисляет ограничивающий прямоугольник всех видимых слоёв.
 * Возвращает null, если слоёв нет или все скрыты.
 */
export function getContentBounds(layers: Layer[]): ContentBounds | null {
    const visibleLayers = layers.filter(l => l.visible);

    if (visibleLayers.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const layer of visibleLayers) {
        const x = layer.x ?? 0;
        const y = layer.y ?? 0;
        const w = layer.width ?? 100;
        const h = layer.height ?? 100;
        const rotation = layer.rotation ?? 0;

        if (rotation === 0) {
            // Простой случай — без поворота
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);
        } else {
            // С поворотом — учитываем все 4 угла
            const rad = (rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const cx = x + w / 2;
            const cy = y + h / 2;

            const corners = [
                { x: x, y: y },
                { x: x + w, y: y },
                { x: x, y: y + h },
                { x: x + w, y: y + h },
            ];

            for (const corner of corners) {
                const dx = corner.x - cx;
                const dy = corner.y - cy;
                const rx = cx + dx * cos - dy * sin;
                const ry = cy + dx * sin + dy * cos;
                minX = Math.min(minX, rx);
                minY = Math.min(minY, ry);
                maxX = Math.max(maxX, rx);
                maxY = Math.max(maxY, ry);
            }
        }
    }

    const padding = 10; // небольшой отступ

    return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
    };
}