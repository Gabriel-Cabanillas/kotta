'use client'

import { Building2, Clock3, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CONTENT = {
  PENDING_ACTIVATION: { icon: Clock3, title: 'Tu condominio está pendiente de activación', description: 'El registro fue recibido correctamente. El equipo de Kotta debe completar el proceso de contratación antes de habilitar el servicio.' },
  SUSPENDED: { icon: ShieldAlert, title: 'Servicio temporalmente suspendido', description: 'El servicio de este condominio se encuentra temporalmente suspendido. Contacta al equipo de Kotta para revisar la situación.' },
  CANCELED: { icon: Building2, title: 'Servicio no activo', description: 'La suscripción de este condominio ya no está activa. Tu información permanece protegida y no ha sido eliminada.' },
} as const

export default function TenantCommercialBlock({ status, organizationName }: { status: keyof typeof CONTENT; organizationName: string }) {
  const router = useRouter()
  const item = CONTENT[status]
  const Icon = item.icon
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/sign-in'); router.refresh() }
  return <main className="min-h-screen bg-[#F7F9FC] px-5 py-12 flex items-center justify-center"><section className="w-full max-w-xl rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-sm sm:p-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F1F34] text-white"><Icon className="h-6 w-6" /></div><p className="mt-6 text-xs font-medium uppercase tracking-[0.12em] text-[#FD5F56]">{organizationName}</p><h1 className="mt-3 font-display text-3xl tracking-tight text-[#0F1F34]">{item.title}</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#6B7A99]">{item.description}</p><div className="mt-8 border-t border-neutral-100 pt-6"><button type="button" onClick={logout} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cerrar sesión</button></div></section></main>
}

