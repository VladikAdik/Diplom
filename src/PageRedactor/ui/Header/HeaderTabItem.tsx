import { type ReactNode } from 'react'

interface HeaderTabItemProps {
    onClick?: () => void;
    children: ReactNode;
}

export function HeaderTabItem({ onClick, children }: HeaderTabItemProps) {
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#333',
                transition: 'background 0.15s',
                whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
            {children}
        </div>
    );
}