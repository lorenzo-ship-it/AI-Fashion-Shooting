import { NextResponse } from 'next/server';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const outfit = await prisma.outfit.findUnique({
      where: { id: params.id },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
          include: {
            images: { include: { upload: true } },
            garments: { include: { variants: { include: { upload: true } } } },
            variants: { include: { upload: true, garment: true } },
          },
        },
      },
    });
    if (!outfit) {
      return NextResponse.json({ error: 'Outfit non trovato' }, { status: 404 });
    }
    return NextResponse.json({ outfit });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    throw error;
  }
}
