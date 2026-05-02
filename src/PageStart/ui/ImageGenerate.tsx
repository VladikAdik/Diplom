import { useState, useEffect } from 'react';
import { ImageGenerationService } from '../api/generateService';
import { ASPECT_RATIO_SIZES, type AspectRatio } from '../api/types';
import { API_MODELS, type ModelId } from '../api/models';
import styles from './ImageGenerate.module.css';

interface ImageGeneratorProps {
    onImageLoad: (image: HTMLImageElement) => void;
}

const generationService = new ImageGenerationService();

export function ImageGenerator({ onImageLoad }: ImageGeneratorProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [ratio, setRatio] = useState<AspectRatio>('1:1');
    const [modelId, setModelId] = useState<ModelId>('local-sd');
    const [showApiKeyInput, setShowApiKeyInput] = useState(false);
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const model = API_MODELS[modelId];
        if (model.requiresApiKey) {
            const existingKey = generationService.getApiKey(modelId);
            if (existingKey) {
                setApiKey(existingKey);
                setShowApiKeyInput(false);
            } else {
                setApiKey('');
                setShowApiKeyInput(true);
            }
        } else {
            setShowApiKeyInput(false);
        }
    }, [modelId]);

    const handleModelChange = (newModelId: ModelId) => {
        setModelId(newModelId);
        setGeneratedImage(null);
    };

    const handleApiKeySubmit = () => {
        if (apiKey.trim()) {
            generationService.setApiKey(modelId, apiKey.trim());
            setShowApiKeyInput(false);
        }
    };

    const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setPrompt(event.target.value);
        setError('');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Пожалуйста, введите промпт');
            return;
        }

        const model = API_MODELS[modelId];
        if (model.requiresApiKey && !generationService.getApiKey(modelId)) {
            setShowApiKeyInput(true);
            setError('Необходимо указать API ключ');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await generationService.generate(
                {
                    prompt: prompt,
                    negativePrompt: '',
                    aspectRatio: ratio,
                    steps: 20,
                    guidanceScale: 7.5
                },
                modelId
            );

            setGeneratedImage(result.imageUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
            setError(errorMessage);
            console.error('Ошибка при генерации:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        generationService.cancelGeneration();
        setIsLoading(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            handleGenerate();
        }
    };

    const handleImageClick = () => {
        if (generatedImage) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => onImageLoad(img);
            img.onerror = () => {
                // Если CORS не поддерживается сервером — пробуем без него
                const fallbackImg = new window.Image();
                fallbackImg.onload = () => onImageLoad(fallbackImg);
                fallbackImg.src = generatedImage;
            };
            img.src = generatedImage;
        }
    };

    const handleSaveImage = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generated-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (showApiKeyInput) {
        return (
            <div className={styles.apiKeyOverlay}>
                <div className={styles.apiKeyModal}>
                    <h3 className={styles.apiKeyTitle}>API ключ</h3>
                    <p className={styles.apiKeySubtitle}>
                        Для использования {API_MODELS[modelId].name} необходим API ключ.
                        Вы можете пропустить этот шаг и вернуться позже.
                    </p>
                    <input
                        type="password"
                        className={styles.apiKeyInput}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Введите API ключ"
                        onKeyDown={(e) => e.key === 'Enter' && handleApiKeySubmit()}
                        autoFocus
                    />
                    <div className={styles.apiKeyButtons}>
                        <button className={styles.saveBtn} onClick={handleApiKeySubmit}>
                            Сохранить
                        </button>
                        <button className={styles.skipBtn} onClick={() => setShowApiKeyInput(false)}>
                            Пропустить
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.promptSection}>
                <textarea
                    className={styles.textarea}
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Введите описание изображения... Например: 'Кот в космосе в стиле киберпанк'"
                    rows={4}
                    disabled={isLoading}
                />

                <div className={styles.buttonRow}>
                    <button className={styles.generateBtn} onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                        {isLoading ? 'Генерация...' : 'Сгенерировать'}
                    </button>

                    {isLoading && (
                        <button className={styles.cancelBtn} onClick={handleCancel}>
                            Отменить
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className={styles.errorBox}>
                    ❌ {error}
                </div>
            )}

            <div className={styles.settingsRow}>
                <select className={styles.select} value={modelId} onChange={(e) => handleModelChange(e.target.value as ModelId)}>
                    {Object.entries(API_MODELS).map(([id, config]) => (
                        <option key={id} value={id}>
                            {config.name}
                        </option>
                    ))}
                </select>

                <select className={styles.select} value={ratio} onChange={(e) => setRatio(e.target.value as AspectRatio)}>
                    {Object.keys(ASPECT_RATIO_SIZES).map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            {generatedImage && (
                <div className={styles.resultSection}>
                    <h3 className={styles.resultTitle}>Результат генерации</h3>
                    <img
                        className={styles.resultImage}
                        src={generatedImage}
                        alt="Сгенерированное изображение"
                        onClick={handleImageClick}
                    />
                    <div className={styles.resultActions}>
                        <button className={styles.saveBtn} onClick={handleSaveImage}>
                            💾 Сохранить
                        </button>
                        <button className={styles.editBtn} onClick={handleImageClick}>
                            ✏️ Редактировать
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}