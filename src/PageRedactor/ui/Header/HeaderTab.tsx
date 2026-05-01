import { usePopover } from '../../hooks/interaction';
import type { ReactNode } from 'react';
import styles from './HeaderTab.module.css';

interface HeaderTabProps {
    title: string;
    children: ReactNode;
}

export function HeaderTab({ title, children }: HeaderTabProps) {
    const { isOpen, toggle, popoverRef } = usePopover();

    return (
        <div className={styles.container}>
            <button
                onClick={() => toggle(title)}
                className={`${styles.button} ${isOpen(title) ? styles.buttonOpen : ''}`}
            >
                {title}
            </button>
            {isOpen(title) && (
                <div ref={popoverRef} className={styles.popover}>
                    {children}
                </div>
            )}
        </div>
    );
}