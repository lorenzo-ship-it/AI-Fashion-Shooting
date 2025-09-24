import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
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
}
