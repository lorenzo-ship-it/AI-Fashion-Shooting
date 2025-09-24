import { PrismaClient } from '@prisma/client';

class PrismaClientNotGeneratedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrismaClientNotGeneratedError';
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let prismaInstance: PrismaClient | undefined;

const createClient = () => {
  try {
    return new PrismaClient({
      log: ['error', 'warn'],
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('@prisma/client did not initialize yet')) {
      throw new PrismaClientNotGeneratedError(error.message);
    }
    throw error;
  }
};

const getClient = (): PrismaClient => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  if (!prismaInstance) {
    prismaInstance = createClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  }
  return prismaInstance;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const target = client as unknown as Record<PropertyKey, unknown>;
    const value = target[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
  set(_target, prop, value) {
    const client = getClient();
    const target = client as unknown as Record<PropertyKey, unknown>;
    target[prop] = value;
    return true;
  },
}) as PrismaClient;

export const PRISMA_GENERATE_MESSAGE =
  'Client Prisma non inizializzato. Esegui `npm install` oppure `npm run prisma:generate` e riprova.';

export const isPrismaClientNotGeneratedError = (error: unknown): boolean =>
  error instanceof PrismaClientNotGeneratedError ||
  (error instanceof Error && error.message.includes('@prisma/client did not initialize yet'));
