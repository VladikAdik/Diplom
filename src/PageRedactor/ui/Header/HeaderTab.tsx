import { useState, useRef, useEffect, type ReactNode } from 'react';

interface HeaderTabProps {
    title: string;
    children: ReactNode;
}

export function HeaderTab({ title, children }: HeaderTabProps) {
    const [isOpen, setIsOpen] = useState(false);
    const tabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tabRef.current && !tabRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={tabRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: isOpen ? '#34495e' : 'transparent',
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
            {isOpen && (
                <div style={{
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