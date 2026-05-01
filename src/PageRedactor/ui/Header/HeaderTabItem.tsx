import type { ReactNode } from 'react';
import styles from './HeaderTabItem.module.css';

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
            className={styles.item}
        >
            {children}
        </div>
    );
}