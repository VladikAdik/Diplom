// components/Workspace/TextEditor.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';

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
        // ✅ Позиционируем ПОД текстом: top текста + его высота
        const textHeight = node.height() * scale;
        const y = containerRect.top + (absPos.y * scale) + textHeight + 4; // +4px отступ
        
        const width = Math.max(node.width() * scale, 100);

        const fontSize = node.fontSize() * scale;
        const fontFamily = node.fontFamily();
        const fill = node.fill() as string;
        const align = node.align() || 'left';
        const lineHeight = node.lineHeight() || 1.2;

        return {
            position: 'fixed' as const,
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
            color: fill,
            textAlign: align as React.CSSProperties['textAlign'],
            lineHeight: lineHeight,
        };
    }, [node]);

    return (
        <div style={{
            position: 'fixed',
            zIndex: 10000,
            background: 'white',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #2196F3',
            ...getTextareaStyle(),
        }}>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                    width: '100%',
                    minHeight: '30px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: '8px',
                    margin: '0',
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    lineHeight: 'inherit',
                    resize: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxSizing: 'border-box',
                }}
            />
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '4px',
                padding: '4px 8px',
                borderTop: '1px solid #eee',
                background: '#fafafa',
                borderRadius: '0 0 4px 4px',
            }}>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleSave}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                    }}
                >
                    ✓
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCancel}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}