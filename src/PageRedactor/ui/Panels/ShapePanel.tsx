// components/Panels/ShapePanel.tsx
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

interface ShapePanelProps {
    onAdd: (shapeType: string, config: ShapeConfig) => void;
    onClose: () => void;
}

export function ShapePanel({ onAdd, onClose }: ShapePanelProps) {
    // Получаем типы фигур из реестра
    const shapeTypes = Object.keys(SHAPE_REGISTRY);
    const firstType = shapeTypes[0] || 'rect';
    
    const [shapeType, setShapeType] = useState<string>(firstType);
    const [fill, setFill] = useState(DEFAULT_SHAPE_FILL);
    const [stroke, setStroke] = useState(DEFAULT_STROKE_COLOR);
    const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
    const [width, setWidth] = useState(DEFAULT_SHAPE_WIDTH);
    const [height, setHeight] = useState(DEFAULT_SHAPE_HEIGHT);

    // Проверяем, есть ли у текущей фигуры constraint
    const currentDef = SHAPE_REGISTRY[shapeType];
    const hasConstraint = !!currentDef?.constrainResize;

    // При смене типа фигуры с constraint — выравниваем размеры
    const handleShapeTypeChange = (type: string) => {
    setShapeType(type);
    const def = SHAPE_REGISTRY[type];
    if (def?.constrainResize) {
        const size = Math.max(width, height);
        setWidth(size);
        setHeight(size);
    }
};

    // При изменении ширины (если есть constraint — синхронизируем высоту)
    const handleWidthChange = (value: number) => {
        const clamped = Math.max(10, value);
        setWidth(clamped);
        if (hasConstraint) {
            setHeight(clamped);
        }
    };

    // При изменении высоты (если есть constraint — синхронизируем ширину)
    const handleHeightChange = (value: number) => {
        const clamped = Math.max(10, value);
        setHeight(clamped);
        if (hasConstraint) {
            setWidth(clamped);
        }
    };

    const handleAdd = () => {
        onAdd(shapeType, { fill, stroke, strokeWidth, width, height });
        onClose();
    };

    // Обработка клавиш
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            onKeyDown={handleKeyDown}
            style={{
                padding: '16px',
                minWidth: '220px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                outline: 'none',
            }}
            tabIndex={0} // Чтобы работал onKeyDown
        >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
                Добавить фигуру
            </h4>

            {/* Тип фигуры */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                }}>
                    Тип
                </label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(shapeTypes.length, 4)}, 1fr)`,
                    gap: '8px',
                }}>
                    {shapeTypes.map(type => {
                        const def = SHAPE_REGISTRY[type];
                        return (
                            <button
                                key={type}
                                onClick={() => handleShapeTypeChange(type)} 
                                title={def.label}
                                style={{
                                    padding: '8px 4px',
                                    background: shapeType === type ? '#2196F3' : '#f5f5f5',
                                    color: shapeType === type ? 'white' : '#333',
                                    border: shapeType === type
                                        ? '2px solid #1976D2'
                                        : '1px solid #ddd',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '2px',
                                }}
                            >
                                <span>{def.icon}</span>
                                <span style={{ fontSize: '9px' }}>{def.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Цвет заливки */}
            <div style={{ marginBottom: '8px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                }}>
                    Заливка
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="color"
                        value={fill}
                        onChange={e => setFill(e.target.value)}
                        style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '2px',
                        }}
                    />
                    <input
                        type="text"
                        value={fill}
                        onChange={e => setFill(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '4px 6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                        }}
                    />
                </div>
            </div>

            {/* Цвет обводки */}
            <div style={{ marginBottom: '8px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                }}>
                    Обводка
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="color"
                        value={stroke}
                        onChange={e => setStroke(e.target.value)}
                        style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '2px',
                        }}
                    />
                    <input
                        type="text"
                        value={stroke}
                        onChange={e => setStroke(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '4px 6px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                        }}
                    />
                </div>
            </div>

            {/* Толщина обводки */}
            <div style={{ marginBottom: '8px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px'
                }}>
                    Толщина обводки: <strong>{strokeWidth}px</strong>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min={0}
                        max={20}
                        value={strokeWidth}
                        onChange={e => setStrokeWidth(Number(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <input
                        type="number"
                        min={0}
                        max={20}
                        value={strokeWidth}
                        onChange={e => setStrokeWidth(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                        style={{
                            width: '50px',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            textAlign: 'center',
                        }}
                    />
                </div>
            </div>

            {/* Размеры */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '4px'
                    }}>
                        Ширина{hasConstraint ? ' (авто)' : ''}
                    </label>
                    <input
                        type="number"
                        value={width}
                        onChange={e => handleWidthChange(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '4px'
                    }}>
                        Высота{hasConstraint ? ' (авто)' : ''}
                    </label>
                    <input
                        type="number"
                        value={height}
                        onChange={e => handleHeightChange(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '6px 16px',
                        fontSize: '12px',
                        background: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                >
                    Отмена
                </button>
                <button
                    onClick={handleAdd}
                    style={{
                        padding: '6px 16px',
                        fontSize: '12px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1976D2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2196F3'}
                >
                    Добавить
                </button>
            </div>
        </div>
    );
}