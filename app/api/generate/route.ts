import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scheduleJob } from '@/lib/job-manager';
import { buildGenerationTasks } from '@/lib/pipeline';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

type GeneratePayload = {
  outfitId: string;
  hints?: string[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as GeneratePayload;
  const { outfitId } = body;
  if (!outfitId) {
    return NextResponse.json({ error: 'outfitId mancante' }, { status: 400 });
  }

  const outfit = await prisma.outfit.findUnique({ where: { id: outfitId } });
  if (!outfit) {
    return NextResponse.json({ error: 'Outfit non trovato' }, { status: 404 });
  }

  const jobId = randomUUID();
  await prisma.generationJob.create({
    data: {
      id: jobId,
      outfitId,
      status: 'QUEUED',
    },
  });

  const tasks = await buildGenerationTasks(outfitId);

  if (body.hints?.length) {
    for (const hint of body.hints) {
      await prisma.generationLog.create({
        data: {
          id: randomUUID(),
          jobId,
          message: `[user-hint] ${hint}`,
        },
      });
    }
  }

  await scheduleJob(jobId, tasks);

  return NextResponse.json({ jobId, total: tasks.length });
}
