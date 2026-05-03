import { memo, useState, useCallback } from 'react';
import type { Layer } from '../../types/Layer';
import styles from './SidebarLayers.module.css';

interface SidebarLayersProps {
    layers?: Layer[];
    selectedLayerIds?: Set<string>;
    onSelectLayer?: (id: string, multiSelect?: boolean) => void;
    onToggleVisibility?: (id: string) => void;
    onToggleLock?: (id: string) => void;
    onRemoveLayer?: (id: string) => void;
    onAddLayer?: () => void;
    previewUrl?: string;
    onReorderLayers?: (layers: Layer[]) => void;
}

const LayerItem = memo(({
    layer,
    isSelected,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onRemove
}: {
    layer: Layer;
    isSelected: boolean;
    onSelect: (id: string, multiSelect?: boolean) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onRemove: (id: string) => void;
}) => {
    return (
        <div
            onClick={(e) => {
                const isMultiSelect = e.ctrlKey || e.metaKey;
                onSelect(layer.id, isMultiSelect);
            }}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ''} ${!layer.visible ? styles.itemHidden : ''}`}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                className={`${styles.iconBtn} ${styles.visibilityBtn}`}
                title={layer.visible ? 'Скрыть' : 'Показать'}
            >
                {layer.visible ? '👁' : '👁‍🗨'}
            </button>

            <span className={`${styles.name} ${isSelected ? styles.nameSelected : ''}`}>
                {layer.name}
            </span>

            <button
                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                className={`${styles.iconBtn} ${styles.lockBtn}`}
                title={layer.locked ? 'Разблокировать' : 'Заблокировать'}
            >
                {layer.locked ? '🔒' : '🔓'}
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(layer.id); }}
                className={`${styles.iconBtn} ${styles.removeBtn}`}
                title="Удалить слой"
            >
                ✕
            </button>
        </div>
    );
});

LayerItem.displayName = 'LayerItem';

export function SidebarLayers({
    layers = [],
    selectedLayerIds = new Set(),
    onSelectLayer,
    onToggleVisibility,
    onToggleLock,
    onRemoveLayer,
    onAddLayer,
    previewUrl,
    onReorderLayers,
}: SidebarLayersProps) {
    
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIndex(index);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIndex) {
            setDragIndex(null);
            setOverIndex(null);
            return;
        }

        const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
        const draggedLayer = sortedLayers[dragIndex];

        // Удаляем перетаскиваемый слой из старой позиции
        const withoutDragged = sortedLayers.filter(l => l.id !== draggedLayer.id);

        // Вставляем в новую позицию
        const reordered = [
            ...withoutDragged.slice(0, dropIndex),
            draggedLayer,
            ...withoutDragged.slice(dropIndex),
        ];

        // Отдаём новый порядок — useLayers сам проставит zIndex
        onReorderLayers?.(reordered);

        setDragIndex(null);
        setOverIndex(null);
    }, [dragIndex, layers, onReorderLayers]);

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setOverIndex(null);
    }, []);

    return (
        <div className={styles.panel}>
            {/* Превью */}
            {previewUrl && (
                <div className={styles.preview}>
                    <img
                        src={previewUrl}
                        alt="Превью"
                        className={styles.previewImage}
                    />
                    <div className={styles.previewLabel}>Превью</div>
                </div>
            )}

            {/* Заголовок слоёв */}
            <div className={styles.header}>
                <h4 className={styles.title}>
                    📑 Слои
                    <span className={styles.count}>({layers.length})</span>
                </h4>
            </div>

            {/* Список слоёв */}
            <div className={styles.list}>
                {layers.length === 0 ? (
                    <div className={styles.empty}>
                        ✨ Нет слоёв<br />
                        <span className={styles.emptyHint}>Нажмите «+» чтобы добавить</span>
                    </div>
                ) : (
                    [...layers]
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((layer, index) => (
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                style={{
                                    opacity: dragIndex === index ? 0.5 : 1,
                                    borderTop: overIndex === index ? '2px solid #2196F3' : 'none',
                                }}
                            >
                                <LayerItem
                                    key={layer.id}
                                    layer={layer}
                                    isSelected={selectedLayerIds.has(layer.id)}
                                    onSelect={onSelectLayer || (() => { })}
                                    onToggleVisibility={onToggleVisibility || (() => { })}
                                    onToggleLock={onToggleLock || (() => { })}
                                    onRemove={onRemoveLayer || (() => { })}
                                />
                            </div>
                        ))
                )}
            </div>

            <button onClick={onAddLayer} className={styles.addBtn}>
                + Добавить слой
            </button>
        </div>
    );
}