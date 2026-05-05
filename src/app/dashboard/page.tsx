import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await getSession()

  if (!user) redirect('/sign-in')

  if (!user.orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h13" stroke="#4FA8E8" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="19" cy="18" r="3.5" fill="#4FA8E8"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl text-[#0F1F34] mb-3">
            Cuenta pendiente de activación
          </h1>
          <p className="text-[#4A5568] leading-relaxed">
            Tu cuenta está siendo configurada. Recibirás un correo cuando esté lista.
          </p>
        </div>
      </div>
    )
  }

  const slug = user.org?.slug

  switch (user.role) {
    case 'SUPERADMIN': redirect('/superadmin')
    case 'ADMIN':      redirect(`/${slug}/admin`)
    case 'VECINO':     redirect(`/${slug}/vecino`)
    case 'PROVEEDOR':  redirect(`/${slug}/proveedor`)
    case 'GUARDIA':    redirect(`/${slug}/guardia`)
    default:           redirect('/sign-in')
  }
}