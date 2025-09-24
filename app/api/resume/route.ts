import { NextResponse } from 'next/server';
import { resumeJob } from '@/lib/job-manager';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';

export const runtime = 'nodejs';

type ResumePayload = {
  jobId: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResumePayload;
    if (!body.jobId) {
      return NextResponse.json({ error: 'jobId mancante' }, { status: 400 });
    }
    await prisma.generationJob.update({ where: { id: body.jobId }, data: { stopRequested: false } }).catch(() => undefined);
    await resumeJob(body.jobId);
    return NextResponse.json({ status: 'resumed' });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    throw error;
  }
}
