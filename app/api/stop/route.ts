import { NextResponse } from 'next/server';
import { stopJob } from '@/lib/job-manager';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';

export const runtime = 'nodejs';

type StopPayload = {
  jobId: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StopPayload;
    if (!body.jobId) {
      return NextResponse.json({ error: 'jobId mancante' }, { status: 400 });
    }
    await prisma.generationJob.update({ where: { id: body.jobId }, data: { stopRequested: true } }).catch(() => undefined);
    await stopJob(body.jobId);
    return NextResponse.json({ status: 'stopped' });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    throw error;
  }
}
