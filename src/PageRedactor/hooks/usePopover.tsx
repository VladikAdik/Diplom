import { useState, useCallback } from 'react';

export function usePopover() {
    const [activePopover, setActivePopover] = useState<string | null>(null);

    const open = useCallback((id: string) => setActivePopover(id), []);
    const close = useCallback(() => setActivePopover(null), []);
    const toggle = useCallback((id: string) => {
        setActivePopover(prev => prev === id ? null : id);
    }, []);
    const isOpen = useCallback((id: string) => activePopover === id, [activePopover]);

    return { open, close, toggle, isOpen, activePopover };
}