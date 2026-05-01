import { useState, useEffect } from 'react';
import { MIN_PEN_WIDTH, MAX_PEN_WIDTH } from '../../constants/editor';
import styles from './PenPanel.module.css';

interface PenPanelProps {
    color: string;
    width: number;
    onColorChange: (color: string) => void;
    onWidthChange: (width: number) => void;
    onClose: () => void;
    showColor?: boolean;
}

export function PenPanel({
    color,
    width,
    onColorChange,
    onWidthChange,
    showColor = true,
}: PenPanelProps) {
    const [localColor, setLocalColor] = useState(color);
    const [localWidth, setLocalWidth] = useState(String(width));

    useEffect(() => {
        setLocalColor(color);
    }, [color]);

    useEffect(() => {
        setLocalWidth(String(width));
    }, [width]);

    return (
        <div className={styles.panel}>
            {showColor && (
                <div className={styles.mb10}>
                    <label className={styles.label}>Цвет</label>
                    <input
                        type="color"
                        value={localColor}
                        onChange={(e) => { setLocalColor(e.target.value); onColorChange(e.target.value); }}
                        className={styles.colorInput}
                    />
                </div>
            )}

            <div className={styles.mb10}>
                <label className={styles.label}>Толщина: {localWidth}px</label>
                <input
                    type="range"
                    min={MIN_PEN_WIDTH}
                    max={MAX_PEN_WIDTH}
                    value={localWidth}
                    onChange={(e) => { setLocalWidth(e.target.value); onWidthChange(Number(e.target.value)); }}
                    className={styles.rangeInput}
                />
            </div>
        </div>
    );
}