export const imageToDataURL = (img: HTMLImageElement): string => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
    const dataURL = canvas.toDataURL();
    canvas.remove(); // ← Очистка
    return dataURL;
};

export const dataURLToImage = (dataURL: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataURL;
    });
};