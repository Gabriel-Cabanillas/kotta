/**
 * Consulta la liquidez global de la plataforma en MXN.
 * Este dato nunca debe enviarse directamente a un administrador de condominio:
 * cada pantalla debe acotarlo contra el saldo contable de su propio coto.
 */
import { stripe } from '@/lib/stripe'

function sumarMonedaMx(balance: Array<{ amount: number; currency: string }>) {
  return balance
    .filter((registro) => registro.currency.toLowerCase() === 'mxn')
    .reduce((total, registro) => total + registro.amount, 0) / 100
}

export async function obtenerLiquidezPlataformaMx() {
  const balance = await stripe.balance.retrieve()

  return {
    disponible: sumarMonedaMx(balance.available),
    pendiente: sumarMonedaMx(balance.pending),
  }
}
