'use client';

import type { GarmentSummary } from '@/types';
import type { EditableBlock } from './BlockEditor';

const categories: GarmentSummary['category'][] = ['abito', 'top', 'maglieria', 'pantaloni', 'gonne', 'borse'];

type CategoryMapperProps = {
  blocks: EditableBlock[];
  onChange: (blocks: EditableBlock[]) => void;
};

export function CategoryMapper({ blocks, onChange }: CategoryMapperProps) {
  const updateGarment = (blockId: string, garmentId: string, patch: Partial<GarmentSummary>) => {
    const updated = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            garments: block.garments.map((garment) =>
              garment.id === garmentId ? { ...garment, ...patch } : garment
            ),
          }
        : block
    );
    onChange(updated);
  };

  const addGarment = (blockId: string) => {
    const updated = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            garments: [
              ...block.garments,
              {
                id: `garment-${Date.now()}`,
                category: 'top',
                articleCode: '',
              } as GarmentSummary,
            ],
          }
        : block
    );
    onChange(updated);
  };

  const removeGarment = (blockId: string, garmentId: string) => {
    const updated = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            garments: block.garments.filter((garment) => garment.id !== garmentId),
          }
        : block
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <section key={block.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Mappatura capi – Blocco #{block.order + 1}</h3>
            <button
              className="text-xs px-2 py-1 rounded-md bg-slate-700 text-slate-100"
              onClick={() => addGarment(block.id)}
              type="button"
            >
              Aggiungi capo
            </button>
          </header>
          {block.garments.length === 0 ? (
            <p className="text-xs text-slate-400 mt-2">Nessun capo definito.</p>
          ) : (
            <div className="mt-3 grid gap-3">
              {block.garments.map((garment) => (
                <div key={garment.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto] items-center bg-slate-800 rounded-lg p-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-400">Categoria</label>
                    <select
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200"
                      value={garment.category}
                      onChange={(event) => updateGarment(block.id, garment.id, { category: event.target.value as GarmentSummary['category'] })}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-400">Codice articolo</label>
                    <input
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200"
                      value={garment.articleCode}
                      onChange={(event) => updateGarment(block.id, garment.id, { articleCode: event.target.value })}
                      placeholder="es. ART1234"
                    />
                  </div>
                  <button
                    className="text-xs px-2 py-1 rounded-md bg-red-500/20 text-red-200"
                    onClick={() => removeGarment(block.id, garment.id)}
                    type="button"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
