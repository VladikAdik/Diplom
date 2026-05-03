import { useMemo, useRef, useState, useEffect } from 'react';
import type { Layer } from '../../types/Layer';
import { getContentBounds } from '../../utils/getContentBounds';
import styles from './SidebarSummary.module.css';

interface SidebarSummaryProps {
    imageUrl: string;
    layers: Layer[];
}

export function SidebarSummary({ imageUrl, layers }: SidebarSummaryProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgRect, setImgRect] = useState<{ width: number; height: number; left: number; top: number } | null>(null);

    const contentSize = useMemo(() => {
        const bounds = getContentBounds(layers);
        if (!bounds) return null;
        return {
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
        };
    }, [layers]);

    // Вычисляем реальные размеры и положение изображения внутри контейнера
    useEffect(() => {
        const img = imgRef.current;
        if (!img || !img.complete) return;
        
        const updateRect = () => {
            const container = img.parentElement;
            if (!container) return;
            
            const containerW = container.clientWidth;
            const containerH = container.clientHeight;
            const naturalW = img.naturalWidth;
            const naturalH = img.naturalHeight;
            
            if (!naturalW || !naturalH) return;
            
            const scale = Math.min(containerW / naturalW, containerH / naturalH);
            const displayW = naturalW * scale;
            const displayH = naturalH * scale;
            
            setImgRect({
                width: displayW,
                height: displayH,
                left: (containerW - displayW) / 2,
                top: (containerH - displayH) / 2,
            });
        };
        
        updateRect();
    }, [imageUrl]);

    

    if (!imageUrl) return null;

    // Вычисляем положение рамки относительно контейнера
    const borderStyle: React.CSSProperties = {};
    if (imgRect && contentSize) {
        const scaleX = imgRect.width / contentSize.width;
        const scaleY = imgRect.height / contentSize.height;
        const scale = Math.min(scaleX, scaleY);
        
        const borderW = contentSize.width * scale;
        const borderH = contentSize.height * scale;
        
        borderStyle.left = imgRect.left + (imgRect.width - borderW) / 2;
        borderStyle.top = imgRect.top + (imgRect.height - borderH) / 2;
        borderStyle.width = borderW;
        borderStyle.height = borderH;
    }

    return (
        <div className={styles.panel}>
            <img ref={imgRef} src={imageUrl} alt="Превью" className={styles.image} />
            {contentSize && imgRect && (
                <div className={styles.contentBorder} style={borderStyle} />
            )}
            {contentSize && (
                <div className={styles.size}>
                    {contentSize.width} × {contentSize.height} px
                </div>
            )}
        </div>
    );
}