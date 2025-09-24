import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AI Fashion Shooting',
  description: 'Pipeline per generare shooting coerenti da foto di manichini e capi appesi',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.variable} bg-slate-950 text-slate-100 min-h-screen`}>{children}</body>
    </html>
  );
}
