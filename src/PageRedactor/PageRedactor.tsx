import { SidebarLayers } from "./ui/SidebarLayers";
import { SidebarSummary } from "./ui/SidebarSummary";
import { SidebarTools } from "./ui/SidebarTools";
import { Header } from "./ui/Header/Header"
import { Workspace, type WorkspaceRef  } from "./ui/Workspace";
import { useState, useRef, useEffect } from "react";
import { imageUploadService } from "./bll/FuncImageUpload";

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const workspaceRef = useRef<WorkspaceRef>(null);

    useEffect(() => {
        imageUploadService.setCallback((loadedImage: HTMLImageElement) => {
            // Тут логика добавления изображения на сцену
            if (workspaceRef.current) {
                workspaceRef.current.addImage(loadedImage);
            }
        });
    }, []);

    const handleLoadImage = () => {
        imageUploadService.openDialog();
    };

    const handleSaveAsPNG = () => {
        // TODO: реализовать
        console.log('Сохранить PNG');
    };

    const handleSaveAsJPG = () => {
        // TODO: реализовать
        console.log('Сохранить JPG');
    };

    return <div>
        <Header 
            onLoadImage={handleLoadImage}
            onSaveAsPNG={handleSaveAsPNG}
            onSaveAsJPG={handleSaveAsJPG}
        />
        <Workspace
            
            image={image}
            onUpdate={setPreviewUrl}
        />
        <SidebarTools/>
        <SidebarLayers/>
        {previewUrl && <SidebarSummary imageUrl={previewUrl}/>}
    </div>
}


