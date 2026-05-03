import { useState, useCallback, useEffect, useRef } from 'react';
import type Konva from 'konva';
import type { Layer } from '../types/Layer';
import { TextEditor } from './Workspace/TextEditor';
import type { ShapeConfig, TextConfig } from '../types/Layer';
import { useLayers } from '../hooks/layers';
import { useStageSize } from '../hooks/workspace';
import { useDrawingTool, useCropTool } from '../hooks/tools';
import { Header, Workspace, SidebarLayers, SidebarTools, SidebarSummary } from './index';
import { getContentBounds } from '../utils/getContentBounds';
import { downloadImage } from '../utils/exportImage';

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [selectedTool, setSelectedTool] = useState<string>('select');
    const { fitToContent, setCustomSize } = useStageSize();
    const stageRef = useRef<Konva.Stage | null>(null);

    const [penColor, setPenColor] = useState('#000000');
    const [penWidth, setPenWidth] = useState(4);

    const {
        layers,
        selectedLayerIds,
        layerRefs,
        addImageLayer,
        addShapeLayer,
        addTextLayer,
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
        copyToClipboard,
        pasteFromClipboard,
        reorderLayers, 
    } = useLayers();

    const getContentCenter = useCallback(() => {
        const bounds = getContentBounds(layers);
        if (!bounds) return { x: 0, y: 0 };
        return {
            x: bounds.x + bounds.width / 2,
            y: bounds.y + bounds.height / 2,
        };
    }, [layers]);

    const targetLayerId = selectedLayerIds.size === 1 ? [...selectedLayerIds][0] : null;
    const {
        isCropping,
        cropShape,
        rectArea,
        freePoints,
        startCrop,
        handleMouseDown: cropMouseDown,
        handleMouseMove: cropMouseMove,
        handleMouseUp: cropMouseUp,
        applyCrop,
        cancelCrop,
    } = useCropTool({
        stageRef,
        layers,
        targetLayerId,
        selectedTool,
        updateLayer,
        selectLayer,
        onCropComplete: () => setSelectedTool('select')
    });

    const { handleMouseDown, handleMouseMove, handleMouseUp, reset } = useDrawingTool({
        stageRef,
        selectedTool,
        layers,
        selectedLayerIds,
        updateLayer,
        penColor,
        penWidth,
    });

    useEffect(() => { reset(); }, [selectedTool, reset]);

    useEffect(() => {
        if (image) {
            fitToContent(image.width, image.height);
            addImageLayer(image, 0, 0);
        }
    }, [image, addImageLayer, fitToContent]);

    // Горячие клавиши
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') { e.preventDefault(); selectAll(); return; }
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) { e.preventDefault(); undo(); return; }
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) { e.preventDefault(); redo(); return; }
            if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); selectedLayerIds.forEach(id => removeLayer(id)); return; }
            if (e.code === 'Escape') { e.preventDefault(); clearSelection(); return; }
            if (e.code === 'KeyV') { setSelectedTool('select'); return; }
            if (e.code === 'KeyP') { setSelectedTool('pen'); return; }
            if (e.code === 'KeyE') { setSelectedTool('eraser'); return; }
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
                e.preventDefault();
                copyToClipboard(selectedLayerIds);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
                e.preventDefault();
                pasteFromClipboard();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectAll, clearSelection, selectedLayerIds, removeLayer, copyToClipboard, pasteFromClipboard]);

    // ✅ Загрузка изображения — в центр вьюпорта
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
                    const center = getContentCenter();
                    addImageLayer(img, center.x - img.width / 2, center.y - img.height / 2);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, [addImageLayer, getContentCenter]);

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
        downloadImage(stageRef.current, layers, 'редактор-изображение.png', { format: 'png', pixelRatio: 2 });
    }, [layers]);

    const handleSaveAsJPG = useCallback(() => {
        if (!stageRef.current) return;
        downloadImage(stageRef.current, layers, 'редактор-изображение.jpg', { format: 'jpeg', quality: 0.95, pixelRatio: 2 });
    }, [layers]);

    const handleStartCrop = useCallback((shape: 'rect' | 'free') => {
        setSelectedTool(shape === 'rect' ? 'cropRect' : 'cropFree');
        startCrop(shape);
    }, [startCrop]);

    // ✅ Добавление текста — в центр вьюпорта
    const handleAddText = useCallback((text: string, config: TextConfig) => {
        const center = getContentCenter();
        addTextLayer(text, center.x - (config.width || 200) / 2, center.y - (config.height || 50) / 2, config);
    }, [addTextLayer, getContentCenter]);

    // ✅ Добавление фигуры — в центр вьюпорта
    const handleAddShape = useCallback((shapeType: string, config: ShapeConfig) => {
        const center = getContentCenter();
        addShapeLayer(shapeType, center.x - (config.width || 100) / 2, center.y - (config.height || 100) / 2, config);
    }, [addShapeLayer, getContentCenter]);

    const [editingText, setEditingText] = useState<{ id: string; node: Konva.Text } | null>(null);

    const handleEditText = useCallback((id: string, node: Konva.Text) => {
        setEditingText({ id, node });
    }, []);

    const handleSaveText = useCallback((text: string) => {
        if (editingText) {
            const layer = layers.find(l => l.id === editingText.id);
            if (layer && layer.runtime?.textConfig) {
                updateLayer(editingText.id, {
                    data: { ...layer.data, text } as Layer['data'],
                    runtime: { textConfig: { ...layer.runtime.textConfig, text } }
                });
            }
            editingText.node.visible(true);
            editingText.node.getLayer()?.batchDraw();
            setEditingText(null);
        }
    }, [editingText, updateLayer, layers]);

    const handleCancelText = useCallback(() => {
        if (editingText) {
            editingText.node.visible(true);
            editingText.node.getLayer()?.batchDraw();
            setEditingText(null);
        }
    }, [editingText]);

    // Превью по границам контента
    const updatePreviewImage = useCallback(() => {
        if (!stageRef.current) return;
        const bounds = getContentBounds(layers);
        if (!bounds) return;

        const stage = stageRef.current;
        const scale = stage.scaleX();

        const x = bounds.x * scale + stage.x();
        const y = bounds.y * scale + stage.y();
        const width = bounds.width * scale;
        const height = bounds.height * scale;

        // ✅ Скрываем Transformer
        const transformers = stage.find('Transformer') as Konva.Transformer[];
        transformers.forEach(t => t.visible(false));

        const cropOverlay = stage.findOne('.crop-overlay') as Konva.Layer | null;  // ← по имени
        if (cropOverlay) cropOverlay.visible(false);

        const dataURL = stage.toDataURL({
            mimeType: 'image/png',
            pixelRatio: 0.5,
            x,
            y,
            width,
            height,
        });

        // ✅ Возвращаем видимость
        transformers.forEach(t => t.visible(true));
        if (cropOverlay) cropOverlay.visible(true);
        stage.batchDraw();

        setPreviewUrl(dataURL);
    }, [layers]);

    useEffect(() => {
        updatePreviewImage();
    }, [layers, updatePreviewImage]);

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
                currentWidth={800}
                currentHeight={600}
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
                    onMouseUp: cropMouseUp,
                }}
                rectArea={rectArea}
                freePoints={freePoints}
                onEditText={handleEditText}
            />

            {editingText && (
                <TextEditor
                    node={editingText.node}
                    onSave={handleSaveText}
                    onCancel={handleCancelText}
                />
            )}

            <SidebarTools
                selectedTool={selectedTool}
                onToolChange={setSelectedTool}
                penColor={penColor}
                penWidth={penWidth}
                onPenColorChange={setPenColor}
                onPenWidthChange={setPenWidth}
                selectedLayerIds={selectedLayerIds}
                onFilterPreview={(filter, value) => previewFilter(filter, value, selectedLayerIds)}
                onFilterApply={(filter, value) => applyFilter(filter, value, selectedLayerIds)}
                onFilterCancel={cancelPreview}
                onStartCrop={handleStartCrop}
                isCropping={isCropping}
                cropShape={cropShape}
                onApplyCrop={applyCrop}
                onCancelCrop={cancelCrop}
                onAddText={handleAddText}
                onAddShape={handleAddShape}
            />

            <div style={{
                position: 'absolute',
                right: 20,
                top: 60,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
            }}>
                {previewUrl && <SidebarSummary imageUrl={previewUrl} layers={layers} />}
                <SidebarLayers
                    layers={layers}
                    selectedLayerIds={selectedLayerIds}
                    onSelectLayer={selectLayer}
                    onToggleVisibility={toggleVisibility}
                    onToggleLock={toggleLock}
                    onRemoveLayer={removeLayer}
                    onAddLayer={addCanvasLayer}
                    onReorderLayers={reorderLayers}
                />
            </div>
        </div>
    );
}