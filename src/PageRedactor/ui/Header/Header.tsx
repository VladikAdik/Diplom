import { useState, useCallback } from "react";
import { HeaderTab } from "./HeaderTab";
import { HeaderTabItem } from "./HeaderTabItem";
import { SizePanel } from "../Panels/SizePanel";
import { usePopover } from "../../hooks/interaction";
import styles from './Header.module.css'

interface HeaderProps {
    onNewProject?: () => void;
    onLoadImage?: () => void;
    onSaveAsPNG?: () => void;
    onSaveAsJPG?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onDelete?: () => void;
    onClearAll?: () => void;
    onShowShortcuts?: () => void;
    onShowAbout?: () => void;
    onFitToContent?: () => void;
    onSetCustomSize?: (width: number, height: number) => void;
    currentWidth?: number;
    currentHeight?: number;
}

export function Header({
    onNewProject,
    onLoadImage,
    onSaveAsPNG,
    onSaveAsJPG,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onClearAll,
    onShowShortcuts,
    onShowAbout,
    onSetCustomSize,
    currentWidth = 800,
    currentHeight = 600
}: HeaderProps) {
    const { isOpen, toggle, close, popoverRef } = usePopover();
    const [panelKey, setPanelKey] = useState(0);

    const handleToggleSizePanel = useCallback(() => {
        if (!isOpen('size')) {
            setPanelKey(prev => prev + 1);
        }
        toggle('size');
    }, [isOpen, toggle]);

    const handleApplySize = useCallback((w: number, h: number) => {
        onSetCustomSize?.(w, h);
        close();
    }, [onSetCustomSize, close]);

    return (
        <div className={styles.header}>
            <HeaderTab title="Файл">
                <HeaderTabItem onClick={onNewProject}>📄 Новый проект</HeaderTabItem>
                <HeaderTabItem onClick={onLoadImage}>📁 Загрузить изображение</HeaderTabItem>
                <HeaderTabItem onClick={onSaveAsPNG}>💾 Сохранить как PNG</HeaderTabItem>
                <HeaderTabItem onClick={onSaveAsJPG}>💾 Сохранить как JPG</HeaderTabItem>
            </HeaderTab>

            <HeaderTab title="Редактировать">
                <HeaderTabItem onClick={onUndo}>
                    ↩ Отменить (Ctrl+Z) {!canUndo && '(недоступно)'}
                </HeaderTabItem>
                <HeaderTabItem onClick={onRedo}>
                    ↪ Повторить (Ctrl+Y) {!canRedo && '(недоступно)'}
                </HeaderTabItem>
                <HeaderTabItem onClick={handleToggleSizePanel}>
                    📏 Задать размер холста
                </HeaderTabItem>
                <HeaderTabItem onClick={onClearAll}>🧹 Очистить всё</HeaderTabItem>
            </HeaderTab>

            <HeaderTab title="Помощь">
                <HeaderTabItem onClick={onShowShortcuts}>⌨ Горячие клавиши</HeaderTabItem>
                <HeaderTabItem onClick={onShowAbout}>ℹ О программе</HeaderTabItem>
            </HeaderTab>

            {isOpen('size') && (
                <div ref={popoverRef} className={styles.sizePopover}>
                    <SizePanel
                        key={panelKey}
                        currentWidth={currentWidth}
                        currentHeight={currentHeight}
                        onApply={handleApplySize}
                        onClose={close}
                    />
                </div>
            )}
        </div>
    );
}