import { useEffect } from 'react';
import { PenPanel } from '../Panels/PenPanel';
import { FilterPanel } from '../Panels/FilterPanel';
import type { FilterType } from '../Panels/FilterPanel';
import { usePopover } from '../../hooks/usePopover';

interface SidebarToolsProps {
    selectedTool?: string;
    onToolChange?: (tool: string) => void;
    penColor?: string;
    penWidth?: number;
    onPenColorChange?: (color: string) => void;
    onPenWidthChange?: (width: number) => void;
    onFilterApply?: (filter: FilterType, value: number) => void;
}

export function SidebarTools({
    selectedTool = 'select',
    onToolChange,
    penColor = '#000000',
    penWidth = 4,
    onPenColorChange,
    onPenWidthChange,
    onFilterApply,
}: SidebarToolsProps) {
    const { isOpen, open, close, popoverRef } = usePopover();

    const showSettingsPanel = selectedTool === 'pen' || selectedTool === 'eraser' || selectedTool === 'filter';

    useEffect(() => {
        if (showSettingsPanel) {
            open('drawing');
        } else {
            close();
        }
    }, [selectedTool, open, close, showSettingsPanel]);

    const handleToolClick = (tool: string) => {
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
                        onApply={(filter, value) => onFilterApply?.(filter, value)}
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
            </div>
        </div>
    );
}