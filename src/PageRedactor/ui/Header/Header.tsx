import { HeaderTab } from "./HeaderTab";
import { HeaderTabItem } from "./HeaderTabItem";

interface HeaderProps {
    onNewProject?: () => void;
    onLoadImage?: () => void;
    onSaveAsPNG?: () => void;
    onSaveAsJPG?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onDelete?: () => void;
    onClearAll?: () => void;
    onShowShortcuts?: () => void;
    onShowAbout?: () => void;
}

export function Header({
    onNewProject,
    onLoadImage,
    onSaveAsPNG,
    onSaveAsJPG,
    onUndo,
    onRedo,
    onDelete,
    onClearAll,
    onShowShortcuts,
    onShowAbout
}: HeaderProps) {

    return <div style={{ display: 'flex' }}>
        <HeaderTab title="Файл">
            <HeaderTabItem onClick={onNewProject}>📄 Новый проект</HeaderTabItem>
            <HeaderTabItem onClick={onLoadImage}>📁 Загрузить изображение</HeaderTabItem>
            <HeaderTabItem onClick={onSaveAsPNG}>💾 Сохранить как PNG</HeaderTabItem>
            <HeaderTabItem onClick={onSaveAsJPG}>💾 Сохранить как JPG</HeaderTabItem>
        </HeaderTab>

        <HeaderTab title="Редактировать">
            <HeaderTabItem onClick={onUndo}>↩ Отменить (Ctrl+Z)</HeaderTabItem>
            <HeaderTabItem onClick={onRedo}>↪ Повторить (Ctrl+Y)</HeaderTabItem>
            <HeaderTabItem onClick={onDelete}>🗑 Удалить выделенное (Delete)</HeaderTabItem>
            <HeaderTabItem onClick={onClearAll}>🧹 Очистить всё</HeaderTabItem>
        </HeaderTab>

        <HeaderTab title="Помощь">
            <HeaderTabItem onClick={onShowShortcuts}>⌨ Горячие клавиши</HeaderTabItem>
            <HeaderTabItem onClick={onShowAbout}>ℹ О программе</HeaderTabItem>
        </HeaderTab>
    </div>

}
