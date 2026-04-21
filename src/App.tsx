import { PageStart } from "./PageStart/PageStart";
import { PageRedactor } from "./PageRedactor/PageRedactor";
import { useState } from "react";

export function App() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [currentPage, setCurrentPage] = useState(1)

  const handleImageLoad = (img: HTMLImageElement) => {
        setImage(img)
        setCurrentPage(2)
  }
  
  return <div>
      {currentPage === 1 && <PageStart onImageLoad={handleImageLoad}/>}
      {currentPage === 2 && <PageRedactor image={image}/>}
    </div>
}