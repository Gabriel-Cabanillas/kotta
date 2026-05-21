/**
 * Pagina principal del panel Super Admin global de Kotta.
 * Contiene metricas generales del SaaS, como condominios totales, condominios
 * activos, usuarios totales y la accion de cierre de sesion.
 * Se relaciona con getSession, prisma, cookies y el flujo global fuera de [coto];
 * a diferencia de las rutas por coto, administra la plataforma completa.
 * Existe para completar la arquitectura multi-rol y multi-coto del SaaS,
 * validando sesion y rol SUPERADMIN antes de mostrar informacion global.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function SuperAdminPanel() {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'SUPERADMIN') redirect('/dashboard')

  const totalOrgs  = await prisma.organization.count()
  const activeOrgs = await prisma.organization.count({ where: { isActive: true } })
  const totalUsers = await prisma.user.count()

  const handleLogout = async () => {
    'use server'
    const { cookies } = await import('next/headers')
    const { prisma: db } = await import('@/lib/prisma')
    const token = cookies().get('kotta-session')?.value
    if (token) await db.session.deleteMany({ where: { token } })
    cookies().delete('kotta-session')
  }

  return (
    <div className="min-h-screen bg-[#0F1F34]">
      <div className="container-kotta py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#4FA8E8] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h13" stroke="#1E3A5F" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="19" cy="18" r="3.5" fill="#1E3A5F"/>
            </svg>
          </div>
          <div>
            <p className="text-xs text-[#8BA8C4]">KOTTA</p>
            <h1 className="font-display text-xl text-white">Super Admin</h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Condominios totales', value: totalOrgs,  color: '#4FA8E8' },
            { label: 'Condominios activos', value: activeOrgs, color: '#1DB87E' },
            { label: 'Usuarios totales',    value: totalUsers, color: '#F5A623' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1E3A5F] rounded-xl p-5 border border-white/10">
              <p className="text-xs text-[#8BA8C4] mb-2">{stat.label}</p>
              <p className="font-display text-3xl" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1E3A5F] rounded-xl p-5 border border-white/10 flex items-center justify-between">
          <p className="text-sm text-[#8BA8C4]">
            Bienvenido, {user.name}. Panel de control global de KOTTA.
          </p>
          <form action={handleLogout}>
            <button type="submit" className="text-xs text-[#8BA8C4] hover:text-white border border-white/20 px-4 py-2 rounded-lg transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
