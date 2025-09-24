import React, { useState, useCallback, useEffect } from 'react';
import type { Outfit } from './types';
import OutfitManager from './components/OutfitManager';
import OutfitWorkspace from './components/OutfitWorkspace';
import { generateFashionImage } from './services/geminiService';
import { NEGATIVE_PROMPT } from './constants';

const App: React.FC = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [activeOutfitId, setActiveOutfitId] = useState<string | null>(null);

  const createNewOutfit = useCallback(() => {
    const newOutfit: Outfit = {
      id: `outfit-${Date.now()}`,
      name: `Outfit #${outfits.length + 1}`,
      status: 'configuring',
      inputImages: {},
      detectedCategories: new Set(),
      confirmedCategories: new Set(),
      generationQueue: [],
      generatedImages: [],
      currentGenerationIndex: 0,
      correctivePrompts: [],
      error: null,
    };
    setOutfits(prev => [...prev, newOutfit]);
    setActiveOutfitId(newOutfit.id);
  }, [outfits.length]);

  const updateOutfit = useCallback((outfitId: string, updates: Partial<Outfit>) => {
    setOutfits(prev =>
      prev.map(o => (o.id === outfitId ? { ...o, ...updates } : o))
    );
  }, []);
  
  const activeOutfit = outfits.find(o => o.id === activeOutfitId);

  const runGeneration = useCallback(async (outfit: Outfit) => {
    if (outfit.status !== 'generating' || !outfit.generationQueue.length) return;

    const { id, generationQueue, currentGenerationIndex, correctivePrompts, inputImages } = outfit;

    if (currentGenerationIndex >= generationQueue.length) {
      updateOutfit(id, { status: 'completed' });
      return;
    }

    const promptDef = generationQueue[currentGenerationIndex];
    const corrective = correctivePrompts.find(cp => cp.index === currentGenerationIndex)?.prompt;

    const requiredImages = promptDef.requiredSlots
      .map(slot => ({ slot, data: inputImages[slot] }))
      .filter(img => img.data);
      
    if (requiredImages.length !== promptDef.requiredSlots.length) {
      console.warn(`Skipping prompt ${promptDef.id} due to missing images.`);
      updateOutfit(id, { currentGenerationIndex: currentGenerationIndex + 1 });
      return;
    }

    try {
      const imageData = await generateFashionImage(
        promptDef.prompt,
        NEGATIVE_PROMPT,
        requiredImages.map(img => ({ data: img.data!, mimeType: 'image/jpeg' })),
        corrective
      );

      const newImage = {
        id: promptDef.id,
        description: promptDef.description,
        src: `data:image/png;base64,${imageData}`,
      };

      updateOutfit(id, {
        generatedImages: [...outfit.generatedImages, newImage],
        currentGenerationIndex: currentGenerationIndex + 1,
      });

    } catch (err) {
      console.error(`Failed to generate image for prompt ${promptDef.id}:`, err);
      updateOutfit(id, { status: 'error', error: `Failed on prompt ${promptDef.id}.` });
    }
  }, [updateOutfit]);

  useEffect(() => {
    const currentlyGenerating = outfits.find(o => o.status === 'generating');
    if (currentlyGenerating) {
      runGeneration(currentlyGenerating);
    } else {
      const nextInQueue = outfits.find(o => o.status === 'queued');
      if (nextInQueue) {
        updateOutfit(nextInQueue.id, { status: 'generating' });
      }
    }
  }, [outfits, runGeneration, updateOutfit]);
  
  useEffect(() => {
    if (outfits.length === 0) {
      createNewOutfit();
    }
  }, [outfits.length, createNewOutfit]);


  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 flex flex-col md:flex-row">
      <OutfitManager
        outfits={outfits}
        activeOutfitId={activeOutfitId}
        onSelectOutfit={setActiveOutfitId}
        onNewOutfit={createNewOutfit}
      />
      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-center overflow-y-auto">
        {activeOutfit ? (
          <OutfitWorkspace
            key={activeOutfit.id}
            outfit={activeOutfit}
            updateOutfit={(updates) => updateOutfit(activeOutfit.id, updates)}
          />
        ) : (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">AI Fashion Studio</h1>
            <p className="text-slate-400 mt-2">Create or select an outfit to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
