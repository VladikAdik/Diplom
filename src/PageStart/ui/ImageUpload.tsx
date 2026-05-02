import { useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect } from 'react-konva';
import styles from './ImageUpload.module.css';

interface ImageUploaderProps {
  onImageLoad: (image: HTMLImageElement) => void;
}

export function ImageUploader({ onImageLoad }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);

  const loadImage = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        onImageLoad(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        loadImage(file);
      }
    };
    input.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const stageWidth = 600;
  const stageHeight = 200;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.overlay}>
          <div className={styles.icon}>
            {isDragOver ? '🎨' : '📸'}
          </div>
          <h3 className={styles.title}>
            {isDragOver ? 'Отпустите, чтобы загрузить' : 'Загрузите изображение'}
          </h3>
          <p className={styles.subtitle}>
            Нажмите или перетащите файл • PNG, JPG, WebP
          </p>
        </div>

        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          className={styles.stage}
          onClick={handleStageClick}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageWidth}
              height={stageHeight}
              fill="transparent"
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}