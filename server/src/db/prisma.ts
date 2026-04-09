import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis as unknown as { prisma: any }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma