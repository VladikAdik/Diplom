import { useState } from 'react';
import styles from './SizePanel.module.css';

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
        <div className={styles.panel}>
            <div className={styles.mb12}>
                <label className={styles.label}>Ширина (px)</label>
                <input
                    type="text"
                    value={width}
                    onChange={handleWidthChange}
                    onKeyDown={handleKeyDown}
                    placeholder={String(currentWidth)}
                    autoFocus
                    className={styles.input}
                />
            </div>
            <div className={styles.mb12}>
                <label className={styles.label}>Высота (px)</label>
                <input
                    type="text"
                    value={height}
                    onChange={handleHeightChange}
                    onKeyDown={handleKeyDown}
                    placeholder={String(currentHeight)}
                    className={styles.input}
                />
            </div>
            <div className={styles.actions}>
                <button onClick={onClose} className={styles.cancelBtn}>Отмена</button>
                <button onClick={handleApply} className={styles.applyBtn}>Применить</button>
            </div>
        </div>
    );
}