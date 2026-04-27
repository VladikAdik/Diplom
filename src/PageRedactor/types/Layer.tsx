import type Konva from "konva";

export interface ImageLayerData {
    type: 'image';
    src: string; // dataURL или URL
    width?: number;   // Добавь
    height?: number;  // Добавь
}

export interface ShapeLayerData {
    type: 'shape';
    shapeType: 'rect' | 'circle' | 'ellipse' | 'line';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    radius?: number; // для circle/ellipse
    points?: number[]; // для line
    width?: number;   // Добавь
    height?: number;
}

export interface TextLayerData {
    type: 'text';
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    align?: 'left' | 'center' | 'right';
    width?: number;   // Добавь
    height?: number;
}

export interface CanvasLayerData {
    type: 'canvas';
    src: string;
    width?: number;
    height?: number;
}

export type LayerData = ImageLayerData | ShapeLayerData | TextLayerData | CanvasLayerData;

// Runtime данные (живые объекты Konva)
export interface LayerRuntime {
    imageElement?: HTMLImageElement;
    shapeConfig?: Konva.ShapeConfig;
    textConfig?: Konva.TextConfig;
}

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    zIndex: number;
    type: 'image' | 'shape' | 'text' | 'canvas';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    data: LayerData;
    runtime?: LayerRuntime;  
}