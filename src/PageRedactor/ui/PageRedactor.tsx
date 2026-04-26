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
    const { stageSize, fitToContent, setCustomSize, getStageCenter } = useStageSize();

    const {
        layers,
        selectedLayerIds,
        layerRefs,
        addImageLayer,
        addShapeLayer,
        removeLayer,
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
    } = useLayers(stageSize);

    useEffect(() => {
        if (image) {
            fitToContent(image.width, image.height);
            addImageLayer(image, 0, 0);
        }
    }, [image, addImageLayer, fitToContent]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                selectAll();
                return;
            }
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
            if (e.key === 'Delete') {
                e.preventDefault();
                selectedLayerIds.forEach(id => removeLayer(id));
                return;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, selectAll, selectedLayerIds, removeLayer]);

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
                    const x = center.x - img.width / 2;
                    const y = center.y - img.height / 2;
                    addImageLayer(img, x, y);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }, [addImageLayer, getStageCenter]);

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

    return (
        <div>
            <Header
                onLoadImage={handleLoadImage}
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
        </div>
    );
}