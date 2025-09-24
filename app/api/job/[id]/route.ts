import { NextResponse } from 'next/server';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';
import { buildGenerationTasks } from '@/lib/pipeline';

export const runtime = 'nodejs';

const fileUrl = (path: string) => `/api/files?path=${encodeURIComponent(path)}`;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const job = await prisma.generationJob.findUnique({
      where: { id },
      include: {
        generations: true,
        logs: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job non trovato' }, { status: 404 });
    }

    const total = (await buildGenerationTasks(job.outfitId)).length;
    const completed = job.generations.length;

    const generations = job.generations.map((generation) => ({
      id: generation.id,
      garmentId: generation.garmentId,
      variantId: generation.variantId,
      angle: generation.angle,
      view: generation.view,
      filePath: generation.filePath,
      url: fileUrl(generation.filePath),
      createdAt: generation.createdAt,
    }));

    return NextResponse.json({
      job: {
        id: job.id,
        outfitId: job.outfitId,
        status: job.status,
        stopRequested: job.stopRequested,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        progress: { completed, total },
        generations,
        logs: job.logs,
      },
    });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    throw error;
  }
}
