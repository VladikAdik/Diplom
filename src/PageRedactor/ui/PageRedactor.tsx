import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './Header/Header';
import { Workspace } from './Workspace/Workspace';
import { SidebarLayers } from './Sidebars/SidebarLayers';
import { SidebarTools } from './Sidebars/SidebarTools';
import { SidebarSummary } from './Sidebars/SidebarSummary';
import { useLayers } from '../hooks/useLayers';
import { useStageSize } from '../hooks/useStageSize';
import { useDrawingTool } from '../hooks/usePenTool';
import { useCropTool } from '../hooks/useCropTool';
import { CropOverlay } from './Workspace/CropOverlay';
import type Konva from 'konva';

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedTool, setSelectedTool] = useState<string>('select');
    const { stageSize, fitToContent, setCustomSize, getStageCenter } = useStageSize();
    const stageRef = useRef<Konva.Stage | null>(null);

    const [penColor, setPenColor] = useState('#000000');
    const [penWidth, setPenWidth] = useState(4);

    const {
        layers,
        selectedLayerIds,
        layerRefs,
        addImageLayer,
        removeLayer,
        updateLayer,
        updateLayerPosition,
        updateMultipleLayers,
        toggleVisibility,
        toggleLock,
        selectLayer,
        clearSelection,
        selectAll,
        undo,
        redo,
        canUndo,
        canRedo,
        clearAll,
        handleDragMove,
        handleDragEnd,
        snapGuides,
        addCanvasLayer,
        previewFilter,
        applyFilter,
        cancelPreview,

    } = useLayers(stageSize);

    const {
        isCropping,
        cropShape,
        rectArea,
        freePoints,
        startCrop,
        handleMouseDown: cropMouseDown,
        handleMouseMove: cropMouseMove,
        applyCrop,
        cancelCrop,
    } = useCropTool({
        stageRef,
        layers,
        selectedLayerIds,
        updateLayer,
        onCropComplete: () => setSelectedTool('select') // Добавить эту строку
    });

    // Кисть
    const { handleMouseDown, handleMouseMove, handleMouseUp, reset } = useDrawingTool({
        stageRef,
        selectedTool,
        layers,
        selectedLayerIds,
        updateLayer,
        penColor,
        penWidth,
    });

    // Сброс при смене инструмента
    useEffect(() => { reset(); }, [selectedTool, reset]);

    // Загрузка изображения при старте
    useEffect(() => {
        if (image) {
            fitToContent(image.width, image.height);
            addImageLayer(image, 0, 0);
        }
    }, [image, addImageLayer, fitToContent]);

    // Горячие клавиши
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Игнорируем ввод в текстовые поля
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Ctrl+A — выделить всё
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
                e.preventDefault();
                selectAll();
                return;
            }

            // Ctrl+Z — отменить (без Shift)
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Ctrl+Shift+Z или Ctrl+Y — повторить
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
                e.preventDefault();
                redo();
                return;
            }

            // Delete или Backspace — удалить выделенные слои
            if (e.code === 'Delete' || e.code === 'Backspace') {
                e.preventDefault();
                selectedLayerIds.forEach(id => removeLayer(id));
                return;
            }

            // Escape — снять выделение
            if (e.code === 'Escape') {
                e.preventDefault();
                clearSelection();
                return;
            }

            // Инструменты (используем code для независимости от раскладки)
            if (e.code === 'KeyV') {
                setSelectedTool('select');
                return;
            }
            if (e.code === 'KeyP') {
                setSelectedTool('pen');
                return;
            }
            if (e.code === 'KeyE') {
                setSelectedTool('eraser');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectAll, clearSelection, selectedLayerIds, removeLayer]);

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
                    addImageLayer(img, center.x - img.width / 2, center.y - img.height / 2);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, [addImageLayer, getStageCenter]);

    const handleTransformEnd = useCallback((transforms: Array<{
        id: string; x: number; y: number; width: number; height: number; rotation: number;
    }>) => {
        if (transforms.length > 1) {
            updateMultipleLayers(transforms);
        } else if (transforms.length === 1) {
            const { id, x, y, width, height, rotation } = transforms[0];
            updateLayerPosition(id, x, y, width, height, rotation);
        }
    }, [updateLayerPosition, updateMultipleLayers]);

    const handleSaveAsPNG = useCallback(() => {
        if (!stageRef.current) return;

        const dataURL = stageRef.current.toDataURL({
            mimeType: 'image/png',
            pixelRatio: 2, // 2x качество
        });

        const link = document.createElement('a');
        link.download = 'редактор-изображение.png';
        link.href = dataURL;
        link.click();
    }, []);

    const handleSaveAsJPG = useCallback(() => {
        if (!stageRef.current) return;

        const dataURL = stageRef.current.toDataURL({
            mimeType: 'image/jpeg',
            quality: 0.95,
            pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = 'редактор-изображение.jpg';
        link.href = dataURL;
        link.click();
    }, []);

    const handleStartCrop = useCallback((shape: 'rect' | 'free') => {
        setSelectedTool(shape === 'rect' ? 'cropRect' : 'cropFree');
        startCrop(shape);
    }, [startCrop]);

    return (
        <div>
            <Header
                onLoadImage={handleLoadImage}
                onSaveAsPNG={handleSaveAsPNG}
                onSaveAsJPG={handleSaveAsJPG}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                onClearAll={clearAll}
                onSetCustomSize={setCustomSize}
                currentWidth={stageSize.width}
                currentHeight={stageSize.height}
            />

            <Workspace
                layers={layers}
                selectedLayerIds={selectedLayerIds}
                selectedTool={selectedTool}
                layerRefs={layerRefs}
                onSelectLayer={selectLayer}
                onClearSelection={clearSelection}
                onTransformEnd={handleTransformEnd}
                onUpdate={setPreviewUrl}
                stageSize={stageSize}
                onLayerDragMove={handleDragMove}
                onLayerDragEnd={handleDragEnd}
                snapGuides={snapGuides}
                stageRef={stageRef}
                penHandlers={{
                    onMouseDown: handleMouseDown,
                    onMouseMove: handleMouseMove,
                    onMouseUp: handleMouseUp,
                }}
                cropHandlers={{
                    onMouseDown: cropMouseDown,
                    onMouseMove: cropMouseMove,
                }}
                rectArea={rectArea}      // добавить в WorkspaceProps
                freePoints={freePoints}  // добавить в WorkspaceProps
            />

            <SidebarTools
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
                penColor={penColor}
                penWidth={penWidth}
                onPenColorChange={setPenColor}
                onPenWidthChange={setPenWidth}
                selectedLayerIds={selectedLayerIds}
                onFilterPreview={(filter, value) => {
                    previewFilter(filter, value, selectedLayerIds);
                }}
                onFilterApply={(filter, value) => {
                    applyFilter(filter, value, selectedLayerIds);
                }}
                onFilterCancel={cancelPreview}
                onStartCrop={handleStartCrop}
                isCropping={isCropping}
                cropShape={cropShape}
                onApplyCrop={applyCrop}
                onCancelCrop={cancelCrop}
            />

            <SidebarLayers
                layers={layers}
                selectedLayerIds={selectedLayerIds}
                onSelectLayer={selectLayer}
                onToggleVisibility={toggleVisibility}
                onToggleLock={toggleLock}
                onRemoveLayer={removeLayer}
                onAddLayer={() => addCanvasLayer(stageSize.width, stageSize.height)}
            />

            {previewUrl && <SidebarSummary imageUrl={previewUrl} />}
        </div>
    );
}