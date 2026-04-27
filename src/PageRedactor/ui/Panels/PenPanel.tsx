import { useState } from 'react';
import { MIN_PEN_WIDTH, MAX_PEN_WIDTH } from '../../constants/editor';

interface PenPanelProps {
    color: string;
    width: number;
    onColorChange: (color: string) => void;
    onWidthChange: (width: number) => void;
    onClose: () => void;
}

export function PenPanel({ color, width, onColorChange, onWidthChange }: PenPanelProps) {
    const [localColor, setLocalColor] = useState(color);
    const [localWidth, setLocalWidth] = useState(String(width));

    return (
        <div style={{
            padding: '12px',
            minWidth: '180px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Цвет</label>
                <input
                    type="color"
                    value={localColor}
                    onChange={(e) => { setLocalColor(e.target.value); onColorChange(e.target.value); }}
                    style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }}
                />
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Толщина: {localWidth}px
                </label>
                <input
                    type="range"
                    min={MIN_PEN_WIDTH}
                    max={MAX_PEN_WIDTH}
                    value={localWidth}
                    onChange={(e) => { setLocalWidth(e.target.value); onWidthChange(Number(e.target.value)); }}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}