/**
 * Crea un Cargo (cuota, cobro individual o extraordinario) junto con sus
 * CargoDestinatario, determinando automáticamente si es MASIVO, GRUPO o
 * INDIVIDUAL según cuántas viviendas se seleccionaron.
 * Se relaciona con el modelo Cargo/CargoDestinatario de Prisma y con el
 * formulario AsignarPagoForm.tsx (siguiente sub-paso).
 * Existe para centralizar la creación de cargos con la regla de negocio
 * de tu plan (sección 4.1): todas = MASIVO, varias = GRUPO, una = INDIVIDUAL.
 */
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { notificarCargoAVecinos } from '@/lib/notificaciones'

export async function POST(req: Request) {
  const user = await getSession()

  if (!user || user.role !== 'ADMIN' || !user.orgId) {
    return Response.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { concepto, monto, fechaLimite, viviendaIds } = body as {
    concepto: string
    monto: number
    fechaLimite: string
    viviendaIds: string[]
  }

  if (!concepto || !monto || !fechaLimite || !Array.isArray(viviendaIds) || viviendaIds.length === 0) {
    return Response.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const totalVecinos = await prisma.user.count({
    where: { orgId: user.orgId, role: 'VECINO', isActive: true },
  })

  const tipo =
    viviendaIds.length >= totalVecinos ? 'MASIVO' :
    viviendaIds.length > 1 ? 'GRUPO' :
    'INDIVIDUAL'

  const cargo = await prisma.$transaction(async (tx) => {
    const nuevoCargo = await tx.cargo.create({
      data: {
        concepto,
        monto,
        fechaLimite: new Date(fechaLimite),
        tipo,
        orgId: user.orgId!,
        creadoPorId: user.id,
      },
    })

    await tx.cargoDestinatario.createMany({
      data: viviendaIds.map((viviendaId) => ({
        cargoId: nuevoCargo.id,
        viviendaId,
      })),
    })

    return nuevoCargo
  })

  await notificarCargoAVecinos(cargo.id)

  return Response.json({ cargoId: cargo.id, tipo })

}