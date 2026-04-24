import { useCallback } from 'react';
import type { Layer } from '../types/Layer';
import {
    DEFAULT_LAYER_X, DEFAULT_LAYER_Y, DEFAULT_LAYER_OPACITY,
    DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT,
    DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT,
    DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY,
    DEFAULT_SHAPE_FILL, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
    DEFAULT_TEXT_FILL, DEFAULT_TEXT_ALIGN
} from '../constants/editor';

export function useLayerFactory() {
    const createImageLayer = useCallback((image: HTMLImageElement, x = DEFAULT_LAYER_X, y = DEFAULT_LAYER_Y): Omit<Layer, 'id' | 'zIndex'> => ({
        name: 'Изображение',
        visible: true,
        locked: false,
        opacity: DEFAULT_LAYER_OPACITY,
        type: 'image',
        x, y,
        width: image.width,
        height: image.height,
        rotation: 0,
        data: { type: 'image', src: '', width: image.width, height: image.height },
        runtime: { imageElement: image }
    }), []);

    const createShapeLayer = useCallback((
        shapeType: 'rect' | 'circle' | 'ellipse' | 'line',
        x = DEFAULT_LAYER_X,
        y = DEFAULT_LAYER_Y
    ): Omit<Layer, 'id' | 'zIndex'> => ({
        name: shapeType,
        visible: true,
        locked: false,
        opacity: DEFAULT_LAYER_OPACITY,
        type: 'shape',
        x, y,
        width: DEFAULT_SHAPE_WIDTH,
        height: DEFAULT_SHAPE_HEIGHT,
        rotation: 0,
        data: {
            type: 'shape',
            shapeType,
            fill: DEFAULT_SHAPE_FILL,
            stroke: DEFAULT_STROKE_COLOR,
            strokeWidth: DEFAULT_STROKE_WIDTH,
            width: DEFAULT_SHAPE_WIDTH,
            height: DEFAULT_SHAPE_HEIGHT
        }
    }), []);

    const createTextLayer = useCallback((
        text = 'Новый текст',
        x = DEFAULT_LAYER_X,
        y = DEFAULT_LAYER_Y
    ): Omit<Layer, 'id' | 'zIndex'> => ({
        name: 'Текст',
        visible: true,
        locked: false,
        opacity: DEFAULT_LAYER_OPACITY,
        type: 'text',
        x, y,
        width: DEFAULT_TEXT_WIDTH,
        height: DEFAULT_TEXT_HEIGHT,
        rotation: 0,
        data: {
            type: 'text',
            text,
            fontSize: DEFAULT_FONT_SIZE,
            fontFamily: DEFAULT_FONT_FAMILY,
            fill: DEFAULT_TEXT_FILL,
            align: DEFAULT_TEXT_ALIGN,
            width: DEFAULT_TEXT_WIDTH,
            height: DEFAULT_TEXT_HEIGHT
        }
    }), []);

    const duplicateLayer = useCallback((layer: Layer): Omit<Layer, 'id' | 'zIndex'> => ({
        name: `${layer.name} (копия)`,
        visible: layer.visible,
        locked: false,
        opacity: layer.opacity,
        type: layer.type,
        data: layer.data,
        x: (layer.x ?? DEFAULT_LAYER_X) + 20,
        y: (layer.y ?? DEFAULT_LAYER_Y) + 20,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation
    }), []);

    return {
        createImageLayer,
        createShapeLayer,
        createTextLayer,
        duplicateLayer
    };
}