import { forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';
import { Stage, Layer as KonvaLayer, Image as KonvaImage } from 'react-konva';
import { useWorkspaceLogic } from '../bll/useWorkspaceLogic';
import { useLayers } from '../bll/useLayers';
import { type Layer } from '../types/Layer';

interface WorkspaceProps {
    image?: HTMLImageElement | null
    onUpdate?: (url: string) => void
    onLayersChange?: (layers: Layer[]) => void
}

export interface WorkspaceRef {
    addImage: (newImage: HTMLImageElement) => void
    addLayer: () => void
    getLayers: () => Layer[]
    selectLayer: (id: string) => void
    toggleVisibility: (id: string) => void
    toggleLock: (id: string) => void
    removeLayer: (id: string) => void
    resetView: () => void
}

export const Workspace = forwardRef<WorkspaceRef, WorkspaceProps>(({
    image,
    onUpdate,
    onLayersChange
}, ref) => {

    // Хук для управления зумом, панорамированием и превью
    const {
        stageRef,
        handleWheel,
        resetView,
        updatePreview
    } = useWorkspaceLogic({ onUpdate });

    // Хук для управления слоями
    const {
        layers,
        selectedLayerId,
        setSelectedLayerId,
        layerRefs,
        addLayer,
        removeLayer,
        toggleVisibility,
        toggleLock,
        updateLayerPosition,
    } = useLayers();

    // При каждом изменении слоёв - уведомляем родителя
    useEffect(() => {
        onLayersChange?.(layers);
    }, [layers, onLayersChange]);

    // При первом запуске (если есть image из PageStart) создаём базовый слой
    useEffect(() => {
        if (image && layers.length === 0) {
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

    // Перетаскивание изображения: сохраняем новую позицию и обновляем превью
    const handleImageDragEnd = useCallback((layerId: string, x: number, y: number) => {
        updateLayerPosition(layerId, x, y);
        updatePreview();
    }, [updateLayerPosition, updatePreview]);

    // Рендер одного слоя (вынесен в useCallback, чтобы не пересоздавать на каждый рендер)
    const renderLayer = useCallback((layer: Layer) => {
        const isSelected = selectedLayerId === layer.id;

        return (
            <KonvaLayer
                key={layer.id}
                ref={(node) => {
                    if (node) {
                        layerRefs.current.set(layer.id, node);
                    }
                }}
                visible={layer.visible}
                opacity={layer.opacity}
                listening={!layer.locked}
                onClick={() => setSelectedLayerId(layer.id)}
            >
                {layer.type === 'image' && layer.data instanceof HTMLImageElement && (
                    <KonvaImage
                        image={layer.data}
                        x={layer.x ?? 100}
                        y={layer.y ?? 100}
                        draggable={!layer.locked}
                        onDragEnd={(e) => {
                            handleImageDragEnd(layer.id, e.target.x(), e.target.y());
                        }}
                        stroke={isSelected ? '#2196F3' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                        name={layer.id}
                    />
                )}
                {/* TODO: рендер фигур и текста */}
            </KonvaLayer>
        );
    }, [selectedLayerId, layerRefs, setSelectedLayerId, handleImageDragEnd]);

    // Экспонируем методы наружу (через ref, который получит PageRedactor)
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
        selectLayer: (id: string) => setSelectedLayerId(id),
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
    }), [layers, addLayer, toggleVisibility, toggleLock, removeLayer, resetView, setSelectedLayerId]);

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
                    cursor: 'default'
                }}
            >
                {layers.map(renderLayer)}
            </Stage>
        </div>
    );
});