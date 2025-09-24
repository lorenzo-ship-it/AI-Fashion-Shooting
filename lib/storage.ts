import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { Readable } from 'node:stream';
import archiver from 'archiver';
import { Writable } from 'node:stream';

const uploadRoot = process.env.UPLOAD_DIR ?? '/tmp/uploads';
const outputRoot = process.env.OUTPUT_DIR ?? '/tmp/outputs';

const ensureDirSync = (dir: string) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

ensureDirSync(uploadRoot);
ensureDirSync(outputRoot);

export const getUploadPath = (fileId: string) => join(uploadRoot, fileId);
export const getOutputPath = (fileId: string) => join(outputRoot, fileId);
export const resolveOutputPath = getOutputPath;
export const relativeOutputPath = (absPath: string) => relative(outputRoot, absPath);

const ensureParentDir = async (target: string) => {
  const parent = dirname(target);
  await mkdir(parent, { recursive: true });
};

export const saveBufferToStorage = async (fileId: string, buffer: Buffer, scope: 'upload' | 'output') => {
  const base = scope === 'upload' ? uploadRoot : outputRoot;
  await mkdir(base, { recursive: true });
  const target = join(base, fileId);
  await ensureParentDir(target);
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(target);
    stream.on('error', reject);
    stream.on('finish', () => resolve());
    stream.end(buffer);
  });
  return target;
};

export const saveReadableToStorage = async (
  fileId: string,
  readable: Readable,
  scope: 'upload' | 'output',
): Promise<string> => {
  const base = scope === 'upload' ? uploadRoot : outputRoot;
  await mkdir(base, { recursive: true });
  const target = join(base, fileId);
  await ensureParentDir(target);
  await new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(target);
    readable.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
  return target;
};

export const writeInlineImage = async (fileId: string, base64: string) => {
  const buffer = Buffer.from(base64, 'base64');
  await saveBufferToStorage(fileId, buffer, 'output');
  return getOutputPath(fileId);
};

export const readBuffer = (fileId: string, scope: 'upload' | 'output') => {
  const path = scope === 'upload' ? getUploadPath(fileId) : getOutputPath(fileId);
  return readFileSync(path);
};

export const writeJson = (fileId: string, data: unknown) => {
  const payload = JSON.stringify(data, null, 2);
  writeFileSync(getOutputPath(fileId), payload, 'utf-8');
};

export const statFile = async (fileId: string, scope: 'upload' | 'output') => {
  const path = scope === 'upload' ? getUploadPath(fileId) : getOutputPath(fileId);
  return stat(path);
};

export type ZipEntry = {
  filePath: string;
  name: string;
};

export const createZipStream = async (entries: ZipEntry[]): Promise<{ stream: Readable; finalize: () => Promise<void> }> => {
  const archive = archiver('zip');
  const stream = new Readable({
    read() {
      /* noop */
    },
  });
  const output = new Writable({
    write(chunk, _encoding, callback) {
      stream.push(chunk);
      callback();
    },
    final(callback) {
      stream.push(null);
      callback();
    },
  });

  archive.on('error', (err) => {
    stream.destroy(err);
  });

  archive.pipe(output);

  for (const entry of entries) {
    archive.file(entry.filePath, { name: entry.name });
  }

  const finalize = async () => {
    await archive.finalize();
  };

  return { stream, finalize };
};
