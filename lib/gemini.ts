import { GoogleGenAI, type Content, type Part } from '@google/genai';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY non impostata. Le chiamate al modello falliranno fino a quando la chiave non sarà configurata.');
}

const client = new GoogleGenAI({ apiKey: apiKey ?? '' });

export type PromptContent = Content | Part | string;

export const bufferToInlineImage = async (buffer: Buffer, mimeType: string): Promise<Part> => ({
  inlineData: {
    data: buffer.toString('base64'),
    mimeType,
  },
});

export const fileToInlineImage = async (filePath: string, mimeType: string): Promise<Part> => {
  const buffer = await readFile(filePath);
  return bufferToInlineImage(buffer, mimeType);
};

export type GeminiCallResult = {
  base64Images: string[];
  textOutputs: string[];
  raw: unknown;
  referenceHashes: string[];
};

const hashContent = (content: PromptContent) => {
  if (typeof content === 'string') {
    return createHash('sha256').update(content).digest('hex');
  }
  if ('parts' in content) {
    return createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }
  if ('inlineData' in content && content.inlineData?.data) {
    return createHash('sha256').update(content.inlineData.data).digest('hex');
  }
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
};

const toContent = (content: PromptContent): Content => {
  if (typeof content === 'string') {
    return { role: 'user', parts: [{ text: content }] };
  }
  if (typeof content === 'object' && 'parts' in content && Array.isArray(content.parts)) {
    return content;
  }
  return { role: 'user', parts: [content as Part] };
};

export const generateContent = async (params: { model: string; contents: PromptContent[] }) => {
  const { model, contents } = params;
  const normalized = contents.map(toContent);
  const response = await client.models.generateContent({ model, contents: normalized });
  const base64Images: string[] = [];
  const textOutputs: string[] = [];

  response.candidates?.forEach((candidate) => {
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
