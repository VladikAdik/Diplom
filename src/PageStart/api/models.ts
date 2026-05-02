export type ModelId = 'local-sd' | 'local-lumina' | 'cloud-sd3';

interface ModelConfig {
  url: string;
  type: 'local' | 'cloud';
  name: string;
  requiresApiKey: boolean;
}

export const API_MODELS: Record<ModelId, ModelConfig> = {
  'local-sd': {
    url: 'https://diplom-backend-sd.cloudpub.ru',
    type: 'local',
    name: 'Stable Diffusion 1.5',
    requiresApiKey: false
  },
  'local-lumina': {
    url: 'https://diplom-backend-lum.cloudpub.ru',
    type: 'local',
    name: 'Lumina',
    requiresApiKey: false
  },
  'cloud-sd3': {
    url: 'https://api.stability.ai/v2beta/stable-image/generate/sd3',
    type: 'cloud',
    name: 'Stable Diffusion 3.5',
    requiresApiKey: true
  }
};