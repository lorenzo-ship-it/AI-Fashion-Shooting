import { NextResponse } from 'next/server';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';
import { generateContent } from '@/lib/gemini';
import { getUploadPath } from '@/lib/storage';
import { BlockType, UploadKind } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const CLASSIFIER_PROMPT = `You are an assistant that labels fashion catalog photos. Return strict JSON with the following keys: subjectType ("mannequin" | "hanging" | "detail" | "other"), angle ("front" | "side" | "back" | "detail"), view ("full body" | "upper body" | "lower body" | "detail"), detailFocus (string | null), categories (array of { name: string, confidence: number } for garments such as abito, top, maglieria, pantaloni, gonne, borse). Do not include prose.`;

type Classification = {
  subjectType: 'mannequin' | 'hanging' | 'detail' | 'other';
  angle: string;
  view: string;
  detailFocus?: string | null;
  categories: { name: string; confidence: number }[];
};

const defaultClassification: Classification = {
  subjectType: 'other',
  angle: 'front',
  view: 'full body',
  categories: [],
};

async function classifyUpload(upload: { storedPath: string; mimeType: string }) {
  try {
    const buffer = await readFile(getUploadPath(upload.storedPath));
    const inlineData = buffer.toString('base64');
    const response = await generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: [
        { text: CLASSIFIER_PROMPT },
        { inlineData: { data: inlineData, mimeType: upload.mimeType } },
      ],
    });
    const text = response.textOutputs.join(' ');
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Classification;
      return parsed;
    }
  } catch (error) {
    console.error('Classification failed', error);
  }
  return defaultClassification;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const uploadIds: string[] = body.uploadIds ?? [];
    const outfitName: string = body.outfitName ?? 'Nuovo outfit';

    if (!uploadIds.length) {
      return NextResponse.json({ error: 'Nessuna immagine da analizzare' }, { status: 400 });
    }

    const uploads = await prisma.upload.findMany({
      where: { id: { in: uploadIds } },
      orderBy: { createdAt: 'asc' },
    });

    type BlockImage = { id: string; classification: Classification };

    const outfit = await prisma.outfit.create({
      data: {
        id: randomUUID(),
        name: outfitName,
        status: 'CONFIGURING',
      },
    });

    let order = 0;
    let currentBlock: { type: BlockType; uploads: BlockImage[] } | null = null;
    const blocks: { id: string; type: BlockType; imageIds: string[] }[] = [];

    for (const upload of uploads) {
      const classification = await classifyUpload(upload);
      const kind = classification.subjectType === 'mannequin'
        ? UploadKind.MANNEQUIN
        : classification.subjectType === 'hanging'
        ? UploadKind.HANGING
        : UploadKind.UNKNOWN;

      await prisma.upload.update({
        where: { id: upload.id },
        data: {
          kind,
          metadata: {
            ...(upload.metadata as Record<string, unknown> | null ?? {}),
            classification,
          },
        },
      });

      const blockType = kind === UploadKind.HANGING ? BlockType.HANGING_VARIANT : BlockType.OUTFIT;
      if (!currentBlock || currentBlock.type !== blockType) {
        if (currentBlock) {
          const blockId = randomUUID();
          await prisma.outfitBlock.create({
            data: {
              id: blockId,
              outfitId: outfit.id,
              order,
              type: currentBlock.type,
            },
          });
          for (const image of currentBlock.uploads) {
            await prisma.outfitBlockImage.create({
              data: {
                id: randomUUID(),
                blockId,
                uploadId: image.id,
                angle: image.classification.angle ?? null,
                role: image.classification.angle ?? null,
              },
            });
          }
          blocks.push({ id: blockId, type: currentBlock.type, imageIds: currentBlock.uploads.map((img) => img.id) });
          order += 1;
        }
        currentBlock = { type: blockType, uploads: [] };
      }
      currentBlock.uploads.push({ id: upload.id, classification });
    }

    if (currentBlock) {
      const blockId = randomUUID();
      await prisma.outfitBlock.create({
        data: {
          id: blockId,
          outfitId: outfit.id,
          order,
          type: currentBlock.type,
        },
      });
      for (const image of currentBlock.uploads) {
        await prisma.outfitBlockImage.create({
          data: {
            id: randomUUID(),
            blockId,
            uploadId: image.id,
            angle: image.classification.angle ?? null,
            role: image.classification.angle ?? null,
          },
        });
      }
      blocks.push({ id: blockId, type: currentBlock.type, imageIds: currentBlock.uploads.map((img) => img.id) });
    }

    return NextResponse.json({ outfitId: outfit.id, blocks });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json(
        {
          error:
            'Database non inizializzato. Esegui `npx prisma migrate deploy` (o `npm run prisma:migrate`) e riprova la fase di analisi.',
        },
        { status: 500 },
      );
    }
    throw error;
  }
}
