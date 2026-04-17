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
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div ref={tabRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    background: isOpen ? '#34495e' : '#565e34'
                }}
            >
                {title} ▼
            </button>
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '0',
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 200,
                    minWidth: '200px'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}