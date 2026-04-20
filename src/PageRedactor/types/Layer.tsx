import type Konva from "konva";

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    zIndex: number;
    type: 'image' | 'shape' | 'text';
    data: HTMLImageElement | Konva.ShapeConfig | Konva.TextConfig | null;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
}