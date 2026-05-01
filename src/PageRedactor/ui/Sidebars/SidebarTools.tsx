import { useEffect } from 'react';
import { PenPanel } from '../Panels/PenPanel';
import { FilterPanel } from '../Panels/FilterPanel';
import type { FilterType } from '../Panels/FilterPanel';
import { usePopover } from '../../hooks/interaction';
import { ShapePanel } from '../Panels/ShapePanel';
import { TextPanel } from '../Panels/TextPanel';
import type { ShapeConfig, TextConfig  } from '../../types/Layer';

interface SidebarToolsProps {
    selectedTool?: string;
    onToolChange?: (tool: string) => void;
    penColor?: string;
    penWidth?: number;
    onPenColorChange?: (color: string) => void;
    onPenWidthChange?: (width: number) => void;
    selectedLayerIds?: Set<string>;
    onFilterPreview?: (filter: FilterType, value: number) => void;
    onFilterApply?: (filter: FilterType, value: number) => void;
    onFilterCancel?: () => void;
    onStartCrop?: (shape: 'rect' | 'free') => void;
    isCropping?: boolean;
    cropShape?: 'rect' | 'free';
    onApplyCrop?: () => void;
    onCancelCrop?: () => void;
    onAddText?: (text: string, config: TextConfig) => void;
    onAddShape?: (shapeType: string, config: ShapeConfig) => void;
}

export function SidebarTools({
    selectedTool = 'select',
    onToolChange,
    penColor = '#000000',
    penWidth = 4,
    onPenColorChange,
    onPenWidthChange,
    onFilterPreview,
    onFilterApply,
    onFilterCancel,
    onStartCrop,
    isCropping = false,
    onApplyCrop,
    onCancelCrop,
    onAddText,
    onAddShape,
}: SidebarToolsProps) {
    const { isOpen, open, close, popoverRef } = usePopover();

    const showSettingsPanel = selectedTool === 'pen'
        || selectedTool === 'eraser'
        || selectedTool === 'filter'
        || selectedTool === 'shape'
        || selectedTool === 'text';

    useEffect(() => {
        if (showSettingsPanel) {
            open('drawing');
        } else {
            close();
        }
    }, [selectedTool, open, close, showSettingsPanel]);

    const handleToolClick = (tool: string) => {
        // ✅ Для shape всегда открываем панель
        if (tool === 'shape') {
            onToolChange?.(tool);
            open('drawing');
            return;
        }

        if (showSettingsPanel && tool === selectedTool) {
            if (isOpen('drawing')) {
                close();
            } else {
                open('drawing');
            }
        }

        if (tool === 'text') {
            onToolChange?.(tool);
            open('drawing');
            return;
        }
        onToolChange?.(tool);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
        }}>
            {/* Панель кисти */}
            {selectedTool === 'pen' && isOpen('drawing') && (
                <div ref={popoverRef}>
                    <PenPanel
                        color={penColor}
                        width={penWidth}
                        onColorChange={onPenColorChange ?? (() => { })}
                        onWidthChange={onPenWidthChange ?? (() => { })}
                        onClose={close}
                        showColor={true}
                    />
                </div>
            )}

            {/* Панель ластика */}
            {selectedTool === 'eraser' && isOpen('drawing') && (
                <div ref={popoverRef}>
                    <PenPanel
                        color="#ffffff"
                        width={penWidth}
                        onColorChange={() => { }}
                        onWidthChange={onPenWidthChange ?? (() => { })}
                        onClose={close}
                        showColor={false}
                    />
                </div>
            )}

            {/* Панель фильтров */}
            {selectedTool === 'filter' && isOpen('drawing') && (
                <div ref={popoverRef}>
                    <FilterPanel
                        currentFilter="none"
                        filterValue={0}
                        onFilterChange={(filter, value) => {
                            onFilterPreview?.(filter, value);
                        }}
                        onApply={(filter, value) => {
                            onFilterApply?.(filter, value);
                        }}
                        onClose={() => {
                            onFilterCancel?.();
                            close();
                        }}
                    />
                </div>
            )}

            {selectedTool === 'shape' && isOpen('drawing') && (
                <div ref={popoverRef}>
                    <ShapePanel
                        onAdd={(shapeType, config) => {
                            onAddShape?.(shapeType, config);
                            close();
                        }}
                        onClose={close}
                    />
                </div>
            )}

            {selectedTool === 'text' && isOpen('drawing') && (
                <div ref={popoverRef}>
                    <TextPanel
                        onAdd={(text, config) => {
                            onAddText?.(text, config);
                            close();
                        }}
                        onClose={close}
                    />
                </div>
            )}

            {/* Кнопки инструментов */}
            <div style={{
                background: 'white',
                padding: '8px 12px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
            }}>
                <button onClick={() => handleToolClick('select')}
                    style={{
                        background: selectedTool === 'select' ? '#2196F3' : '#ddd',
                        color: selectedTool === 'select' ? 'white' : 'black',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }} title="Выделение (V)">🖱️</button>
                <button onClick={() => handleToolClick('pen')}
                    style={{
                        background: selectedTool === 'pen' ? '#2196F3' : '#ddd',
                        color: selectedTool === 'pen' ? 'white' : 'black',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }}>✏️</button>
                <button onClick={() => handleToolClick('eraser')}
                    style={{
                        background: selectedTool === 'eraser' ? '#2196F3' : '#ddd',
                        color: selectedTool === 'eraser' ? 'white' : 'black',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }}>🧽</button>
                <button onClick={() => handleToolClick('filter')}
                    style={{
                        background: selectedTool === 'filter' ? '#2196F3' : '#ddd',
                        color: selectedTool === 'filter' ? 'white' : 'black',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }} title="Фильтры (F)">🎨</button>
                <button onClick={() => onStartCrop?.('rect')}
                    style={{
                        background: selectedTool === 'cropRect' ? '#2196F3' : '#ddd',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }} title="Вырезать прямоугольником (R)">✂️🔲</button>
                <button onClick={() => onStartCrop?.('free')}
                    style={{
                        background: selectedTool === 'cropFree' ? '#2196F3' : '#ddd',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }} title="Вырезать произвольно (O)">✂️✏️</button>

                <button onClick={() => handleToolClick('shape')}
                    style={{
                        background: selectedTool === 'shape' ? '#2196F3' : '#ddd',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }} title="Добавить фигуру">⬛</button>

                <button onClick={() => handleToolClick('text')}
                    style={{
                        background: selectedTool === 'text' ? '#2196F3' : '#ddd',
                        cursor: 'pointer', padding: '6px 10px', border: 'none', borderRadius: '6px',
                    }} title="Добавить текст (T)">📝</button>

                {isCropping && (
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                        <button onClick={onApplyCrop} style={{ background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✓</button>
                        <button onClick={onCancelCrop} style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✗</button>
                    </div>
                )}
            </div>
        </div>
    );
}