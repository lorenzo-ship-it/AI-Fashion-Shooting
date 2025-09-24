import { NextResponse } from 'next/server';
import { stopJob } from '@/lib/job-manager';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type StopPayload = {
  jobId: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as StopPayload;
  if (!body.jobId) {
    return NextResponse.json({ error: 'jobId mancante' }, { status: 400 });
  }
  await prisma.generationJob.update({ where: { id: body.jobId }, data: { stopRequested: true } }).catch(() => undefined);
  await stopJob(body.jobId);
  return NextResponse.json({ status: 'stopped' });
}
