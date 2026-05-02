export type AspectRatio = '1:1' | '16:9' | '9:16';

export const ASPECT_RATIO_SIZES: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 512, height: 512 },
  '16:9': { width: 912, height: 512 },
  '9:16': { width: 512, height: 912 }
};

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  steps?: number;
  guidanceScale?: number;
}

export interface GenerationResult {
  imageUrl: string;
  provider: string;
  timestamp: number;
}