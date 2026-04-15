import { ImageGenerator } from "./ui/ImageGenerate";
import { ImageUploader } from "./ui/ImageUpload";
import { PanelDisclamer } from "./ui/PanelDisclamer";

export function Start() {
  return <div>
    <PanelDisclamer />
    <ImageUploader />
    <ImageGenerator />
  </div>
}
