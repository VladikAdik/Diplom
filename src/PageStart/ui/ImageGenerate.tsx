import { useState } from 'react';
import axios from 'axios';
import FormData from "form-data";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ratio, setRatio] = useState('1:1')
  const apiSD = "http://localhost:80";
  const apiLum = "http://localhost:8000";
  const apiSd3 = "https://api.stability.ai/v2beta/stable-image/generate/sd3";
  let height: number;
  let width: number;
  const [modelUrl, setModel] = useState(apiSD);
  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setPrompt(event.target.value);
    setError(''); // Очищаем ошибку при вводе
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Пожалуйста, введите промпт');
      return;
    }
    switch (ratio) {
    case '1:1':
      height = 512;
      width = 512;
      break;
    case '16:9':
      height = 512;
      width = 912;
      break;
    case '9:16':  
      height = 912;
      width = 512;
      break;
  }
    setIsLoading(true);
    setError('');
    try {
      const requestData = {
        prompt: prompt, // Текстовое описание
        "negative_prompt": "",
        "height": height,
        "width": width,
        "steps": 20,
        "guidance_scale": 7.5              // Количество изображений для генерации
      };
      const response = await fetch(modelUrl + "/generate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      const imUrl = modelUrl + data.url;
      setGeneratedImage(imUrl); // предполагаем, что сервер возвращает URL изображения
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка при генерации:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCloud = async () => {
    if (!prompt.trim()) {
      setError('Пожалуйста, введите промпт');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const requestData = {
        prompt: prompt, // Текстовое описание
        "negative_prompt": "",
        "aspect_ratio": ratio,
        "model": "sd3.5-flash"         
      };
      const response = await axios.postForm(modelUrl, axios.toFormData(requestData, new FormData()),{
        headers: { 
        Authorization: `Bearer sk-m1NS0X6wv8yGnWJv2WXiVCVVcAsF0YFS8mifJtmJb9le0oYp`, //sk-nwCTKQpjrSM08sob4ykrsMCIZypJlWHAJxdaad14nk2u9vJj sk-m1NS0X6wv8yGnWJv2WXiVCVVcAsF0YFS8mifJtmJb9le0oYp
        Accept: "application/json" 
        },
      }
      );
      const imageBase64 = response.data.image;
      setGeneratedImage(imageBase64); // предполагаем, что сервер возвращает URL изображения
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка при генерации:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Отправка по Ctrl+Enter или Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      modelUrl === apiSd3 ? handleGenerateCloud : handleGenerate;
    }
  };
const models = [
  { value: apiSD, label: 'Stable-diffusion-1.5' },
  { value: apiLum, label: 'Lumina' },
  { value: apiSd3, label: 'Stable-diffusion-3.5'},
];
const aspect = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16'},
];
  return (
    <div>
      <div>
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          onKeyPress={handleKeyPress}
          placeholder="Введите описание изображения... Например: 'Кот в космосе в стиле киберпанк'"
          rows={4}
          disabled={isLoading}
        />
        
        <button 
          onClick={modelUrl === apiSd3 ? handleGenerateCloud : handleGenerate}
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? 'Генерация...' : 'Сгенерировать'}
        </button>
      </div>

      {error && (
        <div>
          ❌ {error}
        </div>
      )}
      <select value={modelUrl} onChange={(e) => setModel(e.target.value)}>
        {models.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
        {aspect.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {generatedImage && (
        <div>
          <h3>Результат генерации:</h3>
          <img 
            src={generatedImage} 
            alt="Сгенерированное изображение"
          />
        </div>
      )}
    </div>
  );
};