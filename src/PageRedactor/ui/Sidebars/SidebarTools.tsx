import { useEffect } from 'react';
import { PenPanel } from '../Panels/PenPanel';
import { FilterPanel } from '../Panels/FilterPanel';
import type { FilterType } from '../Panels/FilterPanel';
import { usePopover } from '../../hooks/interaction';
import { ShapePanel } from '../Panels/ShapePanel';
import { TextPanel } from '../Panels/TextPanel';
import type { ShapeConfig, TextConfig } from '../../types/Layer';
import styles from './SidebarTools.module.css';

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
        if (tool === 'shape' || tool === 'text') {
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
        onToolChange?.(tool);
    };

    return (
        <div className={styles.toolbar}>
            {/* Панели */}
            {selectedTool === 'pen' && isOpen('drawing') && (
                <div ref={popoverRef} className={styles.panelWrapper}>
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

            {selectedTool === 'eraser' && isOpen('drawing') && (
                <div ref={popoverRef} className={styles.panelWrapper}>
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

            {selectedTool === 'filter' && isOpen('drawing') && (
                <div ref={popoverRef} className={styles.panelWrapper}>
                    <FilterPanel
                        currentFilter="none"
                        filterValue={0}
                        onFilterChange={(filter, value) => onFilterPreview?.(filter, value)}
                        onApply={(filter, value) => onFilterApply?.(filter, value)}
                        onClose={() => {
                            onFilterCancel?.();
                            close();
                        }}
                    />
                </div>
            )}

            {selectedTool === 'shape' && isOpen('drawing') && (
                <div ref={popoverRef} className={styles.panelWrapper}>
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
                <div ref={popoverRef} className={styles.panelWrapper}>
                    <TextPanel
                        onAdd={(text, config) => {
                            onAddText?.(text, config);
                            close();
                        }}
                        onClose={close}
                    />
                </div>
            )}

            {/* Кнопки */}
            <div className={styles.toolsRow}>
                <button onClick={() => handleToolClick('select')}
                    className={`${styles.toolBtn} ${selectedTool === 'select' ? styles.toolBtnActive : ''}`}
                    title="Выделение (Ctrl+1)">🖱️</button>
                <button onClick={() => handleToolClick('pen')}
                    className={`${styles.toolBtn} ${selectedTool === 'pen' ? styles.toolBtnActive : ''}`}
                    title="Кисть (Ctrl+2)">✏️</button>
                <button onClick={() => handleToolClick('eraser')}
                    className={`${styles.toolBtn} ${selectedTool === 'eraser' ? styles.toolBtnActive : ''}`}
                    title="Ластик (Ctrl+3)">🧽</button>
                <button onClick={() => handleToolClick('filter')}
                    className={`${styles.toolBtn} ${selectedTool === 'filter' ? styles.toolBtnActive : ''}`}
                    title="Фильтры (Ctrl+4)">🎨</button>
                <button onClick={() => onStartCrop?.('rect')}
                    className={`${styles.toolBtn} ${selectedTool === 'cropRect' ? styles.toolBtnActive : ''}`}
                    title="Вырезать прямоугольником (Ctrl+7)">✂️🔲</button>
                <button onClick={() => onStartCrop?.('free')}
                    className={`${styles.toolBtn} ${selectedTool === 'cropFree' ? styles.toolBtnActive : ''}`}
                    title="Вырезать произвольно (Ctrl+8)">✂️✏️</button>
                <button onClick={() => handleToolClick('shape')}
                    className={`${styles.toolBtn} ${selectedTool === 'shape' ? styles.toolBtnActive : ''}`}
                    title="Добавить фигуру (Ctrl+5)">⬛</button>
                <button onClick={() => handleToolClick('text')}
                    className={`${styles.toolBtn} ${selectedTool === 'text' ? styles.toolBtnActive : ''}`}
                    title="Добавить текст (Ctrl+6)">📝</button>

                {isCropping && (
                    <div className={styles.cropActions}>
                        <button onClick={onApplyCrop} className={styles.cropApply}>✓</button>
                        <button onClick={onCancelCrop} className={styles.cropCancel}>✗</button>
                    </div>
                )}
            </div>
        </div>
    );
}