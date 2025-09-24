export type ClothingCategory = 
  | 'Top maniche corte'
  | 'Top maniche lunghe'
  | 'Maglia'
  | 'Felpa'
  | 'Giacca'
  | 'Pantalone'
  | 'Gonna';

export type InputSlot = 'front' | 'side' | 'back' | 'detail';

export type InputImages = {
  [key in InputSlot]?: string;
};

export type PromptCategory = 'FULL_BODY' | 'UPPER_BODY_TOP' | 'UPPER_BODY_JACKET' | 'LOWER_BODY';

export interface PromptDefinition {
  id: number;
  description: string;
  prompt: string;
  category: PromptCategory;
  requiredSlots: InputSlot[];
  getApplicableCategories: (confirmed: Set<ClothingCategory>) => ClothingCategory[];
}

export interface GeneratedImage {
  id: number;
  description: string;
  src: string;
}

export type AppState = 'initial' | 'analyzing' | 'confirming' | 'uploading' | 'generating' | 'results' | 'error';


export type OutfitStatus = 'configuring' | 'queued' | 'generating' | 'paused' | 'completed' | 'stopped' | 'error';

export interface CorrectivePrompt {
  index: number;
  prompt: string;
}

export interface Outfit {
  id: string;
  name: string;
  status: OutfitStatus;
  inputImages: InputImages;
  detectedCategories: Set<ClothingCategory>;
  confirmedCategories: Set<ClothingCategory>;
  generationQueue: PromptDefinition[];
  generatedImages: GeneratedImage[];
  currentGenerationIndex: number;
  correctivePrompts: CorrectivePrompt[];
  error: string | null;
}
