import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const admin = await getSession()
  if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { userId: targetUserId, amount, month, year, notes, status, orgId } = await req.json()
  if (admin.orgId !== orgId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  try {
    await prisma.payment.upsert({
      where:  { orgId_userId_month_year: { orgId, userId: targetUserId, month, year } },
      update: { amount, status, notes: notes || null, paidAt: status === 'PAGADO' ? new Date() : null },
      create: { orgId, userId: targetUserId, amount, status, month, year, notes: notes || null, paidAt: status === 'PAGADO' ? new Date() : null },
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}