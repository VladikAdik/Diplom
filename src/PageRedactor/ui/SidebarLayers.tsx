import { memo } from 'react';
import  { type Layer } from '../types/Layer'

interface SidebarLayersProps {
    layers?: Layer[];
    selectedLayerId?: string | null;
    onSelectLayer?: (id: string) => void;
    onToggleVisibility?: (id: string) => void;
    onToggleLock?: (id: string) => void;
    onRemoveLayer?: (id: string) => void;
    onAddLayer?: () => void;
}

// Вынесенный компонент для отдельного слоя (мемоизирован)
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
    onSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onRemove: (id: string) => void;
}) => {
    return (
        <div
            onClick={() => onSelect(layer.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                marginBottom: '4px',
                background: isSelected ? '#e3f2fd' : 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #eee',
                opacity: layer.visible ? 1 : 0.5,
                transition: 'all 0.2s ease'
            }}
        >
            {/* Кнопка видимости (глазик) */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Чтобы не сработал onSelect у родителя
                    onToggleVisibility(layer.id);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                    borderRadius: '4px'
                }}
                title={layer.visible ? 'Скрыть' : 'Показать'}
            >
                {layer.visible ? '👁' : '👁‍🗨'}
            </button>
            
            {/* Название слоя */}
            <span style={{ 
                flex: 1, 
                fontSize: '13px',
                fontWeight: isSelected ? '500' : 'normal'
            }}>
                {layer.name}
            </span>
            
            {/* Кнопка блокировки (замочек) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px',
                    borderRadius: '4px'
                }}
                title={layer.locked ? 'Разблокировать' : 'Заблокировать'}
            >
                {layer.locked ? '🔒' : '🔓'}
            </button>
            
            {/* Кнопка удаления */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(layer.id);
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#f44336',
                    fontSize: '16px',
                    padding: '4px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}
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
    selectedLayerId = null,
    onSelectLayer,
    onToggleVisibility,
    onToggleLock,
    onRemoveLayer,
    onAddLayer
}: SidebarLayersProps) {
    return (
        <div style={{
            position: 'absolute',
            right: '20px',
            top: '300px',
            width: '260px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
            overflow: 'hidden'
        }}>
            {/* Заголовок */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #eee',
                background: '#fafafa'
            }}>
                <h4 style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    📑 Слои
                    <span style={{
                        fontSize: '11px',
                        color: '#999',
                        fontWeight: 'normal'
                    }}>
                        ({layers.length})
                    </span>
                </h4>
            </div>

            {/* Список слоёв */}
            <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                padding: '8px'
            }}>
                {layers.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        color: '#999', 
                        padding: '32px 20px',
                        fontSize: '13px'
                    }}>
                        ✨ Нет слоёв<br />
                        <span style={{ fontSize: '11px' }}>Нажмите «+» чтобы добавить</span>
                    </div>
                ) : (
                    // Рендер всех слоёв (сортируем по zIndex, чтобы верхние были сверху)
                    [...layers]
                        .sort((a, b) => a.zIndex - b.zIndex)
                        .map((layer) => (
                            <LayerItem
                                key={layer.id}
                                layer={layer}
                                isSelected={selectedLayerId === layer.id}
                                onSelect={onSelectLayer || (() => {})}
                                onToggleVisibility={onToggleVisibility || (() => {})}
                                onToggleLock={onToggleLock || (() => {})}
                                onRemove={onRemoveLayer || (() => {})}
                            />
                        ))
                )}
            </div>

            {/* Кнопка добавления слоя */}
            <button
                onClick={onAddLayer}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1976D2';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#2196F3';
                }}
            >
                + Добавить слой
            </button>
        </div>
    );
}