// Простая загрузка изображения
export async function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject('Это не изображение');
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject('Ошибка загрузки');
            img.src = e.target?.result as string;
        };
        
        reader.onerror = () => reject('Ошибка чтения файла');
        reader.readAsDataURL(file);
    });
}

// Открыть диалог выбора файла
export function selectImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const img = await loadImage(file);
                    resolve(img);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject('Файл не выбран');
            }
        };
        
        input.click();
    });
}
