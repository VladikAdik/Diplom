import { useState } from 'react';
import type { ShapeConfig } from '../../types/Layer';
import { SHAPE_REGISTRY } from '../../constants/shapeRegistry';
import {
    DEFAULT_SHAPE_WIDTH,
    DEFAULT_SHAPE_HEIGHT,
    DEFAULT_SHAPE_FILL,
    DEFAULT_STROKE_COLOR,
    DEFAULT_STROKE_WIDTH
} from '../../constants/editor';
import styles from './ShapePanel.module.css';

interface ShapePanelProps {
    onAdd: (shapeType: string, config: ShapeConfig) => void;
    onClose: () => void;
}

export function ShapePanel({ onAdd, onClose }: ShapePanelProps) {
    const shapeTypes = Object.keys(SHAPE_REGISTRY);
    const firstType = shapeTypes[0] || 'rect';
    
    const [shapeType, setShapeType] = useState<string>(firstType);
    const [fill, setFill] = useState(DEFAULT_SHAPE_FILL);
    const [stroke, setStroke] = useState(DEFAULT_STROKE_COLOR);
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const [width, setWidth] = useState(DEFAULT_SHAPE_WIDTH);
    const [height, setHeight] = useState(DEFAULT_SHAPE_HEIGHT);

    const currentDef = SHAPE_REGISTRY[shapeType];
    const hasConstraint = !!currentDef?.constrainResize;

    const handleShapeTypeChange = (type: string) => {
        setShapeType(type);
        const def = SHAPE_REGISTRY[type];
        if (def?.constrainResize) {
            const size = Math.max(width, height);
            setWidth(size);
            setHeight(size);
        }
    };

    const handleWidthChange = (value: number) => {
        const clamped = Math.max(10, value);
        setWidth(clamped);
        if (hasConstraint) setHeight(clamped);
    };

    const handleHeightChange = (value: number) => {
        const clamped = Math.max(10, value);
        setHeight(clamped);
        if (hasConstraint) setWidth(clamped);
    };

    const handleAdd = () => {
        onAdd(shapeType, { fill, stroke, strokeWidth, width, height });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAdd();
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className={styles.panel} onKeyDown={handleKeyDown} tabIndex={0}>
            <h4 className={styles.title}>Добавить фигуру</h4>

            {/* Тип фигуры */}
            <div className={styles.mb12}>
                <label className={styles.sectionLabel}>Тип</label>
                <div className={styles.shapeGrid} style={{ gridTemplateColumns: `repeat(${Math.min(shapeTypes.length, 4)}, 1fr)` }}>
                    {shapeTypes.map(type => {
                        const def = SHAPE_REGISTRY[type];
                        return (
                            <button
                                key={type}
                                onClick={() => handleShapeTypeChange(type)}
                                title={def.label}
                                className={`${styles.shapeBtn} ${shapeType === type ? styles.shapeBtnActive : ''}`}
                            >
                                <span>{def.icon}</span>
                                <span className={styles.shapeLabel}>{def.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Заливка */}
            <div className={styles.mb8}>
                <label className={styles.sectionLabel}>Заливка</label>
                <div className={styles.colorRow}>
                    <input type="color" value={fill} onChange={e => setFill(e.target.value)} className={styles.colorPicker} />
                    <input type="text" value={fill} onChange={e => setFill(e.target.value)} className={styles.colorText} />
                </div>
            </div>

            {/* Обводка */}
            <div className={styles.mb8}>
                <label className={styles.sectionLabel}>Обводка</label>
                <div className={styles.colorRow}>
                    <input type="color" value={stroke} onChange={e => setStroke(e.target.value)} className={styles.colorPicker} />
                    <input type="text" value={stroke} onChange={e => setStroke(e.target.value)} className={styles.colorText} />
                </div>
            </div>

            {/* Толщина обводки */}
            <div className={styles.mb8}>
                <label className={styles.sectionLabel}>Толщина обводки: <strong>{strokeWidth}px</strong></label>
                <div className={styles.rangeRow}>
                    <input type="range" min={0} max={20} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className={styles.rangeSlider} />
                    <input type="number" min={0} max={20} value={strokeWidth} onChange={e => setStrokeWidth(Math.max(0, Math.min(20, Number(e.target.value) || 0)))} className={styles.numberInput} />
                </div>
            </div>

            {/* Размеры */}
            <div className={`${styles.sizeRow} ${styles.mb12}`}>
                <div className={styles.sizeField}>
                    <label className={styles.sectionLabel}>Ширина{hasConstraint ? ' (авто)' : ''}</label>
                    <input type="number" value={width} onChange={e => handleWidthChange(Number(e.target.value))} className={styles.sizeInput} />
                </div>
                <div className={styles.sizeField}>
                    <label className={styles.sectionLabel}>Высота{hasConstraint ? ' (авто)' : ''}</label>
                    <input type="number" value={height} onChange={e => handleHeightChange(Number(e.target.value))} className={styles.sizeInput} />
                </div>
            </div>

            {/* Кнопки */}
            <div className={styles.actions}>
                <button onClick={onClose} className={styles.cancelBtn}>Отмена</button>
                <button onClick={handleAdd} className={styles.addBtn}>Добавить</button>
            </div>
        </div>
    );
}