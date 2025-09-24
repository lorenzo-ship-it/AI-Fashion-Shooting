'use client';

import type { ChatMessage } from '@/types';
import { useState } from 'react';

interface AIChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => Promise<void>;
}

export function AIChat({ messages, onSend }: AIChatProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setSending(true);
    try {
      await onSend(value.trim());
      setValue('');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-white mb-3">Chat operativa</h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500">Invia istruzioni o feedback per influenzare le rigenerazioni dei singoli scatti.</p>
        )}
        {messages.map((message) => (
          <article
            key={message.id}
            className={`rounded-lg px-3 py-2 text-xs ${message.role === 'user' ? 'bg-slate-800 text-slate-100' : 'bg-slate-950 text-slate-300 border border-slate-700'}`}
          >
            <header className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">
              {message.role === 'user' ? 'Utente' : message.role === 'assistant' ? 'AI Studio' : 'Sistema'}
              <span className="ml-2 text-slate-600 lowercase">{new Date(message.createdAt).toLocaleTimeString()}</span>
            </header>
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </article>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Aggiungi un hint (es. enfatizza i dettagli della zip)"
          className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200"
        />
        <button
          className="px-3 py-2 bg-studio-beige text-slate-900 text-sm font-semibold rounded-md disabled:opacity-50"
          onClick={handleSubmit}
          disabled={sending}
        >
          Invia
        </button>
      </div>
    </section>
  );
}
