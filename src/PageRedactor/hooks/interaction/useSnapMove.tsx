import { useCallback } from 'react';
import type { Layer } from '../../types/Layer';

const SNAP_THRESHOLD = 10;

export interface SnapGuide {
    type: 'vertical' | 'horizontal';
    position: number;
}

interface UseSnapMoveProps {
    layers: Layer[];
    stageSize: { width: number; height: number }; // ← добавь
    setSnapGuides: (guides: SnapGuide[]) => void;
    onPositionChange: (id: string, x: number, y: number, saveHistory: boolean) => void;
}

export function useSnapMove({ layers, stageSize, setSnapGuides, onPositionChange }: UseSnapMoveProps) {

    const snapToLayers = useCallback(
        (currentId: string, x: number, y: number, width: number, height: number) => {
            let snappedX = x;
            let snappedY = y;

            // Примагничивание к другим объектам
            const others = layers.filter(l => l.id !== currentId && l.visible && !l.locked);
            for (const layer of others) {
                const lx = layer.x ?? 0;
                const ly = layer.y ?? 0;
                const lw = layer.width ?? 100;
                const lh = layer.height ?? 100;

                if (Math.abs(x - lx) < SNAP_THRESHOLD) snappedX = lx;
                if (Math.abs(x + width - (lx + lw)) < SNAP_THRESHOLD) snappedX = lx + lw - width;
                if (Math.abs(x + width / 2 - (lx + lw / 2)) < SNAP_THRESHOLD) snappedX = lx + lw / 2 - width / 2;

                if (Math.abs(y - ly) < SNAP_THRESHOLD) snappedY = ly;
                if (Math.abs(y + height - (ly + lh)) < SNAP_THRESHOLD) snappedY = ly + lh - height;
                if (Math.abs(y + height / 2 - (ly + lh / 2)) < SNAP_THRESHOLD) snappedY = ly + lh / 2 - height / 2;
            }

            // ← Примагничивание к границам сцены
            if (Math.abs(x) < SNAP_THRESHOLD) snappedX = 0;
            if (Math.abs(x + width - stageSize.width) < SNAP_THRESHOLD) snappedX = stageSize.width - width;
            if (Math.abs(x + width / 2 - stageSize.width / 2) < SNAP_THRESHOLD) snappedX = stageSize.width / 2 - width / 2;

            if (Math.abs(y) < SNAP_THRESHOLD) snappedY = 0;
            if (Math.abs(y + height - stageSize.height) < SNAP_THRESHOLD) snappedY = stageSize.height - height;
            if (Math.abs(y + height / 2 - stageSize.height / 2) < SNAP_THRESHOLD) snappedY = stageSize.height / 2 - height / 2;

            return { x: snappedX, y: snappedY };
        },
        [layers, stageSize]
    );

    const handleDragMove = useCallback(
        (id: string, x: number, y: number, width?: number, height?: number) => {
            const layer = layers.find(l => l.id === id);
            if (!layer) return;

            const w = width ?? layer.width ?? 100;
            const h = height ?? layer.height ?? 100;
            const snapped = snapToLayers(id, x, y, w, h);

            const guides: SnapGuide[] = [];
            if (snapped.x !== x) guides.push({ type: 'vertical', position: snapped.x + w / 2 });
            if (snapped.y !== y) guides.push({ type: 'horizontal', position: snapped.y + h / 2 });
            setSnapGuides(guides);

            if (snapped.x !== x || snapped.y !== y) {
                onPositionChange(id, snapped.x, snapped.y, false);
            }
        },
        [layers, snapToLayers, setSnapGuides, onPositionChange]
    );

    const handleDragEnd = useCallback(
        (id: string, x: number, y: number) => {
            setSnapGuides([]);
            onPositionChange(id, x, y, true);
        },
        [setSnapGuides, onPositionChange]
    );

    return { handleDragMove, handleDragEnd };
}