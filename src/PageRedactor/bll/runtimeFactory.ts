import type { Layer, LayerRuntime, ShapeLayerData } from '../types/Layer';
import Konva from 'konva';
import { imageToDataURL, dataURLToImage } from './imageUtils';
import {
    DEFAULT_SHAPE_FILL, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
    DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY,
    DEFAULT_TEXT_FILL, DEFAULT_TEXT_ALIGN,
    DEFAULT_TEXT_WIDTH
} from '../constants/editor';

export class RuntimeFactory {
    // Создать runtime объект из сериализованных данных
    static async createRuntime(data: Layer['data']): Promise<LayerRuntime> {
        switch (data.type) {
            case 'image': {
                if (!data.src) {
                    console.warn('Image layer has no src, creating empty runtime');
                    return {};
                }
                try {
                    const img = await dataURLToImage(data.src);
                    return { imageElement: img };
                } catch (error) {
                    console.error('Failed to restore image:', error);
                    return {};
                }
            }

            case 'shape': {
                const shapeConfig: Konva.ShapeConfig = {
                    fill: data.fill || DEFAULT_SHAPE_FILL,
                    stroke: data.stroke || DEFAULT_STROKE_COLOR,
                    strokeWidth: data.strokeWidth || DEFAULT_STROKE_WIDTH,
                    width: data.width,
                    height: data.height,
                };

                switch (data.shapeType) {
                    case 'rect':
                        break;
                    case 'circle':
                        shapeConfig.radius = data.radius || 50;
                        break;
                    case 'ellipse':
                        shapeConfig.radiusX = 50;
                        shapeConfig.radiusY = 30;
                        break;
                    case 'line':
                        shapeConfig.points = data.points || [0, 0, 100, 100];
                        shapeConfig.stroke = data.stroke || '#000000';
                        shapeConfig.strokeWidth = data.strokeWidth || 2;
                        break;
                }
                return { shapeConfig };
            }

            case 'text': {
                return {
                    textConfig: {
                        text: data.text,
                        fontSize: data.fontSize || DEFAULT_FONT_SIZE,
                        fontFamily: data.fontFamily || DEFAULT_FONT_FAMILY,
                        fill: data.fill || DEFAULT_TEXT_FILL,
                        align: data.align || DEFAULT_TEXT_ALIGN,
                        width: data.width || DEFAULT_TEXT_WIDTH,
                    }
                };
            }
            default:
                return {};
        }
    }

    // Сериализовать runtime объект в данные
    static serializeRuntime(layer: Layer): Layer['data'] {
        if (layer.type === 'image' && layer.runtime?.imageElement) {
            const src = imageToDataURL(layer.runtime.imageElement);
            console.log('Serializing image layer, src length:', src.length);
            return {
                type: 'image',
                src: src,
                width: layer.width,
                height: layer.height
            };
        }

        if (layer.type === 'shape' && layer.runtime?.shapeConfig) {
            const config = layer.runtime.shapeConfig;
            const data = layer.data as ShapeLayerData;
            return {
                type: 'shape' as const,
                shapeType: data.shapeType || 'rect',
                fill: (config.fill as string) || DEFAULT_SHAPE_FILL,
                stroke: (config.stroke as string) || DEFAULT_STROKE_COLOR,
                strokeWidth: (config.strokeWidth as number) || DEFAULT_STROKE_WIDTH,
                width: layer.width,
                height: layer.height,
                radius: data.radius,
                points: data.points,
            };
        }

        if (layer.type === 'text' && layer.runtime?.textConfig) {
            const config = layer.runtime.textConfig;
            return {
                type: 'text',
                text: config.text as string || '',
                fontSize: config.fontSize as number,
                fontFamily: config.fontFamily as string,
                fill: config.fill as string,
                align: config.align as 'left' | 'center' | 'right',
                width: layer.width,
                height: layer.height
            };
        }

        return layer.data;
    }
}