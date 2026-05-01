import type { Layer, ShapeLayerData } from '../../types/Layer';
import { imageToDataURL } from '../../utils/imageUtils';
import {
  DEFAULT_SHAPE_FILL, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
  DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_FILL, DEFAULT_TEXT_ALIGN,
  DEFAULT_TEXT_WIDTH
} from '../../constants/editor';
import type Konva from 'konva';

/**
 * Подготовка слоя к сохранению в историю (убираем runtime, синхронизируем data)
 */
export function toSnapshot(layer: Layer): Layer {
  const syncedData = { ...layer.data };

  if (layer.type === 'shape' && layer.runtime?.shapeConfig) {
    const shapeConfig = layer.runtime.shapeConfig;
    Object.assign(syncedData, {
      width: layer.width,
      height: layer.height,
      fill: shapeConfig.fill as string,
      stroke: shapeConfig.stroke as string,
      strokeWidth: shapeConfig.strokeWidth as number,
      radius: shapeConfig.radius,
      radiusX: shapeConfig.radiusX,
      radiusY: shapeConfig.radiusY,
    });
  }

  if (layer.type === 'text' && layer.runtime?.textConfig) {
    const textConfig = layer.runtime.textConfig;
    Object.assign(syncedData, {
      text: textConfig.text as string,
      fontSize: textConfig.fontSize as number,
      fontFamily: textConfig.fontFamily as string,
      fill: textConfig.fill as string,
    });
  }

  if (layer.type === 'image' && layer.runtime?.imageElement) {
    Object.assign(syncedData, {
      src: imageToDataURL(layer.runtime.imageElement),
      width: layer.width,
      height: layer.height,
    });
  }

  if (layer.type === 'canvas') {
    Object.assign(syncedData, {
      width: layer.width,
      height: layer.height,
    });
  }

  return {
    ...layer,
    data: syncedData,
    runtime: undefined
  };
}

/**
 * Восстановление слоя из истории (воссоздаём runtime из data)
 */
export async function fromSnapshot(layer: Layer): Promise<Layer> {
  const data = layer.data;

  switch (data.type) {
    case 'image': {
      if (!('src' in data) || !data.src) return { ...layer, runtime: {} };
      try {
        const img = await loadImage(data.src);
        return { ...layer, runtime: { imageElement: img } };
      } catch (error) {
        console.error('Failed to restore image:', error);
        return { ...layer, runtime: {} };
      }
    }

    case 'shape': {
      const shapeData = data as ShapeLayerData;
      const shapeConfig: Konva.ShapeConfig = {
        fill: shapeData.fill || DEFAULT_SHAPE_FILL,
        stroke: shapeData.stroke || DEFAULT_STROKE_COLOR,
        strokeWidth: shapeData.strokeWidth || DEFAULT_STROKE_WIDTH,
        width: shapeData.width,
        height: shapeData.height,
      };

      if (shapeData.shapeType === 'circle') {
        shapeConfig.radius = shapeData.radius || 50;
      } else if (shapeData.shapeType === 'ellipse') {
        shapeConfig.radiusX = shapeData.radiusX || 50;
        shapeConfig.radiusY = shapeData.radiusY || 30;
      }

      return { ...layer, runtime: { shapeConfig } };
    }

    case 'canvas': {
      return { ...layer, runtime: {} };
    }

    case 'text': {
      return {
        ...layer,
        runtime: {
          textConfig: {
            text: ('text' in data && data.text) || '',
            fontSize: ('fontSize' in data && data.fontSize) || DEFAULT_FONT_SIZE,
            fontFamily: ('fontFamily' in data && data.fontFamily) || DEFAULT_FONT_FAMILY,
            fill: ('fill' in data && data.fill) || DEFAULT_TEXT_FILL,
            align: ('align' in data && data.align) || DEFAULT_TEXT_ALIGN,
            width: data.width || DEFAULT_TEXT_WIDTH,
          }
        }
      };
    }

    default:
      return { ...layer, runtime: {} };
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}