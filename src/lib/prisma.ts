/**
 * Centraliza la creación y reutilización del cliente Prisma de Kotta.
 *
 * Contiene la configuración de conexión a PostgreSQL mediante el adaptador
 * oficial de Prisma para `pg`, incluyendo el pool de conexiones y la
 * reutilización del cliente durante desarrollo para evitar instancias duplicadas.
 *
 * Se relaciona con `prisma/schema.prisma`, `prisma.config.ts` y con todas las
 * rutas, páginas y utilidades que importan `prisma` para leer o escribir datos.
 *
 * Existe para que todo el proyecto use una sola entrada consistente hacia la
 * base de datos multi-coto de Kotta.
 */
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
