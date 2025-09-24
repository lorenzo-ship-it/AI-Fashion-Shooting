'use client';

import type { JobState } from '@/types';
import { useState } from 'react';

interface GeneratorConsoleProps {
  job: JobState | null;
  ready: boolean;
  onGenerate: (hint?: string) => Promise<void>;
  onStop: () => Promise<void>;
  onResume: () => Promise<void>;
}

export function GeneratorConsole({ job, ready, onGenerate, onStop, onResume }: GeneratorConsoleProps) {
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(hint.trim() ? hint.trim() : undefined);
      setHint('');
    } finally {
      setLoading(false);
    }
  };

  const progress = job ? Math.round((job.progress.completed / Math.max(job.progress.total, 1)) * 100) : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-4">
      <header>
        <h3 className="text-sm font-semibold text-white">Generazione shooting</h3>
        <p className="text-xs text-slate-400">Avvia la pipeline Gemini 2.5 Flash Image con consistenza di modella e stile.</p>
      </header>
      <textarea
        value={hint}
        onChange={(event) => setHint(event.target.value)}
        placeholder="Suggerimenti opzionali per la generazione (es. posa, dettagli da enfatizzare)"
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 min-h-[80px]"
      />
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 rounded-md bg-studio-beige text-slate-900 text-sm font-semibold disabled:opacity-50"
          onClick={handleGenerate}
          disabled={!ready || loading}
        >
          {loading ? 'Avvio…' : job ? 'Rigenera' : 'Genera shooting'}
        </button>
        <button
          className="px-4 py-2 rounded-md bg-red-500/20 text-red-200 text-sm disabled:opacity-50"
          onClick={() => onStop()}
          disabled={!job || job.status !== 'RUNNING'}
        >
          Stop
        </button>
        <button
          className="px-4 py-2 rounded-md bg-emerald-500/20 text-emerald-200 text-sm disabled:opacity-50"
          onClick={() => onResume()}
          disabled={!job || job.status !== 'STOPPED'}
        >
          Riprendi
        </button>
      </div>
      {job && (
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span>Stato: {job.status}</span>
            <span>{job.progress.completed}/{job.progress.total}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-studio-beige" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
