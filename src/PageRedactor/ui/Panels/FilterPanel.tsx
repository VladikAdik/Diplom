import { useState } from 'react';
import styles from './FilterPanel.module.css';

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
        <div className={styles.panel}>
            <h4 className={styles.title}>Фильтры</h4>

            <div className={styles.mb12}>
                <select
                    value={filter}
                    onChange={(e) => {
                        const newFilter = e.target.value as FilterType;
                        setFilter(newFilter);
                        const newVal = newFilter === 'none' ? 0 : 50;
                        setValue(newVal);
                        onFilterChange(newFilter, newVal);
                    }}
                    className={styles.select}
                >
                    {filters.map(f => (
                        <option key={f.type} value={f.type}>{f.label}</option>
                    ))}
                </select>
            </div>

            {filter !== 'none' && (
                <div className={styles.mb12}>
                    <label className={styles.sliderLabel}>
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
                        className={styles.slider}
                    />
                </div>
            )}

            <div className={styles.actions}>
                <button onClick={onClose} className={styles.cancelBtn}>Отмена</button>
                <button onClick={() => { onApply(filter, value); onClose(); }} className={styles.applyBtn}>Применить</button>
            </div>
        </div>
    );
}