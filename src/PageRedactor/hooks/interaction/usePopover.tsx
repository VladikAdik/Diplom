import { useState, useCallback, useEffect, useRef } from 'react';

export function usePopover() {
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const open = useCallback((id: string) => setActivePopover(id), []);
    const close = useCallback(() => setActivePopover(null), []);
    const toggle = useCallback((id: string) => {
        setActivePopover(prev => prev === id ? null : id);
    }, []);
    const isOpen = useCallback((id: string) => activePopover === id, [activePopover]);

    // Закрытие по клику вне
    useEffect(() => {
        if (!activePopover) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                close();
            }
        };

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activePopover, close]);

    return { open, close, toggle, isOpen, activePopover, popoverRef };
}