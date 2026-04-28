import { Rect, Ellipse } from 'react-konva';
import type Konva from 'konva';

export interface ShapeDefinition {
    type: string;
    label: string;
    icon: string;
    constrainResize?: (w: number, h: number) => { width: number; height: number };
    getExtraData: (w: number, h: number) => { extraData: Record<string, unknown>; extraRuntime: Record<string, unknown> };
    createElement: (cfg: Konva.ShapeConfig, w: number, h: number, id: string) => React.JSX.Element;
    updateConfig: (cfg: Konva.ShapeConfig, w: number, h: number) => Konva.ShapeConfig;
}

export const SHAPE_REGISTRY: Record<string, ShapeDefinition> = {
    rect: {
        type: 'rect',
        label: 'Прямоугольник',
        icon: '⬛',
        getExtraData: () => ({ extraData: {}, extraRuntime: {} }),
        createElement: (cfg, w, h, id) => <Rect x={0} y={0} width={w} height={h} {...cfg} name={id} />,
        updateConfig: (cfg, w, h) => ({ ...cfg, width: w, height: h }),
    },
    ellipse: {
        type: 'ellipse',
        label: 'Эллипс',
        icon: '⬭',
        getExtraData: (w, h) => ({
            extraData: {},
            extraRuntime: { radiusX: w / 2, radiusY: h / 2 }
        }),
        createElement: (cfg, w, h, id) => <Ellipse x={w / 2} y={h / 2} radiusX={cfg.radiusX as number || w / 2} radiusY={cfg.radiusY as number || h / 2} {...cfg} name={id} />,
        updateConfig: (cfg, w, h) => ({ ...cfg, width: w, height: h, radiusX: w / 2, radiusY: h / 2 }),
    },
};