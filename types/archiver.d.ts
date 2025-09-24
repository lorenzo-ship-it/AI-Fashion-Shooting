declare module 'archiver' {
  import { Transform } from 'stream';

  export interface Archiver extends Transform {
    directory(dir: string, dest: string): Archiver;
    file(filepath: string, data?: { name?: string }): Archiver;
    append(source: NodeJS.ReadableStream | Buffer, data?: { name?: string }): Archiver;
    finalize(): Promise<void>;
    on(event: 'error', handler: (error: Error) => void): this;
  }

  export interface ArchiverOptions {
    zlib?: {
      level?: number;
    };
  }

  export default function archiver(format: 'zip', options?: ArchiverOptions): Archiver;
}
