/**
 * Crea manualmente una cuenta interna de Kotta, sin exponer un endpoint público.
 * Uso: node scripts/crear-kotta-staff.mjs correo@kotta.mx "Nombre" [contraseña]
 */
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

dotenv.config({ path: '.env.local' })

const [email, name, passwordArgumento] = process.argv.slice(2)
if (!email || !name) {
  console.error('Uso: node scripts/crear-kotta-staff.mjs correo@kotta.mx "Nombre" [contraseña]')
  process.exit(1)
}

const passwordTemporal = passwordArgumento || `Kotta-${crypto.randomUUID().slice(0, 12)}`
if (passwordTemporal.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres.')
  process.exit(1)
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Falta DATABASE_URL en .env.local.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  const existente = await prisma.user.findUnique({ where: { email } })
  if (existente) {
    if (existente.role !== 'KOTTA_STAFF') {
      console.error('El correo ya pertenece a un usuario de otro rol; no se modificó su contraseña.')
      process.exitCode = 1
    } else {
      const password = await bcrypt.hash(passwordTemporal, 12)
      await prisma.user.update({
        where: { email },
        data: { password, isActive: true },
      })
      console.log(`Contraseña actualizada para: ${email}`)
      if (!passwordArgumento) console.log(`Contraseña temporal (guárdala ahora): ${passwordTemporal}`)
    }
  } else {
    const password = await bcrypt.hash(passwordTemporal, 12)
    const usuario = await prisma.user.create({
      data: { email, name, password, role: 'KOTTA_STAFF', orgId: null, isActive: true },
      select: { id: true, email: true, name: true, role: true },
    })
    console.log(`Usuario creado: ${usuario.name} <${usuario.email}> (${usuario.role})`)
    if (!passwordArgumento) console.log(`Contraseña temporal (guárdala ahora): ${passwordTemporal}`)
  }
} finally {
  await prisma.$disconnect()
  await pool.end()
}
