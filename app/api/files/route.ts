import { NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { resolveOutputPath, getUploadPath } from '@/lib/storage';
import { extname } from 'node:path';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'path mancante' }, { status: 400 });
  }
  const scope = url.searchParams.get('scope') ?? 'output';
  const filePath = scope === 'upload' ? getUploadPath(path) : resolveOutputPath(path);
  const stream = createReadStream(filePath);
  const extension = extname(filePath).toLowerCase();
  const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';

  return new Response(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
