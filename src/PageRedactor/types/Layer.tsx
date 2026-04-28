import type Konva from "konva";

export interface ImageLayerData {
    type: 'image';
    src: string; // dataURL или URL
    width?: number;   // Добавь
    height?: number;  // Добавь
}

export interface ShapeLayerData {
    type: 'shape';
    shapeType: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    radius?: number; // для circle/ellipse
    radiusX?: number;   // ← добавь
    radiusY?: number; 
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

export interface CropLayerData {
    type: 'crop';
    src: string;
    originalWidth: number;
    originalHeight: number;
    cropShape: 'rect' | 'free';
    cropPoints?: number[];
    width?: number;   // ← добавь
    height?: number; 
}

export type LayerData = ImageLayerData | ShapeLayerData | TextLayerData | CanvasLayerData | CropLayerData;

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
    type: 'image' | 'shape' | 'text' | 'canvas' | 'crop';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    data: LayerData;
    runtime?: LayerRuntime;  
}

export interface ShapeConfig {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    width?: number;
    height?: number;
}

export interface TextConfig {
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    width?: number;
    height?: number;
}

