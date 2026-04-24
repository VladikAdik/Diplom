import { SidebarLayers } from "./ui/SidebarLayers"
import { SidebarSummary } from "./ui/SidebarSummary"
import { SidebarTools } from "./ui/SidebarTools"
import { Header } from "./ui/Header/Header"
import { Workspace } from "./ui/Workspace/Workspace"
import { useState, useCallback, useEffect } from "react"
import { useLayers } from './bll/useLayers'

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [selectedTool, setSelectedTool] = useState<string>('select');

    // Единый источник состояния
    const {
        layers,
        selectedLayerIds,
        selectLayer,
        clearSelection,
        selectAll,
        addImageLayer,
        addShapeLayer,
        addTextLayer,
        removeLayer,
        toggleVisibility,
        toggleLock,
        updateLayerPosition,
        updateMultipleLayers,
        saveCurrentState,  // ДОБАВЬ ЭТУ СТРОКУ
        undo,
        redo,
        canUndo,
        canRedo,
        clearAll,
        layerRefs
    } = useLayers();

    // Загружаем начальное изображение при монтировании
    useEffect(() => {
        if (image && layers.length === 0) {
            addImageLayer(image);
        }
    }, [image]); // Выполнится только при изменении image

    // Обработчики клавиатуры
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+A - выделить всё
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAll();
                return;
            }
            // Ctrl+Z / Ctrl+Y
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
                return;
            }
            // Delete - удалить выделенные слои
            if (e.key === 'Delete') {
                e.preventDefault();
                selectedLayerIds.forEach(id => removeLayer(id));
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectAll, selectedLayerIds, removeLayer]);

    // Загрузка изображения
    const handleLoadImage = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    addImageLayer(img);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        };

        input.click();
    }, [addImageLayer]);

    // Обработчики для панели слоёв
    const handleAddLayer = useCallback(() => {
        addShapeLayer('rect');
    }, [addShapeLayer]);

    // Обработчик перетаскивания слоя
    const handleLayerDragEnd = useCallback((id: string, x: number, y: number) => {
        updateLayerPosition(id, x, y, undefined, undefined, undefined, false);
    }, [updateLayerPosition]);

    // Обработчик трансформации
    const handleTransformEnd = useCallback((transforms: Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
    }>) => {
        console.log('🟠 PageRedactor: transform ended:', transforms);
        if (transforms.length > 1) {
            updateMultipleLayers(transforms, false);
        } else if (transforms.length === 1) {
            const { id, x, y, width, height, rotation } = transforms[0];
            console.log('🟠 PageRedactor: calling updateLayerPosition with:', { id, x, y, width, height, rotation });
            updateLayerPosition(id, x, y, width, height, rotation, false);
        }
    }, [updateLayerPosition, updateMultipleLayers]);

    const handleSaveAsPNG = useCallback(() => {
        console.log("Сохранить PNG");
    }, []);

    const handleSaveAsJPG = useCallback(() => {
        console.log("Сохранить JPG");
    }, []);

    const handleClearAll = useCallback(() => {
        clearAll();
    }, [clearAll]);

    return <div>
        <Header
            onLoadImage={handleLoadImage}
            onSaveAsPNG={handleSaveAsPNG}
            onSaveAsJPG={handleSaveAsJPG}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onClearAll={handleClearAll}
        />
        <Workspace
            layers={layers}
            selectedLayerIds={selectedLayerIds}
            image={image}
            onUpdate={setPreviewUrl}
            selectedTool={selectedTool}
            onSelectLayer={selectLayer}
            onClearSelection={clearSelection}
            onSelectAll={selectAll}
            onLayerDragEnd={handleLayerDragEnd}
            onTransformEnd={handleTransformEnd}
            onSaveStateBeforeTransform={() => {
                console.log('🟠 PageRedactor: saving state before transform');
                saveCurrentState(false);
            }}
            layerRefs={layerRefs}
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
            onAddLayer={handleAddLayer}
        />
        {previewUrl && <SidebarSummary imageUrl={previewUrl} />}
    </div>
}