/**
 * Fuente única de verdad para VisitorType.
 * Usado por: GuardiaPanel (formulario + tabla), /api/accesos/crear (validación),
 * /api/accesos/reporte (etiquetas del PDF).
 * Si agregas un nuevo VisitorType al schema.prisma, agrégalo aquí y nada más.
 */
import type { VisitorType } from '@prisma/client'

export const VISITOR_TYPES: VisitorType[] = [
  'VISITA',
  'PROVEEDOR',
  'DELIVERY',
  'RESIDENTE',
  'OTRO',
]

export const VISITOR_LABELS: Record<VisitorType, string> = {
  VISITA: 'Visita',
  PROVEEDOR: 'Proveedor',
  DELIVERY: 'Delivery',
  RESIDENTE: 'Residente',
  OTRO: 'Otro',
}