import { useState, useEffect, useRef } from 'react';
import Konva from 'konva';

interface TextEditorProps {
    node: Konva.Text;
    onSave: (text: string) => void;
    onCancel: () => void;
}

export function TextEditor({ node, onSave, onCancel }: TextEditorProps) {
    const [value, setValue] = useState(node.text());
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(value);
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    const stage = node.getStage();
    const stagePos = stage?.getAbsolutePosition() || { x: 0, y: 0 };
    const scale = stage?.scaleX() || 1;
    const x = (node.absolutePosition().x - stagePos.x) / scale;
    const y = (node.absolutePosition().y - stagePos.y) / scale;

    return (
        <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(value)}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: node.width(),
                height: node.height(),
                fontSize: node.fontSize(),
                fontFamily: node.fontFamily(),
                //color: node.fill(),
                background: 'transparent',
                border: '2px solid #2196F3',
                outline: 'none',
                resize: 'both',
                padding: '0',
                margin: '0',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                lineHeight: node.lineHeight() ? `${node.lineHeight()}px` : 'normal',
            }}
        />
    );
}