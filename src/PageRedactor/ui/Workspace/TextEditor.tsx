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

    // Авто-подстройка высоты под контент
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
        ta.select();
        autoResize();
    }, [autoResize]);

    useEffect(() => {
        autoResize();
    }, [value, autoResize]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(value);
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    // Пересчитываем позицию с учётом всех трансформаций
    const stage = node.getStage();
    const stageBox = stage?.container().getBoundingClientRect();
    const stagePos = stage?.getAbsolutePosition() || { x: 0, y: 0 };
    const scale = stage?.scaleX() || 1;
    
    // Абсолютная позиция узла
    const nodeAbsPos = node.getAbsolutePosition();
    
    // Координаты относительно контейнера сцены
    const x = (nodeAbsPos.x - stagePos.x) * scale + (stageBox?.left || 0);
    const y = (nodeAbsPos.y - stagePos.y) * scale + (stageBox?.top || 0);
    
    // Размеры с учётом масштаба
    const width = Math.max(node.width() * scale, 100);
    const height = Math.max(node.height() * scale, 30);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(value)}
            style={{
                position: 'fixed',  // fixed чтобы не зависеть от скролла
                left: x,
                top: y,
                width: width,
                minWidth: 100,
                minHeight: height,
                fontSize: node.fontSize() * scale,
                fontFamily: node.fontFamily(),
                color: node.fill() as string,
                background: 'transparent',
                border: '1px solid transparent',
                outline: 'none',
                padding: '2px 4px',
                margin: '0',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: node.lineHeight() || 1.2,
                resize: 'none',
                zIndex: 10000,
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
                e.target.style.border = '1px solid #2196F3';
            }}
        />
    );
}