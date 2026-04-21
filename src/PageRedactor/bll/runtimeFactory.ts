import type { Layer, LayerRuntime } from '../types/Layer';
import Konva from 'konva';
import { imageToDataURL, dataURLToImage } from './imageUtils';

export class RuntimeFactory {
    // Создать runtime объект из сериализованных данных
    static async createRuntime(data: Layer['data']): Promise<LayerRuntime> {
        switch (data.type) {
            case 'image': {
                const img = await dataURLToImage(data.src);
                return { imageElement: img };
            }

            case 'shape': {
                const shapeConfig: Konva.ShapeConfig = {
                    fill: data.fill || '#cccccc',
                    stroke: data.stroke || '#000000',
                    strokeWidth: data.strokeWidth || 2,
                };
                
                switch (data.shapeType) {
                    case 'rect':
                        shapeConfig.width = 100;
                        shapeConfig.height = 100;
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
                        fontSize: data.fontSize || 16,
                        fontFamily: data.fontFamily || 'Arial',
                        fill: data.fill || '#000000',
                        align: data.align || 'left',
                        width: 200,
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
            return {
                type: 'image',
                src: imageToDataURL(layer.runtime.imageElement)
            };
        }
        
        if (layer.type === 'shape' && layer.runtime?.shapeConfig) {
            const config = layer.runtime.shapeConfig;
            return {
                type: 'shape',
                shapeType: 'rect', // по умолчанию
                fill: config.fill as string,
                stroke: config.stroke as string,
                strokeWidth: config.strokeWidth as number,
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
            };
        }
        
        return layer.data;
    }
}