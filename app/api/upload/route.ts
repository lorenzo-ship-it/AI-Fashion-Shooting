import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { saveBufferToStorage } from '@/lib/storage';
import { prisma, isPrismaClientNotGeneratedError, PRISMA_GENERATE_MESSAGE } from '@/lib/prisma';
import exifr from 'exifr';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 });
    }

    const uploads = [] as {
      id: string;
      originalName: string;
      mimeType: string;
      order: number;
      capturedAt?: string;
      tag: 'unknown';
    }[];

    let index = Number(formData.get('startIndex') ?? '0');

    for (const file of files) {
      const id = randomUUID();
      const mimeType = file.type || 'image/jpeg';
      const extension = extname(file.name) || (mimeType === 'image/png' ? '.png' : '.jpg');
      const storagePath = `${id}${extension}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await saveBufferToStorage(storagePath, buffer, 'upload');

      let capturedAt: string | undefined;
      let exifMetadata: Prisma.JsonValue | undefined;
      try {
        const exif = await exifr.parse(buffer, true);
        if (exif?.DateTimeOriginal instanceof Date) {
          capturedAt = exif.DateTimeOriginal.toISOString();
        }
        exifMetadata = exif ? (JSON.parse(JSON.stringify(exif)) as Prisma.JsonValue) : undefined;
      } catch (error) {
        exifMetadata = undefined;
      }

      await prisma.upload.create({
        data: {
          id,
          originalName: file.name,
          mimeType,
          kind: 'UNKNOWN',
          storedPath: storagePath,
          metadata: {
            capturedAt,
            exif: exifMetadata,
          },
        },
      });

      uploads.push({
        id,
        originalName: file.name,
        mimeType,
        order: index,
        capturedAt,
        tag: 'unknown',
      });
      index += 1;
    }

    return NextResponse.json({ uploads });
  } catch (error) {
    if (isPrismaClientNotGeneratedError(error)) {
      return NextResponse.json({ error: PRISMA_GENERATE_MESSAGE }, { status: 500 });
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2021') {
      return NextResponse.json(
        {
          error:
            'Database non inizializzato. Esegui `npx prisma migrate deploy` (o `npm run prisma:migrate`) prima di caricare le immagini.',
        },
        { status: 500 },
      );
    }
    throw error;
  }
}
