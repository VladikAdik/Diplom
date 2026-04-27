import { useEffect } from 'react';
import { PenPanel } from '../Panels/PenPanel';
import { usePopover } from '../../hooks/usePopover';

interface SidebarToolsProps {
    selectedTool?: string;
    onToolChange?: (tool: string) => void;
    penColor?: string;
    penWidth?: number;
    onPenColorChange?: (color: string) => void;
    onPenWidthChange?: (width: number) => void;
}

export function SidebarTools({ 
    selectedTool = 'select', 
    onToolChange,
    penColor = '#000000',
    penWidth = 4,
    onPenColorChange,
    onPenWidthChange,
}: SidebarToolsProps) {
    const { isOpen, open, close, popoverRef } = usePopover();

    // Открываем при выборе кисти, закрываем при смене
    useEffect(() => {
        if (selectedTool === 'pen') {
            open('pen');
        } else {
            close();
        }
    }, [selectedTool, open, close]);

    const handleToolClick = (tool: string) => {
        if (tool === 'pen' && selectedTool === 'pen') {
        if (isOpen('pen')) {
            close();
        } else {
            open('pen');
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
            {isOpen('pen') && onPenColorChange && onPenWidthChange && (
                <div ref={popoverRef}>
                    <PenPanel
                        color={penColor}
                        width={penWidth}
                        onColorChange={onPenColorChange}
                        onWidthChange={onPenWidthChange}
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
            </div>
        </div>
    );
}