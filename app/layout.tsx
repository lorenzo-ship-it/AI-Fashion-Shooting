import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Fashion Shooting',
  description: 'Pipeline per generare shooting coerenti da foto di manichini e capi appesi',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans">{children}</body>
    </html>
  );
}
