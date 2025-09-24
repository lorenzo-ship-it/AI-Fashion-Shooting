import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BlockType, GarmentCategory } from '@prisma/client';
import { extractDominantHex } from '@/lib/color';
import { readBuffer } from '@/lib/storage';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const categoryMap: Record<string, GarmentCategory> = {
  abito: GarmentCategory.ABITO,
  top: GarmentCategory.TOP,
  maglieria: GarmentCategory.MAGLIERIA,
  pantaloni: GarmentCategory.PANTALONI,
  gonne: GarmentCategory.GONNE,
  borse: GarmentCategory.BORSE,
};

type ConfirmPayload = {
  outfitId: string;
  blocks: Array<{
    id?: string;
    type: 'outfit' | 'variant';
    order: number;
    images: Array<{ uploadId: string; angle?: string | null; role?: string | null }>;
    garments?: Array<{
      id?: string;
      category: keyof typeof categoryMap;
      articleCode: string;
      variants?: Array<{ id?: string; garmentId: string; uploadId: string; hexColor?: string }>;
    }>;
    variants?: Array<{ id?: string; garmentId: string; uploadId: string; hexColor?: string }>;
  }>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ConfirmPayload;
  const { outfitId, blocks } = body;

  if (!outfitId || !blocks?.length) {
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.variant.deleteMany({ where: { garment: { outfitId } } });
    await tx.outfitBlockImage.deleteMany({ where: { block: { outfitId } } });
    await tx.garment.deleteMany({ where: { outfitId } });
    await tx.outfitBlock.deleteMany({ where: { outfitId } });

    for (const block of blocks) {
      const blockId = block.id ?? randomUUID();
      const type = block.type === 'variant' ? BlockType.HANGING_VARIANT : BlockType.OUTFIT;
      await tx.outfitBlock.create({
        data: {
          id: blockId,
          outfitId,
          order: block.order,
          type,
        },
      });

      for (const image of block.images) {
        await tx.outfitBlockImage.create({
          data: {
            id: randomUUID(),
            blockId,
            uploadId: image.uploadId,
            angle: image.angle ?? null,
            role: image.role ?? image.angle ?? null,
          },
        });
      }

      if (block.garments?.length) {
        for (const garment of block.garments) {
          const category = categoryMap[garment.category];
          if (!category) continue;
          const garmentId = garment.id ?? randomUUID();
          await tx.garment.create({
            data: {
              id: garmentId,
              outfitId,
              blockId,
              category,
              articleCode: garment.articleCode,
            },
          });
          if (garment.variants?.length) {
            for (const variant of garment.variants) {
              const upload = await tx.upload.findUnique({ where: { id: variant.uploadId } });
              if (!upload) continue;
              let hexColor = variant.hexColor;
              if (!hexColor) {
                const buffer = readBuffer(upload.storedPath, 'upload');
                hexColor = await extractDominantHex(buffer);
              }
              await tx.variant.create({
                data: {
                  id: variant.id ?? randomUUID(),
                  garmentId,
                  blockId,
                  uploadId: variant.uploadId,
                  hexColor,
                },
              });
            }
          }
        }
      }

      if (type === BlockType.HANGING_VARIANT && block.variants?.length) {
        for (const variant of block.variants) {
          const garment = await tx.garment.findUnique({ where: { id: variant.garmentId } });
          if (!garment) continue;
          const upload = await tx.upload.findUnique({ where: { id: variant.uploadId } });
          if (!upload) continue;
          let hexColor = variant.hexColor;
          if (!hexColor) {
            const buffer = readBuffer(upload.storedPath, 'upload');
            hexColor = await extractDominantHex(buffer);
          }
          await tx.variant.create({
            data: {
              id: variant.id ?? randomUUID(),
              garmentId: garment.id,
              blockId,
              uploadId: variant.uploadId,
              hexColor,
            },
          });
        }
      }
    }

    await tx.outfit.update({ where: { id: outfitId }, data: { status: 'READY' } });
  });

  const outfit = await prisma.outfit.findUnique({
    where: { id: outfitId },
    include: {
      blocks: {
        orderBy: { order: 'asc' },
        include: {
          images: true,
          garments: { include: { variants: true } },
        },
      },
    },
  });

  return NextResponse.json({ outfit });
}
