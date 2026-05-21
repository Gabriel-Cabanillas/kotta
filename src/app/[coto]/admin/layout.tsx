/**
 * Layout base del area de administracion de un coto dentro de Kotta.
 * Contiene la estructura principal del dashboard administrativo: sidebar,
 * navbar y contenedor para las paginas hijas del rol ADMIN.
 * Se relaciona con AdminSidebar, AdminNavbar, getSession y las paginas bajo
 * src/app/[coto]/admin; [coto] representa el slug del condominio u organizacion.
 * Existe para sostener la arquitectura multi-rol y multi-coto del SaaS,
 * validando sesion, rol y pertenencia al coto antes de renderizar el area admin.
 */
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminNavbar from '@/components/admin/AdminNavbar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { coto: string }
}) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex">
      <AdminSidebar coto={params.coto} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar user={user} orgName={user.org?.name ?? ''} />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
