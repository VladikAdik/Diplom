type ImageLoadCallback = (image: HTMLImageElement) => void;

class ImageUploadService {
    private onImageLoadCallback: ImageLoadCallback | null = null;

    // Установить обработчик загрузки
    setCallback(callback: ImageLoadCallback) {
        this.onImageLoadCallback = callback;
    }

    // Открыть диалог выбора файла
    openDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && this.onImageLoadCallback) {
                const img = await this.loadImage(file);
                this.onImageLoadCallback(img);
            }
        };
        
        input.click();
    }

    // Загрузить изображение из файла
    private loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject('Не изображение');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject('Ошибка');
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    }

    // Загрузить из URL
    async loadFromUrl(url: string) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        return new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => {
                this.onImageLoadCallback?.(img);
                resolve(img);
            };
            img.onerror = () => reject('Ошибка загрузки URL');
            img.src = url;
        });
    }
}

export const imageUploadService = new ImageUploadService();