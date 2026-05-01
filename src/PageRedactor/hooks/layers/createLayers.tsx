import type { Layer, ShapeConfig } from '../../types/Layer';
import { SHAPE_REGISTRY } from '../../constants/shapeRegistry';
import { imageToDataURL } from '../../utils/imageUtils';
import {
  DEFAULT_LAYER_X, DEFAULT_LAYER_Y, DEFAULT_LAYER_OPACITY,
  DEFAULT_SHAPE_WIDTH, DEFAULT_SHAPE_HEIGHT,
  DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT,
  DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY,
  DEFAULT_SHAPE_FILL, DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXT_FILL, DEFAULT_TEXT_ALIGN
} from '../../constants/editor';

// Генератор ID
let _counter = Date.now();
export const generateId = () => `${_counter++}-${Math.random().toString(36).slice(2, 9)}`;

export function createImageLayerData(image: HTMLImageElement, centerX: number, centerY: number): Omit<Layer, 'id' | 'zIndex'> {
  return {
    name: 'Изображение',
    visible: true,
    locked: false,
    opacity: DEFAULT_LAYER_OPACITY,
    type: 'image',
    x: centerX,
    y: centerY,
    width: image.width,
    height: image.height,
    rotation: 0,
    data: {
      type: 'image',
      src: imageToDataURL(image),
      width: image.width,
      height: image.height
    },
    runtime: { imageElement: image }
  };
}

export function createShapeLayerData(
  shapeType: string,
  x: number,
  y: number,
  config?: ShapeConfig
): Omit<Layer, 'id' | 'zIndex'> {
  const def = SHAPE_REGISTRY[shapeType];
  if (!def) throw new Error(`Unknown shape type: ${shapeType}`);

  const w = config?.width ?? DEFAULT_SHAPE_WIDTH;
  const h = config?.height ?? DEFAULT_SHAPE_HEIGHT;
  const { extraData, extraRuntime } = def.getExtraData(w, h);

  const baseData = {
    type: 'shape' as const,
    shapeType,
    fill: config?.fill ?? DEFAULT_SHAPE_FILL,
    stroke: config?.stroke ?? DEFAULT_STROKE_COLOR,
    strokeWidth: config?.strokeWidth ?? DEFAULT_STROKE_WIDTH,
    width: w,
    height: h,
  };

  return {
    name: def.label,
    visible: true,
    locked: false,
    opacity: DEFAULT_LAYER_OPACITY,
    type: 'shape',
    x, y,
    width: w,
    height: h,
    rotation: 0,
    data: { ...baseData, ...extraData },
    runtime: { shapeConfig: { ...baseData, ...extraRuntime } }
  };
}

export function createTextLayerData(
  text: string,
  x: number,
  y: number,
  config?: { fontSize?: number; fontFamily?: string; fill?: string; width?: number; height?: number }
): Omit<Layer, 'id' | 'zIndex'> {
  const w = config?.width ?? DEFAULT_TEXT_WIDTH;
  const h = config?.height ?? DEFAULT_TEXT_HEIGHT;
  const fs = config?.fontSize ?? DEFAULT_FONT_SIZE;
  const ff = config?.fontFamily ?? DEFAULT_FONT_FAMILY;
  const f = config?.fill ?? DEFAULT_TEXT_FILL;

  return {
    name: 'Текст',
    visible: true,
    locked: false,
    opacity: DEFAULT_LAYER_OPACITY,
    type: 'text',
    x, y,
    width: w,
    height: h,
    rotation: 0,
    data: {
      type: 'text',
      text,
      fontSize: fs,
      fontFamily: ff,
      fill: f,
      align: DEFAULT_TEXT_ALIGN,
      width: w,
      height: h
    },
    runtime: { textConfig: { text, fontSize: fs, fontFamily: ff, fill: f, align: DEFAULT_TEXT_ALIGN, width: w } }
  };
}

export function duplicateLayerData(original: Layer): Omit<Layer, 'id' | 'zIndex'> {
  return {
    name: `${original.name} (копия)`,
    visible: original.visible,
    locked: false,
    opacity: original.opacity,
    type: original.type,
    x: (original.x ?? DEFAULT_LAYER_X) + 20,
    y: (original.y ?? DEFAULT_LAYER_Y) + 20,
    width: original.width,
    height: original.height,
    rotation: original.rotation,
    data: { ...original.data },
    runtime: original.runtime ? { ...original.runtime } : undefined
  };
}