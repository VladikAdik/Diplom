import { SidebarLayers } from "./ui/SidebarLayers"
import { SidebarSummary } from "./ui/SidebarSummary"
import { SidebarTools } from "./ui/SidebarTools"
import { Header } from "./ui/Header/Header"
import { Workspace, type WorkspaceRef } from "./ui/Workspace/Workspace"
import { useState, useRef, useCallback, useEffect } from "react"
import { type Layer } from "./types/Layer"
import { useHistory } from './bll/useHistory';

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [layers, setLayers] = useState<Layer[]>([])
    const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
    const [selectedTool, setSelectedTool] = useState<string>('select');

    const workspaceRef = useRef<WorkspaceRef>(null)     // Ссылка на методы Workspace

    const { saveState, undo, redo, canUndo, canRedo} = useHistory();

    const handleStateChange = useCallback((newLayers: Layer[], newSelectedIds: Set<string>, isIntermediate: boolean = false) => {
        saveState(newLayers, newSelectedIds, isIntermediate);
    }, [saveState]);

    const syncLayers = useCallback(() => {
        setLayers(workspaceRef.current?.getLayers() || []);
    }, []);

    const handleUndo = useCallback(async () => {
        const state = await undo();
        if (state && workspaceRef.current) {
            workspaceRef.current.restoreState(state.layers, state.selectedLayerIds);
            syncLayers();
        }
    }, [undo, syncLayers]);

    const handleRedo = useCallback(async () => {
        const state = await redo();
        if (state && workspaceRef.current) {
            workspaceRef.current.restoreState(state.layers, state.selectedLayerIds);
            syncLayers();
        }
    }, [redo, syncLayers]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    // Загрузка изображения через меню
    const handleLoadImage = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file || !workspaceRef.current) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    workspaceRef.current?.addImage(img);
                    syncLayers();
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        };

        input.click();
    }, [syncLayers]);

    // Обработчики для панели слоёв
    const handleAddLayer = useCallback(() => {
        workspaceRef.current?.addLayer();
        syncLayers();
    }, [syncLayers]);

    // Показать/скрыть слой
    const handleToggleVisibility = useCallback((id: string) => {
        workspaceRef.current?.toggleVisibility(id);
        syncLayers();
    }, [syncLayers]);

    // Заблокировать/разблокировать слой
    const handleToggleLock = useCallback((id: string) => {
        workspaceRef.current?.toggleLock(id);
        syncLayers();
    }, [syncLayers]);

    // Удалить слой
    const handleRemoveLayer = useCallback((id: string) => {
        workspaceRef.current?.removeLayer(id);
        syncLayers();
    }, [syncLayers]);

    // Выбрать слой
    const handleSelectLayer = useCallback((id: string, multiSelect?: boolean) => {
        workspaceRef.current?.selectLayer(id, multiSelect);
    }, []);

    const handleSaveAsPNG = useCallback(() => {
        // TODO: реализовать экспорт PNG
        console.log("Сохранить PNG");
    }, []);

    const handleSaveAsJPG = useCallback(() => {
        // TODO: реализовать экспорт JPG
        console.log("Сохранить JPG");
    }, []);

    return <div>
        <Header
            onLoadImage={handleLoadImage}
            onSaveAsPNG={handleSaveAsPNG}
            onSaveAsJPG={handleSaveAsJPG}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
        />
        <Workspace
            ref={workspaceRef}
            image={image}
            onUpdate={setPreviewUrl}
            onLayersChange={setLayers}
            selectedTool={selectedTool}
            onSelectionChange={setSelectedLayerIds}
            onStateChange={handleStateChange}
        />
        <SidebarTools
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
        />
        <SidebarLayers
            layers={layers}
            selectedLayerIds={selectedLayerIds}
            onSelectLayer={handleSelectLayer}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onRemoveLayer={handleRemoveLayer}
            onAddLayer={handleAddLayer}
        />
        {previewUrl && <SidebarSummary imageUrl={previewUrl} />}
    </div>
}


