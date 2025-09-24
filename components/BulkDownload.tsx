'use client';

type BulkDownloadProps = {
  outfitId: string | null;
  garments: Array<{ id: string; articleCode: string }>;
  onDownload: (scope: 'outfit' | 'garment', options?: { garmentId?: string }) => Promise<void>;
};

export function BulkDownload({ outfitId, garments, onDownload }: BulkDownloadProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Download zip</h3>
      <button
        className="w-full px-4 py-2 rounded-md bg-slate-800 text-slate-100 text-sm disabled:opacity-50"
        onClick={() => onDownload('outfit')}
        disabled={!outfitId}
      >
        Scarica intero outfit
      </button>
      <div className="grid gap-2">
        {garments.map((garment) => (
          <button
            key={garment.id}
            className="px-3 py-2 rounded-md bg-slate-800 text-xs text-slate-200 text-left disabled:opacity-50"
            onClick={() => onDownload('garment', { garmentId: garment.id })}
          >
            Scarica {garment.articleCode}
          </button>
        ))}
      </div>
    </div>
  );
}
