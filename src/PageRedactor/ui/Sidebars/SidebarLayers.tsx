import { memo } from 'react';
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
    previewUrl?: string;  // ← добавили
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
}: SidebarLayersProps) {
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
                        .map((layer) => (
                            <LayerItem
                                key={layer.id}
                                layer={layer}
                                isSelected={selectedLayerIds.has(layer.id)}
                                onSelect={onSelectLayer || (() => {})}
                                onToggleVisibility={onToggleVisibility || (() => {})}
                                onToggleLock={onToggleLock || (() => {})}
                                onRemove={onRemoveLayer || (() => {})}
                            />
                        ))
                )}
            </div>

            <button onClick={onAddLayer} className={styles.addBtn}>
                + Добавить слой
            </button>
        </div>
    );
}