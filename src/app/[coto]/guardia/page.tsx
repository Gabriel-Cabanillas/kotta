import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function GuardiaPanel({ params }: { params: { coto: string } }) {
  const user = await getSession()
  if (!user) redirect('/sign-in')
  if (user.role !== 'GUARDIA') redirect('/dashboard')
  if (user.org?.slug !== params.coto) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="container-kotta py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#6B7A99] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div>
            <p className="text-xs text-[#6B7A99]">{user.org?.name}</p>
            <h1 className="font-display text-xl text-[#0F1F34]">Bitácora del día</h1>
          </div>
        </div>
        <div className="card">
          <p className="text-sm text-[#6B7A99]">Bienvenido, {user.name}. Los accesos del día aparecerán aquí.</p>
        </div>
      </div>
    </div>
  )
}