import type { GarmentCategory, JobStatus, OutfitStatus } from '@prisma/client';
import type { AngleValue } from '@/lib/angles';

export type UploadTag = 'manichino' | 'appeso' | 'unknown';

export type UploadedImage = {
  id: string;
  originalName: string;
  mimeType: string;
  order: number;
  capturedAt?: string;
  tag: UploadTag;
  exif?: Record<string, unknown>;
};

export type OutfitBlockImage = {
  uploadId: string;
  angle?: AngleValue | string;
  role?: 'front' | 'side' | 'back' | 'detail';
  url?: string;
  originalName?: string;
};

export type OutfitBlock = {
  id: string;
  type: 'outfit' | 'variant';
  order: number;
  images: OutfitBlockImage[];
  garments: GarmentSummary[];
  variants?: VariantSummary[];
};

export type GarmentSummary = {
  id: string;
  category: Lowercase<GarmentCategory>;
  articleCode: string;
  variantHex?: string;
  variantUploadId?: string;
};

export type VariantSummary = {
  id: string;
  garmentId?: string;
  uploadId: string;
  url?: string;
  hexColor?: string;
};

export type GenerationTarget = {
  id: string;
  garmentId?: string;
  variantId?: string;
  angle: AngleValue | string;
  view: 'full body' | 'upper body' | 'lower body' | 'detail';
  promptId: string;
  description: string;
  requiredSlots: string[];
};

export type JobState = {
  id: string;
  outfitId: string;
  status: JobStatus;
  stopRequested: boolean;
  progress: {
    completed: number;
    total: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type OutfitState = {
  id: string;
  name: string;
  status: OutfitStatus;
  blocks: OutfitBlock[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type GenerationResult = {
  id: string;
  jobId: string;
  garmentId?: string;
  variantId?: string;
  angle: string;
  view: string;
  filePath: string;
  url: string;
  createdAt: string;
};
