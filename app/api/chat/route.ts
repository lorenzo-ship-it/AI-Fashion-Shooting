import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

type ChatPayload = {
  jobId: string;
  role: 'user' | 'assistant';
  message: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ChatPayload;
  if (!body.jobId || !body.message) {
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
  }
  await prisma.generationLog.create({
    data: {
      id: randomUUID(),
      jobId: body.jobId,
      message: `[${body.role}] ${body.message}`,
    },
  });
  return NextResponse.json({ status: 'ok' });
}
