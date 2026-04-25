import { useState, useCallback, useEffect } from 'react';
import { Header } from './Header/Header';
import { Workspace } from './Workspace/Workspace';
import { SidebarLayers } from './Sidebars/SidebarLayers';
import { SidebarTools } from './Sidebars/SidebarTools';
import { SidebarSummary } from './Sidebars/SidebarSummary';
import { useLayers } from '../hooks/useLayers';
import { useStageSize } from '../hooks/useStageSize';

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedTool, setSelectedTool] = useState<string>('select');
    const { stageSize, fitToContent, setCustomSize, isAdjusted, getStageCenter } = useStageSize();
    const [showSizeModal, setShowSizeModal] = useState(false);
    const [customWidth, setCustomWidth] = useState(800);
    const [customHeight, setCustomHeight] = useState(600);

    // ЕДИНСТВЕННЫЙ хук для всего
    const {
        layers,
        selectedLayerIds,
        layerRefs,

        // Фабрики
        addImageLayer,
        addShapeLayer,

        // CRUD
        removeLayer,
        updateLayerPosition,
        updateMultipleLayers,
        getFirstImageBounds,

        // Свойства
        toggleVisibility,
        toggleLock,

        // Выделение
        selectLayer,
        clearSelection,
        selectAll,

        // История
        undo,
        redo,
        canUndo,
        canRedo,
        clearAll,

    } = useLayers();

    // Загружаем начальное изображение
    useEffect(() => {
        if (image && layers.length === 0) {
            const center = getStageCenter();
            addImageLayer(image, center.x, center.y);
        }
    }, [image, layers.length, addImageLayer, getStageCenter]);

    useEffect(() => {
        if (!isAdjusted && layers.length > 0) {
            const bounds = getFirstImageBounds();
            if (bounds) {
                fitToContent(bounds.width, bounds.height);
            }
        }
    }, [layers, isAdjusted, fitToContent, getFirstImageBounds]);

    // Горячие клавиши
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+A
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAll();
                return;
            }

            // Ctrl+Z / Ctrl+Shift+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }

            // Ctrl+Y
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // Delete
            if (e.key === 'Delete') {
                e.preventDefault();
                selectedLayerIds.forEach(id => removeLayer(id));
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectAll, selectedLayerIds, removeLayer]);

    // Загрузка изображения из файла
    const handleLoadImage = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const center = getStageCenter();
                    addImageLayer(img, center.x, center.y);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, [addImageLayer, getStageCenter]);

    // Обработчик трансформации
    const handleTransformEnd = useCallback((transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => {
        if (transforms.length > 1) {
            updateMultipleLayers(transforms);
        } else if (transforms.length === 1) {
            const { id, x, y, width, height, rotation } = transforms[0];
            updateLayerPosition(id, x, y, width, height, rotation);
        }
    }, [updateLayerPosition, updateMultipleLayers]);

    // Обработчик перетаскивания
    const handleLayerDragEnd = useCallback((id: string, x: number, y: number) => {
        updateLayerPosition(id, x, y);
    }, [updateLayerPosition]);

    return (
        <div>
            <Header
                onLoadImage={handleLoadImage}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onClearAll={clearAll}
                onSetCustomSize={() => setShowSizeModal(true)}
            />

            <Workspace
                layers={layers}
                selectedLayerIds={selectedLayerIds}
                selectedTool={selectedTool}
                layerRefs={layerRefs}
                onSelectLayer={selectLayer}
                onClearSelection={clearSelection}
                onLayerDragEnd={handleLayerDragEnd}
                onTransformEnd={handleTransformEnd}
                onUpdate={setPreviewUrl}
                stageSize={stageSize}
            />

            <SidebarTools
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
            />

            <SidebarLayers
                layers={layers}
                selectedLayerIds={selectedLayerIds}
                onSelectLayer={selectLayer}
                onToggleVisibility={toggleVisibility}
                onToggleLock={toggleLock}
                onRemoveLayer={removeLayer}
                onAddLayer={() => addShapeLayer('rect')}
            />

            {previewUrl && <SidebarSummary imageUrl={previewUrl} />}

            {showSizeModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }} onClick={() => setShowSizeModal(false)}>
                    <div style={{
                        background: 'white',
                        padding: 20,
                        borderRadius: 8,
                        minWidth: 300
                    }} onClick={e => e.stopPropagation()}>
                        <h3>Размер холста</h3>
                        <input
                            type="number"
                            value={customWidth}
                            onChange={e => setCustomWidth(Number(e.target.value))}
                            placeholder="Ширина"
                            style={{ width: '100%', marginBottom: 10, padding: 8 }}
                        />
                        <input
                            type="number"
                            value={customHeight}
                            onChange={e => setCustomHeight(Number(e.target.value))}
                            placeholder="Высота"
                            style={{ width: '100%', marginBottom: 20, padding: 8 }}
                        />
                        <button onClick={() => {
                            setCustomSize(customWidth, customHeight);
                            setShowSizeModal(false);
                        }} style={{ padding: '8px 16px' }}>
                            Применить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}