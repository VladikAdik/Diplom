import { ImageGenerator } from "./ui/ImageGenerate";
import { ImageUploader } from "./ui/ImageUpload";
import { PanelDisclamer } from "./ui/PanelDisclamer";

interface PageStartProps {
    onImageLoad: (image: HTMLImageElement) => void;
}

export function PageStart({ onImageLoad }: PageStartProps) {

  return <div>
    <PanelDisclamer />
    <ImageUploader onImageLoad={onImageLoad}/>
    <ImageGenerator />
  </div>
}