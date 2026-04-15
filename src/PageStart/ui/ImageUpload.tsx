import { useState, useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva';

export function ImageUploader() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const stageRef = useRef<Konva.Stage>(null)
  const imageRef = useRef<Konva.Image>(null)

  // Загрузка изображения из файла
  const loadImage = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        setImage(img)
      }
      img.src = e.target?.result as string 
    }
    reader.readAsDataURL(file)
  }

  // Обработка клика по области
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Игнорируем клик, если кликнули по уже загруженному изображению
    if (e.target === imageRef.current) return
    
    // Создаем скрытый input и имитируем клик
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            loadImage(file);
        }
    }
    input.click()
  }

  // Drag & Drop обработчики
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const stageSizeWidth = 900
  const stageSizeheight = 500
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#f0f0f0' 
    }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          border: `3px dashed ${isDragOver ? '#4CAF50' : '#ccc'}`,
          borderRadius: '10px',
          background: isDragOver ? '#e8f5e9' : 'white',
          transition: 'all 0.3s ease'
        }}>

        <Stage 
          ref={stageRef}
          width={stageSizeWidth} 
          height={stageSizeheight} 
          style={{ 
            background: '#fafafa', 
            borderRadius: '8px', 
            display: 'block',
            cursor: 'pointer' // Меняем курсор на указатель
          }}
          onClick={handleStageClick} // Обработчик клика
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={stageSizeWidth}
              height={stageSizeheight}
              fill={isDragOver ? '#e8f5e9' : '#fafafa'}
              stroke={isDragOver ? '#4CAF50' : '#ddd'}
              strokeWidth={2}
            />
            
            {/* Текст-подсказка */}
            {!image &&
              <Text
                text={'📸 Нажмите или перетащите изображение сюда'}
                fontSize={18}
                fontFamily="Arial"
                fill="#999"
                align="center"
                verticalAlign="middle"
                width={stageSizeWidth}
                height={stageSizeheight}
              />
            }

            {/* Отображаем изображение */}
            {image && <KonvaImage
                ref={imageRef}
                image={image}
                onClick={(e) => {
                  e.cancelBubble = true;
                }}
              />
            }
          </Layer>
        </Stage>
        
        {/* Кнопка для сброса изображения (опционально) */}
        {image && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 100
          }}>
            <button
              onClick={() => setImage(null)}
              style={{
                padding: '5px 10px',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕ Удалить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}