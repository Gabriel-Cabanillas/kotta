import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function ProveedorPanel({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'PROVEEDOR') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="container-kotta py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1DB87E] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div>
            <p className="text-xs text-[#6B7A99]">{user.org?.name}</p>
            <h1 className="font-display text-xl text-[#0F1F34]">Mis órdenes</h1>
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-[#6B7A99]">Bienvenido, {user.name}. Tus órdenes de trabajo aparecerán aquí.</p>
        </div>
      </div>
    </div>
  )
}