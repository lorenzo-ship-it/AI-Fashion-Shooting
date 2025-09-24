'use client';

import { useCallback, useRef, useState } from 'react';
import type { UploadedImage } from '@/types';
import clsx from 'clsx';

type UploadGridProps = {
  uploads: UploadedImage[];
  onUpload: (files: File[]) => Promise<void>;
  uploading: boolean;
};

export function UploadGrid({ uploads, onUpload, uploading }: UploadGridProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    await onUpload(list);
  }, [onUpload]);

  return (
    <div
      className={clsx(
        'border-2 border-dashed rounded-xl p-6 transition-colors',
        isDragging ? 'border-studio-beige bg-studio-beige/10' : 'border-slate-600'
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-slate-300">Trascina qui le foto di manichini e capi appesi</p>
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-studio-beige text-slate-900 text-sm font-semibold hover:bg-studio-beige/90"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Caricamento…' : 'Seleziona immagini'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              void handleFiles(event.target.files);
              event.target.value = '';
            }
          }}
        />
      </div>
      {uploads.length > 0 && (
        <ul className="mt-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {uploads.map((upload) => (
            <li key={upload.id} className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
              <div className="aspect-square bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                <span>{upload.originalName}</span>
              </div>
              <div className="p-2 text-xs text-slate-400 flex items-center justify-between">
                <span>#{upload.order + 1}</span>
                <span>{upload.tag}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
