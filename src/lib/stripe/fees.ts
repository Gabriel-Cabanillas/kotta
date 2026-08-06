/**
 * Tasas públicas de Stripe México verificadas el 2026-08-04.
 * Fuente: https://stripe.com/mx/pricing/local-payment-methods
 * Se usa la tasa internacional para toda tarjeta y el IVA aplica a la comisión.
 */
export const TARJETA_PORCENTAJE = 0.041
export const TARJETA_CARGO_FIJO = 3.00
export const IVA_PORCENTAJE = 0.16

/**
 * Estimación por pago a proveedor para cuentas Connect en México.
 * Stripe factura el costo real de payouts de forma agrupada al cierre mensual;
 * no es una comisión exacta ni atribuible de manera directa a cada Transfer.
 * Fuente y verificación: https://stripe.com/mx/connect/pricing (2026-08-03).
 */
export const CONNECT_PAYOUT_PORCENTAJE_ESTIMADO = 0.0025
export const CONNECT_PAYOUT_FIJO_ESTIMADO = 12.00
export const CONNECT_PAYOUT_IVA = 0.16

export function calcularRecargoTarjeta(montoOriginal: number) {
  // Gross-up: Stripe calcula la tasa sobre el total cobrado, no sobre el
  // monto original. Resolver la ecuación evita que el neto quede por debajo.
  const factorComision = TARJETA_PORCENTAJE * (1 + IVA_PORCENTAJE)
  const montoSinRedondear = (montoOriginal + TARJETA_CARGO_FIJO * (1 + IVA_PORCENTAJE)) / (1 - factorComision)
  const montoConRecargo = Math.ceil(montoSinRedondear * 100 - 0.000001) / 100
  return {
    montoOriginal,
    comisionStripe: montoConRecargo - montoOriginal,
    montoConRecargo,
    montoCentavos: Math.round(montoConRecargo * 100),
  }
}

/** Calcula el colchón estimado de Connect y siempre redondea hacia arriba. */
export function calcularComisionPayoutEstimada(montoProveedor: number) {
  const comisionSinRedondear = (
    montoProveedor * CONNECT_PAYOUT_PORCENTAJE_ESTIMADO
    + CONNECT_PAYOUT_FIJO_ESTIMADO
  ) * (1 + CONNECT_PAYOUT_IVA)
  const comisionEstimada = Math.ceil(comisionSinRedondear * 100 - 0.000001) / 100

  return {
    montoProveedor,
    comisionEstimada,
    totalDescontado: montoProveedor + comisionEstimada,
  }
}
