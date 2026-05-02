import axios from 'axios';
import { type GenerationParams, type GenerationResult, ASPECT_RATIO_SIZES } from './types';
import { API_MODELS, type ModelId } from './models';

export class ImageGenerationService {
  private abortController: AbortController | null = null;
  private customApiKeys: Map<ModelId, string> = new Map();

  setApiKey(modelId: ModelId, apiKey: string): void {
    this.customApiKeys.set(modelId, apiKey);
  }

  getApiKey(modelId: ModelId): string | undefined {
    return this.customApiKeys.get(modelId);
  }

  async generate(
    params: GenerationParams,
    modelId: ModelId
  ): Promise<GenerationResult> {
    this.abortController?.abort();
    this.abortController = new AbortController();

    const model = API_MODELS[modelId];
    const { width, height } = ASPECT_RATIO_SIZES[params.aspectRatio];

    const fullParams = {
      ...params,
      width,
      height
    };

    try {
      if (model.type === 'local') {
        return await this.generateLocal(model.url, fullParams);
      } else {
        const apiKey = this.customApiKeys.get(modelId);
        if (!apiKey) {
          throw new Error('API ключ не указан');
        }
        return await this.generateCloud(model.url, fullParams, apiKey);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Генерация отменена');
      }
      throw error;
    }
  }

  cancelGeneration(): void {
    this.abortController?.abort();
  }

  private async generateLocal(
    url: string,
    params: GenerationParams & { width: number; height: number }
  ): Promise<GenerationResult> {
    const response = await fetch(`${url}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || '',
        height: params.height,
        width: params.width,
        steps: params.steps || 20,
        guidance_scale: params.guidanceScale || 7.5
      }),
      signal: this.abortController!.signal
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();
    return {
      imageUrl: url + data.url,
      provider: url,
      timestamp: Date.now()
    };
  }

  private async generateCloud(
    url: string,
    params: GenerationParams,
    apiKey: string
  ): Promise<GenerationResult> {
    const formData = new FormData();
    formData.append('prompt', params.prompt);
    formData.append('negative_prompt', params.negativePrompt || '');
    formData.append('aspect_ratio', params.aspectRatio);
    formData.append('model', 'sd3.5-flash');

    const response = await axios.postForm(url, formData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      },
      signal: this.abortController!.signal
    });

    return {
      imageUrl: response.data.image,
      provider: url,
      timestamp: Date.now()
    };
  }
}