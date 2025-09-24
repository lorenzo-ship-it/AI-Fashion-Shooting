'use client';

import type { GarmentSummary, VariantSummary } from '@/types';

type VariantMapperProps = {
  blocks: Array<{
    id: string;
    order: number;
    variants: VariantSummary[];
  }>;
  garments: GarmentSummary[];
  onChange: (blocks: VariantMapperProps['blocks']) => void;
};

export function VariantMapper({ blocks, garments, onChange }: VariantMapperProps) {
  const updateVariant = (blockId: string, variantId: string, patch: Partial<VariantSummary>) => {
    const updated = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            variants: block.variants.map((variant) =>
              variant.id === variantId ? { ...variant, ...patch } : variant
            ),
          }
        : block
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <section key={block.id} className="border border-slate-700 rounded-xl bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-white">Varianti appese – Blocco #{block.order + 1}</h3>
          {(block.variants ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 mt-2">Nessuna foto di capi appesi associata.</p>
          ) : (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(block.variants ?? []).map((variant) => (
                <div key={variant.id} className="bg-slate-800 rounded-lg p-3 flex flex-col gap-2">
                  <div className="aspect-video bg-slate-900 rounded-md overflow-hidden flex items-center justify-center">
                    {variant.url ? (
                      <img src={variant.url} alt="Variante" className="object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">{variant.uploadId}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-400">Associa a capo</label>
                    <select
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200"
                      value={variant.garmentId ?? ''}
                      onChange={(event) => updateVariant(block.id, variant.id, { garmentId: event.target.value || undefined })}
                    >
                      <option value="">Seleziona capo</option>
                      {garments.map((garment) => (
                        <option key={garment.id} value={garment.id}>
                          {garment.articleCode} · {garment.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
