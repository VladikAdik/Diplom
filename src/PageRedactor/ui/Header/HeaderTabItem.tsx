import { type ReactNode } from 'react'

interface HeaderTabItemProps {
    onClick?: () => void;
    children: ReactNode;
}

export function HeaderTabItem({ onClick, children}: HeaderTabItemProps) {
    return <div
        onClick={onClick}
        style={{
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
    >
        {children}
    </div>
}