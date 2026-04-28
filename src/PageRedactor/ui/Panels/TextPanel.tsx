import { useState } from 'react';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_FILL, DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT } from '../../constants/editor';

interface TextPanelProps {
    onAdd: (text: string, config: { fontSize: number; fontFamily: string; fill: string; width: number; height: number }) => void;
    onClose: () => void;
}

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];

export function TextPanel({ onAdd, onClose }: TextPanelProps) {
    const [text, setText] = useState('Новый текст');
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
    const [fontFamily, setFontFamily] = useState(DEFAULT_FONT_FAMILY);
    const [fill, setFill] = useState(DEFAULT_TEXT_FILL);

    const handleAdd = () => {
        onAdd(text, { fontSize, fontFamily, fill, width: DEFAULT_TEXT_WIDTH, height: DEFAULT_TEXT_HEIGHT });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
        }
        if (e.key === 'Escape') onClose();
    };

    return (
        <div onKeyDown={handleKeyDown} tabIndex={0} style={{ padding: '16px', minWidth: '260px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', outline: 'none' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Добавить текст</h4>

            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Текст</label>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' }}
                />
            </div>

            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Шрифт</label>
                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)}
                    style={{ width: '100%', padding: '4px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Размер: <strong>{fontSize}px</strong></label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="range" min={8} max={120} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ flex: 1 }} />
                    <input type="number" min={8} max={120} value={fontSize} onChange={e => setFontSize(Math.max(8, Math.min(120, Number(e.target.value) || 8)))}
                        style={{ width: '50px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }} />
                </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Цвет</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="color" value={fill} onChange={e => setFill(e.target.value)}
                        style={{ width: '32px', height: '32px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '2px' }} />
                    <input type="text" value={fill} onChange={e => setFill(e.target.value)}
                        style={{ flex: 1, padding: '4px 6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button onClick={onClose} style={{ padding: '6px 16px', fontSize: '12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Отмена</button>
                <button onClick={handleAdd} style={{ padding: '6px 16px', fontSize: '12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Добавить</button>
            </div>
        </div>
    );
}