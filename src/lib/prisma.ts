import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

declare global {
  var prismaGlobal: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? ''
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })  
  const adapter = new PrismaPg(pool as any)
  return new PrismaClient({ adapter } as any) as PrismaClient
}

export const prisma: PrismaClient =
  global.prismaGlobal ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}