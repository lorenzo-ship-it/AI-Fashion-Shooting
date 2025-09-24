import { NextResponse } from 'next/server';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';
import { createZipStream, resolveOutputPath } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { scope: string } }) {
  try {
    const { scope } = params;
    const url = new URL(request.url);
    const outfitId = url.searchParams.get('outfitId');
    if (!outfitId) {
      return NextResponse.json({ error: 'outfitId mancante' }, { status: 400 });
    }

    const garmentId = url.searchParams.get('garmentId');
    const variantId = url.searchParams.get('variantId');

    const generations = await prisma.generation.findMany({
      where: {
        job: { outfitId },
        ...(scope === 'garment' && garmentId ? { garmentId } : {}),
        ...(scope === 'variant' && variantId ? { variantId } : {}),
      },
    });

    if (!generations.length) {
      return NextResponse.json({ error: 'Nessuna immagine da scaricare' }, { status: 404 });
    }

    const entries = generations.map((generation) => ({
      filePath: resolveOutputPath(generation.filePath),
      name: generation.filePath.split('/').pop() ?? generation.filePath,
    }));

    const { stream, finalize } = await createZipStream(entries);

    const responseStream = new ReadableStream({
      async start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
        await finalize();
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${scope}-${outfitId}.zip"`,
      },
    });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    throw error;
  }
}
