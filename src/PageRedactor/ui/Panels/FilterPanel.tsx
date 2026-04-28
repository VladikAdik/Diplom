import { useState } from 'react';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast' | 'saturate';

interface FilterPanelProps {
    currentFilter: FilterType;
    filterValue: number;
    onFilterChange: (filter: FilterType, value: number) => void;
    onApply: (filter: FilterType, value: number) => void;
    onClose: () => void;
}

export function FilterPanel({
    currentFilter,
    filterValue,
    onFilterChange,
    onApply,
    onClose,
}: FilterPanelProps) {
    const [filter, setFilter] = useState<FilterType>(currentFilter);
    const [value, setValue] = useState(filterValue);

    const filters: { type: FilterType; label: string; min: number; max: number; step: number; unit: string }[] = [
        { type: 'none', label: 'Без фильтра', min: 0, max: 0, step: 0, unit: '' },
        { type: 'grayscale', label: 'Ч/б', min: 0, max: 100, step: 1, unit: '%' },
        { type: 'sepia', label: 'Сепия', min: 0, max: 100, step: 1, unit: '%' },
        { type: 'invert', label: 'Инверсия', min: 0, max: 100, step: 1, unit: '%' },
        { type: 'blur', label: 'Размытие', min: 0, max: 20, step: 0.5, unit: 'px' },
        { type: 'brightness', label: 'Яркость', min: -100, max: 100, step: 1, unit: '' },
        { type: 'contrast', label: 'Контраст', min: -100, max: 100, step: 1, unit: '' },
        { type: 'saturate', label: 'Насыщенность', min: -100, max: 100, step: 1, unit: '' },
    ];

    return (
        <div style={{
            padding: '16px',
            minWidth: '240px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Фильтры</h4>

            <div style={{ marginBottom: '12px' }}>
                <select
                    value={filter}
                    onChange={(e) => {
                        const newFilter = e.target.value as FilterType;
                        setFilter(newFilter);
                        const newVal = newFilter === 'none' ? 0 : 50;
                        setValue(newVal);
                        onFilterChange(newFilter, newVal);
                    }}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                    }}
                >
                    {filters.map(f => (
                        <option key={f.type} value={f.type}>{f.label}</option>
                    ))}
                </select>
            </div>

            {filter !== 'none' && (
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {filters.find(f => f.type === filter)?.label}: {value}{filters.find(f => f.type === filter)?.unit}
                    </label>
                    <input
                        type="range"
                        min={filters.find(f => f.type === filter)?.min || 0}
                        max={filters.find(f => f.type === filter)?.max || 100}
                        step={filters.find(f => f.type === filter)?.step || 1}
                        value={value}
                        onChange={(e) => {
                            const newVal = Number(e.target.value);
                            setValue(newVal);
                            onFilterChange(filter, newVal);
                        }}
                        style={{ width: '100%' }}
                    />
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Отмена
                </button>
                <button
                    onClick={() => { onApply(filter, value); onClose(); }}
                    style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Применить
                </button>
            </div>
        </div>
    );
}