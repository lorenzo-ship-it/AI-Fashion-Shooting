'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { UploadGrid } from '@/components/UploadGrid';
import { BlockEditor, type EditableBlock } from '@/components/BlockEditor';
import { CategoryMapper } from '@/components/CategoryMapper';
import { VariantMapper } from '@/components/VariantMapper';
import { GeneratorConsole } from '@/components/GeneratorConsole';
import { AIChat } from '@/components/AIChat';
import { Gallery } from '@/components/Gallery';
import { BulkDownload } from '@/components/BulkDownload';
import type {
  UploadedImage,
  JobState,
  GenerationResult,
  ChatMessage,
  OutfitBlock,
  VariantSummary,
} from '@/types';

const uploadUrl = (path: string) => `/api/files?scope=upload&path=${encodeURIComponent(path)}`;

export default function Page() {
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [outfitId, setOutfitId] = useState<string | null>(null);
  const [job, setJob] = useState<JobState | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GenerationResult[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingOutfit, setLoadingOutfit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshJob = useCallback(async (id: string) => {
    const response = await fetch(`/api/job/${id}`);
    if (!response.ok) return;
    const data = await response.json();
    const jobData = data.job as JobState & { generations: GenerationResult[] };
    setJob(jobData);
    setGeneratedImages(jobData.generations);
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const tick = async () => {
      await refreshJob(jobId);
    };
    void tick();
    const interval = setInterval(() => {
      if (!cancelled) {
        void tick();
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId, refreshJob]);

  const refreshOutfit = useCallback(async (id: string) => {
    setLoadingOutfit(true);
    try {
      const res = await fetch(`/api/outfit/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const outfit = data.outfit;
      const mapped = outfit.blocks.map((block: any) => {
        const type: OutfitBlock['type'] = block.type === 'OUTFIT' ? 'outfit' : 'variant';
        const images = block.images.map((image: any) => ({
          uploadId: image.uploadId,
          angle: image.angle ?? undefined,
          role: image.role ?? undefined,
          url: uploadUrl(image.upload.storedPath),
          originalName: image.upload.originalName,
        }));
        const garments = block.garments.map((garment: any) => ({
          id: garment.id,
          category: garment.category.toLowerCase(),
          articleCode: garment.articleCode,
          variantHex: garment.variants[0]?.hexColor ?? undefined,
          variantUploadId: garment.variants[0]?.uploadId ?? undefined,
        }));
        const variants: VariantSummary[] = (block.variants ?? []).map((variant: any) => ({
          id: variant.id,
          garmentId: variant.garmentId,
          uploadId: variant.uploadId,
          url: uploadUrl(variant.upload.storedPath),
          hexColor: variant.hexColor ?? undefined,
        }));
        return {
          id: block.id,
          type,
          order: block.order,
          images,
          garments,
          variants,
        } satisfies EditableBlock;
      });
      setBlocks(mapped.sort((a: EditableBlock, b: EditableBlock) => a.order - b.order));
    } finally {
      setLoadingOutfit(false);
    }
  }, []);

  const handleUpload = useCallback(async (files: File[]) => {
    setUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadPayload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (uploadPayload as { error?: string } | null)?.error ?? 'Errore durante il caricamento delle immagini';
        throw new Error(message);
      }
      const uploadsData = (uploadPayload as { uploads?: UploadedImage[] } | null)?.uploads ?? [];
      if (!uploadsData.length) {
        throw new Error('Il server non ha restituito gli ID delle immagini caricate');
      }
      setUploads((prev) => [...prev, ...uploadsData]);
      const analyze = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadIds: uploadsData.map((u: UploadedImage) => u.id) }),
      });
      const analyzePayload = await analyze.json().catch(() => null);
      if (!analyze.ok) {
        const message =
          (analyzePayload as { error?: string } | null)?.error ?? 'Analisi delle immagini non riuscita';
        throw new Error(message);
      }
      if (!analyzePayload || typeof analyzePayload !== 'object' || !('outfitId' in analyzePayload)) {
        throw new Error('Risposta analisi non valida');
      }
      const analyzeData = analyzePayload as { outfitId: string };
      setOutfitId(analyzeData.outfitId);
      await refreshOutfit(analyzeData.outfitId);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Si è verificato un errore imprevisto');
    } finally {
      setUploading(false);
    }
  }, [refreshOutfit]);

  const handleBlocksChange = useCallback((updated: EditableBlock[]) => {
    setBlocks(updated.map((block, index) => ({ ...block, order: index })));
  }, []);

  const handleGarmentsChange = useCallback((updated: EditableBlock[]) => {
    setBlocks((prev) =>
      prev.map((block) => {
        const match = updated.find((candidate) => candidate.id === block.id);
        return match ? { ...block, garments: match.garments } : block;
      })
    );
  }, []);

  const handleVariantsChange = useCallback((variantBlocks: Array<{ id: string; order: number; variants: VariantSummary[] }>) => {
    setBlocks((prev) =>
      prev.map((block) => {
        const match = variantBlocks.find((candidate) => candidate.id === block.id);
        return match ? { ...block, variants: match.variants } : block;
      })
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!outfitId) return;
    const payload = {
      outfitId,
      blocks: blocks.map((block) => ({
        id: block.id,
        type: block.type,
        order: block.order,
        images: block.images.map((image) => ({
          uploadId: image.uploadId,
          angle: image.angle ?? null,
          role: image.role ?? null,
        })),
        garments: block.type === 'outfit'
          ? block.garments.map((garment) => ({
              id: garment.id,
              category: garment.category,
              articleCode: garment.articleCode,
            }))
          : undefined,
        variants: block.type === 'variant'
          ? block.variants?.filter((variant) => variant.garmentId).map((variant) => ({
              id: variant.id,
              garmentId: variant.garmentId!,
              uploadId: variant.uploadId,
              hexColor: variant.hexColor,
            }))
          : undefined,
      })),
    };
    await fetch('/api/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await refreshOutfit(outfitId);
  }, [blocks, outfitId, refreshOutfit]);

  const handleGenerate = useCallback(async (hint?: string) => {
    if (!outfitId) return;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitId, hints: hint ? [hint] : undefined }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setJobId(data.jobId);
    setGeneratedImages([]);
  }, [outfitId]);

  const handleStop = useCallback(async () => {
    if (!jobId) return;
    await fetch('/api/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    await refreshJob(jobId);
  }, [jobId, refreshJob]);

  const handleResume = useCallback(async () => {
    if (!jobId) return;
    await fetch('/api/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    await refreshJob(jobId);
  }, [jobId, refreshJob]);

  const handleChatSend = useCallback(async (message: string) => {
    if (!jobId) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, message, role: 'user' }),
    });
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: message, createdAt: new Date().toISOString() },
    ]);
  }, [jobId]);

  const handleDownload = useCallback(async (scope: 'outfit' | 'garment', options?: { garmentId?: string }) => {
    if (!outfitId) return;
    const params = new URLSearchParams({ outfitId });
    if (scope === 'garment' && options?.garmentId) {
      params.append('garmentId', options.garmentId);
    }
    const response = await fetch(`/api/download/${scope}?${params.toString()}`);
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scope}-${options?.garmentId ?? outfitId}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }, [outfitId]);

  const garments = useMemo(() => blocks.flatMap((block) => block.garments), [blocks]);
  const outfitBlocks = useMemo(() => blocks.filter((block) => block.type === 'outfit'), [blocks]);
  const variantBlocks = useMemo(() => blocks.filter((block) => block.type === 'variant'), [blocks]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">AI Fashion Shooting Studio</h1>
        <p className="text-slate-400 text-sm">
          Pipeline end-to-end per generare shooting coerenti da foto di manichino e capi appesi con Gemini 2.5 Flash Image.
        </p>
      </header>

      <UploadGrid uploads={uploads} onUpload={handleUpload} uploading={uploading} />

      {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}

      {loadingOutfit && <p className="text-sm text-slate-400">Analisi outfit in corso…</p>}

      {blocks.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="md:w-2/3 space-y-4">
              <BlockEditor blocks={blocks} onChange={handleBlocksChange} />
              <CategoryMapper blocks={outfitBlocks} onChange={handleGarmentsChange} />
              <VariantMapper
                blocks={variantBlocks.map((block) => ({ id: block.id, order: block.order, variants: block.variants ?? [] }))}
                garments={garments}
                onChange={handleVariantsChange}
              />
              <button
                className="px-4 py-2 rounded-md bg-slate-800 text-slate-100 text-sm"
                onClick={handleConfirm}
              >
                Salva conferme
              </button>
            </div>
            <div className="md:w-1/3 space-y-4">
              <GeneratorConsole job={job} ready={!!outfitId} onGenerate={handleGenerate} onStop={handleStop} onResume={handleResume} />
              <BulkDownload
                outfitId={outfitId}
                garments={garments.map((garment) => ({ id: garment.id, articleCode: garment.articleCode }))}
                onDownload={handleDownload}
              />
              <AIChat messages={messages} onSend={handleChatSend} />
            </div>
          </div>
          <Gallery images={generatedImages} />
        </section>
      )}
    </main>
  );
}

