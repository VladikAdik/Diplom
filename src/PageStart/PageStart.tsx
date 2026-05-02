import { ImageGenerator } from "./ui/ImageGenerate";
import { ImageUploader } from "./ui/ImageUpload";
import { PanelDisclamer } from "./ui/PanelDisclamer";
import { GeneratorDisclamer } from "./ui/GeneratorDisclaimer";

interface PageStartProps {
    onImageLoad: (image: HTMLImageElement) => void;
}

export function PageStart({ onImageLoad }: PageStartProps) {

    return <div>
        <PanelDisclamer />
        <ImageUploader onImageLoad={onImageLoad} />
        <GeneratorDisclamer />
        <ImageGenerator onImageLoad={onImageLoad}/>
    </div>
}