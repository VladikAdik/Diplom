import { SidebarLayers } from "./ui/SidebarLayers";
import { SidebarSummary } from "./ui/SidebarSummary";
import { SidebarTools } from "./ui/SidebarTools";
import { Header } from "./ui/Header"
import { Workspace } from "./ui/Workspace";
import { useState } from "react";

interface PageRedactorProps {
    image: HTMLImageElement | null;
}

export function PageRedactor({ image }: PageRedactorProps) {
    const [previewUrl, setPreviewUrl] = useState<string>('');

    return <div>
        <Header/>
        <Workspace 
            image={image}
            onUpdate={setPreviewUrl}
        />
        <SidebarTools/>
        <SidebarLayers/>
        {previewUrl && <SidebarSummary imageUrl={previewUrl}/>}
    </div>
}


