import { useRef, type ReactNode } from 'react';
import { usePopover } from '../../hooks/usePopover';

interface HeaderTabProps {
    title: string;
    children: ReactNode;
}

export function HeaderTab({ title, children }: HeaderTabProps) {
    const { isOpen, toggle, popoverRef } = usePopover();
    const tabRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={tabRef} style={{ position: 'relative' }}>
            <button
                onClick={() => toggle(title)}
                style={{
                    background: isOpen(title) ? '#34495e' : 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                }}
            >
                {title}
            </button>
            {isOpen(title) && (
                <div ref={popoverRef} style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 200,
                    minWidth: '200px'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}