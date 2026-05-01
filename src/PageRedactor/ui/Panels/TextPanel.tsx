import { useState } from 'react';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_FILL, DEFAULT_TEXT_WIDTH, DEFAULT_TEXT_HEIGHT } from '../../constants/editor';
import styles from './TextPanel.module.css';

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
        <div className={styles.panel} onKeyDown={handleKeyDown} tabIndex={0}>
            <h4 className={styles.title}>Добавить текст</h4>

            <div className={styles.mb8}>
                <label className={styles.label}>Текст</label>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={3} className={styles.textarea} />
            </div>

            <div className={styles.mb8}>
                <label className={styles.label}>Шрифт</label>
                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className={styles.select}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            <div className={styles.mb8}>
                <label className={styles.label}>Размер: <strong>{fontSize}px</strong></label>
                <div className={styles.rangeRow}>
                    <input type="range" min={8} max={120} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className={styles.rangeSlider} />
                    <input type="number" min={8} max={120} value={fontSize} onChange={e => setFontSize(Math.max(8, Math.min(120, Number(e.target.value) || 8)))} className={styles.numberInput} />
                </div>
            </div>

            <div className={styles.mb8}>
                <label className={styles.label}>Цвет</label>
                <div className={styles.colorRow}>
                    <input type="color" value={fill} onChange={e => setFill(e.target.value)} className={styles.colorPicker} />
                    <input type="text" value={fill} onChange={e => setFill(e.target.value)} className={styles.colorText} />
                </div>
            </div>

            <div className={styles.actions}>
                <button onClick={onClose} className={styles.cancelBtn}>Отмена</button>
                <button onClick={handleAdd} className={styles.addBtn}>Добавить</button>
            </div>
        </div>
    );
}