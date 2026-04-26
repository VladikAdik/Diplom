import { HeaderTab } from "./HeaderTab";
import { HeaderTabItem } from "./HeaderTabItem";
import { SizePanel } from "../Panels/SizePanel";
import { useState, useCallback } from "react";

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
    const [showSizePanel, setShowSizePanel] = useState(false);
    const [panelKey, setPanelKey] = useState(0);

    const handleToggleSizePanel = useCallback(() => {
        if (!showSizePanel) {
            // При открытии увеличиваем ключ для пересоздания панели
            setPanelKey(prev => prev + 1);
        }
        setShowSizePanel(prev => !prev);
    }, [showSizePanel]);

    const handleCloseSizePanel = useCallback(() => {
        setShowSizePanel(false);
    }, []);

    const handleApplySize = useCallback((w: number, h: number) => {
        onSetCustomSize?.(w, h);
        setShowSizePanel(false);
    }, [onSetCustomSize]);

    return (
        <div style={{ 
            display: 'flex', 
            background: '#2c3e50', 
            padding: '4px 8px',
            gap: '4px',
            position: 'relative'
        }}>
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

            {showSizePanel && (
                <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '120px',
                    zIndex: 300,
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid #ddd'
                }}>
                    <SizePanel
                        key={panelKey}
                        currentWidth={currentWidth}
                        currentHeight={currentHeight}
                        onApply={handleApplySize}
                        onClose={handleCloseSizePanel}
                    />
                </div>
            )}
        </div>
    );
}