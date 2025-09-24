import sharp from 'sharp';
import kmeans from 'ml-kmeans';
import convert from 'color-convert';

const BACKGROUND_HEX = '#E6DFD3';
const backgroundLab = convert.hex.lab(BACKGROUND_HEX);

const distance = (a: number[], b: number[]) => Math.sqrt(a.reduce((acc, value, index) => acc + (value - b[index]) ** 2, 0));

const isBackground = (lab: number[]) => distance(lab, backgroundLab) < 10;

export const extractDominantHex = async (buffer: Buffer): Promise<string> => {
  const image = sharp(buffer).removeAlpha();
  const { data, info } = await image
    .resize({ width: 256, height: 256, fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const labSamples: number[][] = [];

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lab = convert.rgb.lab.raw(r, g, b);
    if (!isBackground(lab) && r + g + b < 740) {
      labSamples.push(lab);
    }
  }

  if (labSamples.length === 0) {
    return BACKGROUND_HEX;
  }

  const clusters = kmeans(labSamples, Math.min(3, labSamples.length));
  const [dominant] = clusters.centroids
    .map((centroid, idx) => ({ centroid: centroid.centroid, size: clusters.clusters[idx].length }))
    .sort((a, b) => b.size - a.size);

  const [l, a, b] = dominant.centroid;
  const [r, g, bl] = convert.lab.rgb.raw(l, a, b);
  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`.toUpperCase();
};
