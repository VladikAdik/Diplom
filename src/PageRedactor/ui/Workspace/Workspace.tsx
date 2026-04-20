import { forwardRef, useImperativeHandle, useEffect, useCallback, useRef } from 'react';
import { Stage, Layer as KonvaLayer } from 'react-konva';
import { useWorkspaceLogic } from '../../bll/useWorkspaceLogic';
import { useLayers } from '../../bll/useLayers';
import { type Layer } from '../../types/Layer';
import { TransformControls } from './TransformControls';
import { useSelectionRect } from './useSelectionRect';
import { SelectionRectLayer } from './SelectionRectLayer';
import { LayerRenderer } from './LayerRenderer';

interface WorkspaceProps {
    image?: HTMLImageElement | null;
    onUpdate?: (url: string) => void;
    onLayersChange?: (layers: Layer[]) => void;
    onSelectionChange?: (ids: Set<string>) => void;
    selectedTool?: string;
}

// Методы, которые будут доступны родителю (PageRedactor) через ref
export interface WorkspaceRef {
    addImage: (newImage: HTMLImageElement) => void;
    addLayer: () => void;
    getLayers: () => Layer[];
    selectLayer: (id: string, multiSelect?: boolean) => void;
    toggleVisibility: (id: string) => void;
    toggleLock: (id: string) => void;
    removeLayer: (id: string) => void;
    resetView: () => void;
}

export const Workspace = forwardRef<WorkspaceRef, WorkspaceProps>(({
    image,
    onUpdate,
    onLayersChange,
    onSelectionChange,
    selectedTool = 'select'  // По умолчанию инструмент выделения
}, ref) => {
    // Предотвращает повторную загрузку начального изображения при ререндерах
    const initialImageLoadedRef = useRef(false);

    // Хук для управления зумом, панорамированием и созданием превью
    const { stageRef, handleWheel, resetView, updatePreview } = useWorkspaceLogic({ onUpdate });

    // Хук для управления слоями (добавление, удаление, выделение и т.д.)
    const {
        layers,
        selectedLayerIds,
        selectLayer,
        clearSelection,
        layerRefs,
        addLayer,
        removeLayer,
        toggleVisibility,
        toggleLock,
        updateLayerPosition,
    } = useLayers();

    // Хук для выделения рамкой (клик + перетаскивание на пустом месте)
    const { isSelecting, selectionRect } = useSelectionRect({
        stageRef,
        selectedTool,
        layers,
        clearSelection,
        selectLayer
    });

    // Уведомляем родителя об изменении списка слоёв
    useEffect(() => {
        onLayersChange?.(layers);
    }, [layers, onLayersChange]);

    // Уведомляем родителя об изменении выделенных слоёв
    useEffect(() => {
        onSelectionChange?.(selectedLayerIds);
    }, [selectedLayerIds, onSelectionChange]);

    // При монтировании: если передано изображение, создаём базовый слой
    useEffect(() => {
        if (image && !initialImageLoadedRef.current && layers.length === 0) {
            initialImageLoadedRef.current = true;
            addLayer({
                name: 'Базовое изображение',
                visible: true,
                locked: false,
                opacity: 1,
                type: 'image',
                data: image,
                x: 100,
                y: 100
            });
        }
    }, [image, addLayer, layers.length]);

    // Обработчик завершения перетаскивания слоя
    const handleImageDragEnd = useCallback((layerId: string, x: number, y: number) => {
        updateLayerPosition(layerId, x, y);
        updatePreview(); // Обновляем превью после перемещения
    }, [updateLayerPosition, updatePreview]);

    // Обработчик завершения трансформации (масштабирование/поворот)
    const handleTransformEnd = useCallback((transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => {
        // Применяем новые координаты и размеры ко всем трансформированным слоям
        transforms.forEach(({ id, x, y, width, height, rotation }) => {
            updateLayerPosition(id, x, y, width, height, rotation);
        });
        setTimeout(() => updatePreview(), 0); // Асинхронное обновление превью
    }, [updateLayerPosition, updatePreview]);

    // Обёртка для selectLayer (для совместимости с LayerRenderer)
    const handleSelectLayer = useCallback((id: string, multiSelect: boolean) => {
        selectLayer(id, multiSelect);
    }, [selectLayer]);

    // Экспортируем методы для родительского компонента (PageRedactor)
    useImperativeHandle(ref, () => ({
        addImage: (newImage: HTMLImageElement) => {
            addLayer({
                name: `Изображение ${layers.length + 1}`,
                visible: true,
                locked: false,
                opacity: 1,
                type: 'image',
                data: newImage,
                x: 100,
                y: 100
            });
        },
        getLayers: () => layers,
        selectLayer: (id: string, multiSelect: boolean = false) => selectLayer(id, multiSelect),
        toggleVisibility: (id: string) => toggleVisibility(id),
        toggleLock: (id: string) => toggleLock(id),
        removeLayer: (id: string) => removeLayer(id),
        addLayer: () => {
            addLayer({
                name: `Слой ${layers.length + 1}`,
                visible: true,
                locked: false,
                opacity: 1,
                type: 'shape',
                data: null,
                x: 100,
                y: 100
            });
        },
        resetView: resetView
    }), [layers, addLayer, toggleVisibility, toggleLock, removeLayer, resetView, selectLayer]);

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
            <Stage
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight - 100}
                onWheel={handleWheel}
                style={{
                    border: '1px solid #ccc',
                    background: '#f5f5f5',
                    cursor: selectedTool === 'select' ? 'default' : 'crosshair'
                }}
            >
                {/* Все слои с изображениями */}
                {layers.map(layer => (
                    <LayerRenderer
                        key={layer.id}
                        layer={layer}
                        isSelected={selectedLayerIds.has(layer.id)}
                        canDrag={!layer.locked && selectedTool === 'select'}
                        onDragEnd={handleImageDragEnd}
                        onSelect={handleSelectLayer}
                        selectedTool={selectedTool}
                        layerRefs={layerRefs}
                    />
                ))}

                {/* Контролы трансформации (рамка с якорями) */}
                <KonvaLayer>
                    <TransformControls
                        selectedNodeIds={selectedTool === 'select' ? selectedLayerIds : new Set()}
                        layerRefs={layerRefs}
                        onTransformEnd={handleTransformEnd}
                    />
                </KonvaLayer>

                {/* Визуальная рамка выделения (рисуется поверх всего) */}
                <SelectionRectLayer isSelecting={isSelecting} selectionRect={selectionRect} />
            </Stage>
        </div>
    );
});