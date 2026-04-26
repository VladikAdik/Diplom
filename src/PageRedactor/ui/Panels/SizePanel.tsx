import { useState } from 'react';

interface SizePanelProps {
    currentWidth: number;
    currentHeight: number;
    onApply: (width: number, height: number) => void;
    onClose: () => void;
}

export function SizePanel({ currentWidth, currentHeight, onApply, onClose }: SizePanelProps) {
    const [width, setWidth] = useState(String(currentWidth));
    const [height, setHeight] = useState(String(currentHeight));

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) setWidth(value);
    };

    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d+$/.test(value)) setHeight(value);
    };

    const handleApply = () => {
        const w = width === '' ? currentWidth : Math.max(parseInt(width) || 100, 100);
        const h = height === '' ? currentHeight : Math.max(parseInt(height) || 100, 100);
        onApply(w, h);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleApply();
        if (e.key === 'Escape') onClose();
    };

    return (
        <div style={{
            padding: '16px',
            minWidth: '220px',
            background: 'white'
        }}>
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Ширина (px)
                </label>
                <input
                    type="text"
                    value={width}
                    onChange={handleWidthChange}
                    onKeyDown={handleKeyDown}
                    placeholder={String(currentWidth)}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                    }}
                />
            </div>
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Высота (px)
                </label>
                <input
                    type="text"
                    value={height}
                    onChange={handleHeightChange}
                    onKeyDown={handleKeyDown}
                    placeholder={String(currentHeight)}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                    }}
                />
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Отмена
                </button>
                <button
                    onClick={handleApply}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Применить
                </button>
            </div>
        </div>
    );
}