import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    // Connection pool: limit concurrent connections to avoid exhaustion under load
    // Prisma default is num_cpus * 2 + 1, which can overwhelm small DB instances
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

