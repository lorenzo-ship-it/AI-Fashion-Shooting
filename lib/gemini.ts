import { GoogleGenerativeAI, type Content } from '@google/genai';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY non impostata. Le chiamate al modello falliranno fino a quando la chiave non sarà configurata.');
}

const client = new GoogleGenerativeAI(apiKey ?? '');

export type InlineImage = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

export const bufferToInlineImage = async (buffer: Buffer, mimeType: string): Promise<InlineImage> => ({
  inlineData: {
    data: buffer.toString('base64'),
    mimeType,
  },
});

export const fileToInlineImage = async (filePath: string, mimeType: string): Promise<InlineImage> => {
  const buffer = await readFile(filePath);
  return bufferToInlineImage(buffer, mimeType);
};

export type GeminiCallResult = {
  base64Images: string[];
  textOutputs: string[];
  raw: unknown;
  referenceHashes: string[];
};

const hashContent = (content: Content) => {
  if ('inlineData' in (content as InlineImage)) {
    return createHash('sha256').update((content as InlineImage).inlineData.data).digest('hex');
  }
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
};

export const generateContent = async (params: { model: string; contents: Content[] }) => {
  const { model, contents } = params;
  const response = await client.models.generateContent({ model, contents });
  const base64Images: string[] = [];
  const textOutputs: string[] = [];

  response.response.candidates?.forEach((candidate) => {
    candidate.content?.parts?.forEach((part) => {
      if (part.inlineData?.data) {
        base64Images.push(part.inlineData.data);
      }
      if (part.text) {
        textOutputs.push(part.text);
      }
    });
  });

  return {
    base64Images,
    textOutputs,
    raw: response,
    referenceHashes: contents.map(hashContent),
  } satisfies GeminiCallResult;
};
