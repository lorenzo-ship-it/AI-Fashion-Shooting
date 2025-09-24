'use client';

import type { GenerationResult } from '@/types';

interface GalleryProps {
  images: GenerationResult[];
}

export function Gallery({ images }: GalleryProps) {
  if (!images.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-sm text-slate-400 text-center">
        Nessuna immagine generata ancora. Avvia un job per vedere i risultati in tempo reale.
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {images.map((image) => (
        <figure key={image.id} className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
          <img src={image.url} alt={`${image.view} ${image.angle}`} className="w-full object-cover" />
          <figcaption className="p-3 text-xs text-slate-300">
            <div className="font-semibold text-white">{image.view} · {image.angle}</div>
            <div>{image.garmentId ?? 'outfit'}</div>
            {image.variantId && <div className="text-amber-200">Variante {image.variantId}</div>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
