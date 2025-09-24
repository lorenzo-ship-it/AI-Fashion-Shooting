import { BlockType, GarmentCategory } from '@prisma/client';
import { prisma } from './prisma';
import { buildBaseAnglePrompt, buildBaseMotherPrompt, buildDetailPrompt, buildLowerBodyPrompt, buildUpperBodyPrompt, buildVariantAnglePrompt, buildVariantDetailPrompt, buildVariantMotherPrompt } from './prompts';
import type { GenerationTask, ReferenceSource } from './job-manager';
import { ANGLES } from './angles';
import { extractDominantHex } from './color';
import { readBuffer } from './storage';

const GARMENT_VIEW: Record<GarmentCategory, 'upper body' | 'lower body' | 'full body'> = {
  [GarmentCategory.ABITO]: 'full body',
  [GarmentCategory.TOP]: 'upper body',
  [GarmentCategory.MAGLIERIA]: 'upper body',
  [GarmentCategory.PANTALONI]: 'lower body',
  [GarmentCategory.GONNE]: 'lower body',
  [GarmentCategory.BORSE]: 'full body',
};

const garmentLabel = (category: GarmentCategory) => category.toLowerCase();

const detailLabel = (index: number) => {
  switch (index) {
    case 0:
      return 'collar and neckline';
    case 1:
      return 'cuffs and hem';
    default:
      return 'fabric texture and trims';
  }
};

const mannequinMime = (mime: string) => (mime.includes('png') ? 'image/png' : 'image/jpeg');

export const buildGenerationTasks = async (outfitId: string): Promise<GenerationTask[]> => {
  const outfit = await prisma.outfit.findUnique({
    where: { id: outfitId },
    include: {
      blocks: {
        orderBy: { order: 'asc' },
        include: {
          images: { include: { upload: true } },
          garments: { include: { variants: { include: { upload: true, block: true } } } },
          variants: { include: { upload: true, garment: true } },
        },
      },
    },
  });

  if (!outfit) {
    throw new Error(`Outfit ${outfitId} not found`);
  }

  const tasks: GenerationTask[] = [];
  const baseMotherTask = new Map<string, string>();

  for (const block of outfit.blocks.filter((b) => b.type === BlockType.OUTFIT)) {
    const front = block.images.find((img) => img.role === 'front');
    if (!front) continue;
    const motherTaskId = `block-${block.id}-mother`; // stable id
    const basePrompt = buildBaseMotherPrompt();

    const references: ReferenceSource[] = [
      { kind: 'upload', path: front.upload.storedPath, mimeType: mannequinMime(front.upload.mimeType) },
    ];

    tasks.push({
      id: motherTaskId,
      prompt: basePrompt,
      description: `Immagine madre outfit ${block.order}`,
      references,
      outputName: `look-${block.order}-full-front-base`,
      angle: 'front',
      view: 'full body',
    });

    baseMotherTask.set(block.id, motherTaskId);

    for (const angle of ['side', 'back'] as const) {
      const refImage = block.images.find((img) => img.role === angle || img.angle === angle);
      if (!refImage) continue;
      tasks.push({
        id: `${motherTaskId}-${angle}`,
        prompt: buildBaseAnglePrompt({ angle }),
        description: `Full body ${angle} outfit ${block.order}`,
        references: [
          { kind: 'generation', taskId: motherTaskId, mimeType: 'image/png' },
          { kind: 'upload', path: refImage.upload.storedPath, mimeType: mannequinMime(refImage.upload.mimeType) },
        ],
        outputName: `look-${block.order}-full-${angle}-base`,
        angle,
        view: 'full body',
      });
    }

    const detailImages = block.images.filter((img) => img.role === 'detail');
    detailImages.forEach((detail, index) => {
      tasks.push({
        id: `${motherTaskId}-detail-${index}`,
        prompt: buildDetailPrompt({ detailFocus: detail.angle ?? detailLabel(index) }),
        description: `Dettaglio ${index + 1} outfit ${block.order}`,
        references: [
          { kind: 'generation', taskId: motherTaskId, mimeType: 'image/png' },
          { kind: 'upload', path: detail.upload.storedPath, mimeType: mannequinMime(detail.upload.mimeType) },
        ],
        outputName: `look-${block.order}-detail-${index + 1}-base`,
        angle: detail.angle ?? `detail-${index + 1}`,
        view: 'detail',
      });
    });

    for (const garment of block.garments) {
      const view = GARMENT_VIEW[garment.category];
      const angleList = view === 'upper body' ? ANGLES.upperBody : view === 'lower body' ? ANGLES.lowerBody : ANGLES.fullBody;
      for (const angle of angleList) {
        const mannequin = block.images.find((img) => img.role === angle || img.angle === angle || img.role === 'front');
        if (!mannequin) continue;
        const basePrompt =
          view === 'upper body'
            ? buildUpperBodyPrompt({ angle })
            : view === 'lower body'
            ? buildLowerBodyPrompt({ angle })
            : buildBaseAnglePrompt({ angle });
        const prompt = `${basePrompt} Focus on the ${garmentLabel(garment.category)} garment code ${garment.articleCode}.`;
        tasks.push({
          id: `${garment.id}-${angle}-base`,
          prompt,
          description: `${garment.articleCode} ${angle} base`,
          references: [
            { kind: 'generation', taskId: motherTaskId, mimeType: 'image/png' },
            { kind: 'upload', path: mannequin.upload.storedPath, mimeType: mannequinMime(mannequin.upload.mimeType) },
          ],
          outputName: `${garment.articleCode}_${garmentLabel(garment.category)}_${angle}_base`,
          garmentId: garment.id,
          angle,
          view,
        });
      }
    }
  }

  for (const block of outfit.blocks.filter((b) => b.type === BlockType.HANGING_VARIANT)) {
    const relatedVariants = block.variants;
    for (const variant of relatedVariants) {
      const garment = await prisma.garment.findUnique({
        where: { id: variant.garmentId },
        include: {
          block: {
            include: {
              images: { include: { upload: true } },
            },
          },
        },
      });
      if (!garment) continue;
      const baseMotherId = baseMotherTask.get(garment.blockId);
      if (!baseMotherId) continue;
      const front = garment.block.images.find((img) => img.role === 'front');
      if (!front) continue;
      let hexColor = variant.hexColor;
      if (!hexColor) {
        const buffer = readBuffer(variant.upload.storedPath, 'upload');
        hexColor = await extractDominantHex(buffer);
        await prisma.variant.update({ where: { id: variant.id }, data: { hexColor } });
      }
      const motherId = `${variant.id}-mother`;
      tasks.push({
        id: motherId,
        prompt: `${buildVariantMotherPrompt(hexColor)} Focus on the ${garmentLabel(garment.category)} article ${garment.articleCode}.`,
        description: `Immagine madre variante ${garment.articleCode}`,
        references: [
          { kind: 'generation', taskId: baseMotherId, mimeType: 'image/png' },
          { kind: 'upload', path: variant.upload.storedPath, mimeType: mannequinMime(variant.upload.mimeType) },
          { kind: 'upload', path: front.upload.storedPath, mimeType: mannequinMime(front.upload.mimeType) },
        ],
        outputName: `${garment.articleCode}_${garmentLabel(garment.category)}_front_variant`,
        garmentId: garment.id,
        variantId: variant.id,
        angle: 'front',
        view: 'full body',
      });
      const view = GARMENT_VIEW[garment.category];
      const angleList = view === 'upper body' ? ANGLES.upperBody : view === 'lower body' ? ANGLES.lowerBody : ANGLES.fullBody;
      for (const angle of angleList) {
        const mannequin = garment.block.images.find((img) => img.role === angle || img.angle === angle || img.role === 'front');
        if (!mannequin) continue;
        const prompt = `${buildVariantAnglePrompt({ angle, view, hexColor })} Focus on the ${garmentLabel(garment.category)} article ${garment.articleCode}.`;
        tasks.push({
          id: `${variant.id}-${angle}`,
          prompt,
          description: `${garment.articleCode} ${angle} variante`,
          references: [
            { kind: 'generation', taskId: motherId, mimeType: 'image/png' },
            { kind: 'upload', path: variant.upload.storedPath, mimeType: mannequinMime(variant.upload.mimeType) },
            { kind: 'upload', path: mannequin.upload.storedPath, mimeType: mannequinMime(mannequin.upload.mimeType) },
          ],
          outputName: `${garment.articleCode}_${garmentLabel(garment.category)}_${angle}_variant`,
          garmentId: garment.id,
          variantId: variant.id,
          angle,
          view,
        });
      }

      const detailImages = block.images.filter((img) => img.role === 'detail');
      detailImages.forEach((detail, index) => {
        tasks.push({
          id: `${variant.id}-detail-${index}`,
          prompt: buildVariantDetailPrompt({ detailFocus: detail.angle ?? detailLabel(index), hexColor }),
          description: `Variante ${garment.articleCode} dettaglio ${index + 1}`,
          references: [
            { kind: 'generation', taskId: motherId, mimeType: 'image/png' },
            { kind: 'upload', path: variant.upload.storedPath, mimeType: mannequinMime(variant.upload.mimeType) },
            { kind: 'upload', path: detail.upload.storedPath, mimeType: mannequinMime(detail.upload.mimeType) },
          ],
          outputName: `${garment.articleCode}_${garmentLabel(garment.category)}_detail-${index + 1}_variant`,
          garmentId: garment.id,
          variantId: variant.id,
          angle: detail.angle ?? `detail-${index + 1}`,
          view: 'detail',
        });
      });
    }
  }

  return tasks;
};
