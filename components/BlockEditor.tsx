'use client';

import type { OutfitBlock } from '@/types';
import clsx from 'clsx';

export type EditableBlock = OutfitBlock & {
  previewUrl?: string;
  images: Array<OutfitBlock['images'][number] & { url?: string; originalName?: string }>;
};

type BlockEditorProps = {
  blocks: EditableBlock[];
  onChange: (blocks: EditableBlock[]) => void;
};

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const toggleType = (blockId: string) => {
    const updated = blocks.map((block) =>
      block.id === blockId
        ? { ...block, type: block.type === 'outfit' ? 'variant' : 'outfit' }
        : block
    );
    onChange(updated);
  };

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const [block] = newBlocks.splice(index, 1);
    newBlocks.splice(newIndex, 0, block);
    const remapped = newBlocks.map((b, idx) => ({ ...b, order: idx }));
    onChange(remapped);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div key={block.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Blocco #{block.order + 1}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className={clsx(
                'px-2 py-1 rounded-full uppercase font-semibold',
                block.type === 'outfit' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-200'
              )}>
                {block.type === 'outfit' ? 'Outfit base' : 'Varianti appese'}
              </span>
              <button
                className="px-2 py-1 bg-slate-700 rounded-md text-slate-200"
                onClick={() => toggleType(block.id)}
              >
                Switch
              </button>
              <div className="flex rounded-md overflow-hidden border border-slate-700">
                <button className="px-2" onClick={() => moveBlock(block.id, -1)}>↑</button>
                <button className="px-2" onClick={() => moveBlock(block.id, 1)}>↓</button>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {block.images.map((image) => (
              <figure key={image.uploadId} className="rounded-lg bg-slate-800 border border-slate-700 p-2 text-xs text-slate-300">
                <div className="aspect-square bg-slate-900 mb-2 flex items-center justify-center">
                  {image.url ? (
                    <img src={image.url} alt={image.role ?? 'reference'} className="object-cover rounded-md" />
                  ) : (
                    <span>{image.uploadId}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wide text-slate-400">Ruolo</label>
                  <select
                    className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200"
                    value={image.role ?? ''}
                    onChange={(event) => {
                      const updated = blocks.map((blockEntry) =>
                        blockEntry.id === block.id
                          ? {
                              ...blockEntry,
                              images: blockEntry.images.map((img) =>
                                img.uploadId === image.uploadId
                                  ? { ...img, role: event.target.value || undefined }
                                  : img
                              ),
                            }
                          : blockEntry
                      );
                      onChange(updated);
                    }}
                  >
                    <option value="">Auto</option>
                    <option value="front">Frontale</option>
                    <option value="side">Laterale</option>
                    <option value="back">Retro</option>
                    <option value="detail">Dettaglio</option>
                  </select>
                </div>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
