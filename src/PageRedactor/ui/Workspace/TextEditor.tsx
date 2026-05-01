import { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import styles from './TextEditor.module.css';

interface TextEditorProps {
    node: Konva.Text;
    onSave: (text: string) => void;
    onCancel: () => void;
}

export function TextEditor({ node, onSave, onCancel }: TextEditorProps) {
    const [value, setValue] = useState(node.text());
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const originalTextRef = useRef(node.text());

    const autoResize = useCallback(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
    }, []);

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(0, ta.value.length);
        autoResize();
    }, [autoResize]);

    useEffect(() => {
        autoResize();
    }, [value, autoResize]);

    const handleChange = useCallback((newValue: string) => {
        setValue(newValue);
        node.text(newValue);
        node.getLayer()?.batchDraw();
    }, [node]);

    const handleSave = useCallback(() => {
        onSave(value);
    }, [value, onSave]);

    const handleCancel = useCallback(() => {
        node.text(originalTextRef.current);
        node.getLayer()?.batchDraw();
        onCancel();
    }, [node, onCancel]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    const getTextareaStyle = useCallback((): React.CSSProperties => {
        const stage = node.getStage();
        if (!stage) return {};

        const containerRect = stage.container().getBoundingClientRect();
        const scale = stage.scaleX();
        const absPos = node.getAbsolutePosition();
        
        const x = containerRect.left + (absPos.x * scale);
        const textHeight = node.height() * scale;
        const y = containerRect.top + (absPos.y * scale) + textHeight + 4;
        
        const width = Math.max(node.width() * scale, 100);

        const fontSize = node.fontSize() * scale;
        const fontFamily = node.fontFamily();
        const fill = node.fill() as string;

        return {
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            color: fill,
        };
    }, [node]);

    return (
        <div className={styles.wrapper} style={getTextareaStyle()}>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.textarea}
            />
            <div className={styles.actions}>
                <button onMouseDown={(e) => e.preventDefault()} onClick={handleSave} className={styles.saveBtn}>✓</button>
                <button onMouseDown={(e) => e.preventDefault()} onClick={handleCancel} className={styles.cancelBtn}>✕</button>
            </div>
        </div>
    );
}