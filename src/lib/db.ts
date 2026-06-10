import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Connection pool config for serverless/production per architecture.md
  // datasourceUrl handled via env var
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
