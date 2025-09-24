import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildGenerationTasks } from '@/lib/pipeline';
import { scheduleJob } from '@/lib/job-manager';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

type RegeneratePayload = {
  outfitId: string;
  promptId: string;
  hint?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegeneratePayload;
  const { outfitId, promptId, hint } = body;
  if (!outfitId || !promptId) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }

  const tasks = await buildGenerationTasks(outfitId);
  const task = tasks.find((t) => t.id === promptId);
  if (!task) {
    return NextResponse.json({ error: 'Prompt non trovato' }, { status: 404 });
  }

  const jobId = randomUUID();
  await prisma.generationJob.create({
    data: {
      id: jobId,
      outfitId,
      status: 'QUEUED',
    },
  });

  const adjustedTask = hint ? { ...task, prompt: `${task.prompt}\nRegeneration hint: ${hint}` } : task;

  await scheduleJob(jobId, [adjustedTask]);

  return NextResponse.json({ jobId });
}
