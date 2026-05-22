/**
 * Configura Prisma para conectar Kotta con la base de datos.
 * Se relaciona con prisma/schema.prisma, las migraciones y el adaptador PostgreSQL.
 * Existe para centralizar la URL directa y el adapter usado por Prisma en el proyecto.
 */

import path from 'path'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DIRECT_URL ?? ''

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: connectionString,
  },
  migrate: {
    async adapter() {
      const pool = new pg.Pool({ connectionString })
      return new PrismaPg(pool as any)
    },
  },
} as any)